import type { GoodId, MarketGoodSnapshot, PricePoint } from '../types';

/**
 * Mercado com preco endogeno.
 *
 * A licao central: o preco nao e um numero fixo na tabela. Ele responde ao que
 * o jogador faz. Despejar muita mercadoria de uma vez satura o mercado e derruba
 * o preco; esperar alguns dias deixa o mercado absorver o estoque e o preco sobe
 * de novo.
 *
 * Modelo (deliberadamente simples e legivel para uma crianca):
 *
 *   pressao   = estoque / saturacao
 *   multiplic = clamp(1 - SENSIBILIDADE * pressao, PISO, TETO)
 *   preco     = max(1, round(base * multiplic))
 *
 * `base` acompanha a inflacao. `estoque` sobe a cada venda e decai todo dia
 * pela taxa de absorcao.
 */

const SENSITIVITY = 0.65;
const PRICE_FLOOR = 0.4;
const PRICE_CEILING = 1.7;
const HISTORY_LIMIT = 90;

interface GoodConfig {
  label: string;
  baseValue: number;
  saturation: number;
  absorption: number;
}

const CONFIG: Record<GoodId, GoodConfig> = {
  wheat: { label: 'Trigo', baseValue: 10, saturation: 46, absorption: 0.28 },
  milk: { label: 'Leite', baseValue: 16, saturation: 22, absorption: 0.32 },
};

export const GOOD_IDS = Object.keys(CONFIG) as GoodId[];

export interface MarketSale {
  quantity: number;
  totalEarned: number;
  averagePrice: number;
  priceBefore: number;
  priceAfter: number;
}

interface GoodState {
  stock: number;
  history: PricePoint[];
}

export interface MarketSaveState {
  goods: Record<string, GoodState>;
}

export class MarketSystem {
  private readonly goods: Record<GoodId, GoodState> = {
    wheat: { stock: 0, history: [] },
    milk: { stock: 0, history: [] },
  };

  /** Indice de inflacao aplicado ao valor base. 100 = sem inflacao. */
  private priceIndex = 100;

  setPriceIndex(index: number): void {
    this.priceIndex = index;
  }

  baseValueOf(good: GoodId): number {
    return CONFIG[good].baseValue * (this.priceIndex / 100);
  }

  priceOf(good: GoodId): number {
    const config = CONFIG[good];
    const pressure = this.goods[good].stock / config.saturation;
    const multiplier = Math.min(
      PRICE_CEILING,
      Math.max(PRICE_FLOOR, 1 - SENSITIVITY * pressure),
    );
    return Math.max(1, Math.round(this.baseValueOf(good) * multiplier));
  }

  /**
   * Vende `quantity` unidades com precificacao MARGINAL: cada unidade colocada
   * no mercado pressiona o preco da unidade seguinte.
   *
   * Isto e o que faz a licao chegar na hora. Se o preco so caisse para vendas
   * futuras, despejar tudo de uma vez sairia de graca no momento da venda e a
   * crianca nao ligaria a causa ao efeito.
   */
  sell(good: GoodId, quantity: number): MarketSale {
    const priceBefore = this.priceOf(good);
    if (quantity <= 0) {
      return { quantity: 0, totalEarned: 0, averagePrice: priceBefore, priceBefore, priceAfter: priceBefore };
    }
    let totalEarned = 0;
    for (let unit = 0; unit < quantity; unit += 1) {
      totalEarned += this.priceOf(good);
      this.goods[good].stock += 1;
    }
    return {
      quantity,
      totalEarned,
      averagePrice: totalEarned / quantity,
      priceBefore,
      priceAfter: this.priceOf(good),
    };
  }

  /** Registra estoque sem apurar receita. Util para testes e eventos. */
  recordSale(good: GoodId, quantity: number): void {
    if (quantity <= 0) return;
    this.goods[good].stock += quantity;
  }

  /**
   * Fecha o dia. O preco de fechamento entra no historico ANTES da absorcao,
   * para que o grafico mostre a queda que o jogador de fato provocou.
   */
  advanceDay(day: number): void {
    GOOD_IDS.forEach((good) => {
      const state = this.goods[good];
      state.history.push({ day, price: this.priceOf(good) });
      if (state.history.length > HISTORY_LIMIT) state.history.shift();
      state.stock = Math.max(0, state.stock * (1 - CONFIG[good].absorption));
      if (state.stock < 0.05) state.stock = 0;
    });
  }

  /** +1 subindo, -1 caindo, 0 estavel, comparado com `daysBack` dias atras. */
  trendOf(good: GoodId, daysBack = 3): number {
    const history = this.goods[good].history;
    if (history.length < 2) return 0;
    const recent = history[history.length - 1].price;
    const older = history[Math.max(0, history.length - 1 - daysBack)].price;
    if (recent > older) return 1;
    if (recent < older) return -1;
    return 0;
  }

  /** Quao saturado o mercado esta, de 0 a 1+. Usado pela camada pedagogica. */
  saturationOf(good: GoodId): number {
    return this.goods[good].stock / CONFIG[good].saturation;
  }

  snapshot(): MarketGoodSnapshot[] {
    return GOOD_IDS.map((good) => ({
      id: good,
      label: CONFIG[good].label,
      price: this.priceOf(good),
      trend: this.trendOf(good),
      saturation: Number(this.saturationOf(good).toFixed(3)),
      history: [...this.goods[good].history],
    }));
  }

  load(state?: Partial<MarketSaveState>): void {
    if (!state?.goods) return;
    GOOD_IDS.forEach((good) => {
      const saved = state.goods?.[good];
      if (!saved) return;
      this.goods[good].stock = saved.stock ?? 0;
      this.goods[good].history = Array.isArray(saved.history) ? saved.history : [];
    });
  }

  serialize(): MarketSaveState {
    return {
      goods: Object.fromEntries(
        GOOD_IDS.map((good) => [good, { ...this.goods[good], history: [...this.goods[good].history] }]),
      ),
    };
  }
}
