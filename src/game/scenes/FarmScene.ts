import Phaser from 'phaser';
import { createPixelAssets } from '../assets/createPixelAssets';
import { emitGameEvent } from '../eventBus';
import { EconomySystem } from '../systems/EconomySystem';
import { FieldSystem } from '../systems/FieldSystem';
import { TaskSystem } from '../systems/TaskSystem';
import { TILE_SIZE, type AnimationState, type Direction, type TaskType } from '../types';

const WORLD_WIDTH = 20;
const WORLD_HEIGHT = 13;
const MOVE_DURATION = 150;
const TASK_DURATION = 650;
const TILE_INDEX = {
  grass: 0,
  dirtPath: 1,
  fieldHarvested: 2,
  fieldPrepared: 3,
  fieldPlanted: 4,
  fieldLocked: 5,
  fence: 6,
  water: 7,
} as const;

export class FarmScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private maya!: Phaser.GameObjects.Sprite;
  private fieldLayer!: Phaser.Tilemaps.TilemapLayer;
  private tileX = 4;
  private tileY = 6;
  private moving = false;
  private animationState: AnimationState = 'idle';

  private readonly fields = new FieldSystem();
  private readonly tasks = new TaskSystem();
  private readonly economy = new EconomySystem();

  constructor() {
    super('FarmScene');
  }

  create() {
    createPixelAssets(this);
    this.createAnimations();
    this.createWorld();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,SPACE,ONE,TWO,THREE,FOUR') as Record<string, Phaser.Input.Keyboard.Key>;

    this.maya = this.add.sprite(this.tileX * TILE_SIZE + 16, this.tileY * TILE_SIZE + 16, 'maya', 0);
    this.maya.setDepth(10);
    this.maya.play('maya-idle');

    this.publishState('Welcome to Capitalism 4 Kids.');
  }

  update() {
    if (this.moving) return;

    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.enqueueTask('Prepare Soil');
    if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.enqueueTask('Plant Wheat');
    if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.enqueueTask('Harvest Wheat');
    if (Phaser.Input.Keyboard.JustDown(this.keys.FOUR)) this.enqueueTask('Milk Cow');

    if (this.tasks.currentTask) return;

    const direction = this.readDirection();
    if (direction) {
      this.moveMaya(direction);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.performContextAction();
  }

  private createAnimations() {
    const animationMap: Array<[string, number]> = [
      ['idle', 0],
      ['walk', 1],
      ['prepare soil', 2],
      ['plant', 3],
      ['harvest', 4],
      ['milk cow', 5],
    ];

    animationMap.forEach(([key, frame]) => {
      if (this.anims.exists(`maya-${key}`)) return;
      this.anims.create({ key: `maya-${key}`, frames: [{ key: 'maya', frame }], frameRate: 1 });
    });
  }

  private createWorld() {
    this.cameras.main.setBackgroundColor('#2f6f43');
    const map = this.make.tilemap({ width: WORLD_WIDTH, height: WORLD_HEIGHT, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
    const tileset = map.addTilesetImage('farm-tiles', 'farm-tiles', TILE_SIZE, TILE_SIZE, 0, 0);
    const groundLayer = map.createBlankLayer('Ground', tileset!, 0, 0)!;

    for (let y = 0; y < WORLD_HEIGHT; y += 1) {
      for (let x = 0; x < WORLD_WIDTH; x += 1) {
        groundLayer.putTileAt(this.tileIndexForBaseTile(x, y), x, y);
      }
    }

    this.fieldLayer = map.createBlankLayer('Fields', tileset!, 0, 0)!;
    this.fieldLayer.setDepth(2);
    this.redrawFields();

    groundLayer.putTileAt(TILE_INDEX.water, 13, 4);
    groundLayer.putTileAt(TILE_INDEX.water, 14, 4);
    groundLayer.putTileAt(TILE_INDEX.water, 13, 5);
    groundLayer.putTileAt(TILE_INDEX.water, 14, 5);

    this.add.text(9, 9, '1 Soil  2 Seed  3 Harvest  4 Milk  Space Context', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#fff8d6',
      backgroundColor: '#2d241a',
      padding: { x: 4, y: 3 },
    }).setDepth(20);
  }

  private tileIndexForBaseTile(x: number, y: number) {
    if (x === 0 || y === 0 || x === WORLD_WIDTH - 1 || y === WORLD_HEIGHT - 1) return TILE_INDEX.fence;
    if (y === 7 || (x > 2 && x < 11 && y === 6)) return TILE_INDEX.dirtPath;
    return TILE_INDEX.grass;
  }

  private redrawFields() {
    this.fieldLayer.fill(-1);
    [
      { x: 6, y: 5 },
      { x: 8, y: 5 },
    ].forEach(({ x, y }) => {
      const field = this.fields.getFieldAt(x, y);
      this.fieldLayer.putTileAt(field ? this.tileIndexForField(field.state) : TILE_INDEX.fieldHarvested, x, y);
    });
  }

  private tileIndexForField(state: string) {
    if (state === 'Prepared') return TILE_INDEX.fieldPrepared;
    if (state === 'Planted') return TILE_INDEX.fieldPlanted;
    if (state === 'Locked') return TILE_INDEX.fieldLocked;
    return TILE_INDEX.fieldHarvested;
  }

  private readDirection(): Direction | null {
    if (this.cursors.left.isDown || this.keys.A.isDown) return 'left';
    if (this.cursors.right.isDown || this.keys.D.isDown) return 'right';
    if (this.cursors.up.isDown || this.keys.W.isDown) return 'up';
    if (this.cursors.down.isDown || this.keys.S.isDown) return 'down';
    return null;
  }

  private moveMaya(direction: Direction) {
    const deltas: Record<Direction, [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
    const [dx, dy] = deltas[direction];
    const nextX = Phaser.Math.Clamp(this.tileX + dx, 1, WORLD_WIDTH - 2);
    const nextY = Phaser.Math.Clamp(this.tileY + dy, 1, WORLD_HEIGHT - 2);

    if (nextX === this.tileX && nextY === this.tileY) return;

    this.tileX = nextX;
    this.tileY = nextY;
    this.moving = true;
    this.setMayaAnimation('walk');

    this.tweens.add({
      targets: this.maya,
      x: this.tileX * TILE_SIZE + 16,
      y: this.tileY * TILE_SIZE + 16,
      duration: MOVE_DURATION,
      ease: 'Linear',
      onComplete: () => {
        this.moving = false;
        this.setMayaAnimation('idle');
        this.publishState();
      },
    });
  }

  private performContextAction() {
    const field = this.fields.getFieldAt(this.tileX, this.tileY) ?? this.fields.getFirstUnlockedField();
    if (!field) return;

    if (field.state === 'Harvested') this.enqueueTask('Prepare Soil');
    else if (field.state === 'Prepared') this.enqueueTask('Plant Wheat');
    else if (field.state === 'Planted') this.enqueueTask('Harvest Wheat');
    else this.publishState('That field is locked.');
  }

  private enqueueTask(task: TaskType) {
    const started = this.tasks.enqueue(task);
    this.publishState(started ? `${task} started.` : `${task} added to queue.`);
    if (started) this.runTask(task);
  }

  private runTask(task: TaskType) {
    const animation: Record<TaskType, AnimationState> = {
      'Prepare Soil': 'prepare soil',
      'Plant Wheat': 'plant',
      'Harvest Wheat': 'harvest',
      'Milk Cow': 'milk cow',
    };

    this.setMayaAnimation(animation[task]);

    this.time.delayedCall(TASK_DURATION, () => {
      const message = this.applyTask(task);
      this.redrawFields();
      const nextTask = this.tasks.completeCurrent();
      this.setMayaAnimation('idle');
      this.publishState(message);
      if (nextTask) this.time.delayedCall(120, () => this.runTask(nextTask));
    });
  }

  private applyTask(task: TaskType) {
    const field = this.fields.getFieldAt(this.tileX, this.tileY) ?? this.fields.getFirstUnlockedField();
    const fieldX = field?.tileX ?? this.tileX;
    const fieldY = field?.tileY ?? this.tileY;

    if (task === 'Prepare Soil') {
      return this.fields.prepare(fieldX, fieldY) ? 'Field prepared.' : 'No harvested field is available.';
    }

    if (task === 'Plant Wheat') {
      if (!this.economy.useSeed()) return 'No seeds available.';
      if (this.fields.plant(fieldX, fieldY)) return 'Wheat planted.';
      this.economy.inventory.seeds += 1;
      return 'No prepared field is available.';
    }

    if (task === 'Harvest Wheat') {
      if (!this.fields.harvest(fieldX, fieldY)) return 'No planted field is available.';
      this.economy.addWheat(3);
      return 'Wheat harvested.';
    }

    this.economy.addMilk(1);
    return 'Cow milked.';
  }

  private setMayaAnimation(state: AnimationState) {
    this.animationState = state;
    this.maya.play(`maya-${state}`);
  }

  private publishState(notification?: string) {
    emitGameEvent('state', {
      economy: { ...this.economy.economy },
      inventory: { ...this.economy.inventory },
      currentTask: this.tasks.currentTask,
      taskQueue: [...this.tasks.queue],
      fields: this.fields.snapshots,
      animationState: this.animationState,
    });

    if (notification) emitGameEvent('notification', notification);
  }
}
