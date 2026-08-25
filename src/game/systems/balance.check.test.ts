import { describe, expect, it } from 'vitest';
import { EconomySystem, HOUSEHOLD_BASE_COST, SEED_BASE_COST, WHEAT_HARVEST_YIELD } from './EconomySystem';
import { InflationSystem } from './InflationSystem';
import { MarketSystem } from './MarketSystem';

function simulate(strategy: 'dump' | 'gradual' | 'repay', days = 30) {
  const eco = new EconomySystem();
  const mkt = new MarketSystem();
  const inf = new InflationSystem();
  const log: string[] = [];

  for (let day = 1; day <= days; day += 1) {
    // 2 campos, cada um rende WHEAT_HARVEST_YIELD por ciclo de ~2 dias
    const seedCost = Math.max(1, Math.round(inf.nominal(SEED_BASE_COST)));
    for (let i = 0; i < 2; i += 1) if (eco.buySeed(seedCost)) eco.useSeed();
    eco.addWheat(WHEAT_HARVEST_YIELD * 2);

    const vender = strategy === 'dump' ? day % 6 === 0 : true;
    if (vender && eco.inventory.wheat > 0) {
      const r = mkt.sell('wheat', eco.inventory.wheat);
      eco.applySale(r.quantity, r.totalEarned, Math.round(r.averagePrice));
    }
    if (strategy === 'repay' && eco.economy.coins > 60) eco.repayDebt(40);

    inf.advanceDay();
    mkt.setPriceIndex(inf.index);
    eco.accrueInterest();
    eco.payDailyCost(Math.max(1, Math.round(inf.nominal(HOUSEHOLD_BASE_COST))));
    mkt.advanceDay(day);
    if (day % 10 === 0) {
      log.push(`d${day}: moedas=${eco.economy.coins} dívida=${eco.economy.debt} preço=${mkt.priceOf('wheat')}`);
    }
    eco.rollOverDay();
  }
  return { eco, mkt, inf, log };
}

describe('balanceamento — a partida é vencível?', () => {
  it('vender em mercado saturado rende menos que em mercado vazio', () => {
    const vazio = new MarketSystem();
    const cheio = new MarketSystem();
    cheio.recordSale('wheat', 40);
    expect(cheio.sell('wheat', 10).totalEarned).toBeLessThan(vazio.sell('wheat', 10).totalEarned);
  });

  it('a fazenda é vencível: dá para terminar 30 dias no azul', () => {
    const g = simulate('gradual');
    console.log('  gradual:', g.log.join(' | '));
    console.log('  dump   :', simulate('dump').log.join(' | '));
    expect(g.eco.economy.coins).toBeGreaterThan(0);
    expect(g.eco.economy.debt).toBeLessThan(400 * 1.5);
  });

  it('quem abate a dívida termina com ela menor que no começo', () => {
    const r = simulate('repay');
    expect(r.eco.economy.debt).toBeLessThan(400);
  });

  it('abater a dívida cedo termina melhor que ignorá-la', () => {
    const r = simulate('repay');
    const g = simulate('gradual');
    console.log('  com abatimento:', r.log.join(' | '));
    console.log('  juros pagos — com abatimento:', r.eco.economy.interestPaidTotal,
                '| sem:', g.eco.economy.interestPaidTotal);
    expect(r.eco.economy.debt).toBeLessThan(g.eco.economy.debt);
    expect(r.eco.economy.interestPaidTotal).toBeLessThan(g.eco.economy.interestPaidTotal);
  });

  it('a inflação é perceptível mas não esmagadora em 30 dias', () => {
    const { inf } = simulate('gradual');
    console.log('  inflação acumulada em 30 dias:', inf.accumulatedPercent.toFixed(1) + '%');
    expect(inf.accumulatedPercent).toBeGreaterThan(15);
    expect(inf.accumulatedPercent).toBeLessThan(80);
  });
});
