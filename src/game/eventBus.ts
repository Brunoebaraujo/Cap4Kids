import Phaser from 'phaser';
import type { GameEvents } from './types';

export const gameEvents = new Phaser.Events.EventEmitter();

export function emitGameEvent<K extends keyof GameEvents>(event: K, payload: GameEvents[K]) {
  gameEvents.emit(event, payload);
}
