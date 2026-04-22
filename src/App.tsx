import { useCallback, useEffect, useRef, useState } from 'react';
import { Flame } from 'lucide-react';
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
import type { Opening } from './types';

const DESKTOP_BREAKPOINT = 1024;
const BOARD_CHROME_H = 142;
const BOARD_STAGE_PADDING = 32;
const EVAL_BAR_W = 28;
const MOBILE_VIEWPORT_MARGIN = 24;

export default function App() {
  const { opening, phase, postLine, mode, streak, startOpening } = useTrainingStore();
  const { markSetupComplete, isSetupComplete } = useProgressStore();

  const [showHome, setShowHome] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= DESKTOP_BREAKPOINT);
  const [boardSize, setBoardSize] = useState(() =>
    Math.max(280, Math.min(640, window.innerWidth - 32)),
  );

  const shellRef = useRef<HTMLDivElement>(null);
  const boardStageRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const recomputeBoardSize = useCallback(() => {
    const shellEl = shellRef.current;
    const boardEl = boardStageRef.current;
    if (!shellEl || !boardEl) return;

    const shellRect = shellEl.getBoundingClientRect();
    const boardRect = boardEl.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const viewportAllowance = Math.max(
      280,
      viewportHeight - shellRect.top - MOBILE_VIEWPORT_MARGIN,
    );

    const maxW = boardRect.width - BOARD_STAGE_PADDING - EVAL_BAR_W;
    const maxH = Math.min(boardRect.height, viewportAllowance) - BOARD_CHROME_H;
    const size = Math.min(840, Math.max(260, Math.min(maxW, maxH)));
    setBoardSize(Math.floor(size));
  }, []);

  useEffect(() => {
    const shellEl = shellRef.current;
    const boardEl = boardStageRef.current;
    if (!shellEl || !boardEl) return;

    const handleShellResize = (entries: ResizeObserverEntry[]) => {
      const width = entries[0].contentRect.width;
      setIsDesktop(width >= DESKTOP_BREAKPOINT);
      recomputeBoardSize();
    };

    const roShell = new ResizeObserver(handleShellResize);
    const roBoard = new ResizeObserver(() => {
      recomputeBoardSize();
    });

    roShell.observe(shellEl);
    roBoard.observe(boardEl);
    window.addEventListener('resize', recomputeBoardSize);
    window.visualViewport?.addEventListener('resize', recomputeBoardSize);
    recomputeBoardSize();

    return () => {
      roShell.disconnect();
      roBoard.disconnect();
      window.removeEventListener('resize', recomputeBoardSize);
      window.visualViewport?.removeEventListener('resize', recomputeBoardSize);
    };
  }, [recomputeBoardSize, showHome]);

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
    <div className="min-h-screen bg-brand-bg text-slate-100 flex flex-col">
      <Header
        onSettingsClick={() => setShowSettings(true)}
        onHomeClick={handleGoHome}
      />

      <main className="flex-1 overflow-y-auto">
        <div
          ref={shellRef}
          className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:min-h-[calc(100vh-73px)] lg:flex-row lg:items-stretch lg:gap-5 lg:overflow-hidden"
        >
          <section
            ref={boardStageRef}
            className="board-stage flex min-h-[calc(100svh-8.5rem)] w-full min-w-0 items-center justify-center overflow-visible rounded-[28px] border border-white/6 bg-brand-stage px-3 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:px-5 sm:py-5 lg:min-h-0 lg:flex-1 lg:px-6 lg:py-6"
          >
            <ChessBoardPanel boardSize={boardSize} />
          </section>

          <aside
            className={[
              'flex w-full flex-col overflow-visible rounded-[24px] border border-white/8 bg-brand-surface/95 shadow-[0_18px_48px_rgba(0,0,0,0.2)] backdrop-blur-sm',
              isDesktop ? 'lg:h-full lg:w-[340px] lg:flex-none lg:overflow-hidden' : '',
              mode === 'drill' ? 'ring-1 ring-red-900/40' : '',
            ].join(' ')}
          >
            <div className="relative flex flex-col overflow-visible lg:h-full lg:overflow-y-auto">
              {opening && (
                <>
                  <OpeningInfoPanel opening={opening} />

                  {phase === 'setup' && (
                    <SetupBanner opening={opening} />
                  )}

                  {postLine && (
                    <div className="px-4 py-2.5 bg-emerald-900/30 border-b border-emerald-800/40 flex-shrink-0">
                      <p className="text-xs text-emerald-300 font-semibold">
                        Free play - any legal move accepted
                      </p>
                    </div>
                  )}

                  {mode === 'time-trial' && <TimerDisplay />}

                  {streak >= 3 && phase === 'training' && !postLine && (
                    <div className="px-4 py-1.5 bg-amber-900/20 border-b border-amber-800/30 flex-shrink-0">
                      <p className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                        <Flame size={14} className="text-amber-400" /> {streak} move streak!
                      </p>
                    </div>
                  )}

                  <div className="flex-shrink-0 relative px-4 pt-3 pb-3 border-b border-slate-700/40">
                    <LineSelector opening={opening} />
                  </div>

                  <div className="px-4 pt-3 pb-3 border-b border-slate-700/40 h-44 flex-shrink-0 flex flex-col">
                    <MoveList />
                  </div>

                  <div className="px-4 pt-3 pb-4 flex-shrink-0">
                    <ControlPanel />
                  </div>

                  {postLine && <AnalysisPanel />}
                </>
              )}
            </div>
          </aside>
        </div>
      </main>

      <TrainingSetupModal key={`setup-modal-${phase}`} />
      <CompletionModal />
      <FreePlayEndModal />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

function OpeningInfoPanel({ opening }: { opening: Opening }) {
  const { isLineUnlocked } = useProgressStore();
  const totalLines = opening.lines.length;
  const completedLines = opening.lines.filter((line) =>
    isLineUnlocked(opening.id, line.id),
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
