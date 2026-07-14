import type { FieldSnapshot, FieldState } from '../types';

export interface FieldRecord {
  id: number;
  tileX: number;
  tileY: number;
  state: FieldState;
}

export class FieldSystem {
  private readonly fields: FieldRecord[] = [
    { id: 1, tileX: 6, tileY: 5, state: 'Raw' },
    { id: 2, tileX: 8, tileY: 5, state: 'Locked' },
    { id: 3, tileX: 6, tileY: 8, state: 'Locked' },
  ];

  get snapshots(): FieldSnapshot[] {
    return this.fields.map(({ id, state }) => ({ id, state }));
  }

  get allFields() { return this.fields; }
  getFieldAt(tileX: number, tileY: number) { return this.fields.find((field) => field.tileX === tileX && field.tileY === tileY) ?? null; }
  getFieldById(id: number) { return this.fields.find((field) => field.id === id) ?? null; }
  getFirstUnlockedField() { return this.fields.find((field) => field.state !== 'Locked') ?? null; }
  getFirstFieldWithState(state: FieldState) { return this.fields.find((field) => field.state === state) ?? null; }

  prepare(tileX: number, tileY: number) {
    const field = this.getFieldAt(tileX, tileY);
    if (!field || field.state !== 'Raw') return false;
    field.state = 'Prepared';
    return true;
  }

  plant(tileX: number, tileY: number) {
    const field = this.getFieldAt(tileX, tileY);
    if (!field || field.state !== 'Prepared') return false;
    field.state = 'Planted';
    return true;
  }

  harvest(tileX: number, tileY: number) {
    const field = this.getFieldAt(tileX, tileY);
    if (!field || field.state !== 'Mature') return false;
    field.state = 'Raw';
    return true;
  }

  advanceDay() {
    let changed = false;
    this.fields.forEach((field) => {
      if (field.state === 'Planted') { field.state = 'Growing'; changed = true; }
      else if (field.state === 'Growing') { field.state = 'Mature'; changed = true; }
    });
    return changed;
  }
}
