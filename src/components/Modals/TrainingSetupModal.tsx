import { useState } from 'react';
import { BookOpen, Layers, Zap, Timer, CalendarClock, X } from 'lucide-react';
import type { TrainingMode } from '../../types';
import { useTrainingStore } from '../../store/trainingStore';
import { useProgressStore } from '../../store/progressStore';
import { useSettingsStore } from '../../store/settingsStore';

export default function TrainingSetupModal() {
  const { phase, opening, selectLine, setMode } = useTrainingStore();
  const { isLineUnlocked, isFavorite, toggleFavorite, isDue } = useProgressStore();
  const { enableSRReminders } = useSettingsStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [chosenMode, setChosenMode] = useState<TrainingMode>('learn');
  const [lineExpanded, setLineExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (phase !== 'line-select' || !opening) return null;

  // When dismissed the modal hides but the backdrop-click re-opens it
  function handleBackdropClick() {
    if (dismissed) {
      // Re-open at step 1
      setDismissed(false);
      setStep(1);
      setLineExpanded(false);
    } else if (step === 2) {
      // Go back to mode selection
      setStep(1);
      setLineExpanded(false);
    }
    // step 1 + not dismissed → do nothing (stay open)
  }

  if (dismissed) {
    // Show a small "Choose training" prompt so user can reopen
    return (
      <div
        className="fixed inset-0 z-40 flex items-end justify-center pb-8 pointer-events-none"
      >
        <button
          onClick={() => { setDismissed(false); setStep(1); }}
          className="pointer-events-auto animate-pulse bg-brand-accent/90 hover:bg-brand-accent text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg shadow-black/40 transition-colors cursor-pointer"
        >
          Choose training mode →
        </button>
      </div>
    );
  }

  function handleModeSelect(mode: TrainingMode) {
    setChosenMode(mode);
    setStep(2);
    setLineExpanded(false);
  }

  function handleSelectLine(lineId: string) {
    const line = opening!.lines.find((l) => l.id === lineId);
    if (!line) return;
    setMode(chosenMode);
    selectLine(line);
  }

  function handleRandom() {
    const lines = opening!.lines;
    const random = lines[Math.floor(Math.random() * lines.length)];
    setMode(chosenMode);
    selectLine(random);
  }

  function handleBack() {
    setStep(1);
    setLineExpanded(false);
  }

  // Completion summary
  const totalLines = opening.lines.length;
  const completedLines = opening.lines.filter((l) =>
    isLineUnlocked(opening.id, l.id),
  ).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-brand-surface border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 p-8 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >

        {step === 1 && (
          <>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-white">
                How do you want to train?
              </h2>
              <button
                onClick={() => setDismissed(true)}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer ml-2"
                title="Dismiss"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-slate-400 text-sm mb-1">
              {opening.name}
            </p>
            {/* Completion indicator */}
            {totalLines > 0 && (
              <div className="flex flex-col items-center mb-5">
                <span className="text-xs text-slate-500 mb-1.5">
                  <span className={completedLines > 0 ? 'text-emerald-400 font-semibold' : ''}>
                    {completedLines}
                  </span>
                  /{totalLines} lines completed
                </span>
                <div className="w-40 bg-slate-700/60 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((completedLines / totalLines) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleModeSelect('learn')}
                className="rounded-xl border border-slate-600/50 bg-slate-800/60 hover:border-blue-500/60 hover:bg-slate-700/60 transition-all p-4 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1 text-blue-400">
                  <BookOpen size={20} />
                  <div className="text-white font-bold text-sm">Learn</div>
                </div>
                <div className="text-slate-400 text-xs">
                  Play the full line with hints available
                </div>
              </button>

              <button
                onClick={() => handleModeSelect('step-by-step')}
                className="rounded-xl border border-slate-600/50 bg-slate-800/60 hover:border-amber-500/60 hover:bg-slate-700/60 transition-all p-4 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1 text-amber-400">
                  <Layers size={20} />
                  <div className="text-white font-bold text-sm">Step by Step</div>
                </div>
                <div className="text-slate-400 text-xs">
                  Build up move by move — master one move at a time
                </div>
              </button>

              <button
                onClick={() => handleModeSelect('drill')}
                className="rounded-xl border border-slate-600/50 bg-slate-800/60 hover:border-red-500/60 hover:bg-slate-700/60 transition-all p-4 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1 text-red-400">
                  <Zap size={20} />
                  <div className="text-white font-bold text-sm">Drill</div>
                </div>
                <div className="text-slate-400 text-xs">
                  No hints. No mercy. Pure recall under pressure.
                </div>
              </button>

              <button
                onClick={() => handleModeSelect('time-trial')}
                className="rounded-xl border border-slate-600/50 bg-slate-800/60 hover:border-cyan-500/60 hover:bg-slate-700/60 transition-all p-4 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1 text-cyan-400">
                  <Timer size={20} />
                  <div className="text-white font-bold text-sm">Time Trial</div>
                </div>
                <div className="text-slate-400 text-xs">
                  60 seconds. Each correct move adds time. Beat the clock.
                </div>
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-center mb-5">
              <button
                onClick={handleBack}
                className="text-slate-400 hover:text-white text-sm transition-colors cursor-pointer mr-3"
              >
                ← Back
              </button>
              <h2 className="text-xl font-bold text-white">Choose your line</h2>
            </div>

            <div className="flex flex-col gap-3">
              {/* Choose a line — expandable */}
              <div className="rounded-xl border border-slate-600/50 bg-slate-800/60 overflow-hidden">
                <button
                  onClick={() => setLineExpanded((v) => !v)}
                  className="w-full p-4 text-left flex items-center justify-between cursor-pointer hover:bg-slate-700/40 transition-colors"
                >
                  <div>
                    <div className="text-white font-bold text-sm">Choose a line</div>
                    <div className="text-slate-400 text-xs mt-0.5">
                      Pick a specific variation
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs ml-2">
                    {lineExpanded ? '▲' : '▼'}
                  </span>
                </button>

                {lineExpanded && (
                  <div className="border-t border-slate-700/50 divide-y divide-slate-700/40">
                    {opening.lines.map((line) => {
                      const unlocked = isLineUnlocked(opening.id, line.id);
                      const fav = isFavorite(opening.id, line.id);
                      const due = isDue(opening.id, line.id);
                      const showDueBadge = fav && due && enableSRReminders;
                      return (
                        <div key={line.id} className="flex items-center">
                          <button
                            onClick={() => handleSelectLine(line.id)}
                            className="flex-1 px-4 py-3 text-left flex items-center gap-2 hover:bg-slate-700/50 transition-colors cursor-pointer"
                          >
                            {/* Completion check */}
                            <span
                              className={`flex-shrink-0 ${
                                unlocked ? 'text-emerald-400' : 'text-slate-600'
                              }`}
                              title={unlocked ? 'Completed' : 'Not completed'}
                            >
                              {unlocked
                                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              }
                            </span>
                            <span className="text-slate-200 text-sm">{line.name}</span>
                            {showDueBadge && (
                              <span className="ml-auto flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-cyan-300 bg-cyan-900/40 border border-cyan-700/40 rounded px-1.5 py-0.5">
                                <CalendarClock size={12} /> Due
                              </span>
                            )}
                          </button>
                          {/* Favourite star */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(opening.id, line.id);
                            }}
                            title={fav ? 'Remove from favourites' : 'Add to favourites'}
                            className={`px-3 py-3 transition-colors cursor-pointer ${
                              fav ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-600 hover:text-slate-400'
                            }`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Random line */}
              <button
                onClick={handleRandom}
                className="w-full rounded-xl border border-slate-600/50 bg-slate-800/60 hover:border-brand-accent/60 hover:bg-slate-700/60 transition-all p-4 text-left cursor-pointer"
              >
                <div className="text-white font-bold text-sm mb-1">Random line</div>
                <div className="text-slate-400 text-xs">
                  Surprise me — pick a random variation
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
