import type { GameClockSnapshot } from '../types';

const DAY_LENGTH_SECONDS = 180;
const MINUTES_PER_DAY = 24 * 60;

export class GameClockSystem {
  day = 1;
  minuteOfDay = 6 * 60;
  dailyCostCountdownSeconds = DAY_LENGTH_SECONDS;
  isRunning = true;

  update(deltaSeconds: number) {
    const previousDay = this.day;
    const dayProgress = deltaSeconds / DAY_LENGTH_SECONDS;
    this.minuteOfDay += dayProgress * MINUTES_PER_DAY;
    this.dailyCostCountdownSeconds -= deltaSeconds;

    let daysElapsed = 0;
    while (this.minuteOfDay >= MINUTES_PER_DAY) {
      this.minuteOfDay -= MINUTES_PER_DAY;
      this.day += 1;
      daysElapsed += 1;
    }

    while (this.dailyCostCountdownSeconds <= 0) {
      this.dailyCostCountdownSeconds += DAY_LENGTH_SECONDS;
      if (daysElapsed === 0) daysElapsed += 1;
    }

    return this.day !== previousDay || daysElapsed > 0 ? daysElapsed : 0;
  }

  setRunning(isRunning: boolean) {
    const changed = this.isRunning !== isRunning;
    this.isRunning = isRunning;
    return changed;
  }

  load(state?: Partial<GameClockSnapshot>) {
    if (!state) return;
    this.day = state.day ?? this.day;
    this.minuteOfDay = state.minuteOfDay ?? this.minuteOfDay;
    this.dailyCostCountdownSeconds = state.dailyCostCountdownSeconds ?? this.dailyCostCountdownSeconds;
    this.isRunning = state.isRunning ?? this.isRunning;
  }

  get snapshot(): GameClockSnapshot {
    return {
      day: this.day,
      minuteOfDay: Math.floor(this.minuteOfDay),
      dailyCostCountdownSeconds: Math.ceil(this.dailyCostCountdownSeconds),
      isRunning: this.isRunning,
    };
  }
}
