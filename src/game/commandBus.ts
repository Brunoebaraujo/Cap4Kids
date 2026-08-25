import Phaser from 'phaser';
import type { GameSnapshot, TaskType } from './types';

/**
 * Barramento de comandos React -> Phaser e de estado Phaser -> React.
 *
 * Substitui o antigo `dispatchKey`, que sintetizava KeyboardEvent no window
 * para o Phaser reinterpretar. Aquilo acoplava a UI ao mapa de teclas e nao
 * escalava para um painel de comando com dezenas de acoes.
 */

export type Command =
  | { type: 'queueTask'; task: TaskType }
  | { type: 'buySeed' }
  | { type: 'sellWheat' }
  | { type: 'repayDebt'; amount: number }
  | { type: 'setSpeed'; speed: number }
  | { type: 'cancelQueue' }
  | { type: 'selectTile'; tileX: number; tileY: number }
  | { type: 'centerOnWorker' }
  | { type: 'setCameraMode'; mode: 'free' | 'followMaya' };

export type Notice = { text: string; tone: 'info' | 'good' | 'bad' };

const emitter = new Phaser.Events.EventEmitter();

export const COMMAND = 'command';
export const STATE = 'state';
export const NOTICE = 'notice';

/** React chama isto. */
export function sendCommand(command: Command): void {
  emitter.emit(COMMAND, command);
}

/** A cena chama isto. */
export function publishState(snapshot: GameSnapshot): void {
  emitter.emit(STATE, snapshot);
}

export function publishNotice(text: string, tone: Notice['tone'] = 'info'): void {
  emitter.emit(NOTICE, { text, tone });
}

export function onCommand(handler: (command: Command) => void): () => void {
  emitter.on(COMMAND, handler);
  return () => emitter.off(COMMAND, handler);
}

export function onState(handler: (snapshot: GameSnapshot) => void): () => void {
  emitter.on(STATE, handler);
  return () => emitter.off(STATE, handler);
}

export function onNotice(handler: (notice: Notice) => void): () => void {
  emitter.on(NOTICE, handler);
  return () => emitter.off(NOTICE, handler);
}
