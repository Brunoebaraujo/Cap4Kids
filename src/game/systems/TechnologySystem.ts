import type { TechSnapshot, TechTierId } from '../types';

/**
 * Tecnologia = capacidade de trabalho por dia.
 *
 * A licao central: investir custa caro hoje e paga depois. A crianca precisa
 * conseguir fazer a conta de cabeca — "gasto 320 para trabalhar 5 por dia em vez
 * de 3; quantos dias isso leva para se pagar?".
 *
 * DECISAO DE DESENHO: tecnologia aumenta QUANTO voce trabalha, nunca a
 * velocidade com que a planta cresce. Trator nao faz trigo crescer mais rapido.
 * Isso e fiel a realidade e ensina que dinheiro compra produtividade, nao
 * biologia — algumas coisas so levam o tempo que levam.
 */

export interface TechTier {
  id: TechTierId;
  label: string;
  /** Pontos de trabalho disponiveis por dia. */
  capacity: number;
  /** Custo para subir da tier anterior para esta. Base, antes da inflacao. */
  upgradeCost: number;
  description: string;
}

export const TECH_TIERS: TechTier[] = [
  {
    id: 'manual',
    label: 'Manual',
    capacity: 4,
    upgradeCost: 0,
    description: 'Só as mãos. Um ciclo completo de campo leva dois dias de trabalho.',
  },
  {
    id: 'simple',
    label: 'Ferramentas simples',
    capacity: 6,
    upgradeCost: 140,
    description: 'Enxada e foice. Sobra trabalho depois de preparar e plantar.',
  },
  {
    id: 'medium',
    label: 'Ferramentas médias',
    capacity: 8,
    upgradeCost: 320,
    description: 'Arado de tração. Um ciclo completo de campo por dia.',
  },
  {
    id: 'advanced',
    label: 'Ferramentas sofisticadas',
    capacity: 12,
    upgradeCost: 700,
    description: 'Semeadeira e ceifadeira. Um campo e meio por dia.',
  },
  {
    id: 'mechanized',
    label: 'Mecanização',
    capacity: 18,
    upgradeCost: 1500,
    description: 'Trator e colheitadeira. Mais de dois campos por dia.',
  },
];

/** Custo em pontos de trabalho de cada tarefa. */
export const TASK_WORK_COST: Record<string, number> = {
  'Prepare Soil': 3,
  'Plant Wheat': 1,
  'Harvest Wheat': 3,
  'Deliver To Shipping Bin': 1,
};

export interface TechSaveState {
  tierIndex: number;
  workUsedToday: number;
}

export class TechnologySystem {
  private tierIndex = 0;
  private workUsedToday = 0;

  get tier(): TechTier {
    return TECH_TIERS[this.tierIndex];
  }

  get nextTier(): TechTier | null {
    return TECH_TIERS[this.tierIndex + 1] ?? null;
  }

  get capacity(): number {
    return this.tier.capacity;
  }

  get workRemaining(): number {
    return Math.max(0, this.capacity - this.workUsedToday);
  }

  /** Custo do ciclo completo de um campo, em pontos de trabalho. */
  static get fullCycleCost(): number {
    return TASK_WORK_COST['Prepare Soil'] + TASK_WORK_COST['Plant Wheat']
      + TASK_WORK_COST['Harvest Wheat'] + TASK_WORK_COST['Deliver To Shipping Bin'];
  }

  costOf(task: string): number {
    return TASK_WORK_COST[task] ?? 1;
  }

  canAfford(task: string): boolean {
    return this.costOf(task) <= this.workRemaining;
  }

  /** Consome capacidade. Devolve false se nao houver trabalho disponivel hoje. */
  spend(task: string): boolean {
    const cost = this.costOf(task);
    if (cost > this.workRemaining) return false;
    this.workUsedToday += cost;
    return true;
  }

  resetDay(): void {
    this.workUsedToday = 0;
  }

  /** Preco de subir de nivel ja corrigido pela inflacao. */
  upgradeCost(priceIndex: number): number | null {
    const next = this.nextTier;
    if (!next) return null;
    return Math.round(next.upgradeCost * (priceIndex / 100));
  }

  upgrade(): boolean {
    if (!this.nextTier) return false;
    this.tierIndex += 1;
    return true;
  }

  /**
   * Em quantos dias o upgrade se paga, dado o lucro medio por ponto de
   * trabalho. E a conta de retorno sobre investimento que a crianca precisa ver.
   */
  paybackDays(priceIndex: number, profitPerWorkPoint: number): number | null {
    const cost = this.upgradeCost(priceIndex);
    const next = this.nextTier;
    if (cost === null || !next || profitPerWorkPoint <= 0) return null;
    const extraPerDay = (next.capacity - this.capacity) * profitPerWorkPoint;
    if (extraPerDay <= 0) return null;
    return Math.ceil(cost / extraPerDay);
  }

  load(state?: Partial<TechSaveState>): void {
    if (!state) return;
    this.tierIndex = Math.min(TECH_TIERS.length - 1, Math.max(0, state.tierIndex ?? 0));
    this.workUsedToday = state.workUsedToday ?? 0;
  }

  serialize(): TechSaveState {
    return { tierIndex: this.tierIndex, workUsedToday: this.workUsedToday };
  }

  snapshot(priceIndex: number, profitPerWorkPoint: number): TechSnapshot {
    const next = this.nextTier;
    return {
      tierId: this.tier.id,
      tierLabel: this.tier.label,
      description: this.tier.description,
      capacity: this.capacity,
      workRemaining: this.workRemaining,
      nextTierLabel: next?.label ?? null,
      nextCapacity: next?.capacity ?? null,
      upgradeCost: this.upgradeCost(priceIndex),
      paybackDays: this.paybackDays(priceIndex, profitPerWorkPoint),
    };
  }
}
