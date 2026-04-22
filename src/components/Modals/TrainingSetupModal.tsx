import { useState } from 'react';
import { BookOpen, CalendarClock, Layers, Lock, Swords, Timer, X, Zap } from 'lucide-react';
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
  const currentOpening = opening;

  const totalLines = currentOpening.lines.length;
  const completedLines = currentOpening.lines.filter((line) =>
    isLineUnlocked(currentOpening.id, line.id),
  ).length;
  const setupComplete = totalLines > 0;
  const modeCards = getModeCards(setupComplete, completedLines);

  function handleBackdropClick() {
    if (dismissed) {
      setDismissed(false);
      setStep(1);
      setLineExpanded(false);
    } else if (step === 2) {
      setStep(1);
      setLineExpanded(false);
    }
  }

  if (dismissed) {
    return (
      <div className="fixed inset-0 z-40 flex items-end justify-center pb-8 pointer-events-none">
        <button
          onClick={() => { setDismissed(false); setStep(1); }}
          className="pointer-events-auto animate-pulse rounded-full bg-sky-500/90 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-black/40 transition-colors hover:bg-sky-400 cursor-pointer"
        >
          {'Choose training mode ->'}
        </button>
      </div>
    );
  }

  function handleModeSelect(mode: TrainingMode, unlocked: boolean) {
    if (!unlocked) return;
    setChosenMode(mode);
    setStep(2);
    setLineExpanded(false);
  }

  function handleSelectLine(lineId: string) {
    const line = currentOpening.lines.find((entry) => entry.id === lineId);
    if (!line) return;
    setMode(chosenMode);
    selectLine(line);
  }

  function handleRandom() {
    const lines = currentOpening.lines;
    const random = lines[Math.floor(Math.random() * lines.length)];
    setMode(chosenMode);
    selectLine(random);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-700/60 bg-brand-surface p-8 shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 1 && (
          <>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Pick your training mode
              </h2>
              <button
                onClick={() => setDismissed(true)}
                className="ml-2 text-slate-500 transition-colors hover:text-slate-300 cursor-pointer"
                title="Dismiss"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-400">
              {currentOpening.name}
            </p>

            <div className="mt-5 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Course progress
                  </div>
                  <div className="mt-1 text-lg font-bold text-white">
                    {completedLines}/{totalLines} lines discovered
                  </div>
                </div>
                <div className="text-sm text-emerald-300">
                  {Math.round((completedLines / Math.max(1, totalLines)) * 100)}%
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.round((completedLines / Math.max(1, totalLines)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {modeCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleModeSelect(card.id, card.unlocked)}
                  className={`rounded-xl p-4 text-left transition-all ${
                    card.unlocked
                      ? 'border border-slate-600/50 bg-slate-800/60 hover:bg-slate-700/60 cursor-pointer'
                      : 'border border-slate-800 bg-slate-900/70 cursor-default'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={`mb-1 flex items-center gap-2 ${card.color}`}>
                        {card.icon}
                        <div className="text-sm font-bold text-white">{card.label}</div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {card.description}
                      </div>
                    </div>
                    {!card.unlocked && <Lock size={15} className="mt-0.5 text-slate-600" />}
                  </div>
                  <div className={`mt-3 text-xs font-semibold ${card.unlocked ? 'text-emerald-300' : 'text-slate-500'}`}>
                    {card.unlocked ? 'Ready' : card.unlockText}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-slate-700/50 bg-slate-900/50 p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Mode ladder
              </div>
              <div className="grid gap-2 sm:grid-cols-5">
                {[
                  { label: 'Learn', unlocked: modeCards[0].unlocked, icon: <BookOpen size={13} /> },
                  { label: 'Practice', unlocked: modeCards[1].unlocked, icon: <Layers size={13} /> },
                  { label: 'Drill', unlocked: modeCards[2].unlocked, icon: <Zap size={13} /> },
                  { label: 'Top moves', unlocked: completedLines >= 1, icon: <Swords size={13} /> },
                  { label: 'Speed', unlocked: modeCards[3].unlocked, icon: <Timer size={13} /> },
                ].map((item, index) => (
                  <div
                    key={item.label}
                    className={`rounded-xl px-3 py-2 text-center text-xs font-semibold ${
                      item.unlocked ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-center gap-1">
                      <span className={item.unlocked ? 'text-sky-300' : 'text-slate-600'}>{index + 1}</span>
                      {item.icon}
                    </div>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="mb-5 flex items-center">
              <button
                onClick={() => { setStep(1); setLineExpanded(false); }}
                className="mr-3 text-sm text-slate-400 transition-colors hover:text-white cursor-pointer"
              >
                {'<- Back'}
              </button>
              <div>
                <h2 className="text-xl font-bold text-white">Choose your line</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {currentOpening.name} / {modeCards.find((card) => card.id === chosenMode)?.label}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/60">
                <button
                  onClick={() => setLineExpanded((value) => !value)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-700/40 cursor-pointer"
                >
                  <div>
                    <div className="text-sm font-bold text-white">Choose a line</div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      Pick a specific variation
                    </div>
                  </div>
                  <span className="ml-2 text-xs text-slate-400">
                    {lineExpanded ? '^' : 'v'}
                  </span>
                </button>

                {lineExpanded && (
                  <div className="divide-y divide-slate-700/40 border-t border-slate-700/50">
                    {currentOpening.lines.map((line) => {
                      const unlocked = isLineUnlocked(currentOpening.id, line.id);
                      const fav = isFavorite(currentOpening.id, line.id);
                      const due = isDue(currentOpening.id, line.id);
                      const showDueBadge = fav && due && enableSRReminders;

                      return (
                        <div key={line.id} className="flex items-center">
                          <button
                            onClick={() => handleSelectLine(line.id)}
                            className="flex flex-1 items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-700/50 cursor-pointer"
                          >
                            <span
                              className={`flex-shrink-0 ${unlocked ? 'text-emerald-400' : 'text-slate-600'}`}
                              title={unlocked ? 'Completed' : 'Not completed'}
                            >
                              {unlocked
                                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>}
                            </span>
                            <span className="text-sm text-slate-200">{line.name}</span>
                            {showDueBadge && (
                              <span className="ml-auto flex flex-shrink-0 items-center gap-1 rounded bg-cyan-900/40 px-1.5 py-0.5 text-xs font-semibold text-cyan-300">
                                <CalendarClock size={12} /> Due
                              </span>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(currentOpening.id, line.id);
                            }}
                            title={fav ? 'Remove from favourites' : 'Add to favourites'}
                            className={`px-3 py-3 transition-colors cursor-pointer ${
                              fav ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-600 hover:text-slate-400'
                            }`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={handleRandom}
                className="w-full rounded-xl border border-slate-600/50 bg-slate-800/60 p-4 text-left transition-all hover:border-sky-500/60 hover:bg-slate-700/60 cursor-pointer"
              >
                <div className="mb-1 text-sm font-bold text-white">Random line</div>
                <div className="text-xs text-slate-400">
                  Surprise me and launch a random variation
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function getModeCards(setupComplete: boolean, completedLines: number) {
  return [
    {
      id: 'learn' as TrainingMode,
      label: 'Learn',
      description: 'Hints on. Best for first passes through a line.',
      unlocked: true,
      unlockText: '',
      color: 'text-sky-400',
      icon: <BookOpen size={20} />,
    },
    {
      id: 'step-by-step' as TrainingMode,
      label: 'Practice',
      description: 'Build the line in chunks and lock in the sequence.',
      unlocked: setupComplete,
      unlockText: 'Finish setup to unlock',
      color: 'text-sky-400',
      icon: <Layers size={20} />,
    },
    {
      id: 'drill' as TrainingMode,
      label: 'Drill',
      description: 'No hints. Pure recall once one line is discovered.',
      unlocked: completedLines >= 1,
      unlockText: 'Complete 1 line to unlock',
      color: 'text-emerald-400',
      icon: <Zap size={20} />,
    },
    {
      id: 'time-trial' as TrainingMode,
      label: 'Speed',
      description: 'Race the clock once you know a few lines.',
      unlocked: completedLines >= 3,
      unlockText: 'Complete 3 lines to unlock',
      color: 'text-cyan-400',
      icon: <Timer size={20} />,
    },
  ];
}
