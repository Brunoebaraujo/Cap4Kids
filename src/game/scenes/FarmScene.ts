import Phaser from 'phaser';
import { createPixelAssets } from '../assets/createPixelAssets';
import { emitGameEvent } from '../eventBus';
import { EconomySystem } from '../systems/EconomySystem';
import { FieldSystem } from '../systems/FieldSystem';
import { TaskSystem } from '../systems/TaskSystem';
import { TILE_SIZE, type AnimationState, type TaskType } from '../types';

export const WORLD_WIDTH = 4000;
export const WORLD_HEIGHT = 3000;
export const CAMERA_ZOOM = 2;
const WORLD_COLUMNS = Math.ceil(WORLD_WIDTH / TILE_SIZE);
const WORLD_ROWS = Math.ceil(WORLD_HEIGHT / TILE_SIZE);
const MAYA_SPEED = 150;
const CAMERA_LERP = 0.12;
const TASK_DURATION = 650;

const LANDMARKS = {
  house: { x: 520, y: 430, width: 224, height: 168 },
  cowPen: { x: 3180, y: 1260, width: 320, height: 224 },
  storage: { x: 1960, y: 2580, width: 224, height: 144 },
} as const;

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
  private collisionRects: Phaser.Geom.Rectangle[] = [];
  private mayaX = 560;
  private mayaY = 620;
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
    this.createControls();

    this.maya = this.add.sprite(this.mayaX, this.mayaY, 'maya', 0);
    this.maya.setDepth(20);
    this.maya.play('maya-idle');

    this.configureCamera();
    this.publishState('Welcome to the expanded farm.');
  }

  update(_time: number, delta: number) {
    this.readTaskInput();
    this.moveMaya(delta / 1000);

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.performContextAction();
  }

  private createControls() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,SPACE,ONE,TWO,THREE,FOUR') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture(['W', 'A', 'S', 'D', 'SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT']);
  }

  private configureCamera() {
    const camera = this.cameras.main;
    camera.setBackgroundColor('#2f6f43');
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.setZoom(CAMERA_ZOOM);
    camera.startFollow(this.maya, true, CAMERA_LERP, CAMERA_LERP);
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
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const map = this.make.tilemap({ width: WORLD_COLUMNS, height: WORLD_ROWS, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
    const tileset = map.addTilesetImage('farm-tiles', 'farm-tiles', TILE_SIZE, TILE_SIZE, 0, 0);
    const groundLayer = map.createBlankLayer('Ground', tileset!, 0, 0)!;

    for (let y = 0; y < WORLD_ROWS; y += 1) {
      for (let x = 0; x < WORLD_COLUMNS; x += 1) {
        groundLayer.putTileAt(this.tileIndexForBaseTile(x, y), x, y);
      }
    }

    this.fieldLayer = map.createBlankLayer('Fields', tileset!, 0, 0)!;
    this.fieldLayer.setDepth(4);
    this.redrawFields();

    this.createLandmarks();
    this.createExplorationProps();
  }

  private tileIndexForBaseTile(x: number, y: number) {
    if (x === 0 || y === 0 || x === WORLD_COLUMNS - 1 || y === WORLD_ROWS - 1) return TILE_INDEX.fence;
    if (this.isPathTile(x, y)) return TILE_INDEX.dirtPath;
    if ((x === 90 || x === 91) && y > 16 && y < 44) return TILE_INDEX.water;
    return TILE_INDEX.grass;
  }

  private isPathTile(x: number, y: number) {
    const houseToFields = y >= 18 && y <= 19 && x >= 16 && x <= 30;
    const fieldConnector = x >= 28 && x <= 29 && y >= 19 && y <= 73;
    const eastRoad = y >= 43 && y <= 44 && x >= 29 && x <= 104;
    const southRoad = x >= 61 && x <= 62 && y >= 44 && y <= 82;
    const storageTurn = y >= 81 && y <= 82 && x >= 61 && x <= 67;

    return houseToFields || fieldConnector || eastRoad || southRoad || storageTurn;
  }

  private createLandmarks() {
    this.createHouse();
    this.createCowPen();
    this.createStorage();
  }

  private createHouse() {
    const { x, y, width, height } = LANDMARKS.house;
    this.add.rectangle(x, y, width, height, 0x8f4c2e).setDepth(8);
    this.add.rectangle(x, y - 78, width + 28, 64, 0x5d2f25).setDepth(9);
    this.add.rectangle(x - 62, y + 36, 42, 66, 0x3b2418).setDepth(10);
    this.add.rectangle(x + 48, y + 6, 52, 42, 0x83b7d8).setDepth(10);
    this.add.text(x - 92, y - 18, 'HOUSE', { fontFamily: 'monospace', fontSize: '16px', color: '#fff4bd' }).setDepth(11);
    this.addCollisionRect(x - width / 2, y - height / 2, width, height);
  }

  private createCowPen() {
    const { x, y, width, height } = LANDMARKS.cowPen;
    this.add.rectangle(x, y, width, height, 0x6fbf4a).setDepth(6);
    this.add.rectangle(x, y, width, 16, 0x8a5528).setDepth(9);
    this.add.rectangle(x, y + height / 2 - 8, width, 16, 0x8a5528).setDepth(9);
    this.add.rectangle(x - width / 2 + 8, y, 16, height, 0x8a5528).setDepth(9);
    this.add.rectangle(x + width / 2 - 8, y, 16, height, 0x8a5528).setDepth(9);
    this.add.rectangle(x - 34, y + 18, 62, 42, 0xffffff).setDepth(10);
    this.add.rectangle(x - 60, y + 5, 28, 28, 0x2f2d2b).setDepth(11);
    this.add.text(x - 70, y - 14, 'COW PEN', { fontFamily: 'monospace', fontSize: '16px', color: '#2d241a' }).setDepth(11);
    this.addCollisionRect(x - width / 2, y - height / 2, width, 18);
    this.addCollisionRect(x - width / 2, y + height / 2 - 18, width, 18);
    this.addCollisionRect(x - width / 2, y - height / 2, 18, height);
    this.addCollisionRect(x + width / 2 - 18, y - height / 2, 18, height);
  }

  private createStorage() {
    const { x, y, width, height } = LANDMARKS.storage;
    this.add.rectangle(x, y, width, height, 0x7b5a35).setDepth(8);
    this.add.rectangle(x, y - 68, width + 18, 42, 0x4b3320).setDepth(9);
    this.add.rectangle(x - 52, y + 30, 42, 58, 0x2f2418).setDepth(10);
    this.add.text(x - 82, y - 10, 'STORAGE', { fontFamily: 'monospace', fontSize: '16px', color: '#fff4bd' }).setDepth(11);
    this.addCollisionRect(x - width / 2, y - height / 2, width, height);
  }

  private createExplorationProps() {
    for (let i = 0; i < 95; i += 1) {
      const x = 180 + ((i * 337) % (WORLD_WIDTH - 360));
      const y = 170 + ((i * 239) % (WORLD_HEIGHT - 340));

      if (this.isNearLandmark(x, y)) continue;

      if (i % 3 === 0) this.createTree(x, y);
      else if (i % 3 === 1) this.createRock(x, y);
      else this.createFlower(x, y);
    }
  }

  private createTree(x: number, y: number) {
    this.add.rectangle(x, y + 20, 26, 54, 0x6b3f24).setDepth(7);
    this.add.circle(x, y - 24, 52, 0x236d38).setDepth(8);
    this.add.circle(x - 28, y - 4, 38, 0x2f8545).setDepth(8);
    this.add.circle(x + 26, y - 2, 40, 0x2f8545).setDepth(8);
    this.addCollisionRect(x - 32, y - 16, 64, 84);
  }

  private createRock(x: number, y: number) {
    this.add.rectangle(x, y, 46, 32, 0x6d6f72).setDepth(7);
    this.add.rectangle(x - 8, y - 10, 32, 16, 0x8b8e8f).setDepth(8);
    this.addCollisionRect(x - 24, y - 18, 48, 36);
  }

  private createFlower(x: number, y: number) {
    this.add.rectangle(x, y + 8, 4, 16, 0x2f8545).setDepth(7);
    this.add.rectangle(x - 6, y, 8, 8, 0xf0c15f).setDepth(8);
    this.add.rectangle(x + 6, y, 8, 8, 0xd95a7a).setDepth(8);
  }

  private isNearLandmark(x: number, y: number) {
    const protectedAreas = [
      { x: 540, y: 520, radius: 380 },
      { x: 768, y: 1344, radius: 280 },
      { x: 896, y: 2304, radius: 280 },
      { x: 3180, y: 1260, radius: 320 },
      { x: 1960, y: 2580, radius: 300 },
    ];

    return protectedAreas.some((area) => Phaser.Math.Distance.Between(x, y, area.x, area.y) < area.radius);
  }

  private redrawFields() {
    this.fieldLayer.fill(-1);

    this.fields.allFields.forEach((field) => {
      for (let y = field.tileY - 1; y <= field.tileY + 1; y += 1) {
        for (let x = field.tileX - 1; x <= field.tileX + 1; x += 1) {
          this.fieldLayer.putTileAt(this.tileIndexForField(field.state), x, y);
        }
      }
    });
  }

  private tileIndexForField(state: string) {
    if (state === 'Prepared') return TILE_INDEX.fieldPrepared;
    if (state === 'Planted') return TILE_INDEX.fieldPlanted;
    if (state === 'Locked') return TILE_INDEX.fieldLocked;
    return TILE_INDEX.fieldHarvested;
  }

  private readTaskInput() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.enqueueTask('Prepare Soil');
    if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.enqueueTask('Plant Wheat');
    if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.enqueueTask('Harvest Wheat');
    if (Phaser.Input.Keyboard.JustDown(this.keys.FOUR)) this.enqueueTask('Milk Cow');
  }

  private moveMaya(deltaSeconds: number) {
    const inputX = Number(this.cursors.right.isDown || this.keys.D.isDown) - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const inputY = Number(this.cursors.down.isDown || this.keys.S.isDown) - Number(this.cursors.up.isDown || this.keys.W.isDown);

    if (inputX === 0 && inputY === 0) {
      if (!this.tasks.currentTask && this.animationState === 'walk') this.setMayaAnimation('idle');
      return;
    }

    const vector = new Phaser.Math.Vector2(inputX, inputY).normalize().scale(MAYA_SPEED * deltaSeconds);
    const nextX = Phaser.Math.Clamp(this.mayaX + vector.x, 16, WORLD_WIDTH - 16);
    const nextY = Phaser.Math.Clamp(this.mayaY + vector.y, 16, WORLD_HEIGHT - 16);

    if (!this.collidesAt(nextX, this.mayaY)) this.mayaX = nextX;
    if (!this.collidesAt(this.mayaX, nextY)) this.mayaY = nextY;

    this.maya.setPosition(this.mayaX, this.mayaY);
    if (!this.tasks.currentTask) this.setMayaAnimation('walk');
    this.publishState();
  }

  private collidesAt(x: number, y: number) {
    const mayaBounds = this.getMayaBounds(x, y);
    return this.collisionRects.some((rect) => Phaser.Geom.Intersects.RectangleToRectangle(mayaBounds, rect));
  }

  private getMayaBounds(x: number, y: number) {
    return new Phaser.Geom.Rectangle(x - 10, y - 8, 20, 20);
  }

  private addCollisionRect(x: number, y: number, width: number, height: number) {
    this.collisionRects.push(new Phaser.Geom.Rectangle(x, y, width, height));
  }

  private performContextAction() {
    const tileX = Math.floor(this.mayaX / TILE_SIZE);
    const tileY = Math.floor(this.mayaY / TILE_SIZE);
    const field = this.fields.getFieldAt(tileX, tileY) ?? this.fields.getFirstUnlockedField();
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
    const tileX = Math.floor(this.mayaX / TILE_SIZE);
    const tileY = Math.floor(this.mayaY / TILE_SIZE);
    const field = this.fields.getFieldAt(tileX, tileY) ?? this.fields.getFirstUnlockedField();
    const fieldX = field?.tileX ?? tileX;
    const fieldY = field?.tileY ?? tileY;

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
