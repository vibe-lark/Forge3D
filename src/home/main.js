import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { assets, cameraBookmarks, zones } from './data.js';
import './style.css';

const isMobile = matchMedia('(max-width: 760px)').matches;
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelector('#app').innerHTML = `
  <main class="home-shell">
    <header class="topbar glass">
      <a class="brand" href="#" aria-label="回到全屋视角">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
        <span><strong>拾光之家</strong><small>FORGE3D HOME</small></span>
      </a>
      <div class="home-facts" aria-label="住宅信息">
        <span>108㎡</span><span>2室 · 1厅 · 1书房</span><span>12m × 9m</span>
      </div>
      <nav class="tools" aria-label="场景控制">
        <button class="icon-btn" id="dayToggle" type="button" aria-pressed="false" title="切换昼夜"><span>☼</span><em>白天</em></button>
        <button class="icon-btn" id="furnitureToggle" type="button" aria-pressed="true" title="显示或隐藏真实家具"><span>◫</span><em>家具</em></button>
        <button class="icon-btn" id="tourToggle" type="button" aria-pressed="false" title="自动漫游"><span>↝</span><em>漫游</em></button>
        <button class="icon-btn" id="licenseToggle" type="button" aria-expanded="false" title="查看模型许可"><span>ⓘ</span><em>许可</em></button>
      </nav>
    </header>

    <section class="scene-wrap" aria-label="新家三维空间">
      <canvas id="scene"></canvas>
      <div class="loading-cover" id="loadingCover">
        <div class="loader-house"><i></i><i></i><i></i></div>
        <p>正在点亮新家</p><span id="loadingDetail">准备空间结构…</span>
      </div>
      <aside class="zone-card glass" aria-live="polite">
        <span class="eyebrow" id="zoneKicker">108㎡ MODERN WARM HOME</span>
        <h1 id="zoneName">全屋</h1>
        <p id="zoneDescription">开放客餐厨连接安静卧室与独立书房。</p>
        <div class="load-progress"><i id="loadBar"></i></div>
        <small id="loadStatus">0 / ${assets.length} 件真实家具已就位</small>
      </aside>
      <aside class="asset-card glass" id="assetCard">
        <button class="asset-close" id="assetClose" type="button" aria-label="关闭来源信息">×</button>
        <span class="eyebrow">REAL MODEL SOURCE</span>
        <h2 id="assetName">选择一件家具</h2>
        <p id="assetNameEn">点击场景中的真实模型查看来源</p>
        <dl><div><dt>区域</dt><dd id="assetZone">—</dd></div><div><dt>许可</dt><dd id="assetLicense">—</dd></div><div><dt>署名</dt><dd id="assetAttribution">—</dd></div></dl>
        <a id="assetSource" href="#" target="_blank" rel="noreferrer">在 GitHub 查看固定版本 ↗</a>
      </aside>
      <div class="scene-hint" id="sceneHint">拖动旋转 · 滚轮缩放 · 点击家具查看来源</div>
    </section>

    <nav class="zone-nav glass" aria-label="房间视角">
      ${Object.entries(zones).map(([id, zone], index) => `<button type="button" data-zone="${id}" class="${index === 0 ? 'active' : ''}"><span>0${index + 1}</span>${zone.name}</button>`).join('')}
    </nav>

    <aside class="license-drawer" id="licenseDrawer" aria-hidden="true">
      <div class="license-head"><div><span class="eyebrow">OPEN ASSET CREDITS</span><h2>模型来源与许可</h2></div><button id="licenseClose" type="button" aria-label="关闭许可清单">×</button></div>
      <p class="license-intro">房屋结构由 Forge3D 程序化生成；以下真实家具来自固定 GitHub commit，并优先通过妙笔 TOS 加载。</p>
      <div class="license-list">${assets.map((asset) => `
        <article><div><strong>${asset.name}</strong><span>${asset.nameEn}</span></div><p>${asset.attribution}</p><a href="${asset.licenseUrl}" target="_blank" rel="noreferrer">${asset.license} ↗</a></article>
      `).join('')}</div>
    </aside>
    <div class="drawer-scrim" id="drawerScrim"></div>
  </main>
`;

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.15 : 1.75));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.94;
renderer.shadowMap.enabled = !isMobile;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd6cfc5);
scene.fog = new THREE.FogExp2(0xd6cfc5, 0.014);

const camera = new THREE.PerspectiveCamera(38, canvas.clientWidth / canvas.clientHeight, 0.05, 80);
camera.position.fromArray(cameraBookmarks.whole.position);

const controls = new OrbitControls(camera, canvas);
controls.target.fromArray(cameraBookmarks.whole.target);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.minDistance = 3.4;
controls.maxDistance = 24;
controls.maxPolarAngle = Math.PI * 0.47;
controls.minPolarAngle = 0.16;
controls.enablePan = !isMobile;

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const furnitureGroup = new THREE.Group();
furnitureGroup.name = '真实家具';
scene.add(furnitureGroup);

const selectable = [];
const loadedModels = new Map();
const qa = { loadedIds: [], errors: [], meshes: 0, triangles: 0, activeZone: 'whole', ready: false, tosLoads: 0 };
window.__HOME_QA__ = qa;

const palette = {
  plaster: 0xe9e2d8, floor: 0xb8916e, walnut: 0x5e4433, oak: 0xb98e65,
  stone: 0xd4cdc2, linen: 0xd8cbbd, cream: 0xf2ece2, charcoal: 0x2f302d,
  sage: 0x89907b, rust: 0xa7674c, glass: 0xb9c6c7, brass: 0xb6945f,
};

function mat(color, roughness = 0.76, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function box(name, size, position, material, parent = scene, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.y = options.rotation;
  mesh.castShadow = !isMobile && options.castShadow !== false;
  mesh.receiveShadow = !isMobile && options.receiveShadow !== false;
  parent.add(mesh);
  return mesh;
}

function cylinder(name, radius, height, position, material, parent = scene, segments = 32) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = !isMobile;
  mesh.receiveShadow = !isMobile;
  parent.add(mesh);
  return mesh;
}

function createHouse() {
  const structure = new THREE.Group();
  structure.name = '房屋结构';
  scene.add(structure);

  box('地板', [12, 0.18, 9], [0, -0.1, 0], mat(palette.floor, 0.86), structure, { castShadow: false });
  box('后墙', [12, 3.25, 0.18], [0, 1.55, -4.5], mat(palette.plaster), structure);
  box('左墙', [0.18, 3.25, 9], [-6, 1.55, 0], mat(palette.plaster), structure);
  box('右后矮墙', [0.18, 1.1, 4.35], [6, 0.46, -2.32], mat(palette.plaster), structure);
  box('右前矮墙', [0.18, 1.05, 3.7], [6, 0.44, 2.65], mat(palette.plaster), structure);

  box('卧室剖切墙', [5.25, 1.45, 0.12], [-3.37, 0.65, -0.55], mat(0xd2c6b8), structure);
  box('书房剖切墙', [4.3, 1.45, 0.12], [3.85, 0.65, -0.55], mat(0xd2c6b8), structure);
  box('走廊剖切墙', [0.12, 1.45, 3.85], [0.55, 0.65, -2.55], mat(0xd2c6b8), structure);

  const windowMat = new THREE.MeshPhysicalMaterial({ color: palette.glass, transparent: true, opacity: 0.27, roughness: 0.12, transmission: isMobile ? 0 : 0.48 });
  box('客厅落地窗', [0.06, 2.15, 2.9], [-5.89, 1.34, 2.05], windowMat, structure, { castShadow: false });
  box('厨房窗', [0.06, 1.6, 1.8], [5.89, 1.55, 2.15], windowMat, structure, { castShadow: false });

  const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.1), mat(0xc9b9a5, 1));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-2.8, 0.015, 2.0);
  rug.receiveShadow = !isMobile;
  structure.add(rug);

  // 客厅：低矮家具保留视觉通透感。
  box('电视柜', [1.75, 0.38, 0.5], [-0.7, 0.19, 2.15], mat(palette.walnut), structure);
  box('茶几台面', [1.35, 0.09, 0.72], [-2.6, 0.4, 1.6], mat(palette.oak), structure);
  [[-3.14, 0.2, 1.86], [-2.06, 0.2, 1.86], [-3.14, 0.2, 1.34], [-2.06, 0.2, 1.34]].forEach((p, i) => cylinder(`茶几腿${i}`, 0.035, 0.38, p, mat(palette.charcoal), structure, 16));
  cylinder('陶盆', 0.24, 0.38, [-5.25, 0.2, 0.3], mat(0xa78970), structure);
  const plant = new THREE.Mesh(new THREE.SphereGeometry(0.48, 18, 12), mat(0x61705d));
  plant.scale.set(0.65, 1.3, 0.65); plant.position.set(-5.25, 0.88, 0.3); structure.add(plant);

  // 餐厨：中岛将操作区与餐桌自然连接。
  box('厨房后柜', [4.75, 0.9, 0.62], [3.45, 0.45, 3.95], mat(palette.stone), structure);
  box('厨房台面', [4.9, 0.08, 0.72], [3.45, 0.94, 3.9], mat(0xe3ded4, 0.45), structure);
  box('中岛', [2.2, 0.86, 0.88], [2.55, 0.43, 1.85], mat(0xb8a28a), structure);
  box('中岛台面', [2.34, 0.08, 1.0], [2.55, 0.9, 1.85], mat(0xe6e0d7, 0.42), structure);
  box('餐桌', [2.0, 0.11, 0.92], [4.65, 0.75, 0.45], mat(palette.walnut), structure);
  [[4.0, 0.37, 0.13], [5.3, 0.37, 0.13], [4.0, 0.37, 0.77], [5.3, 0.37, 0.77]].forEach((p, i) => cylinder(`餐桌腿${i}`, 0.045, 0.72, p, mat(palette.charcoal), structure, 14));
  [[3.85, 0.43, -0.15], [4.75, 0.43, -0.15], [5.45, 0.43, 0.98]].forEach((p, i) => {
    cylinder(`餐椅座${i}`, 0.28, 0.08, p, mat(i === 1 ? palette.rust : palette.sage), structure, 24);
    cylinder(`餐椅腿${i}`, 0.04, 0.42, [p[0], 0.21, p[2]], mat(palette.charcoal), structure, 12);
  });

  // 卧室：靠墙床组与柔和织物构成安静区。
  box('床架', [3.1, 0.34, 2.2], [-3.25, 0.18, -2.75], mat(palette.walnut), structure);
  box('床垫', [2.94, 0.32, 2.06], [-3.25, 0.48, -2.74], mat(palette.cream), structure);
  box('床头', [3.2, 1.15, 0.16], [-3.25, 0.86, -3.82], mat(0xa98972), structure);
  box('床毯', [2.82, 0.07, 0.75], [-3.25, 0.68, -2.12], mat(palette.rust), structure);
  box('左床头柜', [0.58, 0.52, 0.5], [-4.75, 0.26, -3.25], mat(palette.oak), structure);
  box('右床头柜', [0.58, 0.52, 0.5], [-1.75, 0.26, -3.25], mat(palette.oak), structure);
  box('衣柜', [1.25, 2.1, 0.62], [-5.15, 1.05, -1.05], mat(0xc5b39d), structure);

  // 书房：书柜形成视觉背景，真实工作站占据核心。
  box('书柜', [0.48, 2.2, 2.7], [5.52, 1.1, -2.8], mat(palette.walnut), structure);
  for (let i = 0; i < 4; i += 1) box(`书架层板${i}`, [0.62, 0.06, 2.6], [5.28, 0.4 + i * 0.55, -2.8], mat(palette.oak), structure);
  const bookColors = [palette.rust, palette.sage, 0xc6aa84, 0x4d5a5b, 0xd2c3ae];
  for (let i = 0; i < 14; i += 1) {
    const shelf = i % 3;
    box(`书${i}`, [0.18 + (i % 2) * 0.05, 0.34 + (i % 3) * 0.03, 0.11], [5.0, 0.61 + shelf * 0.55, -3.82 + (i % 5) * 0.43], mat(bookColors[i % bookColors.length]), structure);
  }

  const zoneLabels = [
    ['客厅', -4.95, 0.03, 3.85], ['餐厨', 4.9, 0.03, 3.85], ['卧室', -4.9, 0.03, -4.05], ['书房', 4.9, 0.03, -4.05],
  ];
  zoneLabels.forEach(([label, x, y, z]) => {
    const sprite = makeLabel(label);
    sprite.position.set(x, y + 0.12, z); sprite.scale.set(0.9, 0.23, 1); structure.add(sprite);
  });
}

function makeLabel(text) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.font = '600 46px system-ui'; ctx.fillStyle = 'rgba(42,38,33,.68)'; ctx.fillText(text, 18, 78);
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
}

const hemi = new THREE.HemisphereLight(0xfff6e8, 0x6d716a, 1.35);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe5bd, 2.85);
sun.position.set(-7, 10, 8); sun.castShadow = !isMobile;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.near = 1; sun.shadow.camera.far = 30;
sun.shadow.camera.left = -10; sun.shadow.camera.right = 10; sun.shadow.camera.top = 10; sun.shadow.camera.bottom = -10;
scene.add(sun);
const warmLamp = new THREE.PointLight(0xffb46f, 0, 5, 2); warmLamp.position.set(-5.05, 1.55, 2.82); scene.add(warmLamp);
const bedroomLamp = new THREE.PointLight(0xff9870, 0, 3.2, 2); bedroomLamp.position.set(-4.6, 1.05, -3.35); scene.add(bedroomLamp);

createHouse();

const draco = new DRACOLoader().setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
const ktx2 = new KTX2Loader().setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.178.0/examples/jsm/libs/basis/').detectSupport(renderer);
const loader = new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);

function loadGltf(url) {
  return new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
}

async function loadAsset(asset) {
  let lastError;
  for (let i = 0; i < asset.urls.length; i += 1) {
    const url = asset.urls[i];
    try {
      const gltf = await loadGltf(url);
      if (i === 0) qa.tosLoads += 1;
      placeAsset(asset, gltf.scene);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  qa.errors.push({ id: asset.id, message: String(lastError?.message || lastError) });
  updateProgress();
}

function placeAsset(asset, model) {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  model.scale.setScalar(asset.targetMax / maxDimension);
  model.updateMatrixWorld(true);
  const scaledBounds = new THREE.Box3().setFromObject(model);
  const center = scaledBounds.getCenter(new THREE.Vector3());
  model.position.set(asset.position[0] - center.x, asset.position[1] - scaledBounds.min.y, asset.position[2] - center.z);
  model.rotation.y = asset.rotation || 0;
  model.userData.asset = asset;
  model.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = !isMobile;
    node.receiveShadow = !isMobile;
    node.userData.asset = asset;
    selectable.push(node);
    qa.meshes += 1;
    const geometry = node.geometry;
    qa.triangles += geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
  });
  furnitureGroup.add(model);
  loadedModels.set(asset.id, model);
  qa.loadedIds.push(asset.id);
  updateProgress();
}

async function loadPool(items, concurrency) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor; cursor += 1;
      await loadAsset(items[index]);
    }
  });
  await Promise.allSettled(workers);
}

function updateProgress() {
  const done = qa.loadedIds.length + qa.errors.length;
  document.querySelector('#loadBar').style.width = `${(done / assets.length) * 100}%`;
  document.querySelector('#loadStatus').textContent = `${qa.loadedIds.length} / ${assets.length} 件真实家具已就位${qa.errors.length ? ` · ${qa.errors.length} 件使用失败` : ''}`;
  document.querySelector('#loadingDetail').textContent = `${qa.loadedIds.length} 件家具已加载`;
}

async function loadHome() {
  const priority = assets.filter((item) => item.priority === 1);
  const later = assets.filter((item) => item.priority !== 1);
  await loadPool(priority, isMobile ? 2 : 3);
  document.querySelector('#loadingCover').classList.add('done');
  qa.ready = true;
  await new Promise((resolve) => setTimeout(resolve, 220));
  await loadPool(later, isMobile ? 1 : 2);
}

const cameraTween = { active: false, start: 0, duration: 1000, fromPos: new THREE.Vector3(), toPos: new THREE.Vector3(), fromTarget: new THREE.Vector3(), toTarget: new THREE.Vector3() };
function setZone(id, instant = false) {
  const bookmark = cameraBookmarks[id];
  if (!bookmark) return;
  qa.activeZone = id;
  document.querySelectorAll('[data-zone]').forEach((button) => button.classList.toggle('active', button.dataset.zone === id));
  const zone = zones[id];
  document.querySelector('#zoneKicker').textContent = zone.kicker;
  document.querySelector('#zoneName').textContent = zone.name;
  document.querySelector('#zoneDescription').textContent = zone.description;
  cameraTween.fromPos.copy(camera.position); cameraTween.toPos.fromArray(bookmark.position);
  cameraTween.fromTarget.copy(controls.target); cameraTween.toTarget.fromArray(bookmark.target);
  cameraTween.start = performance.now(); cameraTween.duration = instant || prefersReducedMotion ? 1 : 1050; cameraTween.active = true;
}

function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function updateCameraTween(now) {
  if (!cameraTween.active) return;
  const t = Math.min(1, (now - cameraTween.start) / cameraTween.duration);
  const e = easeInOut(t);
  camera.position.lerpVectors(cameraTween.fromPos, cameraTween.toPos, e);
  controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, e);
  if (t === 1) cameraTween.active = false;
}

let night = false;
function setNight(value) {
  night = value;
  document.body.classList.toggle('night', night);
  const button = document.querySelector('#dayToggle');
  button.setAttribute('aria-pressed', String(night)); button.querySelector('span').textContent = night ? '☾' : '☼'; button.querySelector('em').textContent = night ? '夜晚' : '白天';
  scene.background.set(night ? 0x151a20 : 0xd6cfc5); scene.fog.color.set(night ? 0x151a20 : 0xd6cfc5);
  hemi.intensity = night ? 0.45 : 1.35; sun.intensity = night ? 0.18 : 2.85;
  warmLamp.intensity = night ? 22 : 0; bedroomLamp.intensity = night ? 12 : 0;
  renderer.toneMappingExposure = night ? 0.82 : 0.94;
}

let tourTimer;
let tourIndex = 0;
const tourZones = ['whole', 'living', 'kitchen', 'bedroom', 'study'];
function setTour(enabled) {
  const button = document.querySelector('#tourToggle');
  button.setAttribute('aria-pressed', String(enabled));
  clearInterval(tourTimer);
  if (!enabled) return;
  tourIndex = (tourZones.indexOf(qa.activeZone) + 1) % tourZones.length;
  setZone(tourZones[tourIndex]);
  tourTimer = setInterval(() => { tourIndex = (tourIndex + 1) % tourZones.length; setZone(tourZones[tourIndex]); }, 5200);
}

function openDrawer(open) {
  document.querySelector('#licenseDrawer').classList.toggle('open', open);
  document.querySelector('#drawerScrim').classList.toggle('open', open);
  document.querySelector('#licenseDrawer').setAttribute('aria-hidden', String(!open));
  document.querySelector('#licenseToggle').setAttribute('aria-expanded', String(open));
}

document.querySelector('.brand').addEventListener('click', (event) => { event.preventDefault(); setZone('whole'); });
document.querySelectorAll('[data-zone]').forEach((button) => button.addEventListener('click', () => { setTour(false); setZone(button.dataset.zone); }));
document.querySelector('#dayToggle').addEventListener('click', () => setNight(!night));
document.querySelector('#furnitureToggle').addEventListener('click', (event) => {
  furnitureGroup.visible = !furnitureGroup.visible;
  event.currentTarget.setAttribute('aria-pressed', String(furnitureGroup.visible));
});
document.querySelector('#tourToggle').addEventListener('click', (event) => setTour(event.currentTarget.getAttribute('aria-pressed') !== 'true'));
document.querySelector('#licenseToggle').addEventListener('click', () => openDrawer(true));
document.querySelector('#licenseClose').addEventListener('click', () => openDrawer(false));
document.querySelector('#drawerScrim').addEventListener('click', () => openDrawer(false));
document.querySelector('#assetClose').addEventListener('click', () => document.querySelector('#assetCard').classList.remove('open'));

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
canvas.addEventListener('pointerup', (event) => {
  if (Math.abs(event.movementX) > 4 || Math.abs(event.movementY) > 4) return;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(selectable, false)[0];
  if (!hit) return;
  const asset = hit.object.userData.asset;
  document.querySelector('#assetName').textContent = asset.name;
  document.querySelector('#assetNameEn').textContent = asset.nameEn;
  document.querySelector('#assetZone').textContent = zones[asset.zone]?.name || asset.zone;
  document.querySelector('#assetLicense').textContent = asset.license;
  document.querySelector('#assetAttribution').textContent = asset.attribution;
  document.querySelector('#assetSource').href = asset.sourceUrl;
  document.querySelector('#assetCard').classList.add('open');
});

function resize() {
  const width = canvas.clientWidth; const height = canvas.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);

let raf = 0;
function render(now) {
  raf = requestAnimationFrame(render);
  updateCameraTween(now);
  controls.update();
  renderer.render(scene, camera);
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
  else if (!raf) raf = requestAnimationFrame(render);
});

resize();
raf = requestAnimationFrame(render);
loadHome();
