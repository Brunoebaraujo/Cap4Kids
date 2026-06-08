import type { FieldSnapshot, FieldState } from '../types';

export interface FieldRecord {
  id: number;
  tileX: number;
  tileY: number;
  state: FieldState;
}

export class FieldSystem {
  private readonly fields: FieldRecord[] = [
    { id: 1, tileX: 6, tileY: 5, state: 'Harvested' },
    { id: 2, tileX: 8, tileY: 5, state: 'Locked' },
  ];

  get snapshots(): FieldSnapshot[] {
    return this.fields.map(({ id, state }) => ({ id, state }));
  }

  getFieldAt(tileX: number, tileY: number) {
    return this.fields.find((field) => field.tileX === tileX && field.tileY === tileY) ?? null;
  }

  getFirstUnlockedField() {
    return this.fields.find((field) => field.state !== 'Locked') ?? null;
  }

  prepare(tileX: number, tileY: number) {
    const field = this.getFieldAt(tileX, tileY);

    if (!field || field.state !== 'Harvested') {
      return false;
    }

    field.state = 'Prepared';
    return true;
  }

  plant(tileX: number, tileY: number) {
    const field = this.getFieldAt(tileX, tileY);

    if (!field || field.state !== 'Prepared') {
      return false;
    }

    field.state = 'Planted';
    return true;
  }

  harvest(tileX: number, tileY: number) {
    const field = this.getFieldAt(tileX, tileY);

    if (!field || field.state !== 'Planted') {
      return false;
    }

    field.state = 'Harvested';
    return true;
  }
}
