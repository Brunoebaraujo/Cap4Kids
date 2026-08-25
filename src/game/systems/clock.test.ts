import { describe, expect, it } from 'vitest';
import {
  DAYS_PER_SEASON,
  GameClockSystem,
  REAL_SECONDS_PER_DAY,
} from './GameClockSystem';
import { FieldSystem, GROWTH_STAGE_DAYS } from './FieldSystem';

function runSeconds(clock: GameClockSystem, seconds: number, step = 1 / 60) {
  let deltaDays = 0;
  let daysElapsed = 0;
  let seasons = 0;
  for (let t = 0; t < seconds; t += step) {
    const tick = clock.update(step);
    deltaDays += tick.deltaDays;
    daysElapsed += tick.daysElapsed;
    if (tick.seasonEnded) seasons += 1;
  }
  return { deltaDays, daysElapsed, seasons };
}

describe('GameClockSystem — ritmo', () => {
  it('um dia de jogo dura o tempo real configurado', () => {
    const clock = new GameClockSystem();
    const { daysElapsed } = runSeconds(clock, REAL_SECONDS_PER_DAY + 0.5);
    expect(daysElapsed).toBe(1);
  });

  it('velocidade multiplica o tempo sem distorcer proporções', () => {
    const normal = new GameClockSystem();
    const rapido = new GameClockSystem();
    rapido.setSpeed(3);
    const a = runSeconds(normal, 60);
    const b = runSeconds(rapido, 60);
    expect(b.deltaDays).toBeCloseTo(a.deltaDays * 3, 4);
  });

  it('pausar congela o tempo por completo', () => {
    const clock = new GameClockSystem();
    clock.setSpeed(0);
    const { deltaDays, daysElapsed } = runSeconds(clock, 300);
    expect(deltaDays).toBe(0);
    expect(daysElapsed).toBe(0);
  });

  it('fecha uma estação a cada intervalo configurado', () => {
    const clock = new GameClockSystem();
    clock.setSpeed(3);
    const { seasons } = runSeconds(clock, REAL_SECONDS_PER_DAY * DAYS_PER_SEASON / 3 + 1);
    expect(seasons).toBe(1);
    expect(clock.seasonNumber).toBe(2);
  });

  it('nomeia a estação a partir do dia', () => {
    const clock = new GameClockSystem();
    expect(clock.season).toBe('Primavera');
    clock.day = DAYS_PER_SEASON + 1;
    expect(clock.season).toBe('Verão');
    clock.day = DAYS_PER_SEASON * 4 + 1;
    expect(clock.season).toBe('Primavera');
  });

  it('mantém a hora dentro do dia', () => {
    const clock = new GameClockSystem();
    runSeconds(clock, REAL_SECONDS_PER_DAY * 2.5);
    expect(clock.minuteOfDay).toBeGreaterThanOrEqual(0);
    expect(clock.minuteOfDay).toBeLessThan(24 * 60);
  });
});

describe('ritmo não altera balanceamento', () => {
  it('a lavoura leva o mesmo número de DIAS em qualquer velocidade', () => {
    const medir = (speed: 1 | 2 | 3) => {
      const clock = new GameClockSystem();
      const fields = new FieldSystem();
      clock.setSpeed(speed);
      fields.prepare(15, 16);
      fields.plant(15, 16);
      let dias = 0;
      for (let t = 0; t < 600; t += 1 / 60) {
        const tick = clock.update(1 / 60);
        fields.updateGrowth(tick.deltaDays);
        dias += tick.deltaDays;
        if (fields.snapshots[0].state === 'Ready To Harvest') break;
      }
      return dias;
    };
    const [a, b, c] = [medir(1), medir(2), medir(3)];
    expect(b).toBeCloseTo(a, 1);
    expect(c).toBeCloseTo(a, 1);
    expect(a).toBeCloseTo(GROWTH_STAGE_DAYS * 4, 1);
  });

  it('a razão entre ciclo de lavoura e dia é a mesma de antes do refactor', () => {
    // antes: 72s de crescimento / 180s de dia = 0,4 dia por ciclo
    expect(GROWTH_STAGE_DAYS * 4).toBeCloseTo(0.4, 5);
  });
});
