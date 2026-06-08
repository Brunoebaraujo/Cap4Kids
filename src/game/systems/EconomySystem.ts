import type { Economy, Inventory } from '../types';

export class EconomySystem {
  readonly economy: Economy = {
    coins: 40,
    debt: 250,
    dailyHouseholdCost: 8,
  };

  readonly inventory: Inventory = {
    seeds: 4,
    wheat: 0,
    milk: 0,
  };

  useSeed() {
    if (this.inventory.seeds <= 0) {
      return false;
    }

    this.inventory.seeds -= 1;
    return true;
  }

  addWheat(amount: number) {
    this.inventory.wheat += amount;
  }

  addMilk(amount: number) {
    this.inventory.milk += amount;
  }
}
