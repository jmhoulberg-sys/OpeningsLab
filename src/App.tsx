import { useCallback, useEffect, useRef, useState } from 'react';
import { Flame, PanelRight, X } from 'lucide-react';
import Header from './components/Header/Header';
import ChessBoardPanel from './components/Board/ChessBoardPanel';
import MoveList from './components/MoveList/MoveList';
import LineSelector from './components/LineSelector/LineSelector';
import ControlPanel from './components/Controls/ControlPanel';
import CompletionModal from './components/Modals/CompletionModal';
import TrainingSetupModal from './components/Modals/TrainingSetupModal';
import SettingsModal from './components/Settings/SettingsModal';
import TimerDisplay from './components/Timer/TimerDisplay';
import HomePage from './pages/HomePage';
import { useTrainingStore } from './store/trainingStore';
import { useProgressStore } from './store/progressStore';
import type { Opening } from './types';

// Width at which the sidebar collapses from inline → fixed drawer.
// 650 = 320 (sidebar) + ~300 (usable board) + padding
const SIDEBAR_BREAK = 650;
// Board-panel chrome height: status bar + progress + feedback + nav + gaps
const BOARD_CHROME_H = 130;
// Extra horizontal space consumed by the eval bar + gap inside the board area
const EVAL_BAR_W = 24;

export default function App() {
  const { opening, phase, postLine, mode, streak, startOpening } = useTrainingStore();
  const { markSetupComplete, isSetupComplete } = useProgressStore();

  const [showHome, setShowHome] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  // sidebarOpen only matters in drawer (small-screen) mode
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(() => window.innerWidth < SIDEBAR_BREAK);
  const [boardSize, setBoardSize] = useState(() =>
    // Safe initial guess before ResizeObserver fires
    Math.max(240, Math.min(520, window.innerWidth - 40)),
  );

  const mainRef = useRef<HTMLDivElement>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);

  // Observer 1: main element width → decide if sidebar is inline or drawer.
  // No board-size logic here, so no circular dependency.
  const handleMainResize = useCallback((entries: ResizeObserverEntry[]) => {
    const W = entries[0].contentRect.width;
    setIsSmallScreen(W < SIDEBAR_BREAK);
  }, []);

  // Observer 2: board container (flex-1 div) → compute board size.
  // contentRect already excludes padding, so we only subtract chrome.
  // When sidebar is inline its width is naturally excluded from contentRect.width.
  // When sidebar is a drawer (fixed) it's out of flow, so contentRect.width = full area.
  // Either way, this gives the correct available space — no circularity.
  const handleBoardContainerResize = useCallback((entries: ResizeObserverEntry[]) => {
    const { width, height } = entries[0].contentRect;
    const maxW = width - EVAL_BAR_W;
    const maxH = height - BOARD_CHROME_H;
    const size = Math.min(820, Math.max(240, Math.min(maxW, maxH)));
    setBoardSize(Math.floor(size));
  }, []);

  useEffect(() => {
    const mainEl = mainRef.current;
    const boardEl = boardContainerRef.current;
    if (!mainEl || !boardEl) return;

    const roMain = new ResizeObserver(handleMainResize);
    const roBoard = new ResizeObserver(handleBoardContainerResize);
    roMain.observe(mainEl);
    roBoard.observe(boardEl);

    return () => {
      roMain.disconnect();
      roBoard.disconnect();
    };
  }, [handleMainResize, handleBoardContainerResize]);

  // Mark setup complete the first time we reach line-select.
  useEffect(() => {
    if (phase === 'line-select' && opening && !isSetupComplete(opening.id)) {
      markSetupComplete(opening.id);
    }
  }, [phase, opening, isSetupComplete, markSetupComplete]);

  // Guard against StrictMode double-invoke
  const startedRef = useRef(false);
  function handleSelectOpening(selectedOpening: Opening) {
    if (!startedRef.current) {
      startedRef.current = true;
    }
    setShowHome(false);
    startOpening(selectedOpening);
  }

  function handleGoHome() {
    setShowHome(true);
    startedRef.current = false;
  }

  if (showHome) {
    return (
      <>
        <HomePage
          onSelectOpening={handleSelectOpening}
          onSettingsClick={() => setShowSettings(true)}
        />
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </>
    );
  }

  return (
    <div className="h-screen bg-brand-bg text-slate-100 flex flex-col overflow-hidden">
      <Header
        onSettingsClick={() => setShowSettings(true)}
        onHomeClick={handleGoHome}
      />

      <main ref={mainRef} className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* ── Board area ──────────────────────────────────────── */}
        <div
          ref={boardContainerRef}
          className="flex-1 flex items-center justify-center p-2 sm:p-3 min-w-0 overflow-hidden"
        >
          <ChessBoardPanel boardSize={boardSize} />
        </div>

        {/* Open-sidebar button — only on small screens when sidebar is closed */}
        {isSmallScreen && !sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-brand-surface/95 border border-slate-600/50 rounded-lg px-3 py-2 text-slate-300 hover:text-white hover:border-slate-500 text-sm font-semibold transition-colors cursor-pointer shadow-xl shadow-black/40"
            title="Open panel"
          >
            <PanelRight size={15} />
            <span className="hidden sm:inline">Panel</span>
          </button>
        )}

        {/* Mobile backdrop — only when small screen sidebar is open */}
        {isSmallScreen && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ─────────────────────────────────────────── */}
        {/*
          Desktop (lg+): inline, width transitions 0 ↔ 320px, no translate.
          Mobile: fixed drawer from the right, translate-x controls visibility.
        */}
        <aside
          className={[
            'flex flex-col bg-brand-surface border-l border-slate-700/50 overflow-hidden transition-transform duration-300',
            // large screen — always visible, inline in flex row
            !isSmallScreen
              ? 'relative flex-shrink-0 w-80'
              : '',
            // small screen — fixed right drawer, toggle via translate
            isSmallScreen
              ? `fixed inset-y-0 right-0 w-80 z-40 shadow-2xl shadow-black/60 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`
              : '',
            mode === 'drill' ? 'ring-1 ring-red-900/40' : '',
          ].join(' ')}
        >
          {/* Inner wrapper — fixed width so content never wraps during transition */}
          <div className="relative flex flex-col h-full w-80 overflow-hidden">
            {/* Close button — only on small screens */}
            {isSmallScreen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-3 right-3 z-10 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                title="Close panel"
              >
                <X size={16} />
              </button>
            )}

            {opening && (
              <>
                {/* Opening info + completion percentage */}
                <OpeningInfoPanel opening={opening} />

                {/* Setup progress banner */}
                {phase === 'setup' && (
                  <SetupBanner opening={opening} />
                )}

                {/* Free play banner */}
                {postLine && (
                  <div className="px-4 py-2.5 bg-emerald-900/30 border-b border-emerald-800/40 flex-shrink-0">
                    <p className="text-xs text-emerald-300 font-semibold">
                      Free play — any legal move accepted
                    </p>
                  </div>
                )}

                {/* Timer display (time-trial mode) */}
                {mode === 'time-trial' && <TimerDisplay />}

                {/* Streak banner */}
                {streak >= 3 && phase === 'training' && !postLine && (
                  <div className="px-4 py-1.5 bg-amber-900/20 border-b border-amber-800/30 flex-shrink-0">
                    <p className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                      <Flame size={14} className="text-amber-400" /> {streak} move streak!
                    </p>
                  </div>
                )}

                {/* Line selector */}
                <div className="flex-1 px-4 pt-3 pb-3 border-b border-slate-700/40 min-h-0 overflow-hidden flex flex-col">
                  <LineSelector opening={opening} />
                </div>

                {/* Move list */}
                <div className="px-4 pt-3 pb-3 border-b border-slate-700/40 h-44 flex-shrink-0 flex flex-col">
                  <MoveList />
                </div>

                {/* Controls */}
                <div className="px-4 pt-3 pb-4 flex-shrink-0">
                  <ControlPanel />
                </div>
              </>
            )}
          </div>
        </aside>
      </main>

      {/* Modals */}
      <TrainingSetupModal key={`setup-modal-${phase}`} />
      <CompletionModal />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

// ── Opening info with completion percentage ─────────────────────────

function OpeningInfoPanel({ opening }: { opening: Opening }) {
  const { isLineUnlocked } = useProgressStore();
  const totalLines = opening.lines.length;
  const completedLines = opening.lines.filter((l) =>
    isLineUnlocked(opening.id, l.id),
  ).length;
  const pct = totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0;

  return (
    <div className="px-4 pt-4 pb-3 border-b border-slate-700/40 flex-shrink-0">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
        Opening
      </div>
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <div className="font-bold text-white text-sm truncate">{opening.name}</div>
        {totalLines > 0 && (
          <span className="text-xs text-slate-500 shrink-0">
            <span className={completedLines > 0 ? 'text-emerald-400 font-semibold' : ''}>
              {completedLines}
            </span>/{totalLines}
          </span>
        )}
      </div>
      {totalLines > 0 && (
        <div className="w-full bg-slate-700/60 rounded-full h-1 mb-2">
          <div
            className="bg-emerald-500 h-1 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      <div className="text-xs text-slate-400 leading-relaxed">
        {opening.description}
      </div>
    </div>
  );
}

// ── Setup progress banner ────────────────────────────────────────────

function SetupBanner({ opening }: { opening: { setupMoves: string[] } }) {
  const { currentMoveIndex } = useTrainingStore();
  const total = opening.setupMoves.length;
  const done = Math.min(currentMoveIndex, total);
  const pct = Math.round((done / total) * 100);

  return (
    <div className="px-4 py-3 bg-blue-900/30 border-b border-blue-800/40 flex-shrink-0">
      <div className="text-xs text-blue-300 font-semibold mb-1.5">
        Setup: play the opening moves ({done}/{total})
      </div>
      <div className="w-full bg-slate-700/60 rounded-full h-1.5">
        <div
          className="bg-blue-400 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
