import Phaser from 'phaser';
import { TILE_REGISTRY, TILE_SIZE, type TileId } from './tileRegistry';

function px(graphics: Phaser.GameObjects.Graphics, color: number, x: number, y: number, width: number, height: number) {
  graphics.fillStyle(color, 1).fillRect(x, y, width, height);
}

function addSpeckles(graphics: Phaser.GameObjects.Graphics, color: number, points: Array<[number, number]>) {
  graphics.fillStyle(color, 1);
  points.forEach(([x, y]) => graphics.fillRect(x, y, 2, 2));
}

function drawGrassBase(graphics: Phaser.GameObjects.Graphics, base = 0x63ad45) {
  px(graphics, base, 0, 0, TILE_SIZE, TILE_SIZE);
  addSpeckles(graphics, 0x7dc457, [[4, 6], [15, 10], [25, 5], [8, 24], [24, 22]]);
  px(graphics, 0x4d8d38, 6, 15, 2, 5);
  px(graphics, 0x4d8d38, 18, 21, 2, 5);
}

function drawPathBase(graphics: Phaser.GameObjects.Graphics) {
  px(graphics, 0x6fbf4a, 0, 0, TILE_SIZE, TILE_SIZE);
  px(graphics, 0xb57b42, 0, 0, TILE_SIZE, TILE_SIZE);
  addSpeckles(graphics, 0xd1a05e, [[5, 5], [15, 12], [24, 7], [8, 23], [25, 24]]);
  addSpeckles(graphics, 0x8e5d32, [[10, 18], [21, 15], [4, 28]]);
}

function drawPathMask(graphics: Phaser.GameObjects.Graphics, north: boolean, east: boolean, south: boolean, west: boolean) {
  drawGrassBase(graphics);
  px(graphics, 0xb57b42, 8, 8, 16, 16);
  if (north) px(graphics, 0xb57b42, 8, 0, 16, 16);
  if (east) px(graphics, 0xb57b42, 16, 8, 16, 16);
  if (south) px(graphics, 0xb57b42, 8, 16, 16, 16);
  if (west) px(graphics, 0xb57b42, 0, 8, 16, 16);
  addSpeckles(graphics, 0xd1a05e, [[11, 10], [20, 13], [13, 22], [24, 18]]);
  px(graphics, 0x8e5d32, 9, 8, 14, 2);
  px(graphics, 0x8e5d32, 9, 22, 14, 2);
}

function drawFencePost(graphics: Phaser.GameObjects.Graphics, x: number, y: number) {
  px(graphics, 0x70431f, x, y, 5, 22);
  px(graphics, 0xb8793a, x, y, 5, 4);
}

function drawFieldRows(graphics: Phaser.GameObjects.Graphics, base: number, shadow: number, highlight: number) {
  px(graphics, base, 0, 0, TILE_SIZE, TILE_SIZE);
  for (let y = 5; y < TILE_SIZE; y += 8) {
    px(graphics, shadow, 2, y, 28, 2);
    px(graphics, highlight, 4, y + 2, 24, 1);
  }
}

function drawHouseWall(graphics: Phaser.GameObjects.Graphics) {
  px(graphics, 0xa86f3a, 0, 0, TILE_SIZE, TILE_SIZE);
  px(graphics, 0xc58a4e, 0, 0, TILE_SIZE, 4);
  for (let y = 8; y < TILE_SIZE; y += 8) px(graphics, 0x7d4e2a, 0, y, TILE_SIZE, 2);
  for (let x = 6; x < TILE_SIZE; x += 12) px(graphics, 0x8f5c32, x, 4, 2, TILE_SIZE - 4);
}

function drawPlaceholderTile(id: TileId, graphics: Phaser.GameObjects.Graphics) {
  switch (id) {
    case 'grass_base':
    case 'grass_light':
      drawGrassBase(graphics, 0x63ad45);
      break;
    case 'grass_dark':
      drawGrassBase(graphics, 0x4f913a);
      px(graphics, 0x3f7f33, 13, 9, 2, 7);
      break;
    case 'grass_flower':
      drawGrassBase(graphics, 0x63ad45);
      px(graphics, 0xf1d16a, 7, 9, 5, 5);
      px(graphics, 0xd85b7a, 21, 18, 5, 5);
      px(graphics, 0xffffff, 16, 7, 4, 4);
      break;
    case 'grass_rock_small':
      drawGrassBase(graphics, 0x63ad45);
      px(graphics, 0x6d6f72, 18, 18, 9, 6);
      px(graphics, 0x999b9c, 20, 16, 6, 3);
      break;
    case 'grass_clover':
      drawGrassBase(graphics, 0x63ad45);
      px(graphics, 0x2f8545, 9, 8, 5, 5);
      px(graphics, 0x2f8545, 14, 8, 5, 5);
      px(graphics, 0x2f8545, 12, 13, 5, 5);
      px(graphics, 0x2f8545, 13, 18, 2, 7);
      break;
    case 'grass_worn':
      drawGrassBase(graphics, 0x6aa248);
      px(graphics, 0x94723d, 7, 12, 18, 8);
      addSpeckles(graphics, 0xb28a4d, [[10, 14], [18, 17], [23, 15]]);
      break;
    case 'path_horizontal':
      drawPathMask(graphics, false, true, false, true);
      break;
    case 'path_vertical':
      drawPathMask(graphics, true, false, true, false);
      break;
    case 'path_corner_ne':
      drawPathMask(graphics, true, true, false, false);
      break;
    case 'path_corner_se':
      drawPathMask(graphics, false, true, true, false);
      break;
    case 'path_corner_sw':
      drawPathMask(graphics, false, false, true, true);
      break;
    case 'path_corner_nw':
      drawPathMask(graphics, true, false, false, true);
      break;
    case 'path_t_north':
      drawPathMask(graphics, true, true, false, true);
      break;
    case 'path_t_east':
      drawPathMask(graphics, true, true, true, false);
      break;
    case 'path_t_south':
      drawPathMask(graphics, false, true, true, true);
      break;
    case 'path_t_west':
      drawPathMask(graphics, true, false, true, true);
      break;
    case 'path_cross':
      drawPathMask(graphics, true, true, true, true);
      break;
    case 'path_edge':
    case 'dirt_path_edge':
      drawGrassBase(graphics, 0x63ad45);
      px(graphics, 0xb57b42, 0, 12, TILE_SIZE, 8);
      px(graphics, 0x4d8d38, 0, 10, TILE_SIZE, 2);
      px(graphics, 0x4d8d38, 0, 20, TILE_SIZE, 2);
      break;
    case 'dirt_path':
      drawPathBase(graphics);
      break;
    case 'field_harvested':
      drawFieldRows(graphics, 0x9c6a32, 0x704722, 0xc08a43);
      px(graphics, 0xd1aa61, 8, 4, 2, 4);
      px(graphics, 0xd1aa61, 23, 20, 2, 4);
      break;
    case 'field_prepared':
      drawFieldRows(graphics, 0x6d4024, 0x3f2518, 0x9d6338);
      break;
    case 'field_planted':
      drawFieldRows(graphics, 0x6d4024, 0x3f2518, 0x9d6338);
      [[8, 10], [20, 10], [8, 22], [20, 22]].forEach(([x, y]) => {
        px(graphics, 0x88c441, x, y, 3, 7);
        px(graphics, 0x5e9f38, x - 2, y + 2, 7, 2);
      });
      break;
    case 'field_locked':
      drawFieldRows(graphics, 0x5a5146, 0x2f2d2b, 0x8f877a);
      px(graphics, 0x2f2d2b, 5, 14, 22, 12);
      graphics.lineStyle(3, 0x2f2d2b, 1).strokeRect(10, 7, 12, 12);
      break;
    case 'water':
      px(graphics, 0x3b8bd9, 0, 0, TILE_SIZE, TILE_SIZE);
      px(graphics, 0x65b7ef, 3, 8, 10, 2);
      px(graphics, 0x65b7ef, 17, 20, 12, 2);
      px(graphics, 0x246bb9, 0, 28, TILE_SIZE, 4);
      break;
    case 'fence_horizontal':
      drawGrassBase(graphics, 0x63ad45);
      px(graphics, 0x8a5528, 0, 12, TILE_SIZE, 5);
      px(graphics, 0x8a5528, 0, 22, TILE_SIZE, 4);
      drawFencePost(graphics, 5, 7);
      drawFencePost(graphics, 22, 7);
      break;
    case 'fence_vertical':
      drawGrassBase(graphics, 0x63ad45);
      px(graphics, 0x8a5528, 12, 0, 5, TILE_SIZE);
      px(graphics, 0x8a5528, 22, 0, 4, TILE_SIZE);
      drawFencePost(graphics, 7, 5);
      drawFencePost(graphics, 7, 22);
      break;
    case 'fence_corner':
      drawGrassBase(graphics, 0x63ad45);
      px(graphics, 0x8a5528, 12, 12, TILE_SIZE - 12, 5);
      px(graphics, 0x8a5528, 12, 12, 5, TILE_SIZE - 12);
      drawFencePost(graphics, 10, 10);
      break;
    case 'fence_gate':
      drawGrassBase(graphics, 0x63ad45);
      px(graphics, 0x8a5528, 3, 14, 11, 4);
      px(graphics, 0x8a5528, 18, 14, 11, 4);
      drawFencePost(graphics, 4, 8);
      drawFencePost(graphics, 23, 8);
      break;
    case 'corral_dirt':
      px(graphics, 0x9a6a38, 0, 0, TILE_SIZE, TILE_SIZE);
      addSpeckles(graphics, 0xbc8549, [[4, 7], [16, 10], [24, 22], [8, 25]]);
      break;
    case 'house_wall':
      drawHouseWall(graphics);
      break;
    case 'house_roof':
      px(graphics, 0x8c2f27, 0, 0, TILE_SIZE, TILE_SIZE);
      px(graphics, 0xb84632, 0, 0, TILE_SIZE, 5);
      for (let y = 8; y < TILE_SIZE; y += 8) px(graphics, 0x6f241d, 0, y, TILE_SIZE, 2);
      break;
    case 'house_roof_left':
      px(graphics, 0x63ad45, 0, 0, TILE_SIZE, TILE_SIZE);
      px(graphics, 0x8c2f27, 8, 8, 24, 24);
      px(graphics, 0xb84632, 11, 6, 21, 4);
      break;
    case 'house_roof_right':
      px(graphics, 0x63ad45, 0, 0, TILE_SIZE, TILE_SIZE);
      px(graphics, 0x8c2f27, 0, 8, 24, 24);
      px(graphics, 0xb84632, 0, 6, 21, 4);
      break;
    case 'house_door':
      drawHouseWall(graphics);
      px(graphics, 0x4a2b1b, 10, 8, 12, 24);
      px(graphics, 0xd4a94e, 19, 19, 2, 2);
      break;
    case 'house_window':
      drawHouseWall(graphics);
      px(graphics, 0x83b7d8, 8, 8, 16, 12);
      px(graphics, 0xe8f4ff, 10, 10, 5, 4);
      px(graphics, 0x3e6f8f, 15, 8, 2, 12);
      break;
    case 'house_chimney':
      px(graphics, 0x8c2f27, 0, 0, TILE_SIZE, TILE_SIZE);
      px(graphics, 0x5d2f25, 12, 3, 10, 24);
      px(graphics, 0x2f1d18, 10, 0, 14, 4);
      break;
    case 'house_flower_box':
      drawHouseWall(graphics);
      px(graphics, 0x5c351f, 7, 21, 18, 5);
      px(graphics, 0xf1d16a, 9, 17, 4, 4);
      px(graphics, 0xd85b7a, 17, 17, 4, 4);
      break;
    case 'tree':
      drawGrassBase(graphics, 0x63ad45);
      px(graphics, 0x6b3f24, 13, 15, 6, 14);
      graphics.fillStyle(0x236d38, 1).fillCircle(16, 10, 10);
      graphics.fillStyle(0x2f8545, 1).fillCircle(9, 15, 8).fillCircle(22, 15, 8);
      px(graphics, 0x184f2e, 8, 20, 17, 3);
      break;
    case 'bush':
      drawGrassBase(graphics, 0x63ad45);
      graphics.fillStyle(0x2f8545, 1).fillCircle(10, 18, 7).fillCircle(17, 15, 8).fillCircle(24, 19, 6);
      px(graphics, 0x1f6635, 7, 22, 21, 3);
      break;
    case 'rock':
      drawGrassBase(graphics, 0x63ad45);
      px(graphics, 0x6d6f72, 7, 14, 20, 12);
      px(graphics, 0x8b8e8f, 10, 10, 14, 7);
      px(graphics, 0x4f5255, 8, 23, 18, 3);
      break;
    case 'flower':
      drawGrassBase(graphics, 0x63ad45);
      px(graphics, 0x2f8545, 15, 14, 3, 12);
      px(graphics, 0xf0c15f, 10, 10, 7, 7);
      px(graphics, 0xd95a7a, 17, 10, 7, 7);
      px(graphics, 0xffffff, 14, 7, 6, 6);
      break;
  }
}

function createTileTexture(scene: Phaser.Scene, id: TileId, key: string) {
  if (scene.textures.exists(key)) return;

  const graphics = scene.add.graphics();
  drawPlaceholderTile(id, graphics);
  graphics.generateTexture(key, TILE_SIZE, TILE_SIZE);
  graphics.destroy();
}

function createFarmTileset(scene: Phaser.Scene) {
  if (scene.textures.exists('farm-tiles')) {
    scene.textures.remove('farm-tiles');
  }

  const tileset = scene.add.renderTexture(0, 0, TILE_SIZE * TILE_REGISTRY.length, TILE_SIZE);
  TILE_REGISTRY.forEach((tile) => {
    tileset.draw(tile.textureKey, tile.atlasIndex * TILE_SIZE, 0);
  });
  tileset.saveTexture('farm-tiles');
  tileset.destroy();
}

function createMayaTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('maya')) return;

  const maya = scene.add.graphics();
  const frameSize = 32;
  const states = [
    { key: 'idle', dress: 0xf2b84b },
    { key: 'walk', dress: 0xeaa33b },
    { key: 'prepare', dress: 0xd88934 },
    { key: 'plant', dress: 0x86b94d },
    { key: 'harvest', dress: 0xf0c64c },
    { key: 'milk', dress: 0x9fb7d9 },
  ];

  states.forEach((state, index) => {
    const x = index * frameSize;
    maya.fillStyle(0x000000, 0).fillRect(x, 0, frameSize, frameSize);
    maya.fillStyle(0x5a3823, 1).fillRect(x + 10, 4, 12, 8);
    maya.fillStyle(0xffc17a, 1).fillRect(x + 11, 8, 10, 8);
    maya.fillStyle(state.dress, 1).fillRect(x + 9, 16, 14, 9);
    maya.fillStyle(0x2f5f9f, 1).fillRect(x + 9, 25, 5, 5).fillRect(x + 18, 25, 5, 5);
    maya.fillStyle(0x2b1b12, 1).fillRect(x + 13, 11, 2, 2).fillRect(x + 18, 11, 2, 2);

    if (state.key === 'walk') {
      maya.fillStyle(0xffc17a, 1).fillRect(x + 5, 18, 5, 4).fillRect(x + 22, 15, 5, 4);
    } else if (state.key === 'prepare') {
      maya.fillStyle(0x6d4828, 1).fillRect(x + 23, 12, 3, 16).fillRect(x + 20, 24, 9, 3);
    } else if (state.key === 'plant') {
      maya.fillStyle(0x5e9f38, 1).fillRect(x + 23, 20, 4, 4);
    } else if (state.key === 'harvest') {
      maya.fillStyle(0xe8d36c, 1).fillRect(x + 23, 14, 4, 10);
    } else if (state.key === 'milk') {
      maya.fillStyle(0xffffff, 1).fillRect(x + 22, 18, 6, 7);
    }
  });

  maya.generateTexture('maya', frameSize * states.length, frameSize);
  maya.destroy();

  const texture = scene.textures.get('maya');
  states.forEach((_, index) => {
    texture.add(index, 0, index * frameSize, 0, frameSize, frameSize);
  });
}

export function createPixelAssets(scene: Phaser.Scene) {
  TILE_REGISTRY.forEach((tile) => createTileTexture(scene, tile.id, tile.textureKey));
  createFarmTileset(scene);
  createMayaTexture(scene);
}
