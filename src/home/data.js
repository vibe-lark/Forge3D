export const zones = {
  whole: { name: '全屋', kicker: '108㎡ MODERN WARM HOME', description: '开放客餐厨连接安静卧室与独立书房。' },
  living: { name: '客厅', kicker: 'LIVING ROOM', description: '丝绒、木质与暖光围合出的社交中心。' },
  kitchen: { name: '餐厨', kicker: 'DINING & KITCHEN', description: '一字厨房与中岛构成日常生活核心。' },
  bedroom: { name: '卧室', kicker: 'BEDROOM', description: '柔软材质、低照度和克制装饰。' },
  study: { name: '书房', kicker: 'STUDY', description: '低干扰工作区与真实数码模型组合。' },
};

export const cameraBookmarks = {
  whole: { position: [10.6, 9.6, 11.8], target: [0, 0.65, -0.15] },
  living: { position: [-8.2, 4.2, 8.4], target: [-2.6, 0.8, 2.2] },
  kitchen: { position: [8.6, 4.1, 7.8], target: [3.3, 0.9, 2.1] },
  bedroom: { position: [-8.2, 4.2, -7.2], target: [-3.1, 0.8, -2.6] },
  study: { position: [8.1, 4.2, -7.5], target: [3.4, 0.9, -2.6] },
};

export const assets = [
  {
    id: 'glam-velvet-sofa', name: '丝绒沙发', nameEn: 'Glam Velvet Sofa', zone: 'living', size: 3149844,
    urls: [
      'https://magic-builder.tos-cn-beijing.volces.com/forge3d/models/khronos-gltf-sample-assets/2bac6f8c57bf471df0d2a1e8a8ec023c7801dddf/glam-velvet-sofa.glb',
      'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@2bac6f8c57bf471df0d2a1e8a8ec023c7801dddf/Models/GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb',
      'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/2bac6f8c57bf471df0d2a1e8a8ec023c7801dddf/Models/GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb',
    ],
    sourceUrl: 'https://github.com/KhronosGroup/glTF-Sample-Assets/blob/2bac6f8c57bf471df0d2a1e8a8ec023c7801dddf/Models/GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb',
    license: 'CC BY 4.0', licenseUrl: 'https://github.com/KhronosGroup/glTF-Sample-Assets/blob/2bac6f8c57bf471df0d2a1e8a8ec023c7801dddf/Models/GlamVelvetSofa/LICENSE.md', attribution: 'Eric Chadwick / Wayfair',
    targetMax: 2.45, position: [-3.3, 0, 2.75], rotation: Math.PI / 2, priority: 2,
  },
  {
    id: 'armchair-with-pillows', name: '软垫扶手椅', nameEn: 'Armchair with Pillows', zone: 'living', size: 39061,
    urls: [
      'https://magic-builder.tos-cn-beijing.volces.com/forge3d/models/kaykit-game-assets/kaykit-furniture-bits-1.0/96d5930a8dbdb363409bbc2d3341718b00e17c9c/armchair-with-pillows/armchair_pillows.gltf',
      'https://cdn.jsdelivr.net/gh/KayKit-Game-Assets/KayKit-Furniture-Bits-1.0@96d5930a8dbdb363409bbc2d3341718b00e17c9c/addons/kaykit_furniture_bits/Assets/gltf/armchair_pillows.gltf',
      'https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Furniture-Bits-1.0/96d5930a8dbdb363409bbc2d3341718b00e17c9c/addons/kaykit_furniture_bits/Assets/gltf/armchair_pillows.gltf',
    ],
    sourceUrl: 'https://github.com/KayKit-Game-Assets/KayKit-Furniture-Bits-1.0/blob/96d5930a8dbdb363409bbc2d3341718b00e17c9c/addons/kaykit_furniture_bits/Assets/gltf/armchair_pillows.gltf',
    license: 'CC0 1.0', licenseUrl: 'https://github.com/KayKit-Game-Assets/KayKit-Furniture-Bits-1.0/blob/96d5930a8dbdb363409bbc2d3341718b00e17c9c/LICENSE.txt', attribution: 'Kay Lousberg / KayKit',
    targetMax: 1.05, position: [-4.65, 0, 1.35], rotation: -0.65, priority: 1,
  },
  {
    id: 'standing-lamp', name: '落地灯', nameEn: 'Standing Lamp', zone: 'living', size: 30287,
    urls: [
      'https://magic-builder.tos-cn-beijing.volces.com/forge3d/models/kaykit-game-assets/kaykit-furniture-bits-1.0/96d5930a8dbdb363409bbc2d3341718b00e17c9c/standing-lamp/lamp_standing.gltf',
      'https://cdn.jsdelivr.net/gh/KayKit-Game-Assets/KayKit-Furniture-Bits-1.0@96d5930a8dbdb363409bbc2d3341718b00e17c9c/addons/kaykit_furniture_bits/Assets/gltf/lamp_standing.gltf',
      'https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Furniture-Bits-1.0/96d5930a8dbdb363409bbc2d3341718b00e17c9c/addons/kaykit_furniture_bits/Assets/gltf/lamp_standing.gltf',
    ],
    sourceUrl: 'https://github.com/KayKit-Game-Assets/KayKit-Furniture-Bits-1.0/blob/96d5930a8dbdb363409bbc2d3341718b00e17c9c/addons/kaykit_furniture_bits/Assets/gltf/lamp_standing.gltf',
    license: 'CC0 1.0', licenseUrl: 'https://github.com/KayKit-Game-Assets/KayKit-Furniture-Bits-1.0/blob/96d5930a8dbdb363409bbc2d3341718b00e17c9c/LICENSE.txt', attribution: 'Kay Lousberg / KayKit',
    targetMax: 1.65, position: [-5.1, 0, 2.85], rotation: 0.1, priority: 1, light: true,
  },
  {
    id: 'vintage-television', name: '复古电视机', nameEn: 'Vintage Television', zone: 'living', size: 19392,
    urls: [
      'https://magic-builder.tos-cn-beijing.volces.com/forge3d/models/subtiliorars-sys/game-3d-assets/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vintage-television.glb',
      'https://cdn.jsdelivr.net/gh/subtiliorars-sys/game-3d-assets@b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/furniture-kit/Models/GLTF%20format/televisionVintage.glb',
      'https://raw.githubusercontent.com/subtiliorars-sys/game-3d-assets/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/furniture-kit/Models/GLTF%20format/televisionVintage.glb',
    ],
    sourceUrl: 'https://github.com/subtiliorars-sys/game-3d-assets/blob/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/furniture-kit/Models/GLTF%20format/televisionVintage.glb',
    license: 'CC0 1.0', licenseUrl: 'https://github.com/subtiliorars-sys/game-3d-assets/blob/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/furniture-kit/License.txt', attribution: 'Kenney / Furniture Kit',
    targetMax: 0.92, position: [-0.75, 0.43, 2.45], rotation: -Math.PI / 2, priority: 1,
  },
  {
    id: 'wooden-radio', name: '复古木质收音机', nameEn: 'Wooden Radio', zone: 'living', size: 25020,
    urls: [
      'https://magic-builder.tos-cn-beijing.volces.com/forge3d/models/subtiliorars-sys/game-3d-assets/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/furniture-kit/radio.glb',
      'https://cdn.jsdelivr.net/gh/subtiliorars-sys/game-3d-assets@b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/furniture-kit/Models/GLTF%20format/radio.glb',
      'https://raw.githubusercontent.com/subtiliorars-sys/game-3d-assets/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/furniture-kit/Models/GLTF%20format/radio.glb',
    ],
    sourceUrl: 'https://github.com/subtiliorars-sys/game-3d-assets/blob/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/furniture-kit/Models/GLTF%20format/radio.glb',
    license: 'CC0 1.0', licenseUrl: 'https://github.com/subtiliorars-sys/game-3d-assets/blob/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/furniture-kit/License.txt', attribution: 'Kenney / Furniture Kit',
    targetMax: 0.42, position: [-0.7, 0.47, 1.55], rotation: -Math.PI / 2, priority: 1,
  },
  {
    id: 'freestanding-oven', name: '独立烤箱', nameEn: 'Freestanding Oven', zone: 'kitchen', size: 60708,
    urls: [
      'https://magic-builder.tos-cn-beijing.volces.com/forge3d/models/kaykit-game-assets/kaykit-restaurant-bits-1.0/153c8a7535b48237854cb54ff6890679f8c574d1/freestanding-oven/oven.gltf',
      'https://cdn.jsdelivr.net/gh/KayKit-Game-Assets/KayKit-Restaurant-Bits-1.0@153c8a7535b48237854cb54ff6890679f8c574d1/addons/kaykit_restaurant_bits/Assets/gltf/oven.gltf',
      'https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Restaurant-Bits-1.0/153c8a7535b48237854cb54ff6890679f8c574d1/addons/kaykit_restaurant_bits/Assets/gltf/oven.gltf',
    ],
    sourceUrl: 'https://github.com/KayKit-Game-Assets/KayKit-Restaurant-Bits-1.0/blob/153c8a7535b48237854cb54ff6890679f8c574d1/addons/kaykit_restaurant_bits/Assets/gltf/oven.gltf',
    license: 'CC0 1.0', licenseUrl: 'https://github.com/KayKit-Game-Assets/KayKit-Restaurant-Bits-1.0/blob/153c8a7535b48237854cb54ff6890679f8c574d1/LICENSE.txt', attribution: 'Kay Lousberg / KayKit',
    targetMax: 1.25, position: [4.85, 0, 3.25], rotation: Math.PI, priority: 1,
  },
  {
    id: 'countertop-coffee-machine', name: '台式咖啡机与杯子', nameEn: 'Countertop Coffee Machine', zone: 'kitchen', size: 13332,
    urls: [
      'https://magic-builder.tos-cn-beijing.volces.com/forge3d/models/subtiliorars-sys/game-3d-assets/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/countertop-coffee-machine.glb',
      'https://cdn.jsdelivr.net/gh/subtiliorars-sys/game-3d-assets@b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/furniture-kit/Models/GLTF%20format/kitchenCoffeeMachine.glb',
      'https://raw.githubusercontent.com/subtiliorars-sys/game-3d-assets/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/furniture-kit/Models/GLTF%20format/kitchenCoffeeMachine.glb',
    ],
    sourceUrl: 'https://github.com/subtiliorars-sys/game-3d-assets/blob/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/furniture-kit/Models/GLTF%20format/kitchenCoffeeMachine.glb',
    license: 'CC0 1.0', licenseUrl: 'https://github.com/subtiliorars-sys/game-3d-assets/blob/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/furniture-kit/License.txt', attribution: 'Kenney / Furniture Kit',
    targetMax: 0.38, position: [3.7, 0.92, 3.33], rotation: Math.PI, priority: 1,
  },
  {
    id: 'corner-computer-workstation', name: '转角电脑工作站', nameEn: 'Corner Computer Workstation', zone: 'study', size: 8720,
    urls: [
      'https://magic-builder.tos-cn-beijing.volces.com/forge3d/models/subtiliorars-sys/game-3d-assets/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/space-kit/desk_computerCorner.glb',
      'https://cdn.jsdelivr.net/gh/subtiliorars-sys/game-3d-assets@b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/space-kit/Models/GLTF%20format/desk_computerCorner.glb',
      'https://raw.githubusercontent.com/subtiliorars-sys/game-3d-assets/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/space-kit/Models/GLTF%20format/desk_computerCorner.glb',
    ],
    sourceUrl: 'https://github.com/subtiliorars-sys/game-3d-assets/blob/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/space-kit/Models/GLTF%20format/desk_computerCorner.glb',
    license: 'CC0 1.0', licenseUrl: 'https://github.com/subtiliorars-sys/game-3d-assets/blob/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/space-kit/License.txt', attribution: 'Kenney / Space Kit',
    targetMax: 1.65, position: [3.8, 0, -3.05], rotation: Math.PI / 2, priority: 1,
  },
  {
    id: 'space-office-chair', name: '太空办公椅', nameEn: 'Space Office Chair', zone: 'study', size: 10440,
    urls: [
      'https://magic-builder.tos-cn-beijing.volces.com/forge3d/models/subtiliorars-sys/game-3d-assets/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/space-kit/desk_chairArms.glb',
      'https://cdn.jsdelivr.net/gh/subtiliorars-sys/game-3d-assets@b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/space-kit/Models/GLTF%20format/desk_chairArms.glb',
      'https://raw.githubusercontent.com/subtiliorars-sys/game-3d-assets/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/space-kit/Models/GLTF%20format/desk_chairArms.glb',
    ],
    sourceUrl: 'https://github.com/subtiliorars-sys/game-3d-assets/blob/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/space-kit/Models/GLTF%20format/desk_chairArms.glb',
    license: 'CC0 1.0', licenseUrl: 'https://github.com/subtiliorars-sys/game-3d-assets/blob/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/space-kit/License.txt', attribution: 'Kenney / Space Kit',
    targetMax: 0.72, position: [2.75, 0, -2.65], rotation: -Math.PI / 2, priority: 1,
  },
  {
    id: 'compact-laptop', name: '轻薄笔记本电脑', nameEn: 'Compact Laptop', zone: 'study', size: 5540,
    urls: [
      'https://magic-builder.tos-cn-beijing.volces.com/forge3d/models/subtiliorars-sys/game-3d-assets/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/furniture-kit/laptop.glb',
      'https://cdn.jsdelivr.net/gh/subtiliorars-sys/game-3d-assets@b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/furniture-kit/Models/GLTF%20format/laptop.glb',
      'https://raw.githubusercontent.com/subtiliorars-sys/game-3d-assets/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/furniture-kit/Models/GLTF%20format/laptop.glb',
    ],
    sourceUrl: 'https://github.com/subtiliorars-sys/game-3d-assets/blob/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/furniture-kit/Models/GLTF%20format/laptop.glb',
    license: 'CC0 1.0', licenseUrl: 'https://github.com/subtiliorars-sys/game-3d-assets/blob/b8984ce96e222b5d5ba5a7a17b9a5faa3be38995/vendor/kenney/furniture-kit/License.txt', attribution: 'Kenney / Furniture Kit',
    targetMax: 0.42, position: [3.65, 0.82, -3.0], rotation: Math.PI / 2, priority: 1,
  },
  {
    id: 'iridescence-lamp', name: '虹彩台灯', nameEn: 'Iridescence Lamp', zone: 'bedroom', size: 4083912,
    urls: [
      'https://magic-builder.tos-cn-beijing.volces.com/forge3d/models/khronos-gltf-sample-assets/2bac6f8c57bf471df0d2a1e8a8ec023c7801dddf/iridescence-lamp.glb',
      'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@2bac6f8c57bf471df0d2a1e8a8ec023c7801dddf/Models/IridescenceLamp/glTF-Binary/IridescenceLamp.glb',
      'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/2bac6f8c57bf471df0d2a1e8a8ec023c7801dddf/Models/IridescenceLamp/glTF-Binary/IridescenceLamp.glb',
    ],
    sourceUrl: 'https://github.com/KhronosGroup/glTF-Sample-Assets/blob/2bac6f8c57bf471df0d2a1e8a8ec023c7801dddf/Models/IridescenceLamp/glTF-Binary/IridescenceLamp.glb',
    license: 'CC BY 4.0', licenseUrl: 'https://github.com/KhronosGroup/glTF-Sample-Assets/blob/2bac6f8c57bf471df0d2a1e8a8ec023c7801dddf/Models/IridescenceLamp/LICENSE.md', attribution: 'Eric Chadwick / Wayfair',
    targetMax: 0.52, position: [-4.6, 0.58, -3.35], rotation: 0.3, priority: 2, light: true,
  },
];
