import { useEffect, useRef, useState } from 'react';
import { Flame } from 'lucide-react';
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

export default function App() {
  const { opening, phase, postLine, mode, streak, startOpening } = useTrainingStore();
  const { markSetupComplete, isSetupComplete } = useProgressStore();

  const [showHome, setShowHome] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

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

      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* ── Left: Board ─────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center p-6 min-w-0 overflow-hidden">
          <ChessBoardPanel />
        </div>

        {/* ── Right: Sidebar ───────────────────────────────────────── */}
        <aside className={`w-80 flex-shrink-0 border-l border-slate-700/50 flex flex-col bg-brand-surface/60 backdrop-blur-sm overflow-hidden ${mode === 'drill' ? 'ring-1 ring-red-900/40' : ''}`}>
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
        </aside>
      </main>

      {/* Modals */}
      {/* key resets internal step state every time line-select phase is entered */}
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
        <div className="w-full bg-slate-700/60 rounded-full h-1 mb-1.5">
          <div
            className="bg-emerald-500 h-1 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      <div className="text-xs text-slate-400 leading-relaxed line-clamp-2">
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
