import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import { createGame } from './game/createGame';
import { gameEvents } from './game/eventBus';
import { CROPS } from './game/data/crops';
import type { AdminEventType, CropId, GameRole, GameSnapshot, TaskType } from './game/types';

const initialSnapshot: GameSnapshot = {
  economy: {
    coins: 40,
    debt: 250,
    dailyHouseholdCost: 8,
    inflationRate: 0.02,
    wheatPrice: 6,
    milkPrice: 9,
    wealthCreated: 0,
    day: 1,
  },
  inventory: {
    seeds: { wheat: 4, rice: 0, tomato: 0, banana: 0 },
    wheat: 0,
    rice: 0,
    tomato: 0,
    banana: 0,
    milk: 0,
  },
  selectedWorkerId: 'maya',
  selectedWorker: {
    id: 'maya',
    name: 'Maya',
    position: { x: 4, y: 6 },
    status: 'Idle',
    currentTask: null,
    taskQueue: [],
    animationState: 'idle',
    isSelected: true,
  },
  workers: [
    { id: 'maya', name: 'Maya', position: { x: 4, y: 6 }, status: 'Idle', currentTask: null, taskQueue: [], animationState: 'idle', isSelected: true },
    { id: 'worker-1', name: 'Worker 1', position: { x: 10, y: 6 }, status: 'Idle', currentTask: null, taskQueue: [], animationState: 'idle', isSelected: false },
  ],
  currentTask: null,
  taskQueue: [],
  fields: [
    { id: 1, state: 'Raw' },
    { id: 2, state: 'Locked' },
    { id: 3, state: 'Locked' },
    { id: 4, state: 'Locked' },
    { id: 5, state: 'Locked' },
    { id: 6, state: 'Locked' },
  ],
  animationState: 'idle',
  role: 'player',
  rivals: [
    { id: 'olive', name: 'Fazenda Oliveira', coins: 52, marketShare: 34, price: 6, color: '#e38b4d' },
    { id: 'sun', name: 'Sítio do Sol', coins: 47, marketShare: 29, price: 7, color: '#f4cf55' },
  ],
  events: [],
};

function App() {
  const gameRootRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [notification, setNotification] = useState('Selecione um trabalhador e clique em um campo.');
  const [tutorialDismissed, setTutorialDismissed] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  useEffect(() => {
    if (!gameRootRef.current || gameRef.current) return;
    gameRef.current = createGame(gameRootRef.current);
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const requestTask = (task: TaskType) => gameEvents.emit('task', task);
  const selectWorker = (workerId: string) => gameEvents.emit('selectWorker', workerId);
  const findWorker = (workerId: string) => gameEvents.emit('findWorker', workerId);
  const sell = (product: 'wheat' | 'milk') => gameEvents.emit('sell', product);
  const buySeeds = (crop: CropId = 'wheat') => gameEvents.emit('buySeeds', crop);
  const nextDay = () => gameEvents.emit('nextDay');
  const setRole = (role: GameRole) => gameEvents.emit('role', role);
  const triggerEvent = (event: AdminEventType) => gameEvents.emit('adminEvent', event);

  useEffect(() => {
    const handleState = (nextSnapshot: GameSnapshot) => setSnapshot(nextSnapshot);
    const handleOpenShop = () => setShopOpen(true);
    const handleCloseShop = () => setShopOpen(false);
    const handleNotification = (message: string) => {
      if (message !== 'Selecione um trabalhador e clique no Campo 1 para preparar o solo.' && message !== 'Selecione um trabalhador e clique em um campo.') {
        setTutorialDismissed(true);
      }
      setNotification(message);
    };

    gameEvents.on('state', handleState);
    gameEvents.on('notification', handleNotification);
    gameEvents.on('openShop', handleOpenShop);
    gameEvents.on('closeShop', handleCloseShop);

    return () => {
      gameEvents.off('state', handleState);
      gameEvents.off('notification', handleNotification);
      gameEvents.off('openShop', handleOpenShop);
      gameEvents.off('closeShop', handleCloseShop);
    };
  }, []);

  const showNotice = !tutorialDismissed || notification.length > 0;

  return (
    <main className="app-shell">
      <section className="game-panel" aria-label="Capitalism 4 Kids farm world">
        {showNotice && <p className={tutorialDismissed ? 'map-notification' : 'map-notification tutorial'}>{notification}</p>}
        <div ref={gameRootRef} className="game-root" />
      </section>

      <aside className="hud" aria-label="Farm status">
        <header className="hud-header">
          <p className="eyebrow">Capitalism 4 Kids · Dia {snapshot.economy.day}</p>
          <h1>Vale das Oportunidades</h1>
          <div className="role-switch" role="group" aria-label="Modo de acesso">
            <button className={snapshot.role === 'player' ? 'active' : ''} onClick={() => setRole('player')}>Jogador</button>
            <button className={snapshot.role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}>Admin</button>
          </div>
        </header>

        <section className="hud-section">
          <h2>Economy</h2>
          <dl className="stat-grid">
            <div><dt>Coins</dt><dd>{snapshot.economy.coins}</dd></div>
            <div><dt>Debt</dt><dd>{snapshot.economy.debt}</dd></div>
            <div><dt>Custo diário</dt><dd>{snapshot.economy.dailyHouseholdCost}</dd></div>
          </dl>
          <div className="economy-strip">
            <span>Inflação <strong>{(snapshot.economy.inflationRate * 100).toFixed(1)}%</strong></span>
            <span>Riqueza criada <strong>{snapshot.economy.wealthCreated}</strong></span>
          </div>
          <button className="primary-action" onClick={nextDay}>Encerrar dia e pagar custos</button>
        </section>

        <section className="hud-section market-section">
          <h2>Mercado local</h2>
          <div className="market-grid">
            <button onClick={() => sell('wheat')}><span>Trigo</span><strong>{snapshot.economy.wheatPrice} moedas</strong><small>Vender estoque</small></button>
            <button onClick={() => sell('milk')}><span>Leite</span><strong>{snapshot.economy.milkPrice} moedas</strong><small>Vender estoque</small></button>
            <button onClick={() => setShopOpen(true)}><span>Sementes</span><strong>Na lojinha</strong><small>Comprar insumos</small></button>
          </div>
          <p className="lesson">Preços sinalizam escassez. A inflação reduz o poder de compra; concorrentes reagem ao mercado a cada dia.</p>
        </section>

        <section className="hud-section">
          <h2>Concorrência · sala com 3 fazendas</h2>
          <div className="leaderboard">
            <div><i style={{ background: '#62c58b' }} /><span>Sua fazenda</span><strong>{snapshot.economy.coins} moedas</strong></div>
            {snapshot.rivals.map((rival) => <div key={rival.id}><i style={{ background: rival.color }} /><span>{rival.name}</span><strong>{rival.coins} · preço {rival.price}</strong></div>)}
          </div>
          <small className="prototype-note">Rivais simulados nesta versão; o servidor autoritativo substituirá esta camada.</small>
        </section>

        {shopOpen && <section className="hud-section shop-panel">
          <h2>Lojinha · Sementes</h2>
          <p className="lesson">No fluxo final, a compra acontece ao visitar fisicamente a lojinha. Esta janela já será expandida depois com equipamentos e contratação.</p>
          <div className="shop-grid">
            {CROPS.map((crop) => (
              <button key={crop.id} type="button" onClick={() => buySeeds(crop.id)}>
                <span>{crop.label}</span>
                <strong>Venda ${crop.saleValueUsd}</strong>
                <small>Plantar {crop.plantMinutes}min · Crescer {crop.growthDays}d · Colher {crop.harvestMinutes}min</small>
                <small>Sementes: {snapshot.inventory.seeds[crop.id]}</small>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setShopOpen(false)}>Fechar loja</button>
        </section>}

        {snapshot.role === 'admin' && <section className="hud-section admin-panel">
          <p className="eyebrow">Console divino</p>
          <h2>Criar evento para toda a sala</h2>
          <div className="admin-actions">
            {([['drought', 'Seca'], ['rain', 'Chuva'], ['subsidy', 'Subsídio'], ['inflation', 'Inflação'], ['locusts', 'Gafanhotos']] as [AdminEventType, string][]).map(([type, label]) => <button key={type} onClick={() => triggerEvent(type)}>{label}</button>)}
          </div>
          <div className="event-feed">{snapshot.events.length ? snapshot.events.slice(0, 3).map((event) => <p key={event.id}><strong>Dia {event.day}: {event.title}</strong>{event.description}</p>) : <p>Nenhum evento criado.</p>}</div>
        </section>}

        <section className="hud-section">
          <h2>Selected Worker</h2>
          <div className="actions">
            <button type="button" onClick={() => requestTask('Prepare Soil')}>Prepare Soil</button>
            <button type="button" onClick={() => requestTask('Plant Wheat')}>Plant Wheat</button>
            <button type="button" onClick={() => requestTask('Harvest Wheat')}>Harvest Wheat</button>
            <button type="button" onClick={() => requestTask('Milk Cow')}>Milk Cow</button>
          </div>
          <div className="task-line"><span>Selected Worker</span><strong>{snapshot.selectedWorker.name}</strong></div>
          <div className="task-line"><span>Status</span><strong>{snapshot.selectedWorker.status}</strong></div>
          <div className="task-line"><span>Current Task</span><strong>{snapshot.selectedWorker.currentTask?.type ?? 'Idle'}</strong></div>
          <div className="task-line"><span>Queue Length</span><strong>{snapshot.selectedWorker.taskQueue.length}</strong></div>
          <div className="queue">
            {snapshot.selectedWorker.taskQueue.length > 0 ? snapshot.selectedWorker.taskQueue.map((task) => <span key={task.id}>{task.type}</span>) : <span>Queue empty</span>}
          </div>
        </section>

        <section className="hud-section">
          <h2>Workers</h2>
          <div className="workers-list">
            {snapshot.workers.map((worker) => (
              <div key={worker.id} className={worker.isSelected ? 'worker-row worker-row-selected' : 'worker-row'}>
                <button type="button" className="worker-select" onClick={() => selectWorker(worker.id)}>
                  <span>{worker.name}</span>
                  <strong>{worker.status} / Queue {worker.taskQueue.length}</strong>
                </button>
                <button type="button" className="find-worker" onClick={() => findWorker(worker.id)}>Find</button>
              </div>
            ))}
          </div>
          <p className="prototype-note">O botão Find será substituído por minimapa/câmera com limites no mapa expansível.</p>
        </section>

        <section className="hud-section">
          <h2>Inventory</h2>
          <dl className="inventory">
            <div><dt>Seeds</dt><dd>{snapshot.inventory.seeds}</dd></div>
            <div><dt>Wheat</dt><dd>{snapshot.inventory.wheat}</dd></div>
            <div><dt>Milk</dt><dd>{snapshot.inventory.milk}</dd></div>
          </dl>
        </section>

        <section className="hud-section">
          <h2>Fields</h2>
          <div className="fields">
            {snapshot.fields.map((field) => (
              <div key={field.id} className="field-row"><span>Field {field.id}</span><strong>{field.state}</strong></div>
            ))}
          </div>
        </section>
      </aside>
    </main>
  );
}

export default App;
