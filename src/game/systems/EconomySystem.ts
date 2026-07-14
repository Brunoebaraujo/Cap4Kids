import type { AdminEventType, Economy, Inventory, RivalSnapshot, WorldEvent } from '../types';

export class EconomySystem {
  readonly economy: Economy = {
    coins: 40, debt: 250, dailyHouseholdCost: 8, inflationRate: 0.02,
    wheatPrice: 6, milkPrice: 9, wealthCreated: 0, day: 1,
  };
  readonly inventory: Inventory = { seeds: 4, wheat: 0, milk: 0 };
  readonly rivals: RivalSnapshot[] = [
    { id: 'olive', name: 'Fazenda Oliveira', coins: 52, marketShare: 34, price: 6, color: '#e38b4d' },
    { id: 'sun', name: 'Sítio do Sol', coins: 47, marketShare: 29, price: 7, color: '#f4cf55' },
  ];
  readonly events: WorldEvent[] = [];
  private nextEventId = 1;

  useSeed() { if (this.inventory.seeds <= 0) return false; this.inventory.seeds -= 1; return true; }
  addWheat(amount: number) { this.inventory.wheat += amount; this.economy.wealthCreated += amount * this.economy.wheatPrice; }
  addMilk(amount: number) { this.inventory.milk += amount; this.economy.wealthCreated += amount * this.economy.milkPrice; }
  buySeeds() {
    const price = Math.ceil(3 * (1 + this.economy.inflationRate) ** this.economy.day);
    if (this.economy.coins < price) return `Você precisa de ${price} moedas.`;
    this.economy.coins -= price; this.inventory.seeds += 2;
    return `2 sementes compradas por ${price} moedas.`;
  }
  sell(product: 'wheat' | 'milk') {
    const amount = this.inventory[product];
    if (!amount) return `Você não tem ${product === 'wheat' ? 'trigo' : 'leite'} para vender.`;
    const price = product === 'wheat' ? this.economy.wheatPrice : this.economy.milkPrice;
    const revenue = amount * price; this.inventory[product] = 0; this.economy.coins += revenue;
    return `Venda concluída: ${amount} unidade(s), receita de ${revenue} moedas.`;
  }
  nextDay() {
    this.economy.day += 1;
    this.economy.coins -= this.economy.dailyHouseholdCost;
    this.rivals.forEach((rival, index) => { rival.coins += 4 + index * 2; rival.price = Math.max(3, rival.price + (Math.random() > .55 ? 1 : -1)); });
    const cheapest = Math.min(this.economy.wheatPrice, ...this.rivals.map((r) => r.price));
    this.rivals.forEach((r) => { r.marketShare = Math.max(12, r.marketShare + (r.price === cheapest ? 2 : -1)); });
    this.reprice();
    return `Dia ${this.economy.day}: custos pagos e concorrentes ajustaram seus preços.`;
  }
  applyAdminEvent(type: AdminEventType) {
    const effects: Record<AdminEventType, [string, string, () => void]> = {
      drought: ['Seca severa', 'A colheita encolheu e o trigo ficou mais caro.', () => { this.inventory.wheat = Math.floor(this.inventory.wheat / 2); this.economy.wheatPrice += 4; }],
      rain: ['Chuva abundante', 'A produtividade aumentou: +2 trigo.', () => { this.inventory.wheat += 2; }],
      subsidy: ['Subsídio rural', 'O governo transferiu 15 moedas para cada fazenda.', () => { this.economy.coins += 15; this.rivals.forEach((r) => { r.coins += 15; }); }],
      inflation: ['Choque inflacionário', 'Custos e preços subiram rapidamente.', () => { this.economy.inflationRate += .08; this.economy.dailyHouseholdCost += 3; this.reprice(); }],
      locusts: ['Nuvem de gafanhotos', 'Metade do trigo armazenado foi perdida.', () => { this.inventory.wheat = Math.floor(this.inventory.wheat / 2); }],
    };
    const [title, description, effect] = effects[type]; effect();
    this.events.unshift({ id: this.nextEventId++, type, title, description, day: this.economy.day });
    return `${title}: ${description}`;
  }
  private reprice() {
    const multiplier = 1 + this.economy.inflationRate;
    this.economy.wheatPrice = Math.max(2, Math.round(6 * multiplier ** (this.economy.day / 4)));
    this.economy.milkPrice = Math.max(3, Math.round(9 * multiplier ** (this.economy.day / 4)));
  }
}
