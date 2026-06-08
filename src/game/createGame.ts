import Phaser from 'phaser';
import { FarmScene } from './scenes/FarmScene';

export function createGame(parent: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 640,
    height: 416,
    pixelArt: true,
    backgroundColor: '#2f6f43',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true,
    },
    scene: [FarmScene],
  });
}
