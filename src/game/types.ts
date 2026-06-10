export const TILE_SIZE = 32;

export type Direction = 'down' | 'up' | 'left' | 'right';

export type FieldState = 'Harvested' | 'Prepared' | 'Planted' | 'Locked';

export type TaskType = 'Prepare Soil' | 'Plant Wheat' | 'Harvest Wheat' | 'Milk Cow';

export type AnimationState = 'idle' | 'walk' | 'prepare soil' | 'plant' | 'harvest' | 'milk cow';

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
}

export interface FieldSnapshot {
  id: number;
  state: FieldState;
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
}

export interface GameEvents {
  state: GameSnapshot;
  notification: string;
}
