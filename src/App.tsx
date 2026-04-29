import { useCallback, useEffect, useRef, useState } from 'react';
import { Flame, PanelRight, X } from 'lucide-react';
import Header from './components/Header/Header';
import AuthModal from './components/Auth/AuthModal';
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
import ProfilePage from './pages/ProfilePage';
import { useTrainingStore } from './store/trainingStore';
import { useProgressStore } from './store/progressStore';
import { useProfileStore } from './store/profileStore';
import type { Opening, OpeningLine } from './types';

const SIDEBAR_BREAK = 1100;
const BOARD_CHROME_H = 236;
const EVAL_BAR_W = 24;

export default function App() {
  const { opening, phase, postLine, postLineOutOfBook, postLineError, mode, streak, startOpening } = useTrainingStore();
  const { markSetupComplete, isSetupComplete, isLineUnlocked } = useProgressStore();
  const { } = useProfileStore();

  const [showHome, setShowHome] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
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

  function handleStartOpeningLine(selectedOpening: Opening, _line: OpeningLine) {
    if (!startedRef.current) {
      startedRef.current = true;
    }
    setShowHome(false);
    startOpening(selectedOpening);
  }

  function handleGoHome() {
    setShowHome(true);
    setShowProfile(false);
    startedRef.current = false;
  }

  function handleProfileClick() {
    setShowProfile(true);
  }

  if (showHome) {
    return (
      <>
        <HomePage
          onSelectOpening={handleSelectOpening}
          onStartOpeningLine={handleStartOpeningLine}
          onSettingsClick={() => setShowSettings(true)}
          onProfileClick={handleProfileClick}
        />
        <AuthModal />
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        {showProfile && <ProfilePage onBack={() => setShowProfile(false)} />}
      </>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-brand-bg text-slate-100">
      <Header
        onSettingsClick={() => setShowSettings(true)}
        onHomeClick={handleGoHome}
        onProfileClick={handleProfileClick}
      />

      <main ref={mainRef} className="relative min-h-0 flex-1 overflow-hidden">
        <div className={`mx-auto grid h-full w-full max-w-[1500px] gap-4 p-3 ${isSmallScreen ? 'grid-cols-1' : 'grid-cols-[minmax(0,1fr)_360px]'}`}>
          <section
            ref={boardContainerRef}
            className="flex min-h-0 min-w-0 items-start justify-center overflow-hidden rounded-[28px] bg-stone-950/35 px-2 py-2 sm:px-4 sm:py-3"
          >
            <ChessBoardPanel boardSize={boardSize} />
          </section>

          {!isSmallScreen && opening && (
            <section className="min-h-0 overflow-hidden rounded-[28px] border border-stone-800/65 bg-stone-950/86 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <TrainingPanelContent
                opening={opening}
                mode={mode}
                phase={phase}
                postLine={postLine}
                postLineError={postLineError}
                postLineOutOfBook={postLineOutOfBook}
                streak={streak}
                isLineUnlocked={isLineUnlocked}
                onHomeClick={handleGoHome}
              />
            </section>
          )}
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

        {isSmallScreen && opening && (
          <aside
            className={`fixed inset-y-0 right-0 z-40 w-80 overflow-hidden border-l border-stone-800/60 bg-stone-950/96 shadow-2xl shadow-black/60 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="relative h-full">
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute right-3 top-3 z-10 rounded-lg border border-stone-700/40 bg-stone-800 px-2 py-1.5 text-stone-400 transition-colors hover:bg-stone-700 hover:text-stone-200 cursor-pointer"
                title="Close panel"
              >
                <X size={16} />
              </button>
              <TrainingPanelContent
                opening={opening}
                mode={mode}
                phase={phase}
                postLine={postLine}
                postLineError={postLineError}
                postLineOutOfBook={postLineOutOfBook}
                streak={streak}
                isLineUnlocked={isLineUnlocked}
                onHomeClick={handleGoHome}
              />
            </div>
          </aside>
        )}
      </main>

      <TrainingSetupModal key={`setup-modal-${phase}`} />
      <CompletionModal />
      <FreePlayEndModal />
      <AuthModal />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      {showProfile && <ProfilePage onBack={() => setShowProfile(false)} />}
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

function TrainingPanelContent({
  opening,
  mode,
  phase,
  postLine,
  postLineError,
  postLineOutOfBook,
  streak,
  isLineUnlocked,
  onHomeClick,
}: {
  opening: Opening;
  mode: string;
  phase: string;
  postLine: boolean;
  postLineError: string | null;
  postLineOutOfBook: boolean;
  streak: number;
  isLineUnlocked: (openingId: string, lineId: string) => boolean;
  onHomeClick: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden px-4 py-4">
      <ControlPanel onHomeClick={onHomeClick} />

      <div className="mt-4">
        <OpeningInfoPanel opening={opening} isLineUnlocked={isLineUnlocked} />
      </div>

      {postLine && (
        <div className={`mt-3 rounded-2xl border px-4 py-3 ${postLineError || postLineOutOfBook ? 'border-amber-300/18 bg-amber-400/8' : 'border-emerald-300/18 bg-emerald-400/8'}`}>
          <p className={`text-xs font-semibold leading-relaxed ${postLineError || postLineOutOfBook ? 'text-amber-300' : 'text-emerald-300'}`}>
            {postLineError
              ? postLineError
              : postLineOutOfBook
              ? 'Out of database. Retry the line or choose another.'
              : 'Practicing top responses from Lichess games.'}
          </p>
        </div>
      )}

      {mode === 'time-trial' && (
        <div className="mt-3">
          <TimerDisplay />
        </div>
      )}

      {streak >= 3 && phase === 'training' && !postLine && (
        <div className="mt-3 rounded-2xl border border-emerald-300/18 bg-emerald-300/8 px-4 py-2">
          <p className="flex items-center gap-1 text-xs font-semibold text-emerald-300">
            <Flame size={14} className="text-emerald-300" /> {streak} move streak
          </p>
        </div>
      )}

      <div className="mt-4 flex-shrink-0">
        <LineSelector opening={opening} />
      </div>

      <div className="mt-3 flex h-44 flex-shrink-0 flex-col">
        <MoveList />
      </div>

      {postLine && <AnalysisPanel />}
    </div>
  );
}
