import type { CropId, FieldSnapshot, FieldState } from '../types';

export interface FieldRecord { id: number; tileX: number; tileY: number; state: FieldState; plots: PlotRecord[] }
export interface PlotRecord { id: string; fieldId: number; row: number; col: number; state: FieldState; cropId: CropId | null; growthRemainingDays: number }

const GRID_SIZE = 6;
function createPlots(fieldId: number, unlocked: boolean): PlotRecord[] {
  const plots: PlotRecord[] = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      plots.push({ id: 'field-' + fieldId + '-plot-' + row + '-' + col, fieldId, row, col, state: unlocked ? 'Raw' : 'Locked', cropId: null, growthRemainingDays: 0 });
    }
  }
  return plots;
}

export class FieldSystem {
  private readonly fields: FieldRecord[] = [1, 2, 3, 4, 5, 6].map((id) => ({
    id, tileX: id, tileY: 1, state: id === 1 ? 'Raw' : 'Locked', plots: createPlots(id, id === 1),
  }));

  get snapshots(): FieldSnapshot[] {
    return this.fields.map((field) => ({ id: field.id, state: this.aggregateState(field), plots: field.plots.map((plot) => ({ ...plot })) }));
  }

  get allFields() { return this.fields; }
  get allPlots() { return this.fields.flatMap((field) => field.plots); }
  getFieldAt(tileX: number, tileY: number) { return this.fields.find((field) => field.tileX === tileX && field.tileY === tileY) ?? null; }
  getFieldById(id: number) { return this.fields.find((field) => field.id === id) ?? null; }
  getPlotById(id: string) { return this.allPlots.find((plot) => plot.id === id) ?? null; }
  getFirstUnlockedField() { return this.fields.find((field) => field.plots.some((plot) => plot.state !== 'Locked')) ?? null; }
  getFirstFieldWithState(state: FieldState) { return this.fields.find((field) => field.plots.some((plot) => plot.state === state)) ?? null; }
  getFirstPlotWithState(state: FieldState) { return this.allPlots.find((plot) => plot.state === state) ?? null; }

  prepare(plotIdOrTileX: string | number, tileY?: number) { const plot = typeof plotIdOrTileX === 'string' ? this.getPlotById(plotIdOrTileX) : this.getFirstPlotWithState('Raw'); if (!plot || plot.state !== 'Raw') return false; plot.state = 'Prepared'; return true; }
  plant(plotIdOrTileX: string | number, cropId: CropId = 'wheat', growthDays = 2) { const plot = typeof plotIdOrTileX === 'string' ? this.getPlotById(plotIdOrTileX) : this.getFirstPlotWithState('Prepared'); if (!plot || plot.state !== 'Prepared') return false; plot.state = 'Planted'; plot.cropId = cropId; plot.growthRemainingDays = growthDays; return true; }
  harvest(plotIdOrTileX: string | number) { const plot = typeof plotIdOrTileX === 'string' ? this.getPlotById(plotIdOrTileX) : this.getFirstPlotWithState('Mature'); if (!plot || plot.state !== 'Mature') return null; const cropId = plot.cropId; plot.state = 'Raw'; plot.cropId = null; plot.growthRemainingDays = 0; return cropId; }

  advanceDay() { let changed = false; this.allPlots.forEach((plot) => { if (plot.state === 'Planted' || plot.state === 'Growing') { plot.growthRemainingDays = Math.max(0, plot.growthRemainingDays - 1); plot.state = plot.growthRemainingDays <= 0 ? 'Mature' : 'Growing'; changed = true; } }); return changed; }

  private aggregateState(field: FieldRecord): FieldState {
    const states = field.plots.map((plot) => plot.state);
    if (states.every((state) => state === 'Locked')) return 'Locked';
    if (states.some((state) => state === 'Mature')) return 'Mature';
    if (states.some((state) => state === 'Growing')) return 'Growing';
    if (states.some((state) => state === 'Planted')) return 'Planted';
    if (states.some((state) => state === 'Prepared')) return 'Prepared';
    return 'Raw';
  }
}
