import { cropById } from '../data/crops';
import type { AdminEventType, CropId, Economy, Inventory, RivalSnapshot, WorldEvent } from '../types';

export class EconomySystem {
  readonly economy: Economy = {
    coins: 40, debt: 250, dailyHouseholdCost: 8, inflationRate: 0.02,
    wheatPrice: 10, milkPrice: 9, wealthCreated: 0, day: 1,
  };
  readonly inventory: Inventory = { seeds: { wheat: 4, rice: 0, tomato: 0, banana: 0 }, wheat: 0, rice: 0, tomato: 0, banana: 0, milk: 0 };
  readonly rivals: RivalSnapshot[] = [
    { id: 'olive', name: 'Fazenda Oliveira', coins: 52, marketShare: 34, price: 6, color: '#e38b4d' },
    { id: 'sun', name: 'Sítio do Sol', coins: 47, marketShare: 29, price: 7, color: '#f4cf55' },
  ];
  readonly events: WorldEvent[] = [];
  private nextEventId = 1;

  useSeed(crop: CropId = 'wheat') { if (this.inventory.seeds[crop] <= 0) return false; this.inventory.seeds[crop] -= 1; return true; }
  addCrop(crop: CropId, amount: number) { const definition = cropById(crop); this.inventory[crop] += amount; this.economy.wealthCreated += amount * definition.saleValueUsd; }
  addWheat(amount: number) { this.addCrop('wheat', amount); }
  addMilk(amount: number) { this.inventory.milk += amount; this.economy.wealthCreated += amount * this.economy.milkPrice; }
  buySeeds(crop: CropId = 'wheat') {
    const definition = cropById(crop);
    const price = Math.ceil(definition.seedPrice * (1 + this.economy.inflationRate) ** Math.max(0, this.economy.day - 1));
    if (this.economy.coins < price) return 'Você precisa de ' + price + ' moedas para comprar sementes de ' + definition.label + '.';
    this.economy.coins -= price; this.inventory.seeds[crop] += 1;
    return '1 pacote de sementes de ' + definition.label + ' comprado por ' + price + ' moedas.';
  }
  sell(product: CropId | 'milk') {
    const amount = this.inventory[product];
    if (!amount) return 'Você não tem estoque de ' + product + ' para vender.';
    const price = product === 'milk' ? this.economy.milkPrice : cropById(product).saleValueUsd;
    const revenue = amount * price; this.inventory[product] = 0; this.economy.coins += revenue;
    return 'Venda concluída: ' + amount + ' unidade(s), receita de ' + revenue + ' moedas.';
  }
  nextDay() {
    this.economy.day += 1;
    this.economy.coins -= this.economy.dailyHouseholdCost;
    this.rivals.forEach((rival, index) => { rival.coins += 4 + index * 2; rival.price = Math.max(3, rival.price + (Math.random() > .55 ? 1 : -1)); });
    const cheapest = Math.min(this.economy.wheatPrice, ...this.rivals.map((r) => r.price));
    this.rivals.forEach((r) => { r.marketShare = Math.max(12, r.marketShare + (r.price === cheapest ? 2 : -1)); });
    this.reprice();
    return 'Dia ' + this.economy.day + ': custos pagos e concorrentes ajustaram seus preços.';
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
    return title + ': ' + description;
  }
  private reprice() { const multiplier = 1 + this.economy.inflationRate; this.economy.wheatPrice = Math.max(2, Math.round(10 * multiplier ** (this.economy.day / 4))); this.economy.milkPrice = Math.max(3, Math.round(9 * multiplier ** (this.economy.day / 4))); }
}
