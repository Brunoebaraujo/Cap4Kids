import Phaser from 'phaser';
import { createPixelAssets } from '../assets/createPixelAssets';
import { emitGameEvent, gameEvents } from '../eventBus';
import { EconomySystem } from '../systems/EconomySystem';
import { FieldSystem } from '../systems/FieldSystem';
import { TaskSystem } from '../systems/TaskSystem';
import {
  TILE_SIZE,
  type AnimationState,
  type AdminEventType,
  type GameRole,
  type Direction,
  type TaskCommand,
  type TaskType,
  type WorkerSnapshot,
  type WorkerStatus,
} from '../types';

const WORLD_WIDTH = 20;
const WORLD_HEIGHT = 13;
const MOVE_DURATION = 150;
const TASK_DURATION = 650;
const MAYA_ID = 'maya';
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

interface WorkerRuntime {
  id: string;
  name: string;
  tileX: number;
  tileY: number;
  sprite: Phaser.GameObjects.Sprite;
  selectionRing: Phaser.GameObjects.Graphics;
  nameLabel: Phaser.GameObjects.Text;
  statusLabel: Phaser.GameObjects.Text;
  tasks: TaskSystem;
  status: WorkerStatus;
  animationState: AnimationState;
}

export class FarmScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private fieldLayer!: Phaser.GameObjects.Graphics;
  private selectedWorkerId = MAYA_ID;
  private nextTaskId = 1;
  private role: GameRole = 'player';
  private skipNextWorldClick = false;

  private readonly workers = new Map<string, WorkerRuntime>();
  private readonly fields = new FieldSystem();
  private readonly economy = new EconomySystem();

  constructor() {
    super('FarmScene');
  }

  create() {
    createPixelAssets(this);
    this.createAnimations();
    this.createWorld();
    this.createWorkers();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,SPACE,ONE,TWO,THREE,FOUR') as Record<string, Phaser.Input.Keyboard.Key>;

    this.input.on('pointerup', this.handleWorldClick, this);
    gameEvents.on('task', this.enqueueTaskForSelectedWorker, this);
    gameEvents.on('selectWorker', this.selectWorker, this);
    gameEvents.on('findWorker', this.centerCameraOnWorker, this);
    gameEvents.on('sell', this.sellProduct, this);
    gameEvents.on('buySeeds', this.buySeeds, this);
    gameEvents.on('nextDay', this.nextDay, this);
    gameEvents.on('adminEvent', this.applyAdminEvent, this);
    gameEvents.on('role', this.setRole, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerup', this.handleWorldClick, this);
      gameEvents.off('task', this.enqueueTaskForSelectedWorker, this);
      gameEvents.off('selectWorker', this.selectWorker, this);
      gameEvents.off('findWorker', this.centerCameraOnWorker, this);
      gameEvents.off('sell', this.sellProduct, this);
      gameEvents.off('buySeeds', this.buySeeds, this);
      gameEvents.off('nextDay', this.nextDay, this);
      gameEvents.off('adminEvent', this.applyAdminEvent, this);
      gameEvents.off('role', this.setRole, this);
    });

    this.selectWorker(MAYA_ID, false);
    this.publishState('Welcome to Capitalism 4 Kids.');
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.enqueueTaskForSelectedWorker('Prepare Soil');
    if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.enqueueTaskForSelectedWorker('Plant Wheat');
    if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.enqueueTaskForSelectedWorker('Harvest Wheat');
    if (Phaser.Input.Keyboard.JustDown(this.keys.FOUR)) this.enqueueTaskForSelectedWorker('Milk Cow');

    const selectedWorker = this.getSelectedWorker();
    if (!selectedWorker.tasks.currentTask) {
      const direction = this.readDirection();
      if (direction) {
        this.moveWorkerByInput(selectedWorker, direction);
        return;
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.performContextAction(selectedWorker);
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
      if (this.anims.exists(`maya-${key}`)) {
        return;
      }

      this.anims.create({
        key: `maya-${key}`,
        frames: [{ key: 'maya', frame }],
        frameRate: 1,
      });
    });
  }

  private createWorld() {
    this.cameras.main.setBackgroundColor('#2f6f43');
    const ground = this.add.graphics().setDepth(0);
    for (let y = 0; y < WORLD_HEIGHT; y += 1) {
      for (let x = 0; x < WORLD_WIDTH; x += 1) {
        const [screenX, screenY] = this.isoToScreen(x, y);
        const edge = x === 0 || y === 0 || x === WORLD_WIDTH - 1 || y === WORLD_HEIGHT - 1;
        const path = y === 7 || (x > 2 && x < 11 && y === 6);
        this.drawDiamond(ground, screenX, screenY, edge ? 0x8a6439 : path ? 0xb6793c : 0x6fbf4a, 0x426d36);
      }
    }
    this.fieldLayer = this.add.graphics().setDepth(2);
    this.redrawFields();

    this.add.text(9, 9, 'Click a worker, then click a field. 1-4 queue commands. Space Context.', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#fff8d6',
      backgroundColor: '#2d241a',
      padding: { x: 4, y: 3 },
    }).setDepth(20);

  }

  private isoToScreen(tileX: number, tileY: number): [number, number] {
    return [320 + (tileX - tileY) * 16, 28 + (tileX + tileY) * 8];
  }

  private screenToIso(screenX: number, screenY: number): [number, number] {
    const a = (screenX - 320) / 16;
    const b = (screenY - 28) / 8;
    return [Math.round((a + b) / 2), Math.round((b - a) / 2)];
  }

  private drawDiamond(graphics: Phaser.GameObjects.Graphics, x: number, y: number, fill: number, stroke: number) {
    graphics.fillStyle(fill, 1).lineStyle(1, stroke, .5);
    graphics.beginPath().moveTo(x, y - 8).lineTo(x + 16, y).lineTo(x, y + 8).lineTo(x - 16, y).closePath();
    graphics.fillPath().strokePath();
  }

  private createWorkers() {
    this.addWorker(MAYA_ID, 'Maya', 4, 6, undefined);
    this.addWorker('worker-1', 'Worker 1', 10, 6, 0x89c4ff);
  }

  private addWorker(id: string, name: string, tileX: number, tileY: number, tint?: number) {
    const [x, y] = this.isoToScreen(tileX, tileY);
    const selectionRing = this.add.graphics().setDepth(8);
    const sprite = this.add.sprite(x, y, 'maya', 0).setDepth(10).setInteractive({ useHandCursor: true });
    const nameLabel = this.add.text(x, y - 28, name, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#1d2418',
      padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(12);
    const statusLabel = this.add.text(x, y + 18, 'Idle', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#ffe4a1',
      backgroundColor: '#2d241a',
      padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(12);

    if (tint) {
      sprite.setTint(tint);
    }

    sprite.play('maya-idle');
    sprite.on('pointerdown', () => {
      this.skipNextWorldClick = true;
      this.selectWorker(id);
    });

    const worker: WorkerRuntime = {
      id,
      name,
      tileX,
      tileY,
      sprite,
      selectionRing,
      nameLabel,
      statusLabel,
      tasks: new TaskSystem(),
      status: 'Idle',
      animationState: 'idle',
    };
    this.workers.set(id, worker);
    this.updateWorkerVisuals(worker);
  }

  private tileIndexForBaseTile(x: number, y: number) {
    if (x === 0 || y === 0 || x === WORLD_WIDTH - 1 || y === WORLD_HEIGHT - 1) return TILE_INDEX.fence;
    if (y === 7 || (x > 2 && x < 11 && y === 6)) return TILE_INDEX.dirtPath;
    return TILE_INDEX.grass;
  }

  private redrawFields() {
    this.fieldLayer.clear();

    [
      { id: 1, x: 6, y: 5 },
      { id: 2, x: 8, y: 5 },
    ].forEach(({ x, y }) => {
      const field = this.fields.getFieldAt(x, y);
      const color = field?.state === 'Prepared' ? 0x704422 : field?.state === 'Planted' ? 0x83b93e : field?.state === 'Locked' ? 0x585858 : 0x9c6a32;
      const [screenX, screenY] = this.isoToScreen(x, y);
      this.drawDiamond(this.fieldLayer, screenX, screenY, color, 0x3b2719);
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

  private moveWorkerByInput(worker: WorkerRuntime, direction: Direction) {
    if (worker.status === 'Moving') {
      return;
    }

    const deltas: Record<Direction, [number, number]> = {
      down: [0, 1],
      up: [0, -1],
      left: [-1, 0],
      right: [1, 0],
    };

    const [dx, dy] = deltas[direction];
    const nextX = Phaser.Math.Clamp(worker.tileX + dx, 1, WORLD_WIDTH - 2);
    const nextY = Phaser.Math.Clamp(worker.tileY + dy, 1, WORLD_HEIGHT - 2);

    if (nextX === worker.tileX && nextY === worker.tileY) {
      return;
    }

    this.moveWorkerTo(worker, nextX, nextY).then(() => {
      if (!worker.tasks.currentTask) {
        worker.status = 'Idle';
        this.setWorkerAnimation(worker, 'idle');
        this.updateWorkerVisuals(worker);
        this.publishState();
      }
    });
  }

  private performContextAction(worker: WorkerRuntime) {
    const field = this.fields.getFieldAt(worker.tileX, worker.tileY) ?? this.fields.getFirstUnlockedField();

    if (!field) return;

    const task = this.taskForFieldState(field.state);
    if (!task) {
      this.publishState('That field is locked.');
      return;
    }

    this.enqueueTask(worker, task, field.tileX, field.tileY);
  }

  private handleWorldClick(pointer: Phaser.Input.Pointer) {
    if (this.skipNextWorldClick) {
      this.skipNextWorldClick = false;
      return;
    }

    const [tileX, tileY] = this.screenToIso(pointer.worldX, pointer.worldY);
    const field = this.fields.getFieldAt(tileX, tileY);

    if (!field) {
      return;
    }

    const task = this.taskForFieldState(field.state);
    if (!task) {
      this.publishState('That field is locked.');
      return;
    }

    this.enqueueTask(this.getSelectedWorker(), task, field.tileX, field.tileY);
  }

  private taskForFieldState(state: string): TaskType | null {
    if (state === 'Harvested') return 'Prepare Soil';
    if (state === 'Prepared') return 'Plant Wheat';
    if (state === 'Planted') return 'Harvest Wheat';
    return null;
  }

  private targetForTask(worker: WorkerRuntime, task: TaskType) {
    const currentField = this.fields.getFieldAt(worker.tileX, worker.tileY);
    if (currentField && this.taskForFieldState(currentField.state) === task) {
      return currentField;
    }

    if (task === 'Prepare Soil') {
      return this.fields.getFirstFieldWithState('Harvested') ?? this.lastPlannedTarget(worker);
    }

    if (task === 'Plant Wheat') {
      return this.fields.getFirstFieldWithState('Prepared') ?? this.lastPlannedTarget(worker);
    }

    if (task === 'Harvest Wheat') {
      return this.fields.getFirstFieldWithState('Planted') ?? this.lastPlannedTarget(worker);
    }

    return { tileX: worker.tileX, tileY: worker.tileY };
  }

  private lastPlannedTarget(worker: WorkerRuntime) {
    const lastQueuedTask = worker.tasks.queue[worker.tasks.queue.length - 1];
    const task = lastQueuedTask ?? worker.tasks.currentTask;

    return task ? { tileX: task.targetX, tileY: task.targetY } : { tileX: worker.tileX, tileY: worker.tileY };
  }

  private enqueueTaskForSelectedWorker(task: TaskType) {
    const worker = this.getSelectedWorker();
    const target = this.targetForTask(worker, task);
    this.enqueueTask(worker, task, target.tileX, target.tileY);
  }

  private enqueueTask(worker: WorkerRuntime, taskType: TaskType, targetX: number, targetY: number) {
    const task: TaskCommand = {
      id: this.nextTaskId,
      type: taskType,
      targetX,
      targetY,
    };
    this.nextTaskId += 1;

    const started = worker.tasks.enqueue(task);
    this.updateWorkerVisuals(worker);
    this.publishState(started ? `${taskType} started for ${worker.name}.` : `${taskType} queued for ${worker.name}.`);

    if (started) {
      this.runTask(worker, task);
    }
  }

  private async runTask(worker: WorkerRuntime, task: TaskCommand) {
    await this.moveWorkerTo(worker, task.targetX, task.targetY);

    worker.status = 'Busy';
    const animation: Record<TaskType, AnimationState> = {
      'Prepare Soil': 'prepare soil',
      'Plant Wheat': 'plant',
      'Harvest Wheat': 'harvest',
      'Milk Cow': 'milk cow',
    };

    this.setWorkerAnimation(worker, animation[task.type]);
    this.updateWorkerVisuals(worker);
    this.publishState();

    this.time.delayedCall(TASK_DURATION, () => {
      const message = this.applyTask(task);
      this.redrawFields();
      const nextTask = worker.tasks.completeCurrent();
      worker.status = nextTask ? 'Busy' : 'Idle';
      this.setWorkerAnimation(worker, 'idle');
      this.updateWorkerVisuals(worker);
      this.publishState(`${worker.name}: ${message}`);

      if (nextTask) {
        this.time.delayedCall(120, () => this.runTask(worker, nextTask));
      }
    });
  }

  private moveWorkerTo(worker: WorkerRuntime, tileX: number, tileY: number) {
    return new Promise<void>((resolve) => {
      if (worker.tileX === tileX && worker.tileY === tileY) {
        resolve();
        return;
      }

      worker.status = 'Moving';
      this.setWorkerAnimation(worker, 'walk');
      this.updateWorkerVisuals(worker);
      this.publishState();

      const distance = Math.max(Math.abs(worker.tileX - tileX), Math.abs(worker.tileY - tileY));
      this.tweens.add({
        targets: worker.sprite,
        x: this.isoToScreen(tileX, tileY)[0],
        y: this.isoToScreen(tileX, tileY)[1],
        duration: MOVE_DURATION * Math.max(1, distance),
        ease: 'Linear',
        onUpdate: () => {
          this.updateWorkerVisuals(worker, false);
          this.positionWorkerLabels(worker);
        },
        onComplete: () => {
          worker.tileX = tileX;
          worker.tileY = tileY;
          this.positionWorkerLabels(worker);
          resolve();
        },
      });
    });
  }

  private applyTask(task: TaskCommand) {
    if (task.type === 'Prepare Soil') {
      return this.fields.prepare(task.targetX, task.targetY) ? 'Field prepared.' : 'No harvested field is available.';
    }

    if (task.type === 'Plant Wheat') {
      if (!this.economy.useSeed()) return 'No seeds available.';
      if (this.fields.plant(task.targetX, task.targetY)) return 'Wheat planted.';
      this.economy.inventory.seeds += 1;
      return 'No prepared field is available.';
    }

    if (task.type === 'Harvest Wheat') {
      if (!this.fields.harvest(task.targetX, task.targetY)) return 'No planted field is available.';
      this.economy.addWheat(3);
      return 'Wheat harvested.';
    }

    this.economy.addMilk(1);
    return 'Cow milked.';
  }

  private selectWorker(workerId: string, notify = true) {
    if (!this.workers.has(workerId)) {
      return;
    }

    this.selectedWorkerId = workerId;
    this.workers.forEach((worker) => this.updateWorkerVisuals(worker));
    const worker = this.getSelectedWorker();
    this.publishState(notify ? `Selected Worker: ${worker.name}` : undefined);
  }

  private centerCameraOnWorker(workerId: string) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return;
    }

    this.cameras.main.centerOn(worker.sprite.x, worker.sprite.y);
    this.publishState(`Centered camera on ${worker.name}.`);
  }

  private sellProduct(product: 'wheat' | 'milk') { this.publishState(this.economy.sell(product)); }
  private buySeeds() { this.publishState(this.economy.buySeeds()); }
  private nextDay() { this.publishState(this.economy.nextDay()); }
  private setRole(role: GameRole) { this.role = role; this.publishState(role === 'admin' ? 'Modo administrador ativado.' : 'Modo jogador ativado.'); }
  private applyAdminEvent(type: AdminEventType) {
    if (this.role !== 'admin') { this.publishState('Somente o administrador pode criar eventos.'); return; }
    this.publishState(this.economy.applyAdminEvent(type));
  }

  private getSelectedWorker() {
    return this.workers.get(this.selectedWorkerId) ?? this.workers.get(MAYA_ID)!;
  }

  private setWorkerAnimation(worker: WorkerRuntime, state: AnimationState) {
    worker.animationState = state;
    worker.sprite.play(`maya-${state}`);
  }

  private updateWorkerVisuals(worker: WorkerRuntime, repositionLabels = true) {
    const isSelected = worker.id === this.selectedWorkerId;
    worker.selectionRing.clear();
    worker.selectionRing.lineStyle(isSelected ? 3 : 1, isSelected ? 0xfff06a : 0x2f6f43, isSelected ? 1 : 0.35);
    worker.selectionRing.strokeEllipse(worker.sprite.x, worker.sprite.y + 9, 28, 10);
    worker.selectionRing.fillStyle(0xfff06a, isSelected ? 0.18 : 0);
    worker.selectionRing.fillEllipse(worker.sprite.x, worker.sprite.y + 9, 28, 10);
    worker.nameLabel.setColor(isSelected ? '#fff06a' : '#ffffff');
    worker.statusLabel.setText(this.statusText(worker));

    if (repositionLabels) {
      this.positionWorkerLabels(worker);
    }
  }

  private positionWorkerLabels(worker: WorkerRuntime) {
    worker.nameLabel.setPosition(worker.sprite.x, worker.sprite.y - 28);
    worker.statusLabel.setPosition(worker.sprite.x, worker.sprite.y + 18);
    worker.selectionRing.setPosition(0, 0);
  }

  private statusText(worker: WorkerRuntime) {
    const task = worker.tasks.currentTask?.type;
    if (task) {
      return `${worker.status}: ${task}`;
    }

    return worker.status;
  }

  private publishState(notification?: string) {
    const workers = [...this.workers.values()].map((worker) => this.snapshotWorker(worker));
    const selectedWorker = workers.find((worker) => worker.id === this.selectedWorkerId) ?? workers[0];

    emitGameEvent('state', {
      economy: { ...this.economy.economy },
      inventory: { ...this.economy.inventory },
      selectedWorkerId: selectedWorker.id,
      selectedWorker,
      workers,
      currentTask: selectedWorker.currentTask?.type ?? null,
      taskQueue: selectedWorker.taskQueue.map((task) => task.type),
      fields: this.fields.snapshots,
      animationState: selectedWorker.animationState,
      role: this.role,
      rivals: this.economy.rivals.map((rival) => ({ ...rival })),
      events: this.economy.events.map((event) => ({ ...event })),
    });

    if (notification) {
      emitGameEvent('notification', notification);
    }
  }

  private snapshotWorker(worker: WorkerRuntime): WorkerSnapshot {
    return {
      id: worker.id,
      name: worker.name,
      position: {
        x: worker.tileX,
        y: worker.tileY,
      },
      status: worker.status,
      currentTask: worker.tasks.currentTask ? { ...worker.tasks.currentTask } : null,
      taskQueue: worker.tasks.queue.map((task) => ({ ...task })),
      animationState: worker.animationState,
      isSelected: worker.id === this.selectedWorkerId,
    };
  }
}
