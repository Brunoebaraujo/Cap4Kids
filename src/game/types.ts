export const TILE_SIZE = 32;

export type Direction = 'down' | 'up' | 'left' | 'right';

export type FieldState =
  | 'Empty'
  | 'Prepared'
  | 'Planted'
  | 'Growing Stage 1'
  | 'Growing Stage 2'
  | 'Growing Stage 3'
  | 'Ready To Harvest'
  | 'Locked';

export type TaskType = 'Prepare Soil' | 'Plant Wheat' | 'Harvest Wheat' | 'Deliver To Shipping Bin';

export type AnimationState = 'idle' | 'walk' | 'prepare soil' | 'plant' | 'harvest' | 'deliver';

export type CameraMode = 'free' | 'followMaya';

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

export interface MayaSnapshot {
  animation: string;
  direction: Direction;
  x: number;
  y: number;
  frameWidth: number;
  frameHeight: number;
  state: AnimationState;
}

export interface GameSnapshot {
  economy: Economy;
  inventory: Inventory;
  currentTask: TaskType | null;
  taskQueue: TaskType[];
  fields: FieldSnapshot[];
  animationState: AnimationState;
  cameraMode: CameraMode;
  maya: MayaSnapshot;
  clock: GameClockSnapshot;
  taskProgress: TaskProgressSnapshot;
  lastSale: SaleSummary | null;
  wheatSeedCost: number;
  wheatPrice: number;
}

export interface GameEvents {
  state: GameSnapshot;
  notification: string;
}
