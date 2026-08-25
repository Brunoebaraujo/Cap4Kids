import type { FieldSnapshot, FieldState } from '../types';

/** Um estagio de crescimento em DIAS DE JOGO. 4 estagios = 0,4 dia por ciclo. */
export const GROWTH_STAGE_DAYS = 0.1;

export interface FieldRecord {
  id: number;
  tileX: number;
  tileY: number;
  state: FieldState;
  growthElapsedDays: number;
}

export type FieldSaveState = Array<Pick<FieldRecord, 'id' | 'state' | 'growthElapsedDays'>>;

export class FieldSystem {
  private readonly fields: FieldRecord[] = [
    { id: 1, tileX: 15, tileY: 16, state: 'Empty', growthElapsedDays: 0 },
    { id: 2, tileX: 21, tileY: 20, state: 'Locked', growthElapsedDays: 0 },
  ];

  get snapshots(): FieldSnapshot[] {
    return this.fields.map(({ id, state, growthElapsedDays }) => ({ id, state, growthElapsedDays }));
  }

  get allFields(): FieldRecord[] {
    return this.fields;
  }

  getFieldAt(tileX: number, tileY: number) {
    return this.fields.find((field) => Math.abs(field.tileX - tileX) <= 1 && Math.abs(field.tileY - tileY) <= 1) ?? null;
  }

  getFirstUnlockedField() {
    return this.fields.find((field) => field.state !== 'Locked') ?? null;
  }

  getFirstFieldWithState(states: FieldState[]) {
    return this.fields.find((field) => states.includes(field.state)) ?? null;
  }

  prepare(tileX: number, tileY: number) {
    const field = this.getFieldAt(tileX, tileY);

    if (!field || field.state !== 'Empty') return false;

    field.state = 'Prepared';
    field.growthElapsedDays = 0;
    return true;
  }

  plant(tileX: number, tileY: number) {
    const field = this.getFieldAt(tileX, tileY);

    if (!field || field.state !== 'Prepared') return false;

    field.state = 'Planted';
    field.growthElapsedDays = 0;
    return true;
  }

  harvest(tileX: number, tileY: number) {
    const field = this.getFieldAt(tileX, tileY);

    if (!field || field.state !== 'Ready To Harvest') return false;

    field.state = 'Empty';
    field.growthElapsedDays = 0;
    return true;
  }

  updateGrowth(deltaDays: number) {
    let changed = false;

    this.fields.forEach((field) => {
      if (!this.isGrowing(field.state)) return;

      field.growthElapsedDays += deltaDays;
      const nextState = this.stateForGrowth(field.growthElapsedDays);
      if (nextState !== field.state) {
        field.state = nextState;
        changed = true;
      }
    });

    return changed;
  }

  load(state?: FieldSaveState) {
    if (!state) return;

    state.forEach((saved) => {
      const field = this.fields.find((candidate) => candidate.id === saved.id);
      if (!field) return;
      field.state = saved.state;
      field.growthElapsedDays = saved.growthElapsedDays ?? 0;
    });
  }

  serialize(): FieldSaveState {
    return this.fields.map(({ id, state, growthElapsedDays }) => ({ id, state, growthElapsedDays }));
  }

  private isGrowing(state: FieldState) {
    return ['Planted', 'Growing Stage 1', 'Growing Stage 2', 'Growing Stage 3'].includes(state);
  }

  private stateForGrowth(days: number): FieldState {
    if (days >= GROWTH_STAGE_DAYS * 4) return 'Ready To Harvest';
    if (days >= GROWTH_STAGE_DAYS * 3) return 'Growing Stage 3';
    if (days >= GROWTH_STAGE_DAYS * 2) return 'Growing Stage 2';
    if (days >= GROWTH_STAGE_DAYS) return 'Growing Stage 1';
    return 'Planted';
  }
}
