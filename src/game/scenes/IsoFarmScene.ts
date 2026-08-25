import Phaser from 'phaser';
import {
  GRASS_VARIANTS,
  GROUND,
  GROUND_TILE_H,
  GROUND_TILE_W,
  SPRITES,
  groundUrl,
  spriteUrl,
  wheatSpriteFor,
  type GroundKey,
  type SpriteKey,
} from '../assets/isoManifest';
import {
  onCommand,
  publishNotice,
  publishState,
  type Command,
} from '../commandBus';
import {
  TILE_H,
  TILE_W,
  depthFor,
  spriteAnchor,
  tileToWorld,
  worldBounds,
  worldToTileFloor,
} from '../iso/projection';
import {
  EconomySystem,
  HOUSEHOLD_BASE_COST,
  SEED_BASE_COST,
  WHEAT_HARVEST_YIELD,
} from '../systems/EconomySystem';
import { FieldSystem } from '../systems/FieldSystem';
import { GameClockSystem, REAL_SECONDS_PER_DAY, type SpeedOption } from '../systems/GameClockSystem';
import { InflationSystem } from '../systems/InflationSystem';
import { MarketSystem } from '../systems/MarketSystem';
import { PedagogySystem } from '../systems/PedagogySystem';
import { TaskSystem } from '../systems/TaskSystem';
import type { CameraMode, FieldState, GameSnapshot, Lesson, SeasonReport, TaskType } from '../types';

export const MAP_COLS = 28;
export const MAP_ROWS = 28;

const FIELD_LABELS: Record<FieldState, string> = {
  Empty: 'Vazio',
  Prepared: 'Preparado',
  Planted: 'Plantado',
  'Growing Stage 1': 'Brotando',
  'Growing Stage 2': 'Crescendo',
  'Growing Stage 3': 'Quase pronto',
  'Ready To Harvest': 'Pronto para colher',
  Locked: 'Bloqueado',
};

const SAVE_KEY = 'cap4kids.save.v4';
/** Tiles por DIA DE JOGO. Equivale a ~2,6 tiles/s no ritmo padrao. */
const WORKER_SPEED_TILES_PER_DAY = 2.6 * REAL_SECONDS_PER_DAY;
/** Duracao de uma tarefa em DIAS DE JOGO (~2,4s no ritmo padrao). */
const WORK_DAYS = 2.4 / REAL_SECONDS_PER_DAY;

const LANDMARKS = {
  farmhouse: { tileX: 8, tileY: 8, sprite: 'farmhouse' as SpriteKey },
  barn: { tileX: 8, tileY: 14, sprite: 'barn' as SpriteKey },
  silo: { tileX: 12, tileY: 9, sprite: 'silo' as SpriteKey },
  shippingBin: { tileX: 12, tileY: 13, sprite: 'shipping_bin' as SpriteKey },
  well: { tileX: 11, tileY: 11, sprite: 'well' as SpriteKey },
};

interface Travel {
  task: TaskType;
  targetTileX: number;
  targetTileY: number;
}

interface Work {
  task: TaskType;
  elapsed: number;
}

function hashNoise(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export class IsoFarmScene extends Phaser.Scene {
  private readonly fields = new FieldSystem();
  private readonly tasks = new TaskSystem();
  private readonly economy = new EconomySystem();
  private readonly clock = new GameClockSystem();
  private readonly market = new MarketSystem();
  private readonly inflation = new InflationSystem();
  private readonly pedagogy = new PedagogySystem();
  private lessons: Lesson[] = [];
  private seasonReports: SeasonReport[] = [];
  private seasonAnchor = { debt: 400, priceIndex: 100, wheatPrice: 10 };

  private groundTiles = new Map<string, Phaser.GameObjects.Image>();
  private cropSprites = new Map<string, Phaser.GameObjects.Image>();
  private worker!: Phaser.GameObjects.Image;
  private hoverMarker!: Phaser.GameObjects.Graphics;
  private selectionMarker!: Phaser.GameObjects.Graphics;

  private workerTileX = 10;
  private workerTileY = 11;
  private travel: Travel | null = null;
  private work: Work | null = null;
  private cameraMode: CameraMode = 'free';
  private selectedTile: { x: number; y: number } | null = null;
  private disposeCommands: (() => void) | null = null;

  constructor() {
    super('IsoFarmScene');
  }

  preload(): void {
    (Object.keys(GROUND) as GroundKey[]).forEach((key) => {
      this.load.image(key, groundUrl(key));
    });
    (Object.keys(SPRITES) as SpriteKey[]).forEach((key) => {
      this.load.image(SPRITES[key].key, spriteUrl(key));
    });
  }

  create(): void {
    this.loadGame();
    this.buildGround();
    this.buildLandmarks();
    this.buildProps();
    this.buildMarkers();
    this.buildWorker();
    this.configureCamera();
    this.bindInput();

    this.disposeCommands = onCommand((command) => this.handleCommand(command));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.disposeCommands?.();
      this.disposeCommands = null;
    });

    this.redrawFields();
    this.emitState();
    publishNotice('Compre sementes, prepare o solo e plante o trigo.', 'info');
  }

  update(_time: number, delta: number): void {
    const tick = this.clock.update(delta / 1000);
    if (tick.deltaDays <= 0) return;

    for (let i = 0; i < tick.daysElapsed; i += 1) this.closeDay();
    if (tick.seasonEnded) this.closeSeason();

    if (this.fields.updateGrowth(tick.deltaDays)) {
      this.redrawFields();
    }

    if (this.travel) this.advanceTravel(tick.deltaDays);
    else if (this.work) this.advanceWork(tick.deltaDays);

    if (this.cameraMode === 'followMaya') {
      const world = tileToWorld(this.workerTileX, this.workerTileY);
      this.cameras.main.centerOn(world.x, world.y);
    }

    if (tick.daysElapsed > 0 || this.travel || this.work) this.emitState();
  }

  // ---------------------------------------------------------------- mundo

  private groundKeyForTile(x: number, y: number): GroundKey {
    if (x === 0 || y === 0 || x === MAP_COLS - 1 || y === MAP_ROWS - 1) return 'water';
    if (x === 10 && y >= 6 && y <= 20) return 'path';
    if (y === 11 && x >= 6 && x <= 20) return 'path';
    const noise = hashNoise(x, y);
    return GRASS_VARIANTS[Math.floor(noise * GRASS_VARIANTS.length) % GRASS_VARIANTS.length];
  }

  private buildGround(): void {
    for (let y = 0; y < MAP_ROWS; y += 1) {
      for (let x = 0; x < MAP_COLS; x += 1) {
        const world = tileToWorld(x, y);
        const image = this.add
          .image(world.x, world.y, this.groundKeyForTile(x, y))
          .setOrigin(0.5, 0.5)
          .setDepth(-100000);
        this.groundTiles.set(`${x}:${y}`, image);
      }
    }
  }

  private placeSprite(key: SpriteKey, tileX: number, tileY: number): Phaser.GameObjects.Image {
    const def = SPRITES[key];
    const anchor = spriteAnchor(tileX, tileY, def.footprint);
    return this.add
      .image(anchor.x, anchor.y, def.key)
      .setOrigin(0.5, 1)
      .setDepth(depthFor(anchor.y));
  }

  private buildLandmarks(): void {
    Object.values(LANDMARKS).forEach((landmark) => {
      this.placeSprite(landmark.sprite, landmark.tileX, landmark.tileY);
    });
  }

  private buildProps(): void {
    const treeSpots: Array<[number, number]> = [
      [4, 5], [5, 20], [22, 5], [24, 15], [16, 24], [6, 25], [25, 23], [20, 3], [3, 12],
    ];
    treeSpots.forEach(([x, y]) => this.placeSprite('tree', x, y));

    for (let x = 5; x <= 10; x += 1) this.placeSprite('fence_ne', x, 20);
    for (let y = 20; y <= 24; y += 1) this.placeSprite('fence_nw', 10, y);
    this.placeSprite('cow', 7, 22);
    this.placeSprite('cow', 8, 23);
  }

  private buildMarkers(): void {
    this.hoverMarker = this.add.graphics().setDepth(-99998);
    this.selectionMarker = this.add.graphics().setDepth(-99999);
  }

  private buildWorker(): void {
    const anchor = spriteAnchor(this.workerTileX, this.workerTileY, 1);
    this.worker = this.add
      .image(anchor.x, anchor.y, SPRITES.worker_maya.key)
      .setOrigin(0.5, 1)
      .setDepth(depthFor(anchor.y));
  }

  private drawDiamond(
    graphics: Phaser.GameObjects.Graphics,
    tileX: number,
    tileY: number,
    color: number,
  ): void {
    const world = tileToWorld(tileX, tileY);
    graphics.clear();
    graphics.lineStyle(2, color, 0.95);
    graphics.beginPath();
    graphics.moveTo(world.x, world.y - TILE_H / 2);
    graphics.lineTo(world.x + TILE_W / 2, world.y);
    graphics.lineTo(world.x, world.y + TILE_H / 2);
    graphics.lineTo(world.x - TILE_W / 2, world.y);
    graphics.closePath();
    graphics.strokePath();
  }

  // ---------------------------------------------------------------- camera e input

  private configureCamera(): void {
    const bounds = worldBounds(MAP_COLS, MAP_ROWS);
    const camera = this.cameras.main;
    camera.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    camera.setZoom(1);
    const start = tileToWorld(this.workerTileX, this.workerTileY);
    camera.centerOn(start.x, start.y);
  }

  private bindInput(): void {
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonDown() || (pointer.isDown && pointer.button === 2)) {
        const camera = this.cameras.main;
        camera.scrollX -= (pointer.x - pointer.prevPosition.x) / camera.zoom;
        camera.scrollY -= (pointer.y - pointer.prevPosition.y) / camera.zoom;
        return;
      }
      const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const tile = worldToTileFloor(world.x, world.y);
      if (tile.x < 0 || tile.y < 0 || tile.x >= MAP_COLS || tile.y >= MAP_ROWS) {
        this.hoverMarker.clear();
        return;
      }
      this.drawDiamond(this.hoverMarker, tile.x, tile.y, 0xffffff);
    });

    this.input.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) return;
      const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const tile = worldToTileFloor(world.x, world.y);
      if (tile.x < 0 || tile.y < 0 || tile.x >= MAP_COLS || tile.y >= MAP_ROWS) return;
      this.selectTile(tile.x, tile.y);
    });

    this.input.on(
      Phaser.Input.Events.POINTER_WHEEL,
      (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
        const camera = this.cameras.main;
        camera.setZoom(Phaser.Math.Clamp(camera.zoom - dy * 0.0012, 0.45, 2));
      },
    );

    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    keyboard.on('keydown-ONE', () => this.queueTask('Prepare Soil'));
    keyboard.on('keydown-TWO', () => this.queueTask('Plant Wheat'));
    keyboard.on('keydown-THREE', () => this.queueTask('Harvest Wheat'));
    keyboard.on('keydown-FOUR', () => this.queueTask('Deliver To Shipping Bin'));
    keyboard.on('keydown-B', () => this.buySeed());
    keyboard.on('keydown-V', () => this.sellWheat());
    keyboard.on('keydown-C', () => this.setCameraMode(this.cameraMode === 'free' ? 'followMaya' : 'free'));
    keyboard.on('keydown-SPACE', () => { this.clock.togglePause(); this.emitState(); });
  }

  private selectTile(tileX: number, tileY: number): void {
    this.selectedTile = { x: tileX, y: tileY };
    this.drawDiamond(this.selectionMarker, tileX, tileY, 0xffd166);
    const field = this.fields.getFieldAt(tileX, tileY);
    if (field) {
      publishNotice(`Campo ${field.id}: ${FIELD_LABELS[field.state]}`, 'info');
    }
    this.emitState();
  }

  private setCameraMode(mode: CameraMode): void {
    this.cameraMode = mode;
    publishNotice(mode === 'free' ? 'Câmera livre.' : 'Câmera seguindo a Maya.', 'info');
    this.emitState();
  }

  // ---------------------------------------------------------------- comandos

  private handleCommand(command: Command): void {
    switch (command.type) {
      case 'queueTask':
        this.queueTask(command.task);
        break;
      case 'buySeed':
        this.buySeed();
        break;
      case 'sellWheat':
        this.sellWheat();
        break;
      case 'repayDebt':
        this.repayDebt(command.amount);
        break;
      case 'cancelQueue':
        this.tasks.queue.splice(0, this.tasks.queue.length);
        publishNotice('Fila limpa.', 'info');
        this.emitState();
        break;
      case 'selectTile':
        this.selectTile(command.tileX, command.tileY);
        break;
      case 'centerOnWorker': {
        const world = tileToWorld(this.workerTileX, this.workerTileY);
        this.cameras.main.centerOn(world.x, world.y);
        break;
      }
      case 'setCameraMode':
        this.setCameraMode(command.mode);
        break;
      case 'setSpeed':
        this.clock.setSpeed(command.speed as SpeedOption);
        this.emitState();
        break;
    }
  }

  private buySeed(): void {
    const cost = this.seedCost;
    if (this.economy.buySeed(cost)) {
      publishNotice(`Semente comprada por ${cost}.`, 'good');
    } else {
      publishNotice(`Moedas insuficientes. A semente custa ${cost}.`, 'bad');
    }
    this.saveGame();
    this.emitState();
  }

  private sellWheat(): void {
    const quantity = this.economy.inventory.wheat;
    if (quantity <= 0) {
      publishNotice('Não há trigo no estoque.', 'bad');
      this.emitState();
      return;
    }

    const saturationBefore = this.market.saturationOf('wheat');
    const result = this.market.sell('wheat', quantity);
    this.economy.applySale(result.quantity, result.totalEarned, Math.round(result.averagePrice));

    publishNotice(
      `Vendeu ${result.quantity} de trigo por ${result.totalEarned} ` +
        `(média ${result.averagePrice.toFixed(1)} por unidade).`,
      'good',
    );
    if (result.priceAfter < result.priceBefore) {
      publishNotice(`O preço do trigo caiu de ${result.priceBefore} para ${result.priceAfter}.`, 'bad');
    }
    this.pushLesson(
      this.pedagogy.onSale(saturationBefore, result.quantity, result.priceBefore, result.priceAfter),
    );

    this.saveGame();
    this.emitState();
  }

  private repayDebt(amount: number): void {
    const paid = this.economy.repayDebt(amount);
    if (paid > 0) publishNotice(`Abateu ${paid} da dívida.`, 'good');
    else publishNotice('Sem moedas para abater a dívida.', 'bad');
    this.saveGame();
    this.emitState();
  }

  private queueTask(task: TaskType): void {
    const started = this.tasks.enqueue(task);
    if (started) this.beginTravel(task);
    else publishNotice(`${task} entrou na fila.`, 'info');
    this.emitState();
  }

  private targetForTask(task: TaskType): { x: number; y: number } | null {
    if (task === 'Deliver To Shipping Bin') {
      return { x: LANDMARKS.shippingBin.tileX, y: LANDMARKS.shippingBin.tileY };
    }
    const wanted: Record<string, FieldState[]> = {
      'Prepare Soil': ['Empty'],
      'Plant Wheat': ['Prepared'],
      'Harvest Wheat': ['Ready To Harvest'],
    };
    const field =
      this.fields.getFirstFieldWithState(wanted[task] ?? []) ?? this.fields.getFirstUnlockedField();
    return field ? { x: field.tileX, y: field.tileY } : null;
  }

  private beginTravel(task: TaskType): void {
    const target = this.targetForTask(task);
    if (!target) {
      publishNotice('Nenhum campo disponível para essa tarefa.', 'bad');
      this.tasks.completeCurrent();
      return;
    }
    this.travel = { task, targetTileX: target.x, targetTileY: target.y };
  }

  private advanceTravel(deltaDays: number): void {
    if (!this.travel) return;
    const dx = this.travel.targetTileX - this.workerTileX;
    const dy = this.travel.targetTileY - this.workerTileY;
    const distance = Math.hypot(dx, dy);
    const step = WORKER_SPEED_TILES_PER_DAY * deltaDays;

    if (distance <= step) {
      this.workerTileX = this.travel.targetTileX;
      this.workerTileY = this.travel.targetTileY;
      this.work = { task: this.travel.task, elapsed: 0 };
      this.travel = null;
    } else {
      this.workerTileX += (dx / distance) * step;
      this.workerTileY += (dy / distance) * step;
    }
    this.syncWorkerSprite();
  }

  private syncWorkerSprite(): void {
    const anchor = spriteAnchor(this.workerTileX, this.workerTileY, 1);
    this.worker.setPosition(anchor.x, anchor.y);
    this.worker.setDepth(depthFor(anchor.y));
  }

  private advanceWork(deltaDays: number): void {
    if (!this.work) return;
    this.work.elapsed += deltaDays;
    if (this.work.elapsed < WORK_DAYS) return;

    this.applyTask(this.work.task);
    this.work = null;
    const next = this.tasks.completeCurrent();
    if (next) this.beginTravel(next);
    this.saveGame();
  }

  private applyTask(task: TaskType): void {
    const tileX = Math.round(this.workerTileX);
    const tileY = Math.round(this.workerTileY);

    switch (task) {
      case 'Prepare Soil':
        if (this.fields.prepare(tileX, tileY)) publishNotice('Solo preparado.', 'good');
        else publishNotice('Este campo não estava pronto para preparo.', 'bad');
        break;
      case 'Plant Wheat':
        if (this.economy.inventory.seeds <= 0) {
          publishNotice('Sem sementes. Compre antes de plantar.', 'bad');
          break;
        }
        if (this.fields.plant(tileX, tileY)) {
          this.economy.useSeed();
          publishNotice('Trigo plantado.', 'good');
        } else {
          publishNotice('O solo precisa estar preparado.', 'bad');
        }
        break;
      case 'Harvest Wheat':
        if (this.fields.harvest(tileX, tileY)) {
          this.economy.addWheat(WHEAT_HARVEST_YIELD);
          publishNotice(`Colheu ${WHEAT_HARVEST_YIELD} de trigo.`, 'good');
        } else {
          publishNotice('O trigo ainda não está pronto.', 'bad');
        }
        break;
      case 'Deliver To Shipping Bin':
        this.sellWheat();
        break;
    }
    this.redrawFields();
    this.emitState();
  }

  // ---------------------------------------------------------------- ciclo diario

  private get seedCost(): number {
    return Math.max(1, Math.round(this.inflation.nominal(SEED_BASE_COST)));
  }

  private pushLesson(lesson: Lesson | null): void {
    if (!lesson) return;
    this.lessons.push(lesson);
    publishNotice(lesson.title, 'info');
  }

  private closeDay(): void {
    this.inflation.advanceDay();
    this.market.setPriceIndex(this.inflation.index);

    const interest = this.economy.accrueInterest();
    const householdCost = Math.max(1, Math.round(this.inflation.nominal(HOUSEHOLD_BASE_COST)));
    const payment = this.economy.payDailyCost(householdCost);
    if (payment.addedDebt > 0) {
      publishNotice(`Faltou dinheiro. A dívida subiu ${payment.addedDebt}.`, 'bad');
    }

    this.market.advanceDay(this.clock.day);

    this.pushLesson(
      this.pedagogy.onInterest(this.economy.economy.debt, interest, this.economy.economy.interestPaidTotal),
    );
    this.pushLesson(this.pedagogy.onInflation(this.inflation.accumulatedPercent));
    this.pushLesson(
      this.pedagogy.onDayClose(this.economy.economy.todayRevenue, this.economy.economy.todayExpenses),
    );

    this.economy.rollOverDay();
    this.saveGame();
  }

  private closeSeason(): void {
    const eco = this.economy.economy;
    const report: SeasonReport = {
      seasonNumber: this.clock.seasonNumber - 1,
      season: this.clock.season,
      revenue: Math.round(eco.seasonRevenue),
      expenses: Math.round(eco.seasonExpenses),
      profit: Math.round(eco.seasonRevenue - eco.seasonExpenses),
      debtStart: this.seasonAnchor.debt,
      debtEnd: eco.debt,
      interestPaid: Math.round(eco.seasonInterest),
      priceIndexStart: Math.round(this.seasonAnchor.priceIndex),
      priceIndexEnd: Math.round(this.inflation.index),
      wheatPriceStart: this.seasonAnchor.wheatPrice,
      wheatPriceEnd: this.market.priceOf('wheat'),
    };
    this.seasonReports.push(report);

    this.seasonAnchor = {
      debt: eco.debt,
      priceIndex: this.inflation.index,
      wheatPrice: this.market.priceOf('wheat'),
    };
    this.economy.rollOverSeason();
    this.clock.setSpeed(0);
    publishNotice(`Fim da estação ${report.seasonNumber}. Veja seu balanço.`, 'info');
    this.saveGame();
  }

  // ---------------------------------------------------------------- campos

  private groundForFieldState(state: FieldState): GroundKey {
    if (state === 'Empty' || state === 'Locked') return 'dirt';
    if (state === 'Prepared') return 'soil_plowed';
    return 'soil_planted';
  }

  private redrawFields(): void {
    this.cropSprites.forEach((sprite) => sprite.destroy());
    this.cropSprites.clear();

    this.fields.allFields.forEach((field) => {
      const ground = this.groundForFieldState(field.state);
      const crop = wheatSpriteFor(field.state);

      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const x = field.tileX + dx;
          const y = field.tileY + dy;
          const tile = this.groundTiles.get(`${x}:${y}`);
          if (tile) tile.setTexture(ground);
          if (!crop) continue;
          const anchor = spriteAnchor(x, y, 1);
          const sprite = this.add
            .image(anchor.x, anchor.y, SPRITES[crop].key)
            .setOrigin(0.5, 1)
            .setDepth(depthFor(anchor.y) - 1);
          this.cropSprites.set(`${x}:${y}`, sprite);
        }
      }
    });
  }

  // ---------------------------------------------------------------- estado

  private emitState(): void {
    const snapshot: GameSnapshot = {
      economy: { ...this.economy.economy },
      inventory: { ...this.economy.inventory },
      currentTask: this.tasks.currentTask,
      taskQueue: [...this.tasks.queue],
      fields: this.fields.snapshots,
      cameraMode: this.cameraMode,
      clock: this.clock.snapshot,
      taskProgress: {
        task: this.work?.task ?? this.travel?.task ?? null,
        progress: this.work ? Math.min(1, this.work.elapsed / WORK_DAYS) : 0,
      },
      worker: {
        tileX: Math.round(this.workerTileX),
        tileY: Math.round(this.workerTileY),
        activity: this.work ? 'working' : this.travel ? 'walking' : 'idle',
      },
      selectedTile: this.selectedTile,
      lastSale: this.economy.lastSale,
      wheatSeedCost: this.seedCost,
      wheatPrice: this.market.priceOf('wheat'),
      market: this.market.snapshot(),
      inflation: this.inflation.snapshot,
      lessons: [...this.lessons],
      seasonReports: [...this.seasonReports],
    };
    publishState(snapshot);
  }

  private loadGame(): void {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const save = JSON.parse(raw);
      this.economy.load(save.economy);
      this.fields.load(save.fields);
      this.tasks.load(save.tasks);
      this.clock.load(save.clock);
      this.inflation.load(save.inflation);
      this.market.load(save.market);
      this.pedagogy.load(save.pedagogy);
      this.lessons = Array.isArray(save.lessons) ? save.lessons : [];
      this.seasonReports = Array.isArray(save.seasonReports) ? save.seasonReports : [];
      if (save.seasonAnchor) this.seasonAnchor = save.seasonAnchor;
      this.market.setPriceIndex(this.inflation.index);
      this.workerTileX = save.workerTileX ?? this.workerTileX;
      this.workerTileY = save.workerTileY ?? this.workerTileY;
    } catch {
      // save corrompido: comeca um jogo novo
    }
  }

  private saveGame(): void {
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          economy: this.economy.serialize(),
          fields: this.fields.serialize(),
          tasks: this.tasks.serialize(),
          clock: { ...this.clock.snapshot, dayFraction: this.clock.dayFraction },
          inflation: this.inflation.serialize(),
          market: this.market.serialize(),
          pedagogy: this.pedagogy.serialize(),
          lessons: this.lessons,
          seasonReports: this.seasonReports,
          seasonAnchor: this.seasonAnchor,
          workerTileX: this.workerTileX,
          workerTileY: this.workerTileY,
        }),
      );
    } catch {
      // localStorage indisponivel
    }
  }
}

export { GROUND_TILE_H, GROUND_TILE_W };
