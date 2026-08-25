import { describe, expect, it } from 'vitest';
import {
  DEBT_DAILY_INTEREST,
  EconomySystem,
  HOUSEHOLD_BASE_COST,
} from './EconomySystem';
import { InflationSystem } from './InflationSystem';
import { MarketSystem } from './MarketSystem';
import { PedagogySystem } from './PedagogySystem';

describe('MarketSystem — oferta e procura', () => {
  it('começa no valor base', () => {
    expect(new MarketSystem().priceOf('wheat')).toBe(10);
  });

  it('derruba o preço quando o jogador despeja muita mercadoria', () => {
    const market = new MarketSystem();
    const antes = market.priceOf('wheat');
    market.recordSale('wheat', 30);
    expect(market.priceOf('wheat')).toBeLessThan(antes);
  });

  it('nunca deixa o preço chegar a zero', () => {
    const market = new MarketSystem();
    market.recordSale('wheat', 100000);
    expect(market.priceOf('wheat')).toBeGreaterThanOrEqual(1);
  });

  it('recupera o preço conforme o mercado absorve o estoque', () => {
    const market = new MarketSystem();
    market.recordSale('wheat', 30);
    const deprimido = market.priceOf('wheat');
    for (let day = 1; day <= 12; day += 1) market.advanceDay(day);
    expect(market.priceOf('wheat')).toBeGreaterThan(deprimido);
  });

  it('pune despejar tudo de uma vez já no momento da venda', () => {
    const market = new MarketSystem();
    const venda = market.sell('wheat', 24);
    expect(venda.averagePrice).toBeLessThan(venda.priceBefore);
    expect(venda.priceAfter).toBeLessThan(venda.priceBefore);
  });

  it('vender aos poucos rende mais que despejar tudo de uma vez', () => {
    const golpe = new MarketSystem();
    const receitaGolpe = golpe.sell('wheat', 24).totalEarned;

    const gradual = new MarketSystem();
    let receitaGradual = 0;
    for (let i = 0; i < 4; i += 1) {
      receitaGradual += gradual.sell('wheat', 6).totalEarned;
      for (let d = 0; d < 5; d += 1) gradual.advanceDay(i * 5 + d);
    }
    expect(receitaGradual).toBeGreaterThan(receitaGolpe);
  });

  it('registra no histórico a queda que o jogador provocou', () => {
    const market = new MarketSystem();
    for (let day = 1; day <= 4; day += 1) market.advanceDay(day);
    market.sell('wheat', 30);
    market.advanceDay(5);
    const history = market.snapshot()[0].history;
    expect(history.length).toBe(5);
    expect(history[4].price).toBeLessThan(history[3].price);
    expect(market.trendOf('wheat')).toBe(-1);
  });

  it('mostra tendência de alta enquanto o mercado se recupera', () => {
    const market = new MarketSystem();
    market.sell('wheat', 30);
    for (let day = 1; day <= 4; day += 1) market.advanceDay(day);
    expect(market.trendOf('wheat')).toBe(1);
  });

  it('recupera totalmente o preço base em cerca de uma semana', () => {
    const market = new MarketSystem();
    const base = market.priceOf('wheat');
    market.sell('wheat', 30);
    for (let day = 1; day <= 7; day += 1) market.advanceDay(day);
    expect(market.priceOf('wheat')).toBe(base);
  });

  it('sobrevive a ida e volta da serialização', () => {
    const a = new MarketSystem();
    a.recordSale('wheat', 12);
    a.advanceDay(1);
    const b = new MarketSystem();
    b.load(a.serialize());
    expect(b.priceOf('wheat')).toBe(a.priceOf('wheat'));
  });
});

describe('InflationSystem', () => {
  it('encarece os custos com o tempo', () => {
    const inflation = new InflationSystem();
    for (let d = 0; d < 30; d += 1) inflation.advanceDay();
    expect(inflation.nominal(HOUSEHOLD_BASE_COST)).toBeGreaterThan(HOUSEHOLD_BASE_COST);
  });

  it('mostra que mais moedas não é mais riqueza', () => {
    const inflation = new InflationSystem();
    for (let d = 0; d < 60; d += 1) inflation.advanceDay();
    // dobrou o dinheiro nominal, mas os precos tambem subiram
    expect(inflation.real(200)).toBeLessThan(200);
    expect(inflation.accumulatedPercent).toBeGreaterThan(0);
  });

  it('compõe, não soma', () => {
    const inflation = new InflationSystem();
    for (let d = 0; d < 100; d += 1) inflation.advanceDay();
    expect(inflation.index).toBeGreaterThan(100 + 100 * inflation.dailyRate * 100 * 0.9);
  });
});

describe('EconomySystem — dívida e juros', () => {
  it('faz a dívida crescer sozinha se ignorada', () => {
    const economy = new EconomySystem();
    const inicial = economy.economy.debt;
    for (let d = 0; d < 10; d += 1) economy.accrueInterest();
    expect(economy.economy.debt).toBeGreaterThan(inicial);
    expect(economy.economy.interestPaidTotal).toBeGreaterThan(0);
  });

  it('cobra juros compostos, não simples', () => {
    const economy = new EconomySystem();
    const inicial = economy.economy.debt;
    for (let d = 0; d < 40; d += 1) economy.accrueInterest();
    const simples = inicial * (1 + DEBT_DAILY_INTEREST * 40);
    expect(economy.economy.debt).toBeGreaterThan(simples);
  });

  it('abater cedo custa menos que abater tarde', () => {
    const cedo = new EconomySystem();
    cedo.economy.coins = 100;
    cedo.repayDebt(100);
    for (let d = 0; d < 20; d += 1) cedo.accrueInterest();

    const tarde = new EconomySystem();
    tarde.economy.coins = 100;
    for (let d = 0; d < 20; d += 1) tarde.accrueInterest();
    tarde.repayDebt(100);

    expect(cedo.economy.debt).toBeLessThan(tarde.economy.debt);
  });

  it('não paga além do caixa nem além da dívida', () => {
    const economy = new EconomySystem();
    economy.economy.coins = 10;
    expect(economy.repayDebt(999)).toBe(10);
    economy.economy.coins = 9999;
    economy.repayDebt(9999);
    expect(economy.economy.debt).toBe(0);
  });

  it('converte falta de caixa em dívida', () => {
    const economy = new EconomySystem();
    economy.economy.coins = 3;
    const r = economy.payDailyCost(8);
    expect(r.addedDebt).toBe(5);
    expect(economy.economy.coins).toBe(0);
  });

  it('separa o dia contábil ao virar o dia', () => {
    const economy = new EconomySystem();
    economy.addWheat(10);
    economy.applySale(10, 30, 3);
    economy.rollOverDay();
    expect(economy.economy.lastDayRevenue).toBe(30);
    expect(economy.economy.todayRevenue).toBe(0);
  });
});

describe('PedagogySystem', () => {
  it('explica a queda de preço logo depois da venda', () => {
    const licao = new PedagogySystem().onSale(0.9, 30, 3, 1);
    expect(licao?.concept).toBe('supply-demand');
  });

  it('nunca repete a mesma lição', () => {
    const p = new PedagogySystem();
    expect(p.onSale(0.9, 30, 3, 1)).not.toBeNull();
    expect(p.onSale(0.9, 30, 3, 1)).toBeNull();
  });

  it('não dispara lição sem gatilho real', () => {
    expect(new PedagogySystem().onInflation(2)).toBeNull();
    expect(new PedagogySystem().onInterest(0, 0, 0)).toBeNull();
  });

  it('lembra o que já foi mostrado após recarregar', () => {
    const a = new PedagogySystem();
    a.onSale(0.9, 30, 3, 1);
    const b = new PedagogySystem();
    b.load(a.serialize());
    expect(b.onSale(0.9, 30, 3, 1)).toBeNull();
  });
});
