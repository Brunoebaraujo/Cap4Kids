import { useEffect, useRef, useState } from 'react';
import mayaPortrait from './assets/characters/maya/portraits/maya-portrait.png';
import { createGame } from './game/createGame';
import { gameEvents } from './game/eventBus';
import type { CameraMode, GameSnapshot, TaskType } from './game/types';

const taskLabels: Record<TaskType, string> = {
  'Prepare Soil': 'Preparar Solo',
  'Plant Wheat': 'Plantar Trigo',
  'Harvest Wheat': 'Colher Trigo',
  'Deliver To Shipping Bin': 'Entregar no Shipping Bin',
};

const taskKeys: Record<TaskType, string> = {
  'Prepare Soil': '1',
  'Plant Wheat': '2',
  'Harvest Wheat': '3',
  'Deliver To Shipping Bin': '4',
};

const cameraLabels: Record<CameraMode, string> = {
  free: 'Livre',
  followMaya: 'Seguindo Maya',
};

const initialSnapshot: GameSnapshot = {
  economy: {
    coins: 0,
    debt: 0,
    dailyHouseholdCost: 0,
    profitLoss: 0,
  },
  inventory: {
    seeds: 0,
    wheat: 0,
    milk: 0,
  },
  currentTask: null,
  taskQueue: [],
  fields: [],
  animationState: 'idle',
  cameraMode: 'free',
  maya: {
    animation: 'idle_down',
    direction: 'down',
    x: 0,
    y: 0,
    frameWidth: 32,
    frameHeight: 32,
    state: 'idle',
  },
  clock: {
    day: 1,
    minuteOfDay: 6 * 60,
    dailyCostCountdownSeconds: 180,
    isRunning: true,
  },
  taskProgress: {
    task: null,
    progress: 0,
  },
  lastSale: null,
  wheatSeedCost: 2,
  wheatPrice: 3,
};

function dispatchKey(key: string) {
  const upper = key.toUpperCase();
  const code = /^\d$/.test(key) ? `Digit${key}` : `Key${upper}`;
  window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }));
  window.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true }));
}

function dispatchTaskKey(task: TaskType) {
  dispatchKey(taskKeys[task]);
}

function formatTask(task: TaskType | null) {
  return task ? taskLabels[task] : 'Livre';
}

function formatTime(minuteOfDay: number) {
  const hours = Math.floor(minuteOfDay / 60) % 24;
  const minutes = minuteOfDay % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatSigned(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

export default function App() {
  const gameRootRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<ReturnType<typeof createGame> | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(initialSnapshot);
  const [notification, setNotification] = useState('Bem-vindo a Capitalism 4 Kids.');

  useEffect(() => {
    if (!gameRootRef.current || gameRef.current) return;

    gameRef.current = createGame(gameRootRef.current);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const preventGameKeyScroll = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', preventGameKeyScroll);
    return () => window.removeEventListener('keydown', preventGameKeyScroll);
  }, []);

  useEffect(() => {
    const handleState = (state: GameSnapshot) => setSnapshot(state);
    const handleNotification = (message: string) => setNotification(message);

    gameEvents.on('state', handleState);
    gameEvents.on('notification', handleNotification);

    return () => {
      gameEvents.off('state', handleState);
      gameEvents.off('notification', handleNotification);
    };
  }, []);

  const queuedTasks = snapshot.taskQueue.length
    ? snapshot.taskQueue.map((task) => taskLabels[task]).join(' -> ')
    : 'Vazia';
  const firstField = snapshot.fields[0];
  const taskProgressPercent = Math.round(snapshot.taskProgress.progress * 100);

  return (
    <main className="app-shell">
      <div ref={gameRootRef} className="world-layer" aria-label="Mundo da fazenda" />

      <section className="top-panel" aria-label="Painel principal">
        <div className="maya-profile">
          <img src={mayaPortrait} alt="Retrato da Maya" className="maya-portrait" />
          <div>
            <p className="eyebrow">Capitalism 4 Kids</p>
            <h1>Fazenda da Maya</h1>
          </div>
        </div>

        <div className="hud-grid" aria-label="Resumo da economia">
          <div className="hud-card">
            <span>Moedas</span>
            <strong>{snapshot.economy.coins}</strong>
          </div>
          <div className="hud-card">
            <span>Dívida</span>
            <strong>{snapshot.economy.debt}</strong>
          </div>
          <div className="hud-card">
            <span>Custo diário</span>
            <strong>{snapshot.economy.dailyHouseholdCost}</strong>
          </div>
          <div className="hud-card">
            <span>Lucro/Prejuízo</span>
            <strong>{formatSigned(snapshot.economy.profitLoss)}</strong>
          </div>
          <div className="hud-card">
            <span>Dia</span>
            <strong>{snapshot.clock.day}</strong>
          </div>
          <div className="hud-card">
            <span>Hora</span>
            <strong>{formatTime(snapshot.clock.minuteOfDay)}</strong>
          </div>
        </div>
      </section>

      <aside className="side-panel left-panel" aria-label="Controles da fazenda">
        <div className="panel-block">
          <h2>Ações</h2>
          <div className="action-grid">
            <button type="button" onClick={() => dispatchKey('b')}>
              Comprar Semente ({snapshot.wheatSeedCost})
            </button>
            {(Object.keys(taskLabels) as TaskType[]).map((task) => (
              <button key={task} type="button" onClick={() => dispatchTaskKey(task)}>
                {taskLabels[task]}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-block">
          <h2>Tarefa atual</h2>
          <p className="status-line">{formatTask(snapshot.currentTask)}</p>
          <div className="progress-shell" aria-label="Progresso da tarefa">
            <div className="progress-fill" style={{ width: `${taskProgressPercent}%` }} />
          </div>
          <p className="tiny-line">{snapshot.taskProgress.task ? `${taskProgressPercent}%` : 'Sem tarefa em progresso'}</p>
        </div>

        <div className="panel-block">
          <h2>Fila</h2>
          <p className="status-line">{queuedTasks}</p>
        </div>

        <div className="panel-block debug-panel">
          <h2>Debug</h2>
          <dl className="debug-list">
            <div>
              <dt>Tarefa</dt>
              <dd>{formatTask(snapshot.currentTask)}</dd>
            </div>
            <div>
              <dt>Camera</dt>
              <dd>{cameraLabels[snapshot.cameraMode]}</dd>
            </div>
            <div>
              <dt>Dia</dt>
              <dd>{snapshot.clock.day}</dd>
            </div>
            <div>
              <dt>Hora</dt>
              <dd>{formatTime(snapshot.clock.minuteOfDay)}</dd>
            </div>
            <div>
              <dt>Campo</dt>
              <dd>{firstField?.state ?? 'Sem campo'}</dd>
            </div>
            <div>
              <dt>Maya</dt>
              <dd>{snapshot.maya.animation}</dd>
            </div>
          </dl>
        </div>
      </aside>

      <aside className="side-panel right-panel" aria-label="Inventário">
        <div className="panel-block">
          <h2>Tempo</h2>
          <p className="status-line">{snapshot.clock.isRunning ? 'Tempo ativo' : 'Tempo pausado'}</p>
          <p className="tiny-line">Próximo custo em {snapshot.clock.dailyCostCountdownSeconds}s ativos</p>
        </div>

        <div className="panel-block">
          <h2>Inventário</h2>
          <dl className="inventory-list">
            <div>
              <dt>Sementes</dt>
              <dd>{snapshot.inventory.seeds}</dd>
            </div>
            <div>
              <dt>Trigo</dt>
              <dd>{snapshot.inventory.wheat}</dd>
            </div>
            <div>
              <dt>Preço trigo</dt>
              <dd>{snapshot.wheatPrice}</dd>
            </div>
          </dl>
        </div>

        <div className="panel-block">
          <h2>Venda</h2>
          <dl className="inventory-list">
            <div>
              <dt>Qtd.</dt>
              <dd>{snapshot.lastSale?.quantity ?? 0}</dd>
            </div>
            <div>
              <dt>Preço</dt>
              <dd>{snapshot.lastSale?.unitPrice ?? snapshot.wheatPrice}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{snapshot.lastSale?.totalEarned ?? 0}</dd>
            </div>
          </dl>
        </div>

        <div className="panel-block">
          <h2>Campos</h2>
          <dl className="field-list">
            {snapshot.fields.map((field) => (
              <div key={field.id}>
                <dt>Campo {field.id}</dt>
                <dd>{field.state}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>

      <p className="notification">{notification}</p>
    </main>
  );
}
