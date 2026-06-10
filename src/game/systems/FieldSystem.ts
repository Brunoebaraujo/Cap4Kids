import type { FieldSnapshot, FieldState } from '../types';

export const GROWTH_STAGE_SECONDS = 18;

export interface FieldRecord {
  id: number;
  tileX: number;
  tileY: number;
  state: FieldState;
  growthElapsedSeconds: number;
}

export type FieldSaveState = Array<Pick<FieldRecord, 'id' | 'state' | 'growthElapsedSeconds'>>;

export class FieldSystem {
  private readonly fields: FieldRecord[] = [
    { id: 1, tileX: 24, tileY: 42, state: 'Empty', growthElapsedSeconds: 0 },
    { id: 2, tileX: 28, tileY: 72, state: 'Locked', growthElapsedSeconds: 0 },
  ];

  get snapshots(): FieldSnapshot[] {
    return this.fields.map(({ id, state, growthElapsedSeconds }) => ({ id, state, growthElapsedSeconds }));
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
    field.growthElapsedSeconds = 0;
    return true;
  }

  plant(tileX: number, tileY: number) {
    const field = this.getFieldAt(tileX, tileY);

    if (!field || field.state !== 'Prepared') return false;

    field.state = 'Planted';
    field.growthElapsedSeconds = 0;
    return true;
  }

  harvest(tileX: number, tileY: number) {
    const field = this.getFieldAt(tileX, tileY);

    if (!field || field.state !== 'Ready To Harvest') return false;

    field.state = 'Empty';
    field.growthElapsedSeconds = 0;
    return true;
  }

  updateGrowth(deltaSeconds: number) {
    let changed = false;

    this.fields.forEach((field) => {
      if (!this.isGrowing(field.state)) return;

      field.growthElapsedSeconds += deltaSeconds;
      const nextState = this.stateForGrowth(field.growthElapsedSeconds);
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
      field.growthElapsedSeconds = saved.growthElapsedSeconds ?? 0;
    });
  }

  serialize(): FieldSaveState {
    return this.fields.map(({ id, state, growthElapsedSeconds }) => ({ id, state, growthElapsedSeconds }));
  }

  private isGrowing(state: FieldState) {
    return ['Planted', 'Growing Stage 1', 'Growing Stage 2', 'Growing Stage 3'].includes(state);
  }

  private stateForGrowth(seconds: number): FieldState {
    if (seconds >= GROWTH_STAGE_SECONDS * 4) return 'Ready To Harvest';
    if (seconds >= GROWTH_STAGE_SECONDS * 3) return 'Growing Stage 3';
    if (seconds >= GROWTH_STAGE_SECONDS * 2) return 'Growing Stage 2';
    if (seconds >= GROWTH_STAGE_SECONDS) return 'Growing Stage 1';
    return 'Planted';
  }
}
