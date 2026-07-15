export const TILE_SIZE = 32;

export type Direction = 'down' | 'up' | 'left' | 'right';
export type FieldState = 'Raw' | 'Prepared' | 'Planted' | 'Growing' | 'Mature' | 'Locked';
export type TaskType = 'Prepare Soil' | 'Plant Wheat' | 'Harvest Wheat' | 'Milk Cow';
export type AnimationState = 'idle' | 'walk' | 'prepare soil' | 'plant' | 'harvest' | 'milk cow';
export type WorkerStatus = 'Idle' | 'Busy' | 'Moving';
export type GameRole = 'player' | 'admin';
export type AdminEventType = 'drought' | 'rain' | 'subsidy' | 'inflation' | 'locusts';

// Task targets may include exact world coordinates for per-plot work.
export interface TaskCommand { id: number; type: TaskType; targetX: number; targetY: number; targetPlotId?: string; targetWorldX?: number; targetWorldY?: number }
export interface Inventory { seeds: number; wheat: number; milk: number }
export interface Economy {
  coins: number;
  debt: number;
  dailyHouseholdCost: number;
  inflationRate: number;
  wheatPrice: number;
  milkPrice: number;
  wealthCreated: number;
  day: number;
}
export interface PlotSnapshot { id: string; fieldId: number; row: number; col: number; state: FieldState }
export interface FieldSnapshot { id: number; state: FieldState; plots?: PlotSnapshot[] }
export interface WorkerSnapshot {
  id: string; name: string; position: { x: number; y: number }; status: WorkerStatus;
  currentTask: TaskCommand | null; taskQueue: TaskCommand[]; animationState: AnimationState; isSelected: boolean;
}
export interface RivalSnapshot { id: string; name: string; coins: number; marketShare: number; price: number; color: string }
export interface WorldEvent { id: number; type: AdminEventType; title: string; description: string; day: number }
export interface GameSnapshot {
  economy: Economy; inventory: Inventory; selectedWorkerId: string; selectedWorker: WorkerSnapshot;
  workers: WorkerSnapshot[]; currentTask: TaskType | null; taskQueue: TaskType[]; fields: FieldSnapshot[];
  animationState: AnimationState; role: GameRole; rivals: RivalSnapshot[]; events: WorldEvent[];
}
export interface GameEvents {
  state: GameSnapshot; notification: string; task: TaskType; selectWorker: string; findWorker: string;
  sell: 'wheat' | 'milk'; buySeeds: undefined; nextDay: undefined; adminEvent: AdminEventType; role: GameRole;
}
