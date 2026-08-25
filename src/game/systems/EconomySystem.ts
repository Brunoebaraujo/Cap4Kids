import type { Economy, Inventory, SaleSummary } from '../types';

export const WHEAT_HARVEST_YIELD = 5;

/** Valor de tabela da semente antes da inflacao. */
export const SEED_BASE_COST = 6;
/** Despesa diaria da casa antes da inflacao. */
export const HOUSEHOLD_BASE_COST = 22;
/** Juros compostos diarios sobre a divida. */
export const DEBT_DAILY_INTEREST = 0.008;

export interface EconomySaveState {
  economy: Economy;
  inventory: Inventory;
  lastSale: SaleSummary | null;
}

export class EconomySystem {
  readonly economy: Economy = {
    coins: 120,
    debt: 400,
    dailyHouseholdCost: HOUSEHOLD_BASE_COST,
    profitLoss: 0,
    todayRevenue: 0,
    todayExpenses: 0,
    lastDayRevenue: 0,
    lastDayExpenses: 0,
    interestPaidTotal: 0,
  };

  readonly inventory: Inventory = { seeds: 0, wheat: 0, milk: 0 };

  lastSale: SaleSummary | null = null;

  private spend(amount: number): void {
    this.economy.coins -= amount;
    this.economy.profitLoss -= amount;
    this.economy.todayExpenses += amount;
  }

  private earn(amount: number): void {
    this.economy.coins += amount;
    this.economy.profitLoss += amount;
    this.economy.todayRevenue += amount;
  }

  /** Compra uma semente pelo preco corrente (ja corrigido pela inflacao). */
  buySeed(unitCost: number) {
    if (this.economy.coins < unitCost) return false;
    this.spend(unitCost);
    this.inventory.seeds += 1;
    return true;
  }

  useSeed() {
    if (this.inventory.seeds <= 0) return false;
    this.inventory.seeds -= 1;
    return true;
  }

  addWheat(amount: number) {
    this.inventory.wheat += amount;
  }

  addMilk(amount: number) {
    this.inventory.milk += amount;
  }

  /** Aplica uma venda ja apurada pelo mercado (precificacao marginal). */
  applySale(quantity: number, totalEarned: number, unitPrice: number) {
    if (quantity <= 0) {
      this.lastSale = { quantity: 0, unitPrice, totalEarned: 0 };
      return this.lastSale;
    }
    this.inventory.wheat = Math.max(0, this.inventory.wheat - quantity);
    this.earn(totalEarned);
    this.lastSale = { quantity, unitPrice, totalEarned };
    return this.lastSale;
  }

  /** Abate parte da divida com as moedas em caixa. */
  repayDebt(amount: number) {
    const payable = Math.min(amount, this.economy.coins, this.economy.debt);
    if (payable <= 0) return 0;
    this.economy.coins -= payable;
    this.economy.debt -= payable;
    this.economy.todayExpenses += payable;
    return payable;
  }

  /** Juros compostos. Quanto mais a divida fica parada, mais ela cresce. */
  accrueInterest() {
    if (this.economy.debt <= 0) return 0;
    const interest = Math.round(this.economy.debt * DEBT_DAILY_INTEREST);
    if (interest <= 0) return 0;
    this.economy.debt += interest;
    this.economy.interestPaidTotal += interest;
    this.economy.profitLoss -= interest;
    this.economy.todayExpenses += interest;
    return interest;
  }

  /** Paga a despesa da casa pelo custo corrente. O que faltar vira divida. */
  payDailyCost(cost: number) {
    this.economy.dailyHouseholdCost = cost;
    this.economy.profitLoss -= cost;
    this.economy.todayExpenses += cost;

    if (this.economy.coins >= cost) {
      this.economy.coins -= cost;
      return { paid: cost, addedDebt: 0 };
    }
    const paid = this.economy.coins;
    const addedDebt = cost - paid;
    this.economy.coins = 0;
    this.economy.debt += addedDebt;
    return { paid, addedDebt };
  }

  /** Fecha o dia contabil e zera os acumuladores. */
  rollOverDay() {
    this.economy.lastDayRevenue = this.economy.todayRevenue;
    this.economy.lastDayExpenses = this.economy.todayExpenses;
    this.economy.todayRevenue = 0;
    this.economy.todayExpenses = 0;
  }

  load(state?: Partial<EconomySaveState>) {
    if (!state) return;
    if (state.economy) Object.assign(this.economy, state.economy);
    if (state.inventory) Object.assign(this.inventory, state.inventory);
    this.lastSale = state.lastSale ?? null;
  }

  serialize(): EconomySaveState {
    return {
      economy: { ...this.economy },
      inventory: { ...this.inventory },
      lastSale: this.lastSale ? { ...this.lastSale } : null,
    };
  }
}
