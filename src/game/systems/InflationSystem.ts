import type { InflationSnapshot } from '../types';

/**
 * Inflacao.
 *
 * A licao central: ter mais moedas nao e a mesma coisa que ser mais rico. Se os
 * precos sobem junto, o poder de compra fica igual — ou pior.
 *
 * O indice comeca em 100 e cresce um pouco a cada dia, de forma composta. Ele
 * multiplica tanto o valor base das mercadorias quanto os custos (semente e
 * despesa diaria da casa). Assim a crianca ve a receita nominal subir enquanto
 * o lucro real anda de lado, que e exatamente o ponto.
 */

const DAILY_RATE = 0.007;

export interface InflationSaveState {
  index: number;
  dailyRate: number;
}

export class InflationSystem {
  index = 100;
  dailyRate = DAILY_RATE;

  advanceDay(): void {
    this.index *= 1 + this.dailyRate;
  }

  /** Converte um valor de tabela para moedas de hoje. */
  nominal(baseValue: number): number {
    return baseValue * (this.index / 100);
  }

  /** Converte moedas de hoje para poder de compra do dia 1. */
  real(nominalValue: number): number {
    return nominalValue / (this.index / 100);
  }

  /** Inflacao acumulada em porcentagem desde o inicio do jogo. */
  get accumulatedPercent(): number {
    return this.index - 100;
  }

  load(state?: Partial<InflationSaveState>): void {
    if (!state) return;
    this.index = state.index ?? this.index;
    this.dailyRate = state.dailyRate ?? this.dailyRate;
  }

  serialize(): InflationSaveState {
    return { index: this.index, dailyRate: this.dailyRate };
  }

  get snapshot(): InflationSnapshot {
    return {
      index: Number(this.index.toFixed(2)),
      dailyRatePercent: Number((this.dailyRate * 100).toFixed(2)),
      accumulatedPercent: Number(this.accumulatedPercent.toFixed(1)),
    };
  }
}
