import { useEffect, useState } from 'react';
import { useTrainingStore } from '../../store/trainingStore';
import { useProgressStore } from '../../store/progressStore';
import { isGameOver } from '../../engine/chessEngine';
import PlayOnModal from './PlayOnModal';

export default function CompletionModal() {
  const {
    phase,
    opening,
    selectedLine,
    mistakes,
    currentFen,
    restart,
    backToLineSelect,
  } = useTrainingStore();

  const { recordLineAttempt } = useProgressStore();
  const [showPlayOn, setShowPlayOn] = useState(false);

  // Record progress once when the modal first appears
  useEffect(() => {
    if (phase === 'completed' && opening && selectedLine) {
      recordLineAttempt(opening.id, selectedLine.id, mistakes);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase !== 'completed' || !opening || !selectedLine) {
    return null;
  }

  const perfect = mistakes === 0;
  const canContinue = !isGameOver(currentFen);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-brand-surface border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 p-8 max-w-md w-full mx-4 text-center">

          {/* Icon */}
          <div className="text-5xl mb-3 select-none">
            {perfect ? '★' : '✓'}
          </div>

          {/* Headline */}
          <h2 className="text-2xl font-bold text-white mb-1">
            {perfect ? 'Perfect!' : 'Good job!'}
          </h2>

          <p className="text-slate-400 text-sm mb-4">
            {opening.name} · {selectedLine.name}
          </p>

          {/* Stats */}
          <div className="bg-slate-800/60 rounded-xl p-4 mb-6 space-y-2">
            <StatRow
              label="Mistakes"
              value={mistakes === 0 ? 'None ✓' : `${mistakes}`}
              good={mistakes === 0}
            />
            {perfect ? (
              <p className="text-yellow-400 text-sm font-semibold">
                Line unlocked! ★
              </p>
            ) : (
              <p className="text-slate-400 text-xs">
                Complete with zero mistakes to unlock this line.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={restart}
              className="w-full py-3 rounded-xl bg-brand-accent text-white font-bold text-sm hover:bg-red-500 transition-colors cursor-pointer"
            >
              Try Again
            </button>

            {canContinue && (
              <button
                onClick={() => setShowPlayOn(true)}
                className="w-full py-2.5 rounded-xl bg-emerald-700/70 border border-emerald-600/40 text-emerald-100 font-semibold text-sm hover:bg-emerald-600/70 transition-colors cursor-pointer"
              >
                Play On →
              </button>
            )}

            <button
              onClick={backToLineSelect}
              className="w-full py-2.5 rounded-xl bg-slate-700/60 border border-slate-600/40 text-slate-200 font-semibold text-sm hover:bg-slate-600/60 transition-colors cursor-pointer"
            >
              Select Another Line
            </button>
          </div>
        </div>
      </div>

      <PlayOnModal isOpen={showPlayOn} onClose={() => setShowPlayOn(false)} />
    </>
  );
}

function StatRow({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={`font-bold ${good ? 'text-emerald-400' : 'text-red-400'}`}>{value}</span>
    </div>
  );
}
