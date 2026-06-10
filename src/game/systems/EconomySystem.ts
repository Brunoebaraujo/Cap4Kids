import type { Economy, Inventory, SaleSummary } from '../types';

export const WHEAT_SEED_COST = 2;
export const WHEAT_PRICE = 3;
export const WHEAT_HARVEST_YIELD = 4;

export interface EconomySaveState {
  economy: Economy;
  inventory: Inventory;
  lastSale: SaleSummary | null;
}

export class EconomySystem {
  readonly economy: Economy = {
    coins: 40,
    debt: 250,
    dailyHouseholdCost: 8,
    profitLoss: 0,
  };

  readonly inventory: Inventory = {
    seeds: 0,
    wheat: 0,
    milk: 0,
  };

  lastSale: SaleSummary | null = null;

  buySeed() {
    if (this.economy.coins < WHEAT_SEED_COST) return false;

    this.economy.coins -= WHEAT_SEED_COST;
    this.economy.profitLoss -= WHEAT_SEED_COST;
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

  sellAllWheat() {
    if (this.inventory.wheat <= 0) {
      this.lastSale = { quantity: 0, unitPrice: WHEAT_PRICE, totalEarned: 0 };
      return this.lastSale;
    }

    const quantity = this.inventory.wheat;
    const totalEarned = quantity * WHEAT_PRICE;
    this.inventory.wheat = 0;
    this.economy.coins += totalEarned;
    this.economy.profitLoss += totalEarned;
    this.lastSale = { quantity, unitPrice: WHEAT_PRICE, totalEarned };
    return this.lastSale;
  }

  payDailyCost() {
    const cost = this.economy.dailyHouseholdCost;
    this.economy.profitLoss -= cost;

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
