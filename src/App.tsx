import { useEffect, useMemo, useRef, useState } from 'react';
import mayaPortrait from './assets/characters/maya/portraits/maya-portrait.webp';
import { onNotice, onState, sendCommand, type Notice } from './game/commandBus';
import { createGame } from './game/createGame';
import { MAP_COLS, MAP_ROWS } from './game/scenes/IsoFarmScene';
import type { FieldState, GameSnapshot, Lesson, MarketGoodSnapshot, SeasonReport, TaskType } from './game/types';

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
  economy: {
    coins: 40, debt: 250, dailyHouseholdCost: 8, profitLoss: 0,
    todayRevenue: 0, todayExpenses: 0, lastDayRevenue: 0, lastDayExpenses: 0,
    interestPaidTotal: 0, seasonRevenue: 0, seasonExpenses: 0, seasonInterest: 0,
  },
  inventory: { seeds: 0, wheat: 0, milk: 0 },
  currentTask: null,
  taskQueue: [],
  fields: [],
  cameraMode: 'free',
  clock: {
    day: 1, dayFraction: 0, minuteOfDay: 360, speed: 1,
    season: 'Primavera', seasonNumber: 1, dayOfSeason: 1, daysPerSeason: 10,
  },
  taskProgress: { task: null, progress: 0 },
  worker: { tileX: 10, tileY: 11, activity: 'idle' },
  selectedTile: null,
  lastSale: null,
  wheatSeedCost: 2,
  wheatPrice: 3,
  market: [],
  inflation: { index: 100, dailyRatePercent: 1.2, accumulatedPercent: 0 },
  lessons: [],
  seasonReports: [],
};

function formatTime(minuteOfDay: number) {
  const h = Math.floor(minuteOfDay / 60) % 24;
  const m = Math.floor(minuteOfDay % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function Sparkline({ good }: { good: MarketGoodSnapshot }) {
  if (good.history.length < 2) return <span className="spark-empty">—</span>;
  const points = good.history.slice(-24);
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const path = points
    .map((p, i) => `${(i / (points.length - 1)) * 60},${14 - ((p.price - min) / span) * 12}`)
    .join(' ');
  return (
    <svg viewBox="0 0 60 16" className="spark" aria-hidden="true">
      <polyline points={path} fill="none" stroke="#4a7c3f" strokeWidth="1.4" />
    </svg>
  );
}

function SeasonReportCard({ report, onClose }: { report: SeasonReport; onClose: () => void }) {
  const inflacao = Math.round(
    ((report.priceIndexEnd - report.priceIndexStart) / report.priceIndexStart) * 100,
  );
  const dividaVariou = report.debtEnd - report.debtStart;
  return (
    <div className="season-card" role="dialog" aria-labelledby="season-title">
      <span className="lesson-concept">Balanço da estação</span>
      <h3 id="season-title">{report.season} — estação {report.seasonNumber}</h3>
      <dl className="season-grid">
        <div><dt>Receita</dt><dd className="good">+{report.revenue}</dd></div>
        <div><dt>Despesas</dt><dd className="bad">-{report.expenses}</dd></div>
        <div><dt>Lucro</dt><dd className={report.profit >= 0 ? 'good' : 'bad'}>
          {report.profit >= 0 ? '+' : ''}{report.profit}</dd></div>
        <div><dt>Juros pagos</dt><dd className="bad">{report.interestPaid}</dd></div>
        <div><dt>Dívida</dt><dd className={dividaVariou <= 0 ? 'good' : 'bad'}>
          {report.debtStart} → {report.debtEnd}</dd></div>
        <div><dt>Preços subiram</dt><dd className="bad">{inflacao}%</dd></div>
      </dl>
      <p className="season-note">
        {report.profit >= 0
          ? `Você fechou a estação no lucro. Mas repare: os preços subiram ${inflacao}%, então cada moeda compra menos que no começo.`
          : 'Você gastou mais do que ganhou nesta estação. Vale olhar o que está pesando: semente, despesa da casa ou juros da dívida.'}
        {dividaVariou > 0
          ? ` A dívida cresceu ${dividaVariou} sozinha — são os juros.`
          : dividaVariou < 0
            ? ` Você abateu ${-dividaVariou} da dívida. Isso reduz os juros das próximas estações.`
            : ''}
      </p>
      <button type="button" className="ghost-button" onClick={onClose}>Começar a próxima estação</button>
    </div>
  );
}

function TrendArrow({ trend }: { trend: number }) {
  if (trend > 0) return <span className="trend trend-up" title="Subindo">▲</span>;
  if (trend < 0) return <span className="trend trend-down" title="Caindo">▼</span>;
  return <span className="trend trend-flat" title="Estável">—</span>;
}

function Minimap({ snapshot }: { snapshot: GameSnapshot }) {
  const project = (tx: number, ty: number) => ({
    x: 50 + ((tx - ty) / (MAP_COLS + MAP_ROWS)) * 92,
    y: 6 + ((tx + ty) / (MAP_COLS + MAP_ROWS)) * 88,
  });
  const w = project(snapshot.worker.tileX, snapshot.worker.tileY);
  const corners = [project(0, 0), project(MAP_COLS, 0), project(MAP_COLS, MAP_ROWS), project(0, MAP_ROWS)];
  return (
    <svg viewBox="0 0 100 100" className="minimap-canvas" role="img" aria-label="Minimapa">
      <polygon points={corners.map((p) => `${p.x},${p.y}`).join(' ')} fill="#5c9c4a" stroke="#8a7554" strokeWidth="1" />
      <circle cx={w.x} cy={w.y} r="2.6" fill="#ffd166" stroke="#5a4028" strokeWidth="0.8" />
    </svg>
  );
}

export default function App() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<ReturnType<typeof createGame> | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(initialSnapshot);
  const [notice, setNotice] = useState<Notice>({ text: 'Bem-vindo ao Cap4Kids.', tone: 'info' });
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [journalOpen, setJournalOpen] = useState(false);
  const [seenReports, setSeenReports] = useState(0);

  useEffect(() => {
    if (!rootRef.current || gameRef.current) return;
    gameRef.current = createGame(rootRef.current);
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const offState = onState(setSnapshot);
    const offNotice = onNotice(setNotice);
    return () => { offState(); offNotice(); };
  }, []);

  const progressPercent = Math.round(snapshot.taskProgress.progress * 100);
  const queue = useMemo(
    () => [snapshot.currentTask, ...snapshot.taskQueue].filter(Boolean) as TaskType[],
    [snapshot.currentTask, snapshot.taskQueue],
  );
  const activeLesson: Lesson | undefined = useMemo(
    () => [...snapshot.lessons].reverse().find((l) => !dismissed.includes(l.id)),
    [snapshot.lessons, dismissed],
  );
  const pendingReport = snapshot.seasonReports.length > seenReports
    ? snapshot.seasonReports[snapshot.seasonReports.length - 1]
    : null;
  const { lastDayRevenue, lastDayExpenses } = snapshot.economy;
  const dailyProfit = lastDayRevenue - lastDayExpenses;

  return (
    <main className="app-shell">
      <div ref={rootRef} className="world-layer" aria-label="Mundo isométrico da fazenda" />

      <header className="resource-bar">
        <span className="resource"><i className="res-dot res-coin" />{snapshot.economy.coins}</span>
        <span className="resource"><i className="res-dot res-debt" />{snapshot.economy.debt}</span>
        <span className="resource"><i className="res-dot res-wheat" />{snapshot.inventory.wheat}</span>
        <span className="resource"><i className="res-dot res-seed" />{snapshot.inventory.seeds}</span>
        <span className="resource-divider" />
        <span className="resource-label">Dia {snapshot.clock.day}</span>
        <span className="resource-label">{formatTime(snapshot.clock.minuteOfDay)}</span>
        <span className="resource-season">
          {snapshot.clock.season} · {snapshot.clock.dayOfSeason}/{snapshot.clock.daysPerSeason}
        </span>
        <span className="speed-group" role="group" aria-label="Velocidade do tempo">
          {[0, 1, 2, 3].map((sp) => (
            <button
              key={sp}
              type="button"
              className={`speed-button${snapshot.clock.speed === sp ? ' speed-active' : ''}`}
              title={sp === 0 ? 'Pausar (espaço)' : `Velocidade ${sp}x`}
              onClick={() => sendCommand({ type: 'setSpeed', speed: sp })}
            >
              {sp === 0 ? '❚❚' : `${sp}×`}
            </button>
          ))}
        </span>
        <span className="resource-divider" />
        <span className="resource-label" title="Inflação acumulada desde o dia 1">
          Preços {snapshot.inflation.accumulatedPercent >= 0 ? '+' : ''}
          {snapshot.inflation.accumulatedPercent}%
        </span>
      </header>

      <p className={`notice notice-${notice.tone}`} role="status">{notice.text}</p>

      <aside className="side-stack">
        <section className="side-panel">
          <h2>Indicadores</h2>
          <dl className="indicator-list">
            <div><dt>Receita (ontem)</dt><dd className="good">+{lastDayRevenue}</dd></div>
            <div><dt>Despesas (ontem)</dt><dd className="bad">-{lastDayExpenses}</dd></div>
            <div><dt>Lucro</dt><dd className={dailyProfit >= 0 ? 'good' : 'bad'}>{dailyProfit >= 0 ? '+' : ''}{dailyProfit}</dd></div>
            <div><dt>Juros pagos</dt><dd className="bad">{snapshot.economy.interestPaidTotal}</dd></div>
          </dl>
          <button type="button" className="ghost-button" onClick={() => sendCommand({ type: 'repayDebt', amount: 25 })}>
            Abater 25 da dívida
          </button>
        </section>

        <section className="side-panel">
          <h2>Mercado</h2>
          <table className="market-table">
            <thead>
              <tr><th>Produto</th><th>Preço</th><th>Tend.</th><th>30d</th></tr>
            </thead>
            <tbody>
              {snapshot.market.map((good) => (
                <tr key={good.id}>
                  <td>{good.label}</td>
                  <td className="market-price">{good.price}</td>
                  <td><TrendArrow trend={good.trend} /></td>
                  <td><Sparkline good={good} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="panel-hint">Vender muito de uma vez derruba o preço.</p>
        </section>

        <button type="button" className="journal-button" onClick={() => setJournalOpen((v) => !v)}>
          Diário ({snapshot.lessons.length})
        </button>
      </aside>

      {pendingReport && (
        <SeasonReportCard
          report={pendingReport}
          onClose={() => {
            setSeenReports(snapshot.seasonReports.length);
            sendCommand({ type: 'setSpeed', speed: 1 });
          }}
        />
      )}

      {!pendingReport && activeLesson && (
        <div className="lesson-card" role="dialog" aria-labelledby="lesson-title">
          <span className="lesson-concept">{activeLesson.concept}</span>
          <h3 id="lesson-title">{activeLesson.title}</h3>
          <p>{activeLesson.body}</p>
          <button type="button" className="ghost-button" onClick={() => setDismissed((d) => [...d, activeLesson.id])}>
            Entendi
          </button>
        </div>
      )}

      {journalOpen && (
        <div className="journal-panel">
          <h3>Diário de aprendizado</h3>
          {snapshot.lessons.length === 0 ? (
            <p className="panel-hint">Nenhuma lição ainda. Jogue e elas aparecem.</p>
          ) : (
            <ul>
              {snapshot.lessons.map((l) => (
                <li key={l.id}><strong>{l.title}</strong><span>{l.body}</span></li>
              ))}
            </ul>
          )}
          <button type="button" className="ghost-button" onClick={() => setJournalOpen(false)}>Fechar</button>
        </div>
      )}

      <section className="command-panel">
        <div className="portrait-block">
          <div className="portrait-frame"><img src={mayaPortrait} alt="Retrato da Maya" /></div>
          <div className="nameplate">Maya</div>
          <div className="activity">
            {snapshot.worker.activity === 'working' ? 'Trabalhando'
              : snapshot.worker.activity === 'walking' ? 'A caminho' : 'Parada'}
          </div>
        </div>

        <div className="command-grid">
          {commands.map(({ task, hotkey, glyph }) => (
            <button key={task} type="button" className="command-button" title={taskLabels[task]}
              onClick={() => sendCommand({ type: 'queueTask', task })}>
              <span className="command-hotkey">{hotkey}</span>
              <span className="command-glyph" aria-hidden="true">{glyph}</span>
              <span className="command-label">{taskLabels[task]}</span>
            </button>
          ))}
          <button type="button" className="command-button" onClick={() => sendCommand({ type: 'buySeed' })}>
            <span className="command-hotkey">B</span>
            <span className="command-glyph" aria-hidden="true">+</span>
            <span className="command-label">Semente ({snapshot.wheatSeedCost})</span>
          </button>
          <button type="button" className="command-button" onClick={() => sendCommand({ type: 'sellWheat' })}>
            <span className="command-hotkey">V</span>
            <span className="command-glyph" aria-hidden="true">$</span>
            <span className="command-label">Vender ({snapshot.wheatPrice})</span>
          </button>
        </div>

        <div className="queue-block">
          <h2>Fila de tarefas</h2>
          {queue.length === 0 ? <p className="queue-empty">Nenhuma tarefa.</p> : (
            <ul className="queue-list">
              {queue.map((task, i) => (
                <li key={`${task}-${i}`} className={i === 0 ? 'queue-active' : undefined}>
                  {i === 0 && <span className="queue-progress" style={{ width: `${progressPercent}%` }} />}
                  <span className="queue-text">{taskLabels[task]}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="field-strip">
            {snapshot.fields.map((f) => (
              <span key={f.id} className="field-chip">Campo {f.id}: {fieldLabels[f.state]}</span>
            ))}
          </div>
          <button type="button" className="ghost-button" onClick={() => sendCommand({ type: 'cancelQueue' })}>
            Limpar fila
          </button>
        </div>

        <div className="minimap-block">
          <div className="minimap-frame"><Minimap snapshot={snapshot} /></div>
          <div className="minimap-actions">
            <button type="button" className="ghost-button" onClick={() => sendCommand({ type: 'centerOnWorker' })}>Centralizar</button>
            <button type="button" className="ghost-button"
              onClick={() => sendCommand({ type: 'setCameraMode', mode: snapshot.cameraMode === 'free' ? 'followMaya' : 'free' })}>
              {snapshot.cameraMode === 'free' ? 'Seguir' : 'Livre'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
