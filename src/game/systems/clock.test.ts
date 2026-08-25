import { describe, expect, it } from 'vitest';
import {
  DAYS_PER_SEASON,
  DAYS_PER_YEAR,
  GameClockSystem,
  MAX_CATCHUP_DAYS,
  calendarDaysBetween,
  localMidnight,
} from './GameClockSystem';
import { FieldSystem, GROWTH_STAGE_DAYS } from './FieldSystem';

const DIA = 86_400_000;
const meioDia = (offsetDias: number) =>
  new Date(2026, 7, 25, 12, 0, 0).getTime() + offsetDias * DIA;

describe('GameClockSystem — calendário real', () => {
  it('conta dias por virada de meia-noite, não por 24h corridas', () => {
    const noite = new Date(2026, 7, 25, 23, 50).getTime();
    const manhaSeguinte = new Date(2026, 7, 26, 0, 10).getTime();
    // 20 minutos depois, mas ja e outro dia
    expect(calendarDaysBetween(noite, manhaSeguinte)).toBe(1);
  });

  it('não conta dia dentro do mesmo dia de calendário', () => {
    const manha = new Date(2026, 7, 25, 8, 0).getTime();
    const noite = new Date(2026, 7, 25, 22, 0).getTime();
    expect(calendarDaysBetween(manha, noite)).toBe(0);
  });

  it('meia-noite local ignora a hora', () => {
    expect(localMidnight(meioDia(0))).toBe(new Date(2026, 7, 25).getTime());
  });

  it('nada a processar na mesma sessão', () => {
    const clock = new GameClockSystem();
    clock.startedAtMs = meioDia(0);
    const c = clock.pendingCatchUp(meioDia(0));
    expect(c.daysToProcess).toBe(0);
    expect(c.daysForgiven).toBe(0);
  });

  it('processa um dia quando a criança volta no dia seguinte', () => {
    const clock = new GameClockSystem();
    clock.startedAtMs = meioDia(0);
    const c = clock.pendingCatchUp(meioDia(1));
    expect(c.daysToProcess).toBe(1);
    clock.commitCatchUp(c);
    expect(clock.day).toBe(2);
  });

  it('perdoa ausência longa em vez de destruir a fazenda', () => {
    const clock = new GameClockSystem();
    clock.startedAtMs = meioDia(0);
    const c = clock.pendingCatchUp(meioDia(21));
    expect(c.daysToProcess).toBe(MAX_CATCHUP_DAYS);
    expect(c.daysForgiven).toBe(21 - MAX_CATCHUP_DAYS);
    clock.commitCatchUp(c);
    // o calendario segue em frente, mas os juros so incidiram sobre 5 dias
    expect(clock.day).toBe(22);
  });

  it('volta ao ritmo normal depois de uma ausência longa', () => {
    const clock = new GameClockSystem();
    clock.startedAtMs = meioDia(0);
    clock.commitCatchUp(clock.pendingCatchUp(meioDia(21)));
    const c = clock.pendingCatchUp(meioDia(22));
    expect(c.daysToProcess).toBe(1);
    expect(c.daysForgiven).toBe(0);
  });

  it('uma estação leva uma semana e o ano leva quatro', () => {
    expect(DAYS_PER_SEASON).toBe(7);
    expect(DAYS_PER_YEAR).toBe(28);
  });

  it('nomeia estação e ano a partir do dia', () => {
    const clock = new GameClockSystem();
    clock.day = 1;
    expect(clock.season).toBe('Primavera');
    expect(clock.year).toBe(1);
    clock.day = 8;
    expect(clock.season).toBe('Verão');
    clock.day = 29;
    expect(clock.season).toBe('Primavera');
    expect(clock.year).toBe(2);
  });

  it('marca o fechamento de estação no dia certo', () => {
    expect(GameClockSystem.closesSeason(7)).toBe(true);
    expect(GameClockSystem.closesSeason(14)).toBe(true);
    expect(GameClockSystem.closesSeason(8)).toBe(false);
  });
});

describe('lavoura no ritmo de dias reais', () => {
  it('leva quatro dias para ficar pronta', () => {
    const fields = new FieldSystem();
    fields.prepare(15, 16);
    fields.plant(15, 16);
    for (let d = 0; d < 3; d += 1) fields.updateGrowth(1);
    expect(fields.snapshots[0].state).not.toBe('Ready To Harvest');
    fields.updateGrowth(1);
    expect(fields.snapshots[0].state).toBe('Ready To Harvest');
  });

  it('um ciclo de lavoura cabe dentro de uma estação', () => {
    expect(GROWTH_STAGE_DAYS * 4).toBeLessThan(DAYS_PER_SEASON);
  });
});
