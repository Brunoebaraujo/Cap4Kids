import { useEffect, useRef, useState } from 'react';
import { createGame } from './game/createGame';
import { gameEvents } from './game/eventBus';
import type { GameSnapshot, TaskType } from './game/types';

const taskLabels: Record<TaskType, string> = {
  'Prepare Soil': 'Preparar Solo',
  'Plant Wheat': 'Plantar Trigo',
  'Harvest Wheat': 'Colher Trigo',
  'Milk Cow': 'Ordenhar Vaca',
};

const taskKeys: Record<TaskType, string> = {
  'Prepare Soil': '1',
  'Plant Wheat': '2',
  'Harvest Wheat': '3',
  'Milk Cow': '4',
};

const initialSnapshot: GameSnapshot = {
  economy: {
    coins: 0,
    debt: 0,
    dailyHouseholdCost: 0,
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
};

function dispatchTaskKey(task: TaskType) {
  const key = taskKeys[task];
  const code = `Digit${key}`;

  window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }));
  window.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true }));
}

function formatTask(task: TaskType | null) {
  return task ? taskLabels[task] : 'Livre';
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

  return (
    <main className="app-shell">
      <section className="top-panel" aria-label="Painel principal">
        <div>
          <p className="eyebrow">Capitalism 4 Kids</p>
          <h1>Fazenda da Maya</h1>
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
        </div>
      </section>

      <section className="game-layout" aria-label="Jogo e controles">
        <aside className="side-panel" aria-label="Controles da fazenda">
          <div className="panel-block">
            <h2>Ações</h2>
            <div className="action-grid">
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
          </div>

          <div className="panel-block">
            <h2>Fila</h2>
            <p className="status-line">{queuedTasks}</p>
          </div>
        </aside>

        <section className="game-stage" aria-label="Canvas do jogo">
          <div ref={gameRootRef} className="game-root" />
          <p className="notification">{notification}</p>
        </section>

        <aside className="side-panel" aria-label="Inventário">
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
                <dt>Leite</dt>
                <dd>{snapshot.inventory.milk}</dd>
              </div>
            </dl>
          </div>

          <div className="panel-block">
            <h2>Campos</h2>
            <p className="status-line">{snapshot.fields.length} áreas ativas</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
