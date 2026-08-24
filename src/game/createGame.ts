import Phaser from 'phaser';
import { IsoFarmScene } from './scenes/IsoFarmScene';

export function createGame(parent: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: parent.clientWidth || window.innerWidth,
    height: parent.clientHeight || window.innerHeight,
    backgroundColor: '#243b1f',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
    render: {
      antialias: true,
      roundPixels: true,
    },
    scene: [IsoFarmScene],
  });
}
