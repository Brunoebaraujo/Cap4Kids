import Phaser from 'phaser';
import { TILE_SIZE, type AnimationState, type Direction, type MayaSnapshot } from '../types';

const MAYA_TEXTURE_KEY = 'maya';
const EXPECTED_COLUMNS = 4;
const EXPECTED_ROWS = 4;
const MAYA_WALK_URL = new URL('../../assets/characters/maya/spritesheets/maya-walk.jpg', import.meta.url).href;

const DIRECTION_ROWS: Record<Direction, number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
};

export class Maya {
  static preload(scene: Phaser.Scene) {
    scene.load.image(MAYA_TEXTURE_KEY, MAYA_WALK_URL);
  }

  static createAnimations(scene: Phaser.Scene) {
    const texture = scene.textures.get(MAYA_TEXTURE_KEY);
    const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const frameWidth = Math.max(1, Math.floor(source.width / EXPECTED_COLUMNS));
    const frameHeight = Math.max(1, Math.floor(source.height / EXPECTED_ROWS));

    (Object.keys(DIRECTION_ROWS) as Direction[]).forEach((direction) => {
      const row = DIRECTION_ROWS[direction];

      for (let frame = 0; frame < EXPECTED_COLUMNS; frame += 1) {
        const frameName = Maya.frameName(direction, frame);
        if (!texture.has(frameName)) {
          texture.add(frameName, 0, frame * frameWidth, row * frameHeight, frameWidth, frameHeight);
        }
      }

      const idleKey = Maya.animationKey('idle', direction);
      if (!scene.anims.exists(idleKey)) {
        scene.anims.create({
          key: idleKey,
          frames: [{ key: MAYA_TEXTURE_KEY, frame: Maya.frameName(direction, 0) }],
          frameRate: 1,
        });
      }

      const walkKey = Maya.animationKey('walk', direction);
      if (!scene.anims.exists(walkKey)) {
        scene.anims.create({
          key: walkKey,
          frames: scene.anims.generateFrameNames(MAYA_TEXTURE_KEY, {
            prefix: `maya-${direction}-`,
            start: 0,
            end: EXPECTED_COLUMNS - 1,
          }),
          frameRate: 8,
          repeat: -1,
        });
      }
    });
  }

  static frameName(direction: Direction, frame: number) {
    return `maya-${direction}-${frame}`;
  }

  static animationKey(state: 'idle' | 'walk', direction: Direction) {
    return `${state}_${direction}`;
  }

  readonly sprite: Phaser.GameObjects.Sprite;
  private direction: Direction = 'down';
  private animation = Maya.animationKey('idle', this.direction);
  private semanticState: AnimationState = 'idle';
  private readonly frameWidth: number;
  private readonly frameHeight: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const texture = scene.textures.get(MAYA_TEXTURE_KEY);
    const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    this.frameWidth = Math.max(1, Math.floor(source.width / EXPECTED_COLUMNS));
    this.frameHeight = Math.max(1, Math.floor(source.height / EXPECTED_ROWS));

    this.sprite = scene.add.sprite(x, y, MAYA_TEXTURE_KEY, Maya.frameName(this.direction, 0));
    this.sprite.setDepth(20);
    this.sprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
    this.sprite.play(this.animation);
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }

  setPosition(x: number, y: number) {
    this.sprite.setPosition(x, y);
  }

  playWalkToward(deltaX: number, deltaY: number) {
    this.semanticState = 'walk';
    this.direction = this.directionFromVector(deltaX, deltaY);
    this.play(Maya.animationKey('walk', this.direction));
  }

  playIdle() {
    this.semanticState = 'idle';
    this.play(Maya.animationKey('idle', this.direction));
  }

  playTaskState(state: AnimationState) {
    this.semanticState = state;
    this.play(Maya.animationKey('idle', this.direction));
  }

  getSnapshot(): MayaSnapshot {
    return {
      animation: this.animation,
      direction: this.direction,
      x: Math.round(this.x),
      y: Math.round(this.y),
      frameWidth: this.frameWidth,
      frameHeight: this.frameHeight,
      state: this.semanticState,
    };
  }

  private play(animation: string) {
    this.animation = animation;
    this.sprite.play(animation, true);
  }

  private directionFromVector(deltaX: number, deltaY: number): Direction {
    if (Math.abs(deltaX) > Math.abs(deltaY)) return deltaX < 0 ? 'left' : 'right';
    if (deltaY < 0) return 'up';
    return 'down';
  }
}
