import type { GameClockSnapshot, Season } from '../types';

/**
 * Relogio de CALENDARIO REAL.
 *
 * Um dia de jogo = um dia de calendario real. O dia NAO avanca enquanto a
 * crianca joga: ela entra, ve o resultado de ontem, decide, e sai. A virada
 * acontece na meia-noite local, que e o que faz "volte amanha" significar
 * literalmente amanha — e nao "24h depois da primeira vez que voce abriu".
 *
 * Uma estacao leva 7 dias reais (uma semana). O ano tem 28 dias reais (~um mes).
 */

export const DAYS_PER_SEASON = 7;
export const SEASONS_PER_YEAR = 4;
export const DAYS_PER_YEAR = DAYS_PER_SEASON * SEASONS_PER_YEAR;

/**
 * Teto de dias processados de uma vez. Uma crianca que some por tres semanas
 * nao pode voltar e encontrar a fazenda destruida por juros compostos — isso
 * ensina que o jogo pune, nao economia.
 */
export const MAX_CATCHUP_DAYS = 5;

export const SEASONS: Season[] = ['Primavera', 'Verão', 'Outono', 'Inverno'];

/** Meia-noite local do dia do timestamp, em ms. */
export function localMidnight(timestampMs: number): number {
  const d = new Date(timestampMs);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function calendarDaysBetween(startMs: number, nowMs: number): number {
  const ms = localMidnight(nowMs) - localMidnight(startMs);
  return Math.max(0, Math.round(ms / 86_400_000));
}

export interface CatchUp {
  /** Dias que serao efetivamente simulados. */
  daysToProcess: number;
  /** Dias que passaram mas foram perdoados pelo teto de ausencia. */
  daysForgiven: number;
}

export class GameClockSystem {
  /** Timestamp em que o dia 1 comecou. */
  startedAtMs = Date.now();
  /** Ultimo dia de jogo ja processado. */
  day = 1;

  /**
   * Compara o calendario com o ultimo dia processado e diz quantos dias
   * precisam ser simulados agora.
   */
  pendingCatchUp(nowMs = Date.now()): CatchUp {
    const calendarDay = calendarDaysBetween(this.startedAtMs, nowMs) + 1;
    const pending = Math.max(0, calendarDay - this.day);
    return {
      daysToProcess: Math.min(pending, MAX_CATCHUP_DAYS),
      daysForgiven: Math.max(0, pending - MAX_CATCHUP_DAYS),
    };
  }

  /** Avanca o contador apos a simulacao dos dias pendentes. */
  commitCatchUp(catchUp: CatchUp): void {
    this.day += catchUp.daysToProcess + catchUp.daysForgiven;
  }

  /** Milissegundos ate a proxima virada de dia. */
  msUntilNextDay(nowMs = Date.now()): number {
    return localMidnight(nowMs) + 86_400_000 - nowMs;
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

  get year(): number {
    return Math.floor((this.day - 1) / DAYS_PER_YEAR) + 1;
  }

  get dayOfYear(): number {
    return ((this.day - 1) % DAYS_PER_YEAR) + 1;
  }

  /** Verdadeiro se o dia informado fecha uma estacao. */
  static closesSeason(day: number): boolean {
    return day % DAYS_PER_SEASON === 0;
  }

  load(state?: { startedAtMs?: number; day?: number }) {
    if (!state) return;
    this.startedAtMs = state.startedAtMs ?? this.startedAtMs;
    this.day = state.day ?? this.day;
  }

  serialize() {
    return { startedAtMs: this.startedAtMs, day: this.day };
  }

  get snapshot(): GameClockSnapshot {
    return {
      day: this.day,
      season: this.season,
      seasonNumber: this.seasonNumber,
      dayOfSeason: this.dayOfSeason,
      daysPerSeason: DAYS_PER_SEASON,
      year: this.year,
      dayOfYear: this.dayOfYear,
      daysPerYear: DAYS_PER_YEAR,
      msUntilNextDay: this.msUntilNextDay(),
    };
  }
}
