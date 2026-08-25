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
  todayRevenue: number;
  todayExpenses: number;
  lastDayRevenue: number;
  lastDayExpenses: number;
  interestPaidTotal: number;
  seasonRevenue: number;
  seasonExpenses: number;
  seasonInterest: number;
}

export type GoodId = 'wheat' | 'milk';

export interface PricePoint {
  day: number;
  price: number;
}

export interface MarketGoodSnapshot {
  id: GoodId;
  label: string;
  price: number;
  trend: number;
  saturation: number;
  history: PricePoint[];
}

export interface InflationSnapshot {
  index: number;
  dailyRatePercent: number;
  accumulatedPercent: number;
}

export interface Lesson {
  id: string;
  concept: string;
  title: string;
  body: string;
}

export interface SaleSummary {
  quantity: number;
  unitPrice: number;
  totalEarned: number;
}

export interface FieldSnapshot {
  id: number;
  state: FieldState;
  growthElapsedDays: number;
}

export type Season = 'Primavera' | 'Verão' | 'Outono' | 'Inverno';

export interface GameClockSnapshot {
  day: number;
  dayFraction: number;
  minuteOfDay: number;
  speed: number;
  season: Season;
  seasonNumber: number;
  dayOfSeason: number;
  daysPerSeason: number;
}

export interface SeasonReport {
  seasonNumber: number;
  season: Season;
  revenue: number;
  expenses: number;
  profit: number;
  debtStart: number;
  debtEnd: number;
  interestPaid: number;
  priceIndexStart: number;
  priceIndexEnd: number;
  wheatPriceStart: number;
  wheatPriceEnd: number;
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
  market: MarketGoodSnapshot[];
  inflation: InflationSnapshot;
  lessons: Lesson[];
  seasonReports: SeasonReport[];
}
