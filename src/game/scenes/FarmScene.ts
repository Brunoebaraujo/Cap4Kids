import Phaser from 'phaser';
import { createPixelAssets } from '../assets/createPixelAssets';
import { emitGameEvent } from '../eventBus';
import { EconomySystem } from '../systems/EconomySystem';
import { FieldSystem } from '../systems/FieldSystem';
import { TaskSystem } from '../systems/TaskSystem';
import { TILE_SIZE, type AnimationState, type CameraMode, type TaskType } from '../types';

export const WORLD_WIDTH = 4000;
export const WORLD_HEIGHT = 3000;
export const CAMERA_ZOOM = 1.5;
const WORLD_COLUMNS = Math.ceil(WORLD_WIDTH / TILE_SIZE);
const WORLD_ROWS = Math.ceil(WORLD_HEIGHT / TILE_SIZE);
const MAYA_SPEED = 150;
const CAMERA_PAN_SPEED = 520;
const CAMERA_LERP = 0.12;
const TASK_DURATION = 650;
const TASK_ARRIVAL_DISTANCE = 3;

const LANDMARKS = {
  house: { tileX: 16, tileY: 13, widthTiles: 7, heightTiles: 5 },
  cowPen: { tileX: 99, tileY: 39, widthTiles: 10, heightTiles: 7 },
  storage: { tileX: 61, tileY: 81, widthTiles: 7, heightTiles: 4 },
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

interface TravelTask {
  task: TaskType;
  targetX: number;
  targetY: number;
}

interface CameraDragState {
  pointerX: number;
  pointerY: number;
  scrollX: number;
  scrollY: number;
}

function tileCenter(tile: number) {
  return tile * TILE_SIZE + TILE_SIZE / 2;
}

function landmarkCenter(landmark: { tileX: number; tileY: number }) {
  return {
    x: tileCenter(landmark.tileX),
    y: tileCenter(landmark.tileY),
  };
}

export class FarmScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private maya!: Phaser.GameObjects.Sprite;
  private fieldLayer!: Phaser.Tilemaps.TilemapLayer;
  private collisionRects: Phaser.Geom.Rectangle[] = [];
  private mayaX = tileCenter(17);
  private mayaY = tileCenter(19);
  private animationState: AnimationState = 'idle';
  private cameraMode: CameraMode = 'free';
  private activeTravel: TravelTask | null = null;
  private cameraDrag: CameraDragState | null = null;
  private cameraStatusText!: Phaser.GameObjects.Text;

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
    this.createCameraStatusText();
    this.publishState('Camera livre: arraste o mapa ou use WASD/setas para explorar.');
  }

  update(_time: number, delta: number) {
    const deltaSeconds = delta / 1000;

    this.readTaskInput();

    if (this.activeTravel) {
      this.moveMayaToTask(deltaSeconds);
      return;
    }

    if (this.cameraMode === 'free') {
      this.panFreeCamera(deltaSeconds);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.performContextAction();
  }

  private createControls() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,SPACE,ONE,TWO,THREE,FOUR') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture(['W', 'A', 'S', 'D', 'SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT']);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.cameraMode !== 'free') return;
      this.cameraDrag = {
        pointerX: pointer.x,
        pointerY: pointer.y,
        scrollX: this.cameras.main.scrollX,
        scrollY: this.cameras.main.scrollY,
      };
    });

    this.input.on('pointerup', () => {
      this.cameraDrag = null;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.cameraMode !== 'free' || !pointer.isDown || !this.cameraDrag) return;

      const camera = this.cameras.main;
      const nextScrollX = this.cameraDrag.scrollX - (pointer.x - this.cameraDrag.pointerX) / camera.zoom;
      const nextScrollY = this.cameraDrag.scrollY - (pointer.y - this.cameraDrag.pointerY) / camera.zoom;
      this.setCameraScroll(nextScrollX, nextScrollY);
    });
  }

  private configureCamera() {
    const camera = this.cameras.main;
    camera.setBackgroundColor('#2f6f43');
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.setZoom(CAMERA_ZOOM);
    camera.centerOn(this.mayaX, this.mayaY);
    this.setCameraMode('free');
  }

  private createCameraStatusText() {
    this.cameraStatusText = this.add.text(12, 104, 'Camera: Livre', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#fff4bd',
      backgroundColor: '#223827',
      padding: { x: 8, y: 5 },
    });
    this.cameraStatusText.setScrollFactor(0);
    this.cameraStatusText.setDepth(1000);
  }

  private setCameraMode(mode: CameraMode) {
    if (this.cameraMode === mode) return;

    this.cameraMode = mode;
    this.cameraDrag = null;

    if (!this.maya) return;

    const camera = this.cameras.main;
    if (mode === 'followMaya') {
      camera.startFollow(this.maya, true, CAMERA_LERP, CAMERA_LERP);
    } else {
      camera.stopFollow();
      this.setCameraScroll(camera.scrollX, camera.scrollY);
    }

    this.updateCameraStatusText();
    this.publishState();
  }

  private updateCameraStatusText() {
    if (!this.cameraStatusText) return;
    this.cameraStatusText.setText(this.cameraMode === 'free' ? 'Camera: Livre' : 'Camera: Seguindo Maya');
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
    const landmark = LANDMARKS.house;
    const { x, y } = landmarkCenter(landmark);
    const width = landmark.widthTiles * TILE_SIZE;
    const height = landmark.heightTiles * TILE_SIZE;

    this.add.rectangle(x, y, width, height, 0x8f4c2e).setDepth(8);
    this.add.rectangle(x, y - 2.5 * TILE_SIZE, width + TILE_SIZE, 2 * TILE_SIZE, 0x5d2f25).setDepth(9);
    this.add.rectangle(x - 2 * TILE_SIZE, y + TILE_SIZE, TILE_SIZE, 2 * TILE_SIZE, 0x3b2418).setDepth(10);
    this.add.rectangle(x + 1.5 * TILE_SIZE, y, 1.5 * TILE_SIZE, TILE_SIZE, 0x83b7d8).setDepth(10);
    this.add.text(x - 3 * TILE_SIZE, y - 0.5 * TILE_SIZE, 'HOUSE', { fontFamily: 'monospace', fontSize: '16px', color: '#fff4bd' }).setDepth(11);
    this.addCollisionRect(x - width / 2, y - height / 2, width, height);
  }

  private createCowPen() {
    const landmark = LANDMARKS.cowPen;
    const { x, y } = landmarkCenter(landmark);
    const width = landmark.widthTiles * TILE_SIZE;
    const height = landmark.heightTiles * TILE_SIZE;

    this.add.rectangle(x, y, width, height, 0x6fbf4a).setDepth(6);
    this.add.rectangle(x, y, width, 0.5 * TILE_SIZE, 0x8a5528).setDepth(9);
    this.add.rectangle(x, y + height / 2 - 0.25 * TILE_SIZE, width, 0.5 * TILE_SIZE, 0x8a5528).setDepth(9);
    this.add.rectangle(x - width / 2 + 0.25 * TILE_SIZE, y, 0.5 * TILE_SIZE, height, 0x8a5528).setDepth(9);
    this.add.rectangle(x + width / 2 - 0.25 * TILE_SIZE, y, 0.5 * TILE_SIZE, height, 0x8a5528).setDepth(9);
    this.add.rectangle(x - TILE_SIZE, y + 0.5 * TILE_SIZE, 2 * TILE_SIZE, TILE_SIZE, 0xffffff).setDepth(10);
    this.add.rectangle(x - 2 * TILE_SIZE, y, TILE_SIZE, TILE_SIZE, 0x2f2d2b).setDepth(11);
    this.add.text(x - 2 * TILE_SIZE, y - 0.5 * TILE_SIZE, 'COW PEN', { fontFamily: 'monospace', fontSize: '16px', color: '#2d241a' }).setDepth(11);
    this.addCollisionRect(x - width / 2, y - height / 2, width, 0.5 * TILE_SIZE);
    this.addCollisionRect(x - width / 2, y + height / 2 - 0.5 * TILE_SIZE, width, 0.5 * TILE_SIZE);
    this.addCollisionRect(x - width / 2, y - height / 2, 0.5 * TILE_SIZE, height);
    this.addCollisionRect(x + width / 2 - 0.5 * TILE_SIZE, y - height / 2, 0.5 * TILE_SIZE, height);
  }

  private createStorage() {
    const landmark = LANDMARKS.storage;
    const { x, y } = landmarkCenter(landmark);
    const width = landmark.widthTiles * TILE_SIZE;
    const height = landmark.heightTiles * TILE_SIZE;

    this.add.rectangle(x, y, width, height, 0x7b5a35).setDepth(8);
    this.add.rectangle(x, y - 2 * TILE_SIZE, width + TILE_SIZE, TILE_SIZE, 0x4b3320).setDepth(9);
    this.add.rectangle(x - 1.5 * TILE_SIZE, y + TILE_SIZE, TILE_SIZE, 2 * TILE_SIZE, 0x2f2418).setDepth(10);
    this.add.text(x - 2.5 * TILE_SIZE, y, 'STORAGE', { fontFamily: 'monospace', fontSize: '16px', color: '#fff4bd' }).setDepth(11);
    this.addCollisionRect(x - width / 2, y - height / 2, width, height);
  }

  private createExplorationProps() {
    for (let i = 0; i < 95; i += 1) {
      const tileX = 5 + ((i * 11) % (WORLD_COLUMNS - 10));
      const tileY = 5 + ((i * 7) % (WORLD_ROWS - 10));
      const x = tileCenter(tileX);
      const y = tileCenter(tileY);

      if (this.isNearLandmark(x, y)) continue;

      if (i % 3 === 0) this.createTree(x, y);
      else if (i % 3 === 1) this.createRock(x, y);
      else this.createFlower(x, y);
    }
  }

  private createTree(x: number, y: number) {
    this.add.rectangle(x, y + TILE_SIZE, TILE_SIZE, 2 * TILE_SIZE, 0x6b3f24).setDepth(7);
    this.add.circle(x, y - TILE_SIZE, 1.6 * TILE_SIZE, 0x236d38).setDepth(8);
    this.add.circle(x - TILE_SIZE, y, 1.2 * TILE_SIZE, 0x2f8545).setDepth(8);
    this.add.circle(x + TILE_SIZE, y, 1.2 * TILE_SIZE, 0x2f8545).setDepth(8);
    this.addCollisionRect(x - TILE_SIZE, y - 0.5 * TILE_SIZE, 2 * TILE_SIZE, 2.5 * TILE_SIZE);
  }

  private createRock(x: number, y: number) {
    this.add.rectangle(x, y, 1.5 * TILE_SIZE, TILE_SIZE, 0x6d6f72).setDepth(7);
    this.add.rectangle(x - 0.25 * TILE_SIZE, y - 0.25 * TILE_SIZE, TILE_SIZE, 0.5 * TILE_SIZE, 0x8b8e8f).setDepth(8);
    this.addCollisionRect(x - 0.75 * TILE_SIZE, y - 0.5 * TILE_SIZE, 1.5 * TILE_SIZE, TILE_SIZE);
  }

  private createFlower(x: number, y: number) {
    this.add.rectangle(x, y + 0.25 * TILE_SIZE, 4, 0.5 * TILE_SIZE, 0x2f8545).setDepth(7);
    this.add.rectangle(x - 6, y, 8, 8, 0xf0c15f).setDepth(8);
    this.add.rectangle(x + 6, y, 8, 8, 0xd95a7a).setDepth(8);
  }

  private isNearLandmark(x: number, y: number) {
    const house = landmarkCenter(LANDMARKS.house);
    const cowPen = landmarkCenter(LANDMARKS.cowPen);
    const storage = landmarkCenter(LANDMARKS.storage);
    const protectedAreas = [
      { x: house.x, y: house.y, radius: 12 * TILE_SIZE },
      { x: tileCenter(24), y: tileCenter(42), radius: 9 * TILE_SIZE },
      { x: tileCenter(28), y: tileCenter(72), radius: 9 * TILE_SIZE },
      { x: cowPen.x, y: cowPen.y, radius: 10 * TILE_SIZE },
      { x: storage.x, y: storage.y, radius: 10 * TILE_SIZE },
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

  private panFreeCamera(deltaSeconds: number) {
    const inputX = Number(this.cursors.right.isDown || this.keys.D.isDown) - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const inputY = Number(this.cursors.down.isDown || this.keys.S.isDown) - Number(this.cursors.up.isDown || this.keys.W.isDown);

    if (inputX === 0 && inputY === 0) return;

    const pan = new Phaser.Math.Vector2(inputX, inputY).normalize().scale(CAMERA_PAN_SPEED * deltaSeconds);
    this.setCameraScroll(this.cameras.main.scrollX + pan.x, this.cameras.main.scrollY + pan.y);
  }

  private setCameraScroll(x: number, y: number) {
    const camera = this.cameras.main;
    const maxScrollX = Math.max(0, WORLD_WIDTH - camera.width / camera.zoom);
    const maxScrollY = Math.max(0, WORLD_HEIGHT - camera.height / camera.zoom);

    camera.setScroll(Phaser.Math.Clamp(x, 0, maxScrollX), Phaser.Math.Clamp(y, 0, maxScrollY));
  }

  private moveMayaToTask(deltaSeconds: number) {
    if (!this.activeTravel) return;

    const distance = Phaser.Math.Distance.Between(this.mayaX, this.mayaY, this.activeTravel.targetX, this.activeTravel.targetY);

    if (distance <= TASK_ARRIVAL_DISTANCE) {
      this.mayaX = this.activeTravel.targetX;
      this.mayaY = this.activeTravel.targetY;
      this.maya.setPosition(this.mayaX, this.mayaY);
      const task = this.activeTravel.task;
      this.activeTravel = null;
      this.startTaskAnimation(task);
      return;
    }

    const step = Math.min(MAYA_SPEED * deltaSeconds, distance);
    const vector = new Phaser.Math.Vector2(this.activeTravel.targetX - this.mayaX, this.activeTravel.targetY - this.mayaY)
      .normalize()
      .scale(step);
    const nextX = Phaser.Math.Clamp(this.mayaX + vector.x, TILE_SIZE / 2, WORLD_WIDTH - TILE_SIZE / 2);
    const nextY = Phaser.Math.Clamp(this.mayaY + vector.y, TILE_SIZE / 2, WORLD_HEIGHT - TILE_SIZE / 2);

    if (!this.collidesAt(nextX, this.mayaY)) this.mayaX = nextX;
    if (!this.collidesAt(this.mayaX, nextY)) this.mayaY = nextY;

    this.maya.setPosition(this.mayaX, this.mayaY);
    this.setMayaAnimation('walk');
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
    if (started) this.beginTaskTravel(task);
  }

  private beginTaskTravel(task: TaskType) {
    this.activeTravel = {
      task,
      ...this.getTaskDestination(task),
    };
    this.setCameraMode('followMaya');
    this.setMayaAnimation('walk');
    this.publishState(`${task} destination selected.`);
  }

  private getTaskDestination(task: TaskType): Omit<TravelTask, 'task'> {
    if (task === 'Milk Cow') {
      return { targetX: tileCenter(LANDMARKS.cowPen.tileX - 3), targetY: tileCenter(LANDMARKS.cowPen.tileY + 4) };
    }

    const field = this.getPreferredFieldForTask(task);
    return { targetX: tileCenter(field.tileX), targetY: tileCenter(field.tileY) };
  }

  private getPreferredFieldForTask(task: TaskType) {
    if (task === 'Prepare Soil') {
      return this.fields.allFields.find((field) => field.state === 'Harvested') ?? this.fields.getFirstUnlockedField() ?? this.fields.allFields[0];
    }

    if (task === 'Plant Wheat') {
      return this.fields.allFields.find((field) => field.state === 'Prepared') ?? this.fields.getFirstUnlockedField() ?? this.fields.allFields[0];
    }

    return this.fields.allFields.find((field) => field.state === 'Planted') ?? this.fields.getFirstUnlockedField() ?? this.fields.allFields[0];
  }

  private startTaskAnimation(task: TaskType) {
    const animation: Record<TaskType, AnimationState> = {
      'Prepare Soil': 'prepare soil',
      'Plant Wheat': 'plant',
      'Harvest Wheat': 'harvest',
      'Milk Cow': 'milk cow',
    };

    this.setCameraMode('free');
    this.setMayaAnimation(animation[task]);

    this.time.delayedCall(TASK_DURATION, () => {
      const message = this.applyTask(task);
      this.redrawFields();
      const nextTask = this.tasks.completeCurrent();
      this.setMayaAnimation('idle');
      this.publishState(message);
      if (nextTask) this.time.delayedCall(120, () => this.beginTaskTravel(nextTask));
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
      cameraMode: this.cameraMode,
    });

    if (notification) emitGameEvent('notification', notification);
  }
}
