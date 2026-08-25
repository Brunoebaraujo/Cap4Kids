import type { FieldSnapshot, FieldState } from '../types';

/**
 * Um estagio de crescimento em DIAS. Quatro estagios = 4 dias por ciclo.
 *
 * Com um dia de jogo por dia real, a lavoura leva quatro dias reais para ficar
 * pronta. Tecnologia NAO acelera isso — so aumenta quantos campos a fazenda
 * consegue trabalhar por dia.
 */
export const GROWTH_STAGE_DAYS = 1;

export interface FieldRecord {
  id: number;
  tileX: number;
  tileY: number;
  state: FieldState;
  growthElapsedDays: number;
}

export type FieldSaveState = Array<Pick<FieldRecord, 'id' | 'state' | 'growthElapsedDays'>>;

export class FieldSystem {
  /**
   * Terra e ferramenta sao capitais COMPLEMENTARES. Com poucos campos, subir de
   * tecnologia nao rende nada: a lavoura leva 4 dias e nao ha o que trabalhar.
   * A crianca precisa equilibrar os dois — e descobrir sozinha que trator sem
   * terra e dinheiro jogado fora.
   */
  private readonly fields: FieldRecord[] = [
    { id: 1, tileX: 14, tileY: 15, state: 'Empty', growthElapsedDays: 0 },
    { id: 2, tileX: 18, tileY: 15, state: 'Locked', growthElapsedDays: 0 },
    { id: 3, tileX: 14, tileY: 19, state: 'Locked', growthElapsedDays: 0 },
    { id: 4, tileX: 18, tileY: 19, state: 'Locked', growthElapsedDays: 0 },
    { id: 5, tileX: 22, tileY: 15, state: 'Locked', growthElapsedDays: 0 },
    { id: 6, tileX: 22, tileY: 19, state: 'Locked', growthElapsedDays: 0 },
    { id: 7, tileX: 14, tileY: 23, state: 'Locked', growthElapsedDays: 0 },
    { id: 8, tileX: 18, tileY: 23, state: 'Locked', growthElapsedDays: 0 },
    { id: 9, tileX: 22, tileY: 23, state: 'Locked', growthElapsedDays: 0 },
  ];

  /** Custo base de comprar o proximo campo, antes da inflacao. */
  private static readonly LAND_COSTS = [0, 120, 260, 450, 700, 1000, 1400, 1900, 2500];

  get snapshots(): FieldSnapshot[] {
    return this.fields.map(({ id, state, growthElapsedDays }) => ({ id, state, growthElapsedDays }));
  }

  get allFields(): FieldRecord[] {
    return this.fields;
  }

  getFieldAt(tileX: number, tileY: number) {
    return this.fields.find((field) => Math.abs(field.tileX - tileX) <= 1 && Math.abs(field.tileY - tileY) <= 1) ?? null;
  }

  get unlockedCount(): number {
    return this.fields.filter((f) => f.state !== 'Locked').length;
  }

  /** Proximo campo a comprar, ou null se todos ja foram comprados. */
  get nextLandCost(): number | null {
    const index = this.unlockedCount;
    return index < this.fields.length ? FieldSystem.LAND_COSTS[index] : null;
  }

  /** Libera o proximo campo bloqueado. */
  buyNextField(): boolean {
    const locked = this.fields.find((f) => f.state === 'Locked');
    if (!locked) return false;
    locked.state = 'Empty';
    locked.growthElapsedDays = 0;
    return true;
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
