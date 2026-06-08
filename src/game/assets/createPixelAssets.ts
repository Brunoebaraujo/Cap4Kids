import Phaser from 'phaser';

const TILE = 32;

function addSpeckles(graphics: Phaser.GameObjects.Graphics, color: number, points: Array<[number, number]>) {
  graphics.fillStyle(color, 1);
  points.forEach(([x, y]) => graphics.fillRect(x, y, 2, 2));
}

export function createPixelAssets(scene: Phaser.Scene) {
  if (scene.textures.exists('maya')) {
    return;
  }

  const makeTile = (key: string, draw: (graphics: Phaser.GameObjects.Graphics) => void) => {
    const graphics = scene.add.graphics();
    draw(graphics);
    graphics.generateTexture(key, TILE, TILE);
    graphics.destroy();
  };

  makeTile('tile-grass', (graphics) => {
    graphics.fillStyle(0x6fbf4a, 1).fillRect(0, 0, TILE, TILE);
    addSpeckles(graphics, 0x8bd15a, [[4, 8], [18, 6], [26, 20], [10, 24]]);
  });

  makeTile('tile-dirt-path', (graphics) => {
    graphics.fillStyle(0xb6793c, 1).fillRect(0, 0, TILE, TILE);
    addSpeckles(graphics, 0xd09a57, [[5, 5], [15, 13], [25, 9], [9, 25]]);
  });

  makeTile('tile-field-harvested', (graphics) => {
    graphics.fillStyle(0x9c6a32, 1).fillRect(0, 0, TILE, TILE);
    graphics.fillStyle(0x704722, 1);
    for (let y = 6; y < TILE; y += 8) graphics.fillRect(3, y, 26, 2);
  });

  makeTile('tile-field-prepared', (graphics) => {
    graphics.fillStyle(0x7b4c27, 1).fillRect(0, 0, TILE, TILE);
    graphics.fillStyle(0x4e2f1d, 1);
    for (let x = 6; x < TILE; x += 8) graphics.fillRect(x, 3, 2, 26);
  });

  makeTile('tile-field-planted', (graphics) => {
    graphics.fillStyle(0x7b4c27, 1).fillRect(0, 0, TILE, TILE);
    graphics.fillStyle(0x88c441, 1);
    [[8, 9], [19, 9], [8, 21], [19, 21]].forEach(([x, y]) => {
      graphics.fillRect(x, y, 3, 8);
      graphics.fillRect(x - 2, y + 2, 7, 2);
    });
  });

  makeTile('tile-field-locked', (graphics) => {
    graphics.fillStyle(0x5a5146, 1).fillRect(0, 0, TILE, TILE);
    graphics.fillStyle(0x2f2d2b, 1).fillRect(5, 14, 22, 12);
    graphics.lineStyle(3, 0x2f2d2b, 1).strokeRect(10, 7, 12, 12);
  });

  makeTile('tile-fence', (graphics) => {
    graphics.fillStyle(0x6fbf4a, 1).fillRect(0, 0, TILE, TILE);
    graphics.fillStyle(0x8a5528, 1).fillRect(5, 7, 5, 21).fillRect(22, 7, 5, 21).fillRect(0, 12, TILE, 5);
    graphics.fillStyle(0xb8793a, 1).fillRect(5, 7, 5, 3).fillRect(22, 7, 5, 3);
  });

  makeTile('tile-water', (graphics) => {
    graphics.fillStyle(0x3b8bd9, 1).fillRect(0, 0, TILE, TILE);
    graphics.fillStyle(0x65b7ef, 1).fillRect(3, 8, 10, 2).fillRect(17, 20, 12, 2);
  });

  const tileset = scene.add.renderTexture(0, 0, TILE * 8, TILE);
  [
    'tile-grass',
    'tile-dirt-path',
    'tile-field-harvested',
    'tile-field-prepared',
    'tile-field-planted',
    'tile-field-locked',
    'tile-fence',
    'tile-water',
  ].forEach((key, index) => tileset.draw(key, index * TILE, 0));
  tileset.saveTexture('farm-tiles');
  tileset.destroy();

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
