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
const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 540;
const ISO_ORIGIN_X = 480;
const ISO_ORIGIN_Y = 76;
const ISO_HALF_WIDTH = 28;
const ISO_HALF_HEIGHT = 14;
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

const FIELD_ZONES = [
  { id: 1, points: [[280, 250], [480, 218], [620, 286], [420, 345]] },
  { id: 2, points: [[0, 296], [205, 246], [318, 292], [105, 362]] },
  { id: 3, points: [[185, 352], [425, 310], [650, 394], [350, 536]] },
] as const;

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

  preload() {
    this.load.image('farm-vertical-slice', './assets/world/farm-vertical-slice.webp');
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
    this.cameras.main.setBackgroundColor('#172316');
    this.add.image(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 'farm-vertical-slice')
      .setDisplaySize(VIEW_WIDTH, VIEW_HEIGHT)
      .setDepth(0);

    const vignette = this.add.graphics().setDepth(1);
    vignette.fillStyle(0x071008, 0.16).fillRect(0, 0, VIEW_WIDTH, 46);
    vignette.fillStyle(0x071008, 0.12).fillRect(0, VIEW_HEIGHT - 34, VIEW_WIDTH, 34);
    this.fieldLayer = this.add.graphics().setDepth(2);
    this.redrawFields();

    this.add.text(16, 14, 'Selecione um trabalhador e clique em um campo.', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#fff8d6',
      backgroundColor: '#151b12cc',
      padding: { x: 8, y: 5 },
    }).setDepth(20).setScrollFactor(0);

  }

  private isoToScreen(tileX: number, tileY: number): [number, number] {
    return [ISO_ORIGIN_X + (tileX - tileY) * ISO_HALF_WIDTH, ISO_ORIGIN_Y + (tileX + tileY) * ISO_HALF_HEIGHT];
  }

  private screenToIso(screenX: number, screenY: number): [number, number] {
    const a = (screenX - ISO_ORIGIN_X) / ISO_HALF_WIDTH;
    const b = (screenY - ISO_ORIGIN_Y) / ISO_HALF_HEIGHT;
    return [Math.round((a + b) / 2), Math.round((b - a) / 2)];
  }

  private drawDiamond(graphics: Phaser.GameObjects.Graphics, x: number, y: number, fill: number, stroke: number) {
    graphics.fillStyle(fill, 1).lineStyle(1, stroke, .5);
    graphics.beginPath().moveTo(x, y - ISO_HALF_HEIGHT).lineTo(x + ISO_HALF_WIDTH, y).lineTo(x, y + ISO_HALF_HEIGHT).lineTo(x - ISO_HALF_WIDTH, y).closePath();
    graphics.fillPath().strokePath();
  }

  private createWorkers() {
    this.addWorker(MAYA_ID, 'Maya', 4, 6, undefined);
    this.addWorker('worker-1', 'Worker 1', 10, 6, 0x89c4ff);
  }

  private addWorker(id: string, name: string, tileX: number, tileY: number, tint?: number) {
    const [x, y] = this.isoToScreen(tileX, tileY);
    const selectionRing = this.add.graphics().setDepth(8);
    const sprite = this.add.sprite(x, y, 'maya', 0).setScale(1.45).setDepth(10).setInteractive({ useHandCursor: true });
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
    FIELD_ZONES.forEach((zone) => {
      const field = this.fields.getFieldById(zone.id);
      if (!field) return;
      const polygon = new Phaser.Geom.Polygon(zone.points.map(([x, y]) => ({ x, y })));
      const color = field.state === 'Prepared' ? 0x4b2d18 : field.state === 'Planted' ? 0x8a6a31 : field.state === 'Growing' ? 0x4f8d35 : field.state === 'Mature' ? 0xd8a72d : field.state === 'Locked' ? 0x30352e : 0x6f4c2d;
      this.fieldLayer.fillStyle(color, field.state === 'Raw' ? 0.04 : field.state === 'Locked' ? 0.24 : 0.34);
      this.fieldLayer.lineStyle(field.state === 'Locked' ? 1 : 2, field.state === 'Locked' ? 0x9b998e : 0xffd86b, field.state === 'Locked' ? 0.35 : 0.72);
      this.fieldLayer.fillPoints(polygon.points, true).strokePoints(polygon.points, true);
      this.drawFieldState(polygon, field.state);
    });
  }

  private drawFieldState(polygon: Phaser.Geom.Polygon, state: string) {
    if (state === 'Raw' || state === 'Locked') return;
    const bounds = Phaser.Geom.Polygon.GetAABB(polygon);
    for (let y = bounds.top + 12; y < bounds.bottom - 8; y += 13) {
      for (let x = bounds.left + 12; x < bounds.right - 8; x += 16) {
        if (!Phaser.Geom.Polygon.Contains(polygon, x, y)) continue;
        if (state === 'Prepared') {
          this.fieldLayer.lineStyle(2, 0x29170f, 0.52).lineBetween(x - 8, y + 4, x + 8, y - 4);
        } else if (state === 'Planted') {
          this.fieldLayer.fillStyle(0xd7b25b, 0.76).fillCircle(x, y, 1.5);
        } else if (state === 'Growing') {
          this.fieldLayer.lineStyle(2, 0x75ad42, 0.84).lineBetween(x, y + 4, x, y - 5);
          this.fieldLayer.lineStyle(1, 0xa6cf62, 0.7).lineBetween(x, y - 1, x + 4, y - 4);
        } else if (state === 'Mature') {
          this.fieldLayer.lineStyle(2, 0xd8aa36, 0.92).lineBetween(x, y + 5, x, y - 7);
          this.fieldLayer.fillStyle(0xf0c552, 0.9).fillCircle(x, y - 8, 2);
        }
      }
    }
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
      this.publishState(this.fieldStateMessage(field.state));
      return;
    }

    this.enqueueTask(worker, task, field.tileX, field.tileY);
  }

  private handleWorldClick(pointer: Phaser.Input.Pointer) {
    if (this.skipNextWorldClick) {
      this.skipNextWorldClick = false;
      return;
    }

    const zone = FIELD_ZONES.find(({ points }) => Phaser.Geom.Polygon.Contains(new Phaser.Geom.Polygon(points.map(([x, y]) => ({ x, y }))), pointer.worldX, pointer.worldY));
    const field = zone ? this.fields.getFieldById(zone.id) : null;

    if (!field) {
      return;
    }

    const task = this.taskForFieldState(field.state);
    if (!task) {
      this.publishState(this.fieldStateMessage(field.state));
      return;
    }

    this.enqueueTask(this.getSelectedWorker(), task, field.tileX, field.tileY);
  }

  private taskForFieldState(state: string): TaskType | null {
    if (state === 'Raw') return 'Prepare Soil';
    if (state === 'Prepared') return 'Plant Wheat';
    if (state === 'Mature') return 'Harvest Wheat';
    return null;
  }

  private fieldStateMessage(state: string) {
    if (state === 'Planted') return 'Sementes plantadas. Encerre o dia para iniciar o crescimento.';
    if (state === 'Growing') return 'O trigo ainda está crescendo. Avance mais um dia.';
    if (state === 'Locked') return 'Este campo ainda está bloqueado.';
    return 'Nenhuma ação disponível para este campo.';
  }

  private targetForTask(worker: WorkerRuntime, task: TaskType) {
    const currentField = this.fields.getFieldAt(worker.tileX, worker.tileY);
    if (currentField && this.taskForFieldState(currentField.state) === task) {
      return currentField;
    }

    if (task === 'Prepare Soil') {
      return this.fields.getFirstFieldWithState('Raw') ?? this.lastPlannedTarget(worker);
    }

    if (task === 'Plant Wheat') {
      return this.fields.getFirstFieldWithState('Prepared') ?? this.lastPlannedTarget(worker);
    }

    if (task === 'Harvest Wheat') {
      return this.fields.getFirstFieldWithState('Mature') ?? this.lastPlannedTarget(worker);
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
      return this.fields.prepare(task.targetX, task.targetY) ? 'Solo preparado.' : 'Nenhum campo bruto disponível.';
    }

    if (task.type === 'Plant Wheat') {
      if (!this.economy.useSeed()) return 'No seeds available.';
      if (this.fields.plant(task.targetX, task.targetY)) return 'Trigo semeado. Avance o dia para crescer.';
      this.economy.inventory.seeds += 1;
      return 'Nenhum campo preparado disponível.';
    }

    if (task.type === 'Harvest Wheat') {
      if (!this.fields.harvest(task.targetX, task.targetY)) return 'Nenhum trigo maduro disponível.';
      this.economy.addWheat(3);
      return 'Trigo colhido; o campo voltou ao solo bruto.';
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
  private nextDay() {
    const economyMessage = this.economy.nextDay();
    const grew = this.fields.advanceDay();
    this.redrawFields();
    this.publishState(grew ? `${economyMessage} A plantação avançou um estágio.` : economyMessage);
  }
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
    worker.selectionRing.strokeEllipse(worker.sprite.x, worker.sprite.y + 14, 42, 15);
    worker.selectionRing.fillStyle(0xfff06a, isSelected ? 0.18 : 0);
    worker.selectionRing.fillEllipse(worker.sprite.x, worker.sprite.y + 14, 42, 15);
    worker.sprite.setDepth(10 + worker.sprite.y / 1000);
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
