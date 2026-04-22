import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useTrainingStore } from '../../store/trainingStore';
import { useProgressStore } from '../../store/progressStore';
import { isGameOver } from '../../engine/chessEngine';

export default function CompletionModal() {
  const {
    phase,
    opening,
    selectedLine,
    mistakes,
    currentFen,
    streak,
    restart,
    backToLineSelect,
    startPostLine,
    stopTimer,
  } = useTrainingStore();

  const { recordLineAttempt, recordSpacedRepetition, getLineProgress } = useProgressStore();

  useEffect(() => {
    if (phase === 'completed' && opening && selectedLine) {
      stopTimer();
      recordLineAttempt(opening.id, selectedLine.id, mistakes);
      recordSpacedRepetition(opening.id, selectedLine.id, mistakes === 0);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase !== 'completed' || !opening || !selectedLine) {
    return null;
  }

  const perfect = mistakes === 0;
  const canContinue = !isGameOver(currentFen);
  const filledStars = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;

  const existingProgress = getLineProgress(opening.id, selectedLine.id);
  const existingInterval = existingProgress?.srInterval ?? 0;
  const nextInterval = perfect ? Math.max(1, existingInterval * 2) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-slate-700/60 bg-brand-surface p-8 text-center shadow-2xl shadow-black/60">
        <StarRating mistakes={mistakes} filledCount={filledStars} />

        <h2 className="mb-1 text-2xl font-bold text-white">
          {perfect ? 'Perfect!' : 'Good job!'}
        </h2>

        <p className="mb-4 text-sm text-slate-400">
          {opening.name} · {selectedLine.name}
        </p>

        <div className="mb-6 space-y-2 rounded-xl bg-slate-800/60 p-4">
          <StatRow
            label="Mistakes"
            value={mistakes === 0 ? 'None ✓' : `${mistakes}`}
            good={mistakes === 0}
          />
          {streak >= 3 && (
            <StatRow
              label="Best streak"
              value={`${streak} moves`}
              good
            />
          )}
          <StatRow
            label="Next review"
            value={perfect ? `in ${nextInterval} day${nextInterval === 1 ? '' : 's'} ✓` : 'Tomorrow'}
            good={perfect}
          />
          {perfect ? (
            <p className="flex items-center justify-center gap-1 text-sm font-semibold text-yellow-400">
              Line unlocked! <Star size={14} fill="currentColor" />
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Complete with zero mistakes to unlock this line.
            </p>
          )}
        </div>

        {!canContinue && (
          <p className="mb-4 text-sm text-amber-300">
            This line ends the game, so there is no free-play continuation from this position.
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={restart}
            className="w-full rounded-xl bg-sky-500 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-sky-400 cursor-pointer"
          >
            Retry line
          </button>

          {canContinue && (
            <button
              onClick={() => startPostLine('top-moves', false, true)}
              className="w-full rounded-xl border border-emerald-600/40 bg-emerald-700/70 py-2.5 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-600/70 cursor-pointer"
            >
              Practice top responses (Lichess)
            </button>
          )}

          <button
            onClick={backToLineSelect}
            className="w-full rounded-xl border border-slate-600/40 bg-slate-700/60 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-600/60 cursor-pointer"
          >
            Choose another line
          </button>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={`font-bold ${good ? 'text-emerald-400' : 'text-red-400'}`}>{value}</span>
    </div>
  );
}

function StarRating({ mistakes, filledCount }: { mistakes: number; filledCount: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setShown(1), 300),
      setTimeout(() => setShown(2), 600),
      setTimeout(() => setShown(3), 900),
    ];
    return () => timers.forEach(clearTimeout);
  }, [mistakes]);

  return (
    <div className="mb-3 flex justify-center gap-3">
      {[1, 2, 3].map((star) => (
        <div
          key={`${star}-${shown}`}
          className="inline-flex"
          style={shown >= star
            ? { animation: 'starPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }
            : { opacity: 0.2, transform: 'scale(0.8)' }}
        >
          <Star
            size={52}
            className={star <= filledCount ? 'text-yellow-400' : 'text-slate-600'}
            fill={star <= filledCount && shown >= star ? 'currentColor' : 'none'}
            strokeWidth={star <= filledCount ? 1.5 : 2}
          />
        </div>
      ))}
    </div>
  );
}
