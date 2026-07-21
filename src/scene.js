import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const LOAD_STALL_TIMEOUT = 15000;

function disposeObject(root) {
  root?.traverse((object) => {
    object.geometry?.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.filter(Boolean).forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value?.isTexture) value.dispose();
      });
      material.dispose();
    });
  });
}

function collectStats(root, animations, bounds) {
  let meshes = 0;
  let triangles = 0;
  const materials = new Set();
  root.traverse((object) => {
    if (!object.isMesh) return;
    meshes += 1;
    const geometry = object.geometry;
    triangles += geometry.index ? geometry.index.count / 3 : (geometry.attributes.position?.count || 0) / 3;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    list.filter(Boolean).forEach((item) => materials.add(item.uuid));
  });
  return {
    meshes,
    triangles: Math.round(triangles),
    materials: materials.size,
    animations: animations.length,
    dimensions: {
      x: bounds.x,
      y: bounds.y,
      z: bounds.z,
    },
  };
}

export function createModelViewer(canvas, callbacks = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
  const isCompact = window.matchMedia('(max-width: 760px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCompact ? 1.15 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = !isCompact;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor('#d7d9dc', 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d7d9dc');
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose();

  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 10000);
  camera.position.set(3, 2, 4);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.screenSpacePanning = true;
  controls.minDistance = 0.02;
  controls.maxDistance = 5000;

  const key = new THREE.DirectionalLight('#ffffff', 2.4);
  key.position.set(4, 8, 6);
  key.castShadow = !isCompact;
  scene.add(key);
  scene.add(new THREE.HemisphereLight('#edf3ff', '#4d5158', 1.45));

  const grid = new THREE.GridHelper(40, 40, '#a7abb1', '#c5c8cc');
  grid.material.transparent = true;
  grid.material.opacity = 0.42;
  scene.add(grid);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.ShadowMaterial({ color: '#555a62', opacity: 0.16 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.position.y = -0.001;
  scene.add(ground);

  const draco = new DRACOLoader();
  draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  const ktx2 = new KTX2Loader();
  ktx2.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.178.0/examples/jsm/libs/basis/');
  ktx2.detectSupport(renderer);
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  loader.setKTX2Loader(ktx2);
  loader.setMeshoptDecoder(MeshoptDecoder);

  let currentRoot = null;
  let mixer = null;
  let animationsPlaying = true;
  let loadNumber = 0;
  let fitted = null;
  const clock = new THREE.Clock();

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  function fitCamera(size) {
    const maxSize = Math.max(size.x, size.y, size.z, 0.001);
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const portraitFactor = camera.aspect < 1 ? 1 / camera.aspect : 1;
    const distance = (maxSize / (2 * Math.tan(verticalFov / 2))) * portraitFactor * 1.32;
    const target = new THREE.Vector3(0, size.y * 0.42, 0);
    camera.near = Math.max(maxSize / 1000, 0.001);
    camera.far = Math.max(maxSize * 100, 100);
    camera.position.set(distance * 0.78, target.y + distance * 0.42, distance);
    camera.updateProjectionMatrix();
    controls.target.copy(target);
    controls.minDistance = distance * 0.12;
    controls.maxDistance = distance * 8;
    controls.update();
    fitted = { size: size.clone() };
  }

  function clearModel() {
    if (mixer) {
      mixer.stopAllAction();
      mixer = null;
    }
    if (currentRoot) {
      scene.remove(currentRoot);
      disposeObject(currentRoot);
      currentRoot = null;
    }
  }

  async function load(asset) {
    const requestNumber = ++loadNumber;
    callbacks.onLoading?.(asset, 0);
    clearModel();
    return new Promise((resolve, reject) => {
      const urls = [...new Set([asset.rawUrl, asset.fallbackUrl, asset.githubRawUrl].filter(Boolean))];
      let urlIndex = 0;
      let attemptNumber = 0;
      let stallTimer = null;

      const clearStallTimer = () => {
        if (stallTimer) clearTimeout(stallTimer);
        stallTimer = null;
      };

      const handleLoaded = (gltf) => {
          if (requestNumber !== loadNumber) {
            disposeObject(gltf.scene);
            return;
          }
          currentRoot = gltf.scene;
          currentRoot.name = asset.name;
          currentRoot.traverse((object) => {
            if (!object.isMesh) return;
            object.castShadow = !isCompact;
            object.receiveShadow = !isCompact;
          });

          currentRoot.updateMatrixWorld(true);
          const initialBox = new THREE.Box3().setFromObject(currentRoot);
          const initialSize = initialBox.getSize(new THREE.Vector3());
          const initialCenter = initialBox.getCenter(new THREE.Vector3());
          currentRoot.position.x -= initialCenter.x;
          currentRoot.position.z -= initialCenter.z;
          currentRoot.position.y -= initialBox.min.y;
          currentRoot.updateMatrixWorld(true);
          scene.add(currentRoot);

          if (gltf.animations.length) {
            mixer = new THREE.AnimationMixer(currentRoot);
            gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
            mixer.timeScale = animationsPlaying ? 1 : 0;
          }

          fitCamera(initialSize);
          const stats = collectStats(currentRoot, gltf.animations, initialSize);
          callbacks.onLoaded?.(asset, stats);
          resolve(stats);
      };

      const handleProgress = (event) => {
          if (requestNumber !== loadNumber) return;
          const progress = event.total ? event.loaded / event.total : null;
          callbacks.onProgress?.(asset, progress, event.loaded, event.total || null);
      };

      const handleError = (error, currentAttempt) => {
          if (requestNumber !== loadNumber || currentAttempt !== attemptNumber) return;
          clearStallTimer();
          if (urlIndex < urls.length - 1) {
            urlIndex += 1;
            callbacks.onFallback?.(asset, urls[urlIndex], error);
            startAttempt();
            return;
          }
          const message = error?.message || String(error);
          callbacks.onError?.(asset, message);
          reject(error);
      };

      const armStallTimer = (currentAttempt) => {
        clearStallTimer();
        stallTimer = setTimeout(() => {
          handleError(new Error('模型来源长时间无响应'), currentAttempt);
        }, LOAD_STALL_TIMEOUT);
      };

      const startAttempt = () => {
        const currentAttempt = ++attemptNumber;
        armStallTimer(currentAttempt);
        loader.load(
          urls[urlIndex],
          (gltf) => {
            if (requestNumber !== loadNumber || currentAttempt !== attemptNumber) {
              disposeObject(gltf.scene);
              return;
            }
            clearStallTimer();
            handleLoaded(gltf);
          },
          (event) => {
            if (requestNumber !== loadNumber || currentAttempt !== attemptNumber) return;
            armStallTimer(currentAttempt);
            handleProgress(event);
          },
          (error) => handleError(error, currentAttempt),
        );
      };
      startAttempt();
    });
  }

  function resetView() {
    if (fitted) fitCamera(fitted.size);
  }

  function setAnimationsPlaying(value) {
    animationsPlaying = value;
    if (mixer) mixer.timeScale = value ? 1 : 0;
  }

  function screenshot(filename = 'github-model.png') {
    renderer.render(scene, camera);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    load,
    resetView,
    screenshot,
    setAnimationsPlaying,
    dispose() {
      loadNumber += 1;
      clearModel();
      observer.disconnect();
      controls.dispose();
      draco.dispose();
      ktx2.dispose();
      pmrem.dispose();
      renderer.setAnimationLoop(null);
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
