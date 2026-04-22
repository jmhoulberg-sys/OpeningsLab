import { useCallback, useEffect, useRef, useState } from 'react';
import { Flame, PanelRight, X } from 'lucide-react';
import Header from './components/Header/Header';
import ChessBoardPanel from './components/Board/ChessBoardPanel';
import MoveList from './components/MoveList/MoveList';
import LineSelector from './components/LineSelector/LineSelector';
import ControlPanel from './components/Controls/ControlPanel';
import AnalysisPanel from './components/Analysis/AnalysisPanel';
import CompletionModal from './components/Modals/CompletionModal';
import FreePlayEndModal from './components/Modals/FreePlayEndModal';
import TrainingSetupModal from './components/Modals/TrainingSetupModal';
import SettingsModal from './components/Settings/SettingsModal';
import TimerDisplay from './components/Timer/TimerDisplay';
import HomePage from './pages/HomePage';
import { useTrainingStore } from './store/trainingStore';
import { useProgressStore } from './store/progressStore';
import type { Opening, OpeningLine } from './types';

const SIDEBAR_BREAK = 650;
const BOARD_CHROME_H = 115;
const EVAL_BAR_W = 24;

export default function App() {
  const { opening, phase, postLine, postLineOutOfBook, mode, streak, startOpening, selectLine } = useTrainingStore();
  const { markSetupComplete, isSetupComplete, isLineUnlocked } = useProgressStore();

  const [showHome, setShowHome] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(() => window.innerWidth < SIDEBAR_BREAK);
  const [boardSize, setBoardSize] = useState(() =>
    Math.max(240, Math.min(520, window.innerWidth - 40)),
  );

  const mainRef = useRef<HTMLDivElement>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const handleMainResize = useCallback((entries: ResizeObserverEntry[]) => {
    const width = entries[0].contentRect.width;
    setIsSmallScreen(width < SIDEBAR_BREAK);
  }, []);

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
  }, [handleBoardContainerResize, handleMainResize, showHome]);

  useEffect(() => {
    if (phase === 'line-select' && opening && !isSetupComplete(opening.id)) {
      markSetupComplete(opening.id);
    }
  }, [phase, opening, isSetupComplete, markSetupComplete]);

  function handleSelectOpening(selectedOpening: Opening) {
    if (!startedRef.current) {
      startedRef.current = true;
    }
    setShowHome(false);
    startOpening(selectedOpening);
  }

  function handleStartOpeningLine(selectedOpening: Opening, line: OpeningLine) {
    if (!startedRef.current) {
      startedRef.current = true;
    }
    setShowHome(false);
    startOpening(selectedOpening);
    setTimeout(() => {
      selectLine(line);
    }, 0);
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
          onStartOpeningLine={handleStartOpeningLine}
          onSettingsClick={() => setShowSettings(true)}
        />
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-brand-bg text-slate-100">
      <Header
        onSettingsClick={() => setShowSettings(true)}
        onHomeClick={handleGoHome}
      />

      <main ref={mainRef} className="relative flex min-h-0 flex-1 overflow-hidden">
        <div
          ref={boardContainerRef}
          className="flex flex-1 min-w-0 items-center justify-center overflow-hidden px-2 py-2 sm:px-3 sm:py-3"
        >
          <ChessBoardPanel boardSize={boardSize} />
        </div>

        {isSmallScreen && !sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-xl border border-stone-700/40 bg-stone-900 px-3 py-2 text-sm font-semibold text-stone-300 shadow-xl shadow-black/40 transition-colors hover:bg-stone-800 hover:text-white cursor-pointer"
            title="Open panel"
          >
            <PanelRight size={15} />
            <span className="hidden sm:inline">Panel</span>
          </button>
        )}

        {isSmallScreen && sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={[
            'flex flex-col bg-stone-900/96 overflow-hidden transition-transform duration-300',
            !isSmallScreen ? 'relative w-80 flex-shrink-0' : '',
            isSmallScreen
              ? `fixed inset-y-0 right-0 z-40 w-80 shadow-2xl shadow-black/60 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`
              : '',
            mode === 'drill' ? 'ring-1 ring-rose-900/30' : '',
          ].join(' ')}
        >
          <div className="relative flex h-full w-80 flex-col overflow-x-hidden overflow-y-auto">
            {isSmallScreen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute right-3 top-3 z-10 rounded-lg border border-stone-700/40 bg-stone-800 px-2 py-1.5 text-stone-400 transition-colors hover:bg-stone-700 hover:text-stone-200 cursor-pointer"
                title="Close panel"
              >
                <X size={16} />
              </button>
            )}

            {opening && (
              <>
                <div className="px-4 pt-4">
                  <OpeningInfoPanel opening={opening} isLineUnlocked={isLineUnlocked} />
                </div>

                {phase === 'setup' && (
                  <SetupBanner opening={opening} />
                )}

                {postLine && (
                  <div className={`px-4 py-2.5 ${postLineOutOfBook ? 'bg-amber-400/8' : 'bg-emerald-400/8'}`}>
                    <p className={`text-xs font-semibold ${postLineOutOfBook ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {postLineOutOfBook
                        ? 'Out of book - retry the line or choose another'
                        : 'Practice top responses - based on Lichess games'}
                    </p>
                  </div>
                )}

                {mode === 'time-trial' && <TimerDisplay />}

                {streak >= 3 && phase === 'training' && !postLine && (
                  <div className="bg-emerald-300/8 px-4 py-1.5">
                    <p className="flex items-center gap-1 text-xs font-semibold text-emerald-300">
                      <Flame size={14} className="text-emerald-300" /> {streak} move streak
                    </p>
                  </div>
                )}

                <div className="relative flex-shrink-0 px-4 pb-3 pt-3">
                  <LineSelector opening={opening} />
                </div>

                <div className="flex h-44 flex-shrink-0 flex-col px-4 pb-3 pt-1">
                  <MoveList />
                </div>

                <div className="flex-shrink-0 px-4 pb-4 pt-2">
                  <ControlPanel />
                </div>

                {postLine && <AnalysisPanel />}
              </>
            )}
          </div>
        </aside>
      </main>

      <TrainingSetupModal key={`setup-modal-${phase}`} />
      <CompletionModal />
      <FreePlayEndModal />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

function OpeningInfoPanel({
  opening,
  isLineUnlocked,
}: {
  opening: Opening;
  isLineUnlocked: (openingId: string, lineId: string) => boolean;
}) {
  const totalLines = opening.lines.length;
  const completedLines = opening.lines.filter((line) =>
    isLineUnlocked(opening.id, line.id),
  ).length;
  const pct = totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0;

  return (
    <div className="rounded-[20px] border border-stone-800/60 bg-stone-950/55 px-4 pb-4 pt-4">
      <div className="mb-1 text-xs font-bold uppercase tracking-widest text-stone-500">
        Opening
      </div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="truncate text-sm font-bold text-white">{opening.name}</div>
        {totalLines > 0 && (
          <span className="shrink-0 text-xs text-stone-500">
            <span className={completedLines > 0 ? 'font-semibold text-emerald-300' : ''}>
              {completedLines}
            </span>/{totalLines}
          </span>
        )}
      </div>
      {totalLines > 0 && (
        <div className="mb-2 h-1 rounded-full bg-stone-700/50">
          <div
            className="h-1 rounded-full bg-emerald-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      <div className="text-xs leading-relaxed text-stone-400">
        {opening.description}
      </div>
    </div>
  );
}

function SetupBanner({ opening }: { opening: { setupMoves: string[] } }) {
  const { currentMoveIndex } = useTrainingStore();
  const total = opening.setupMoves.length;
  const done = Math.min(currentMoveIndex, total);
  const pct = Math.round((done / total) * 100);

  return (
    <div className="mx-4 rounded-[20px] border border-sky-400/12 bg-sky-400/8 px-4 py-3">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
        Step 1 of 2
      </div>
      <div className="mb-1.5 text-xs font-semibold text-stone-100">
        Learn setup position ({done}/{total})
      </div>
      <div className="h-1.5 w-full rounded-full bg-stone-700/50">
        <div
          className="h-1.5 rounded-full bg-sky-400 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
