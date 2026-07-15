export type CropId = 'wheat' | 'rice' | 'tomato' | 'banana';

export interface CropDefinition {
  id: CropId;
  label: string;
  plantMinutes: number;
  growthDays: number;
  harvestMinutes: number;
  saleValueUsd: number;
  seedPrice: number;
  color: string;
}

export const CROPS: CropDefinition[] = [
  { id: 'wheat', label: 'Trigo', plantMinutes: 3, growthDays: 2, harvestMinutes: 5, saleValueUsd: 10, seedPrice: 2, color: '#d8aa36' },
  { id: 'rice', label: 'Arroz', plantMinutes: 4, growthDays: 3, harvestMinutes: 6, saleValueUsd: 15, seedPrice: 3, color: '#dfe8b6' },
  { id: 'tomato', label: 'Tomate', plantMinutes: 2, growthDays: 3, harvestMinutes: 8, saleValueUsd: 20, seedPrice: 4, color: '#cf3b2f' },
  { id: 'banana', label: 'Banana', plantMinutes: 5, growthDays: 4, harvestMinutes: 7, saleValueUsd: 30, seedPrice: 6, color: '#e6c43a' },
];

export const DEFAULT_CROP_ID: CropId = 'wheat';
export function cropById(id: CropId) { return CROPS.find((crop) => crop.id === id) ?? CROPS[0]; }
