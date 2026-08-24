import { useEffect, useMemo, useRef, useState } from 'react';
import mayaPortrait from './assets/characters/maya/portraits/maya-portrait.webp';
import { onNotice, onState, sendCommand, type Notice } from './game/commandBus';
import { createGame } from './game/createGame';
import { MAP_COLS, MAP_ROWS } from './game/scenes/IsoFarmScene';
import type { FieldState, GameSnapshot, TaskType } from './game/types';

const taskLabels: Record<TaskType, string> = {
  'Prepare Soil': 'Preparar solo',
  'Plant Wheat': 'Plantar trigo',
  'Harvest Wheat': 'Colher trigo',
  'Deliver To Shipping Bin': 'Entregar no silo',
};

const fieldLabels: Record<FieldState, string> = {
  Empty: 'Vazio',
  Prepared: 'Preparado',
  Planted: 'Plantado',
  'Growing Stage 1': 'Brotando',
  'Growing Stage 2': 'Crescendo',
  'Growing Stage 3': 'Quase pronto',
  'Ready To Harvest': 'Pronto para colher',
  Locked: 'Bloqueado',
};

const commands: Array<{ task: TaskType; hotkey: string; glyph: string }> = [
  { task: 'Prepare Soil', hotkey: '1', glyph: 'ᐱ' },
  { task: 'Plant Wheat', hotkey: '2', glyph: '•' },
  { task: 'Harvest Wheat', hotkey: '3', glyph: '∩' },
  { task: 'Deliver To Shipping Bin', hotkey: '4', glyph: '▤' },
];

const initialSnapshot: GameSnapshot = {
  economy: { coins: 40, debt: 250, dailyHouseholdCost: 8, profitLoss: 0 },
  inventory: { seeds: 0, wheat: 0, milk: 0 },
  currentTask: null,
  taskQueue: [],
  fields: [],
  cameraMode: 'free',
  clock: { day: 1, minuteOfDay: 360, dailyCostCountdownSeconds: 180, isRunning: true },
  taskProgress: { task: null, progress: 0 },
  worker: { tileX: 10, tileY: 11, activity: 'idle' },
  selectedTile: null,
  lastSale: null,
  wheatSeedCost: 2,
  wheatPrice: 3,
};

function formatTime(minuteOfDay: number) {
  const hours = Math.floor(minuteOfDay / 60) % 24;
  const minutes = Math.floor(minuteOfDay % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatSigned(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function Minimap({ snapshot }: { snapshot: GameSnapshot }) {
  const project = (tx: number, ty: number) => ({
    x: 50 + ((tx - ty) / (MAP_COLS + MAP_ROWS)) * 92,
    y: 6 + ((tx + ty) / (MAP_COLS + MAP_ROWS)) * 88,
  });
  const worker = project(snapshot.worker.tileX, snapshot.worker.tileY);
  const corners = [project(0, 0), project(MAP_COLS, 0), project(MAP_COLS, MAP_ROWS), project(0, MAP_ROWS)];

  return (
    <svg viewBox="0 0 100 100" className="minimap-canvas" role="img" aria-label="Minimapa da fazenda">
      <polygon points={corners.map((p) => `${p.x},${p.y}`).join(' ')} fill="#3d6b32" stroke="#8a7554" strokeWidth="1" />
      <circle cx={worker.x} cy={worker.y} r="2.6" fill="#ffd166" stroke="#5a4028" strokeWidth="0.8" />
    </svg>
  );
}

export default function App() {
  const gameRootRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<ReturnType<typeof createGame> | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(initialSnapshot);
  const [notice, setNotice] = useState<Notice>({
    text: 'Bem-vindo ao Cap4Kids.',
    tone: 'info',
  });

  useEffect(() => {
    if (!gameRootRef.current || gameRef.current) return;
    gameRef.current = createGame(gameRootRef.current);
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const offState = onState(setSnapshot);
    const offNotice = onNotice(setNotice);
    return () => {
      offState();
      offNotice();
    };
  }, []);

  const progressPercent = Math.round(snapshot.taskProgress.progress * 100);
  const queue = useMemo(
    () => [snapshot.currentTask, ...snapshot.taskQueue].filter(Boolean) as TaskType[],
    [snapshot.currentTask, snapshot.taskQueue],
  );

  return (
    <main className="app-shell">
      <div ref={gameRootRef} className="world-layer" aria-label="Mundo isométrico da fazenda" />

      <header className="resource-bar">
        <span className="resource"><i className="res-dot res-coin" />{snapshot.economy.coins}</span>
        <span className="resource"><i className="res-dot res-debt" />{snapshot.economy.debt}</span>
        <span className="resource"><i className="res-dot res-wheat" />{snapshot.inventory.wheat}</span>
        <span className="resource"><i className="res-dot res-seed" />{snapshot.inventory.seeds}</span>
        <span className="resource-divider" />
        <span className="resource-label">Dia {snapshot.clock.day}</span>
        <span className="resource-label">{formatTime(snapshot.clock.minuteOfDay)}</span>
        <span className="resource-divider" />
        <span className="resource-label">Trigo vale {snapshot.wheatPrice}</span>
        <span className={snapshot.economy.profitLoss >= 0 ? 'resource-good' : 'resource-bad'}>
          {formatSigned(snapshot.economy.profitLoss)}
        </span>
      </header>

      <p className={`notice notice-${notice.tone}`} role="status">{notice.text}</p>

      <section className="command-panel">
        <div className="portrait-block">
          <div className="portrait-frame">
            <img src={mayaPortrait} alt="Retrato da Maya" />
          </div>
          <div className="nameplate">Maya</div>
          <div className="activity">
            {snapshot.worker.activity === 'working'
              ? 'Trabalhando'
              : snapshot.worker.activity === 'walking'
                ? 'A caminho'
                : 'Parada'}
          </div>
        </div>

        <div className="command-grid">
          {commands.map(({ task, hotkey, glyph }) => (
            <button
              key={task}
              type="button"
              className="command-button"
              title={taskLabels[task]}
              onClick={() => sendCommand({ type: 'queueTask', task })}
            >
              <span className="command-hotkey">{hotkey}</span>
              <span className="command-glyph" aria-hidden="true">{glyph}</span>
              <span className="command-label">{taskLabels[task]}</span>
            </button>
          ))}
          <button
            type="button"
            className="command-button"
            onClick={() => sendCommand({ type: 'buySeed' })}
          >
            <span className="command-hotkey">B</span>
            <span className="command-glyph" aria-hidden="true">+</span>
            <span className="command-label">Semente ({snapshot.wheatSeedCost})</span>
          </button>
          <button
            type="button"
            className="command-button"
            onClick={() => sendCommand({ type: 'sellWheat' })}
          >
            <span className="command-hotkey">V</span>
            <span className="command-glyph" aria-hidden="true">$</span>
            <span className="command-label">Vender trigo</span>
          </button>
        </div>

        <div className="queue-block">
          <h2>Fila de tarefas</h2>
          {queue.length === 0 ? (
            <p className="queue-empty">Nenhuma tarefa.</p>
          ) : (
            <ul className="queue-list">
              {queue.map((task, index) => (
                <li key={`${task}-${index}`} className={index === 0 ? 'queue-active' : undefined}>
                  {index === 0 && (
                    <span className="queue-progress" style={{ width: `${progressPercent}%` }} />
                  )}
                  <span className="queue-text">{taskLabels[task]}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="field-strip">
            {snapshot.fields.map((field) => (
              <span key={field.id} className="field-chip">
                Campo {field.id}: {fieldLabels[field.state]}
              </span>
            ))}
          </div>
          <button type="button" className="ghost-button" onClick={() => sendCommand({ type: 'cancelQueue' })}>
            Limpar fila
          </button>
        </div>

        <div className="minimap-block">
          <div className="minimap-frame">
            <Minimap snapshot={snapshot} />
          </div>
          <div className="minimap-actions">
            <button type="button" className="ghost-button" onClick={() => sendCommand({ type: 'centerOnWorker' })}>
              Centralizar
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() =>
                sendCommand({
                  type: 'setCameraMode',
                  mode: snapshot.cameraMode === 'free' ? 'followMaya' : 'free',
                })
              }
            >
              {snapshot.cameraMode === 'free' ? 'Seguir' : 'Livre'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
