import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  House,
  Lock,
  PanelRight,
  RotateCcw,
  Route,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import Header from './components/Header/Header';
import AuthModal from './components/Auth/AuthModal';
import ChessBoardPanel from './components/Board/ChessBoardPanel';
import AnalysisPanel from './components/Analysis/AnalysisPanel';
import CompletionModal from './components/Modals/CompletionModal';
import FreePlayEndModal from './components/Modals/FreePlayEndModal';
import TrainingSetupModal from './components/Modals/TrainingSetupModal';
import SettingsModal from './components/Settings/SettingsModal';
import TimerDisplay from './components/Timer/TimerDisplay';
import OpeningFinder from './components/Finder/OpeningFinder';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import { useTrainingStore } from './store/trainingStore';
import { useProgressStore } from './store/progressStore';
import { getCoachingNote } from './data/coachingNotes';
import { getSetupFen } from './engine/chessEngine';
import { fetchLichessBookPosition } from './services/lichessBookService';
import type { Opening, OpeningLine, TrainingMode } from './types';

const SIDEBAR_BREAK = 1100;
const BOARD_CHROME_H = 104;
const EVAL_BAR_W = 24;

export default function App() {
  const { opening, phase, postLine, postLineOutOfBook, postLineError, mode, startOpening, selectLine } = useTrainingStore();
  const { markSetupComplete, isSetupComplete, isLineUnlocked } = useProgressStore();

  const [showHome, setShowHome] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFinder, setShowFinder] = useState(false);
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
    setShowFinder(false);
    startedRef.current = false;
  }

  function handleProfileClick() {
    setShowHome(false);
    setShowFinder(false);
    setShowSettings(false);
    setShowProfile(true);
  }

  function handleOpenFinder() {
    setShowHome(false);
    setShowProfile(false);
    setShowSettings(false);
    setShowFinder(true);
  }

  function handleStartFinderLine(selectedOpening: Opening, line: OpeningLine) {
    if (!startedRef.current) {
      startedRef.current = true;
    }
    setShowHome(false);
    setShowFinder(false);
    startOpening(selectedOpening);
    selectLine(line);
  }

  function handleStartFinderOpening(selectedOpening: Opening) {
    if (!startedRef.current) {
      startedRef.current = true;
    }
    setShowHome(false);
    setShowFinder(false);
    startOpening(selectedOpening);
  }

  if (showSettings) {
    return (
      <>
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onOpenFinder={handleOpenFinder}
        />
        <AuthModal />
      </>
    );
  }

  if (showProfile) {
    return (
      <>
        <ProfilePage onBack={() => setShowProfile(false)} />
        <AuthModal />
      </>
    );
  }

  if (showFinder) {
    return (
      <>
        <OpeningFinder
          onBack={handleGoHome}
          onOpenOpening={handleStartFinderOpening}
          onStartPractice={handleStartFinderLine}
        />
        <AuthModal />
      </>
    );
  }

  if (showHome) {
    return (
      <>
        <HomePage
          onSelectOpening={handleSelectOpening}
          onStartOpeningLine={handleStartOpeningLine}
          onSettingsClick={() => setShowSettings(true)}
          onProfileClick={handleProfileClick}
          onOpenFinder={handleOpenFinder}
        />
        <AuthModal />
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
            className="flex min-h-0 min-w-0 items-start justify-center overflow-hidden rounded-[28px] bg-stone-950/35 px-2 pb-4 pt-3 sm:px-4"
          >
            <ChessBoardPanel boardSize={boardSize} />
          </section>

          {!isSmallScreen && opening && (
            <section className="min-h-0 overflow-hidden rounded-[28px] border border-stone-800/65 bg-stone-950/86 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <TrainingPanelContent
                opening={opening}
                mode={mode}
                postLine={postLine}
                postLineError={postLineError}
                postLineOutOfBook={postLineOutOfBook}
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
            className={`fixed inset-y-0 right-0 z-40 w-screen max-w-[22rem] overflow-hidden border-l border-stone-800/60 bg-stone-950 shadow-2xl shadow-black/60 transition-transform duration-300 max-[380px]:max-w-none ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
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
                postLine={postLine}
                postLineError={postLineError}
                postLineOutOfBook={postLineOutOfBook}
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
    </div>
  );
}

function TrainingPanelContent({
  opening,
  mode,
  postLine,
  postLineError,
  postLineOutOfBook,
  isLineUnlocked,
  onHomeClick,
}: {
  opening: Opening;
  mode: string;
  postLine: boolean;
  postLineError: string | null;
  postLineOutOfBook: boolean;
  isLineUnlocked: (openingId: string, lineId: string) => boolean;
  onHomeClick: () => void;
}) {
  return (
      <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden px-4 pb-4 pt-3">
      <CoachCard />

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

      {postLine && <AnalysisPanel />}

      <div className="mt-auto space-y-3 pt-3">
        <ModeSelector opening={opening} isLineUnlocked={isLineUnlocked} />
        <OpeningLineDropdown opening={opening} isLineUnlocked={isLineUnlocked} />
        <CompactActions onHomeClick={onHomeClick} />
      </div>
    </div>
  );
}

function CoachCard() {
  const {
    opening,
    selectedLine,
    phase,
    mode,
    currentMoveIndex,
    isAwaitingUserMove,
    wrongMoveFen,
    viewMoveIndex,
    postLine,
  } = useTrainingStore();
  const isReviewing = viewMoveIndex !== null;
  const expectedSan = !isReviewing && isAwaitingUserMove
    ? (phase === 'setup'
      ? opening?.setupMoves[currentMoveIndex] ?? null
      : selectedLine?.moves[currentMoveIndex]?.san ?? null)
    : null;
  const coachingNote = getCoachingNote(
    opening,
    selectedLine,
    phase === 'setup' ? 'setup' : 'training',
    currentMoveIndex,
    expectedSan,
  );
  const message = getCoachMessage({
    phase,
    mode,
    isAwaitingUserMove,
    wrongMoveFen,
    isReviewing,
    postLine,
    expectedSan,
    coachingNote,
  });

  return (
    <section className="min-h-[148px] rounded-[20px] border border-stone-800/55 bg-stone-950/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-black text-white">
          <BookOpen size={17} className="text-sky-300" />
          Coach
        </div>
        <span className="min-h-[16px] text-xs font-semibold text-stone-500">
          {selectedLine?.name ?? ''}
        </span>
      </div>
      <div className="min-h-[76px] rounded-2xl bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-stone-950 shadow-[0_14px_30px_rgba(0,0,0,0.25)]">
        {message.text}
      </div>
      {message.action && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-sky-200">
          <Sparkles size={13} />
          {message.action}
        </div>
      )}
    </section>
  );
}

function getCoachMessage({
  phase,
  mode,
  isAwaitingUserMove,
  wrongMoveFen,
  isReviewing,
  postLine,
  expectedSan,
  coachingNote,
}: {
  phase: string;
  mode: string;
  isAwaitingUserMove: boolean;
  wrongMoveFen: string | null;
  isReviewing: boolean;
  postLine: boolean;
  expectedSan: string | null;
  coachingNote: string | null;
}) {
  if (isReviewing) {
    return { text: 'You are reviewing the move history. Jump back live when you are ready to continue.' };
  }
  if (wrongMoveFen) {
    return { text: 'That move stepped out of the line. Reset the marker, then play the book idea again.' };
  }
  if (phase === 'setup') {
    return {
      text: isAwaitingUserMove
        ? (coachingNote ?? 'Build the starting position carefully. This is the foundation for every line.')
        : 'Watch the reply and notice what it changes before you make the next move.',
      action: isAwaitingUserMove && expectedSan ? `Play ${expectedSan}` : undefined,
    };
  }
  if (phase === 'line-select') {
    return { text: 'Pick the line you want to train. Start with Learn if it is new, then prove it in practice.' };
  }
  if (postLine) {
    return {
      text: isAwaitingUserMove
        ? 'The book line is over. Now choose a practical move that keeps your position easy to play.'
        : 'Your opponent is choosing from real game responses. Read the position, then continue.',
    };
  }
  if (phase === 'training' && isAwaitingUserMove) {
    if (mode === 'learn') {
      return {
        text: coachingNote ?? 'I am showing the answer this time. Play it, then notice why that square matters.',
        action: expectedSan ? `Play ${expectedSan}` : 'Answer shown',
      };
    }
    if (mode === 'step-by-step') {
      return {
        text: coachingNote ?? 'You know the idea now. Find the next move from memory and keep the plan intact.',
        action: expectedSan ? `Target ${expectedSan}` : 'From memory',
      };
    }
    if (mode === 'full-line') {
      return {
        text: coachingNote ?? 'Run the full line without help. One clean sequence is what unlocks the course.',
        action: expectedSan ? `Find ${expectedSan}` : 'Full line',
      };
    }
    if (mode === 'drill') {
      return {
        text: coachingNote ?? 'Recognize the branch, play the line, then I will shuffle you into the next one.',
        action: expectedSan ? `Find ${expectedSan}` : 'Drill',
      };
    }
    return { text: coachingNote ?? 'Play fast, but keep the idea clear. Accuracy first, speed second.' };
  }
  if (phase === 'completed') {
    return { text: 'Line complete. Repeat it once more or choose another line while the pattern is fresh.' };
  }
  return { text: 'Stay calm, read the position, and make the move that fits the opening plan.' };
}

function ModeSelector({
  opening,
  isLineUnlocked,
}: {
  opening: Opening;
  isLineUnlocked: (openingId: string, lineId: string) => boolean;
}) {
  const { phase, selectedLine, mode, setMode, openLineSelectModal, startDrill } = useTrainingStore();
  const setupDone = useProgressStore((state) => state.isSetupComplete(opening.id));
  const completedLines = opening.lines.filter((line) => isLineUnlocked(opening.id, line.id)).length;
  const totalLines = opening.lines.length;
  const drillUnlocked = completedLines >= 3;
  const modes: Array<{
    value: TrainingMode;
    label: string;
    icon: React.ReactNode;
    unlocked: boolean;
    help?: string;
    lockLabel?: string;
  }> = [
    {
      value: 'learn',
      label: 'Learn',
      icon: <BookOpen size={16} />,
      unlocked: true,
      help: `${completedLines}/${totalLines} lines learned`,
    },
    {
      value: 'step-by-step',
      label: 'Practice',
      icon: <Target size={16} />,
      unlocked: setupDone && completedLines > 0,
      help: `${completedLines}/${completedLines} lines available`,
      lockLabel: 'Learn 1 line',
    },
  ];

  return (
    <section className="rounded-[20px] border border-stone-800/55 bg-stone-950/55 p-3">
      <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Mode</div>
      <div className="grid gap-2">
        {modes.map((item) => {
          const active = item.value === 'step-by-step'
            ? mode === 'step-by-step' || mode === 'full-line' || mode === 'drill'
            : mode === item.value;
          return (
            <button
              key={item.value}
              onClick={() => {
                if (!item.unlocked) return;
                if (phase === 'line-select') {
                  openLineSelectModal(item.value);
                } else {
                  setMode(item.value);
                }
              }}
              disabled={!item.unlocked}
              className={`min-h-[58px] rounded-2xl border px-3 py-2 text-left transition-colors ${
                active
                  ? 'border-sky-300/45 bg-sky-500/16 text-white'
                  : item.unlocked
                    ? 'border-stone-800/70 bg-stone-900/80 text-stone-200 hover:bg-stone-800 cursor-pointer'
                    : 'border-stone-800/45 bg-stone-900/35 text-stone-600 cursor-not-allowed'
              }`}
              title={item.unlocked ? item.label : item.lockLabel}
            >
              <div className="flex items-center gap-2 text-sm font-black">
                <span className={active ? 'text-sky-300' : item.unlocked ? 'text-stone-300' : 'text-stone-600'}>
                  {item.unlocked ? item.icon : <Lock size={15} />}
                </span>
                {item.label}
              </div>
              {(item.help || !item.unlocked) && (
                <div className={`mt-1 text-[11px] font-semibold ${item.unlocked ? 'text-stone-400' : 'text-stone-600'}`}>
                  {item.unlocked ? item.help : item.lockLabel}
                </div>
              )}
            </button>
          );
        })}
        {selectedLine && phase === 'training' && (mode === 'step-by-step' || mode === 'full-line') && (
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-stone-800/70 bg-stone-900/80 p-1">
            {[
              ['step-by-step', 'Step'],
              ['full-line', 'Full'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMode(value as TrainingMode)}
                className={`h-9 rounded-xl text-xs font-black transition-colors ${
                  mode === value
                    ? 'bg-sky-400 text-slate-950'
                    : 'text-stone-400 hover:bg-stone-800 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (drillUnlocked) {
                if (phase === 'line-select') openLineSelectModal('drill');
                else startDrill();
              }
            }}
            disabled={!drillUnlocked}
            className={`min-h-[58px] rounded-2xl border px-3 py-2 text-left transition-colors ${
              drillUnlocked
                ? mode === 'drill'
                  ? 'border-emerald-300/45 bg-emerald-400/14 text-white'
                  : 'border-stone-800/70 bg-stone-900/80 text-stone-200 hover:bg-stone-800 cursor-pointer'
                : 'border-stone-800/45 bg-stone-900/35 text-stone-600 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-black">
              {drillUnlocked ? <Route size={15} /> : <Lock size={15} />}
              Drill
            </div>
            <div className="mt-1 text-[11px] font-semibold">
              {drillUnlocked ? 'Shuffle lines' : 'Learn 3 lines'}
            </div>
          </button>
          {[
            ['Speed', 'Learn 3 lines'],
          ].map(([label, lockLabel]) => (
            <div
              key={label}
              className="min-h-[58px] rounded-2xl border border-stone-800/45 bg-stone-900/35 px-3 py-2 text-left text-stone-600"
            >
              <div className="flex items-center gap-2 text-sm font-black">
                <Lock size={15} />
                {label}
              </div>
              <div className="mt-1 text-[11px] font-semibold">{lockLabel}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OpeningLineDropdown({
  opening,
  isLineUnlocked,
}: {
  opening: Opening;
  isLineUnlocked: (openingId: string, lineId: string) => boolean;
}) {
  const { selectedLine, selectLine, phase } = useTrainingStore();
  const setupDone = useProgressStore((state) => state.isSetupComplete(opening.id));
  const completedLines = opening.lines.filter((line) => isLineUnlocked(opening.id, line.id)).length;
  const [open, setOpen] = useState(false);
  const [lineFrequencies, setLineFrequencies] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    if (!setupDone || !open) return;

    fetchLichessBookPosition(getSetupFen(opening), { topMoves: 10, playedSans: opening.setupMoves })
      .then((result) => {
        if (cancelled || result.status !== 'ok' || !result.position) return;
        const total = Math.max(1, result.position.totalGames);
        const normalise = (value: string) => value.replace(/[+#!?]/g, '').trim();
        const bySan = new Map(
          result.position.moves.map((move) => [normalise(move.san), Math.round((move.popularity / total) * 100)]),
        );
        setLineFrequencies(Object.fromEntries(
          opening.lines.map((line) => {
            const nextMove = line.moves[opening.setupMoves.length]?.san;
            return [line.id, nextMove ? bySan.get(normalise(nextMove)) ?? 0 : 0];
          }),
        ));
      })
      .catch(() => {
        if (!cancelled) setLineFrequencies({});
      });

    return () => {
      cancelled = true;
    };
  }, [open, opening, setupDone]);

  return (
    <section className="relative rounded-[20px] border border-stone-800/55 bg-stone-950/55 p-3">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-stone-900/90 px-3 py-3 text-left transition-colors hover:bg-stone-800 cursor-pointer"
      >
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Opening</div>
          <div className="mt-1 truncate text-sm font-black text-white">{opening.name}</div>
          <div className="mt-0.5 truncate text-xs text-stone-400">
            {selectedLine?.name ?? (phase === 'setup' ? 'Setup position' : 'Choose a line')}
          </div>
        </div>
        <ChevronDown size={18} className={`shrink-0 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-[calc(100%-0.5rem)] z-20 max-h-80 overflow-y-auto rounded-2xl border border-stone-700/70 bg-stone-950 p-2 shadow-2xl shadow-black/45">
          <div className="mb-1 flex items-center justify-between px-2 py-1 text-xs font-semibold text-stone-500">
            <span>{completedLines}/{opening.lines.length} mastered</span>
            <span>{setupDone ? 'Ready' : 'Setup first'}</span>
          </div>
          {opening.lines.map((line) => {
            const mastered = isLineUnlocked(opening.id, line.id);
            const available = setupDone;
            const active = selectedLine?.id === line.id;
            return (
              <button
                key={line.id}
                onClick={() => {
                  if (!available) return;
                  selectLine(line);
                  setOpen(false);
                }}
                disabled={!available}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? 'bg-sky-500/16 text-sky-100'
                    : available
                      ? 'text-stone-200 hover:bg-stone-800 cursor-pointer'
                      : 'text-stone-600 cursor-not-allowed'
                }`}
              >
                {mastered ? <Sparkles size={14} className="text-emerald-300" /> : <Lock size={14} />}
                <span className="min-w-0 flex-1 truncate font-semibold">{line.name}</span>
                {setupDone && (
                  <span className="shrink-0 rounded-full bg-stone-800 px-2 py-0.5 text-[11px] font-black text-stone-300">
                    {lineFrequencies[line.id] != null ? `${lineFrequencies[line.id]}%` : '--'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CompactActions({ onHomeClick }: { onHomeClick: () => void }) {
  const { phase, selectedLine, restart, backToLineSelect } = useTrainingStore();
  const canRestart = !!selectedLine || phase === 'training' || phase === 'completed';
  const canGoBack = phase === 'training' || phase === 'completed';

  return (
    <div className="grid grid-cols-3 gap-2">
      <IconAction onClick={backToLineSelect} disabled={!canGoBack} title="Choose line">
        <ArrowLeft size={16} />
      </IconAction>
      <IconAction onClick={restart} disabled={!canRestart} title="Restart line">
        <RotateCcw size={16} />
      </IconAction>
      <IconAction onClick={onHomeClick} title="Front page">
        <House size={16} />
      </IconAction>
    </div>
  );
}

function IconAction({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="flex h-10 items-center justify-center rounded-2xl border border-stone-800/70 bg-stone-900/80 text-stone-300 transition-colors hover:bg-stone-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer"
    >
      {children}
    </button>
  );
}
