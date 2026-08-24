export type FieldState =
  | 'Empty'
  | 'Prepared'
  | 'Planted'
  | 'Growing Stage 1'
  | 'Growing Stage 2'
  | 'Growing Stage 3'
  | 'Ready To Harvest'
  | 'Locked';

export type TaskType =
  | 'Prepare Soil'
  | 'Plant Wheat'
  | 'Harvest Wheat'
  | 'Deliver To Shipping Bin';

export type CameraMode = 'free' | 'followMaya';

export type WorkerActivity = 'idle' | 'walking' | 'working';

export interface Inventory {
  seeds: number;
  wheat: number;
  milk: number;
}

export interface Economy {
  coins: number;
  debt: number;
  dailyHouseholdCost: number;
  profitLoss: number;
}

export interface SaleSummary {
  quantity: number;
  unitPrice: number;
  totalEarned: number;
}

export interface FieldSnapshot {
  id: number;
  state: FieldState;
  growthElapsedSeconds: number;
}

export interface GameClockSnapshot {
  day: number;
  minuteOfDay: number;
  dailyCostCountdownSeconds: number;
  isRunning: boolean;
}

export interface TaskProgressSnapshot {
  task: TaskType | null;
  progress: number;
}

export interface WorkerSnapshot {
  tileX: number;
  tileY: number;
  activity: WorkerActivity;
}

export interface GameSnapshot {
  economy: Economy;
  inventory: Inventory;
  currentTask: TaskType | null;
  taskQueue: TaskType[];
  fields: FieldSnapshot[];
  cameraMode: CameraMode;
  clock: GameClockSnapshot;
  taskProgress: TaskProgressSnapshot;
  worker: WorkerSnapshot;
  selectedTile: { x: number; y: number } | null;
  lastSale: SaleSummary | null;
  wheatSeedCost: number;
  wheatPrice: number;
}
