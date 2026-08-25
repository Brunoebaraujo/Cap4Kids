import type { GameClockSnapshot, Season } from '../types';

/**
 * Autoridade unica de tempo.
 *
 * Toda a simulacao e expressa em DIAS DE JOGO. Este e o unico lugar que sabe
 * quantos segundos reais dura um dia. Antes, o crescimento da lavoura e a
 * duracao do dia eram constantes independentes em segundos reais, entao mudar
 * o ritmo quebrava o balanceamento economico. Agora nao.
 *
 * `speed` multiplica a passagem do tempo sem alterar nenhuma proporcao, entao
 * acelerar o jogo nunca muda o resultado economico de uma estrategia.
 */

export const REAL_SECONDS_PER_DAY = 60;
export const DAYS_PER_SEASON = 10;
export const MINUTES_PER_DAY = 24 * 60;

export const SEASONS: Season[] = ['Primavera', 'Verão', 'Outono', 'Inverno'];
export const SPEED_OPTIONS = [0, 1, 2, 3] as const;
export type SpeedOption = (typeof SPEED_OPTIONS)[number];

export interface ClockTick {
  /** Dias de jogo decorridos neste quadro, fracionario. */
  deltaDays: number;
  /** Quantos dias inteiros viraram neste quadro. */
  daysElapsed: number;
  /** Verdadeiro quando o ultimo dia virado fechou uma estacao. */
  seasonEnded: boolean;
}

export class GameClockSystem {
  day = 1;
  /** Progresso dentro do dia, de 0 a 1. */
  dayFraction = 0;
  speed: SpeedOption = 1;

  update(realDeltaSeconds: number): ClockTick {
    if (this.speed === 0) return { deltaDays: 0, daysElapsed: 0, seasonEnded: false };

    const deltaDays = (realDeltaSeconds * this.speed) / REAL_SECONDS_PER_DAY;
    this.dayFraction += deltaDays;

    let daysElapsed = 0;
    let seasonEnded = false;
    while (this.dayFraction >= 1) {
      this.dayFraction -= 1;
      this.day += 1;
      daysElapsed += 1;
      if ((this.day - 1) % DAYS_PER_SEASON === 0) seasonEnded = true;
    }

    return { deltaDays, daysElapsed, seasonEnded };
  }

  setSpeed(speed: SpeedOption): void {
    this.speed = speed;
  }

  togglePause(): void {
    this.speed = this.speed === 0 ? 1 : 0;
  }

  get season(): Season {
    return SEASONS[Math.floor((this.day - 1) / DAYS_PER_SEASON) % SEASONS.length];
  }

  get seasonNumber(): number {
    return Math.floor((this.day - 1) / DAYS_PER_SEASON) + 1;
  }

  get dayOfSeason(): number {
    return ((this.day - 1) % DAYS_PER_SEASON) + 1;
  }

  /** Minuto do dia, comecando as 6h para o dia util nao abrir de madrugada. */
  get minuteOfDay(): number {
    return Math.floor((6 * 60 + this.dayFraction * MINUTES_PER_DAY) % MINUTES_PER_DAY);
  }

  load(state?: Partial<GameClockSnapshot> & { dayFraction?: number; speed?: SpeedOption }) {
    if (!state) return;
    this.day = state.day ?? this.day;
    this.dayFraction = state.dayFraction ?? this.dayFraction;
    this.speed = state.speed ?? this.speed;
  }

  get snapshot(): GameClockSnapshot {
    return {
      day: this.day,
      dayFraction: Number(this.dayFraction.toFixed(4)),
      minuteOfDay: this.minuteOfDay,
      speed: this.speed,
      season: this.season,
      seasonNumber: this.seasonNumber,
      dayOfSeason: this.dayOfSeason,
      daysPerSeason: DAYS_PER_SEASON,
    };
  }
}
