import Phaser from 'phaser';
import { TILE_REGISTRY, TILE_SIZE, type TileId } from './tileRegistry';

function addSpeckles(graphics: Phaser.GameObjects.Graphics, color: number, points: Array<[number, number]>) {
  graphics.fillStyle(color, 1);
  points.forEach(([x, y]) => graphics.fillRect(x, y, 2, 2));
}

function drawFencePost(graphics: Phaser.GameObjects.Graphics, x: number, y: number) {
  graphics.fillStyle(0x70431f, 1).fillRect(x, y, 5, 22);
  graphics.fillStyle(0xb8793a, 1).fillRect(x, y, 5, 4);
}

function drawPlaceholderTile(id: TileId, graphics: Phaser.GameObjects.Graphics) {
  if (id === 'grass_light') {
    graphics.fillStyle(0x6fbf4a, 1).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    addSpeckles(graphics, 0x8bd15a, [[4, 8], [18, 6], [26, 20], [10, 24], [24, 7]]);
    graphics.fillStyle(0x4f9e3e, 1).fillRect(7, 17, 2, 6).fillRect(20, 23, 2, 5);
    return;
  }

  if (id === 'grass_dark') {
    graphics.fillStyle(0x57983d, 1).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    addSpeckles(graphics, 0x75b84d, [[5, 6], [16, 17], [25, 9], [8, 25]]);
    graphics.fillStyle(0x3f7f33, 1).fillRect(13, 9, 2, 7).fillRect(23, 22, 2, 5);
    return;
  }

  if (id === 'dirt_path') {
    graphics.fillStyle(0xb6793c, 1).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    addSpeckles(graphics, 0xd09a57, [[5, 5], [15, 13], [25, 9], [9, 25], [22, 24]]);
    graphics.fillStyle(0x9a6531, 1).fillRect(0, 7, TILE_SIZE, 2).fillRect(0, 23, TILE_SIZE, 2);
    return;
  }

  if (id === 'dirt_path_edge') {
    graphics.fillStyle(0x6fbf4a, 1).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(0xb6793c, 1).fillRect(0, 10, TILE_SIZE, 12);
    graphics.fillStyle(0x4f9e3e, 1).fillRect(0, 8, TILE_SIZE, 2).fillRect(0, 22, TILE_SIZE, 2);
    addSpeckles(graphics, 0xd09a57, [[7, 14], [18, 17], [27, 13]]);
    return;
  }

  if (id === 'field_harvested') {
    graphics.fillStyle(0x9c6a32, 1).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(0x704722, 1);
    for (let y = 6; y < TILE_SIZE; y += 8) graphics.fillRect(3, y, 26, 2);
    graphics.fillStyle(0xc08a43, 1).fillRect(6, 4, 2, 3).fillRect(22, 20, 2, 3);
    return;
  }

  if (id === 'field_prepared') {
    graphics.fillStyle(0x7b4c27, 1).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(0x4e2f1d, 1);
    for (let x = 6; x < TILE_SIZE; x += 8) graphics.fillRect(x, 3, 2, 26);
    graphics.fillStyle(0xa96a36, 1).fillRect(3, 8, 26, 2).fillRect(3, 22, 26, 2);
    return;
  }

  if (id === 'field_planted') {
    graphics.fillStyle(0x7b4c27, 1).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(0x88c441, 1);
    [[8, 9], [19, 9], [8, 21], [19, 21]].forEach(([x, y]) => {
      graphics.fillRect(x, y, 3, 8);
      graphics.fillRect(x - 2, y + 2, 7, 2);
    });
    return;
  }

  if (id === 'field_locked') {
    graphics.fillStyle(0x5a5146, 1).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(0x2f2d2b, 1).fillRect(5, 14, 22, 12);
    graphics.lineStyle(3, 0x2f2d2b, 1).strokeRect(10, 7, 12, 12);
    graphics.fillStyle(0x8f877a, 1).fillRect(0, 0, TILE_SIZE, 3).fillRect(0, 29, TILE_SIZE, 3);
    return;
  }

  if (id === 'water') {
    graphics.fillStyle(0x3b8bd9, 1).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(0x65b7ef, 1).fillRect(3, 8, 10, 2).fillRect(17, 20, 12, 2).fillRect(11, 14, 8, 2);
    graphics.fillStyle(0x246bb9, 1).fillRect(0, 28, TILE_SIZE, 4);
    return;
  }

  if (id === 'fence_horizontal') {
    graphics.fillStyle(0x6fbf4a, 1).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(0x8a5528, 1).fillRect(0, 12, TILE_SIZE, 5).fillRect(0, 22, TILE_SIZE, 4);
    drawFencePost(graphics, 5, 7);
    drawFencePost(graphics, 22, 7);
    return;
  }

  if (id === 'fence_vertical') {
    graphics.fillStyle(0x6fbf4a, 1).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(0x8a5528, 1).fillRect(12, 0, 5, TILE_SIZE).fillRect(22, 0, 4, TILE_SIZE);
    drawFencePost(graphics, 7, 5);
    drawFencePost(graphics, 7, 22);
    return;
  }

  if (id === 'fence_corner') {
    graphics.fillStyle(0x6fbf4a, 1).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(0x8a5528, 1).fillRect(12, 12, TILE_SIZE - 12, 5).fillRect(12, 12, 5, TILE_SIZE - 12);
    drawFencePost(graphics, 10, 10);
    return;
  }

  if (id === 'tree') {
    graphics.fillStyle(0x6fbf4a, 1).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(0x6b3f24, 1).fillRect(13, 15, 6, 14);
    graphics.fillStyle(0x236d38, 1).fillCircle(16, 10, 10);
    graphics.fillStyle(0x2f8545, 1).fillCircle(9, 15, 8).fillCircle(22, 15, 8);
    graphics.fillStyle(0x184f2e, 1).fillRect(8, 20, 17, 3);
    return;
  }

  if (id === 'rock') {
    graphics.fillStyle(0x6fbf4a, 1).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(0x6d6f72, 1).fillRect(7, 14, 20, 12);
    graphics.fillStyle(0x8b8e8f, 1).fillRect(10, 10, 14, 7);
    graphics.fillStyle(0x4f5255, 1).fillRect(8, 23, 18, 3);
    return;
  }

  graphics.fillStyle(0x6fbf4a, 1).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  graphics.fillStyle(0x2f8545, 1).fillRect(15, 14, 3, 12);
  graphics.fillStyle(0xf0c15f, 1).fillRect(10, 10, 7, 7);
  graphics.fillStyle(0xd95a7a, 1).fillRect(17, 10, 7, 7);
  graphics.fillStyle(0xffffff, 1).fillRect(14, 7, 6, 6);
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
