import { describe, expect, it } from 'vitest';
import { FieldSystem } from './FieldSystem';
import { TASK_WORK_COST, TECH_TIERS, TechnologySystem } from './TechnologySystem';

describe('TechnologySystem — investir em eficiência', () => {
  it('começa no manual com capacidade baixa', () => {
    const tech = new TechnologySystem();
    expect(tech.tier.id).toBe('manual');
    expect(tech.capacity).toBe(4);
  });

  it('INVARIANTE: toda tarefa é executável já no nível inicial', () => {
    const tech = new TechnologySystem();
    Object.keys(TASK_WORK_COST).forEach((task) => {
      expect(tech.canAfford(task)).toBe(true);
    });
  });

  it('no manual um ciclo completo de campo leva dois dias', () => {
    const tech = new TechnologySystem();
    expect(TechnologySystem.fullCycleCost).toBeGreaterThan(tech.capacity);
    expect(TechnologySystem.fullCycleCost).toBeLessThanOrEqual(tech.capacity * 2);
  });

  it('recusa trabalho além da capacidade do dia', () => {
    const tech = new TechnologySystem();
    expect(tech.spend('Prepare Soil')).toBe(true);
    expect(tech.spend('Plant Wheat')).toBe(true);
    expect(tech.spend('Prepare Soil')).toBe(false);
    expect(tech.workRemaining).toBe(0);
  });

  it('devolve a capacidade na virada do dia', () => {
    const tech = new TechnologySystem();
    tech.spend('Plant Wheat');
    tech.resetDay();
    expect(tech.workRemaining).toBe(tech.capacity);
  });

  it('cada nível aumenta a capacidade', () => {
    for (let i = 1; i < TECH_TIERS.length; i += 1) {
      expect(TECH_TIERS[i].capacity).toBeGreaterThan(TECH_TIERS[i - 1].capacity);
      expect(TECH_TIERS[i].upgradeCost).toBeGreaterThan(TECH_TIERS[i - 1].upgradeCost);
    }
  });

  it('mecanização gira mais de dois campos por dia', () => {
    const tech = new TechnologySystem();
    for (let i = 0; i < TECH_TIERS.length - 1; i += 1) tech.upgrade();
    expect(tech.capacity).toBeGreaterThanOrEqual(TechnologySystem.fullCycleCost * 2);
  });

  it('cada nível reduz os dias necessários por ciclo de campo', () => {
    const dias = TECH_TIERS.map((t) => Math.ceil(TechnologySystem.fullCycleCost / t.capacity));
    for (let i = 1; i < dias.length; i += 1) expect(dias[i]).toBeLessThanOrEqual(dias[i - 1]);
    expect(dias[0]).toBeGreaterThan(dias[dias.length - 1]);
  });

  it('calcula em quantos dias o investimento se paga', () => {
    const tech = new TechnologySystem();
    const payback = tech.paybackDays(100, 4);
    expect(payback).not.toBeNull();
    expect(payback!).toBeGreaterThan(0);
  });

  it('não promete payback quando a fazenda não dá lucro', () => {
    expect(new TechnologySystem().paybackDays(100, 0)).toBeNull();
  });

  it('o upgrade encarece com a inflação', () => {
    const tech = new TechnologySystem();
    expect(tech.upgradeCost(150)!).toBeGreaterThan(tech.upgradeCost(100)!);
  });

  it('para de oferecer upgrade no topo', () => {
    const tech = new TechnologySystem();
    for (let i = 0; i < TECH_TIERS.length - 1; i += 1) tech.upgrade();
    expect(tech.upgrade()).toBe(false);
    expect(tech.upgradeCost(100)).toBeNull();
  });

  it('sobrevive à ida e volta da serialização', () => {
    const a = new TechnologySystem();
    a.upgrade();
    a.spend('Plant Wheat');
    const b = new TechnologySystem();
    b.load(a.serialize());
    expect(b.tier.id).toBe(a.tier.id);
    expect(b.workRemaining).toBe(a.workRemaining);
  });
});

describe('terra e ferramenta como capitais complementares', () => {
  it('cada nível exige mais campos para não desperdiçar trabalho', () => {
    const necessarios = TECH_TIERS.map((t) =>
      Math.ceil((t.capacity * 4) / TechnologySystem.fullCycleCost));
    for (let i = 1; i < necessarios.length; i += 1) {
      expect(necessarios[i]).toBeGreaterThanOrEqual(necessarios[i - 1]);
    }
    expect(necessarios[necessarios.length - 1]).toBeGreaterThan(necessarios[0]);
  });

  it('a fazenda tem campos suficientes para o nível máximo', () => {
    const fields = new FieldSystem();
    const topo = TECH_TIERS[TECH_TIERS.length - 1];
    const necessarios = Math.ceil((topo.capacity * 4) / TechnologySystem.fullCycleCost);
    expect(fields.allFields.length).toBeGreaterThanOrEqual(necessarios);
  });

  it('só o primeiro campo vem liberado', () => {
    expect(new FieldSystem().unlockedCount).toBe(1);
  });

  it('a terra encarece a cada compra', () => {
    const fields = new FieldSystem();
    const custos: number[] = [];
    while (fields.nextLandCost !== null) {
      custos.push(fields.nextLandCost);
      fields.buyNextField();
    }
    for (let i = 1; i < custos.length; i += 1) {
      expect(custos[i]).toBeGreaterThan(custos[i - 1]);
    }
  });
});
