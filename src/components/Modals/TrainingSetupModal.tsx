import { useState } from 'react';
import type { TrainingMode } from '../../types';
import { useTrainingStore } from '../../store/trainingStore';
import { useProgressStore } from '../../store/progressStore';

export default function TrainingSetupModal() {
  const { phase, opening, selectLine, setMode } = useTrainingStore();
  const { isLineUnlocked, isFavorite, toggleFavorite } = useProgressStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [chosenMode, setChosenMode] = useState<TrainingMode>('forced');
  const [lineExpanded, setLineExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (phase !== 'line-select' || !opening || dismissed) return null;

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
      onClick={() => setDismissed(true)}
    >
      <div
        className="bg-brand-surface border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 p-8 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-white mb-1 text-center">
              How do you want to train?
            </h2>
            <p className="text-slate-400 text-sm text-center mb-1">
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

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleModeSelect('forced')}
                className="w-full rounded-xl border border-slate-600/50 bg-slate-800/60 hover:border-brand-accent/60 hover:bg-slate-700/60 transition-all p-4 text-left cursor-pointer"
              >
                <div className="text-white font-bold text-sm mb-1">Full Line</div>
                <div className="text-slate-400 text-xs">
                  Play the complete line from start to finish
                </div>
              </button>

              <button
                onClick={() => handleModeSelect('repetition')}
                className="w-full rounded-xl border border-slate-600/50 bg-slate-800/60 hover:border-brand-accent/60 hover:bg-slate-700/60 transition-all p-4 text-left cursor-pointer"
              >
                <div className="text-white font-bold text-sm mb-1">Step by Step</div>
                <div className="text-slate-400 text-xs">
                  Build up move by move — master one move at a time
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
                      return (
                        <div key={line.id} className="flex items-center">
                          <button
                            onClick={() => handleSelectLine(line.id)}
                            className="flex-1 px-4 py-3 text-left flex items-center gap-2 hover:bg-slate-700/50 transition-colors cursor-pointer"
                          >
                            {/* Completion check */}
                            <span
                              className={`text-sm font-bold leading-none flex-shrink-0 ${
                                unlocked ? 'text-emerald-400' : 'text-slate-600'
                              }`}
                              title={unlocked ? 'Completed' : 'Not completed'}
                            >
                              {unlocked ? '✓' : '–'}
                            </span>
                            <span className="text-slate-200 text-sm">{line.name}</span>
                          </button>
                          {/* Favourite star */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(opening.id, line.id);
                            }}
                            title={fav ? 'Remove from favourites' : 'Add to favourites'}
                            className={`px-3 py-3 text-base transition-colors cursor-pointer ${
                              fav ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-600 hover:text-slate-400'
                            }`}
                          >
                            {fav ? '★' : '☆'}
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
