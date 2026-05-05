import { useEffect, useState } from 'react';
import { Check, Flame, Star } from 'lucide-react';
import { useTrainingStore } from '../../store/trainingStore';
import { useProgressStore } from '../../store/progressStore';
import { getCurrentStreak, getRecentStreakDays, useProgressionStore } from '../../store/progressionStore';
import { isGameOver } from '../../engine/chessEngine';
import { Chess } from 'chess.js';

export default function CompletionModal() {
  const {
    phase,
    opening,
    selectedLine,
    mode,
    mistakes,
    currentFen,
    streak,
    restart,
    backToLineSelect,
    startPostLine,
    stopTimer,
    setMode,
    selectLine,
  } = useTrainingStore();

  const { recordLineAttempt, recordSpacedRepetition, getLineProgress } = useProgressStore();
  const daily = useProgressionStore((state) => state.daily);
  const [earnedXp, setEarnedXp] = useState(0);
  const [lineJustUnlocked, setLineJustUnlocked] = useState(false);
  const [showStreakStep, setShowStreakStep] = useState(false);

  useEffect(() => {
    if (phase === 'completed' && opening && selectedLine) {
      stopTimer();
      const recordsProgress = mode === 'learn' || mode === 'step-by-step' || mode === 'full-line';
      const todayWasEmpty = !getRecentStreakDays(useProgressionStore.getState().daily, 1)[0]?.active;
      const lineWasNew = !useProgressStore.getState().getLineProgress(opening.id, selectedLine.id)?.unlocked;
      setLineJustUnlocked(recordsProgress && lineWasNew && mistakes === 0);
      setShowStreakStep(recordsProgress && todayWasEmpty);
      setEarnedXp(recordsProgress ? 10 + (lineWasNew ? 25 : 0) + (mistakes === 0 ? 40 : 0) : 0);
      if (recordsProgress) {
        recordLineAttempt(opening.id, selectedLine.id, mistakes);
        recordSpacedRepetition(opening.id, selectedLine.id, mistakes === 0);
      }
    } else {
      setLineJustUnlocked(false);
      setShowStreakStep(false);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase !== 'completed' || !opening || !selectedLine) {
    return null;
  }

  const perfect = mistakes === 0;
  const recordsProgress = mode === 'learn' || mode === 'step-by-step' || mode === 'full-line';
  const canContinue = !isGameOver(currentFen);
  const gameResult = getGameResultLabel(currentFen, opening.playerColor);
  const existingProgress = getLineProgress(opening.id, selectedLine.id);
  const existingInterval = existingProgress?.srInterval ?? 0;
  const nextInterval = perfect ? Math.max(1, existingInterval * 2) : 1;
  const streakDays = getRecentStreakDays(daily, 5);
  const currentStreak = getCurrentStreak(daily);

  function startPractice(nextMode: 'step-by-step' | 'full-line') {
    if (!selectedLine) return;
    setMode(nextMode);
    selectLine(selectedLine);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/78 px-3 py-4">
      <div className="mx-2 w-full max-w-2xl rounded-[22px] border border-amber-400 bg-brand-surface p-4 text-center sm:p-7">
        {showStreakStep ? (
          <StreakStep
            currentStreak={currentStreak}
            streakDays={streakDays}
            onContinue={() => setShowStreakStep(false)}
          />
        ) : (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-emerald-400/10 text-emerald-300">
              <Flame size={52} fill="currentColor" />
            </div>

            <h2 className="mt-4 text-2xl font-black text-emerald-300">
              {gameResult ?? (mode === 'learn' ? 'Walkthrough complete' : perfect ? 'Perfect line complete' : 'Line complete')}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-300">{selectedLine.name}</p>

            <div className="my-5 space-y-2 rounded-xl bg-slate-800/60 p-4">
              {recordsProgress ? (
                <StatRow label="XP earned" value={`+${earnedXp}`} good />
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">XP earned</span>
                  <span className="font-bold text-sky-300">Practice to unlock</span>
                </div>
              )}
              <StatRow label="Mistakes" value={mistakes === 0 ? 'None' : `${mistakes}`} good={mistakes === 0} />
              {streak >= 3 && <StatRow label="Best streak" value={`${streak} moves`} good />}
              {recordsProgress && (
                <StatRow
                  label="Next review"
                  value={perfect ? `in ${nextInterval} day${nextInterval === 1 ? '' : 's'}` : 'Tomorrow'}
                  good={perfect}
                />
              )}
              {recordsProgress && perfect ? (
                <p className={`flex items-center justify-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-emerald-300 ${
                  lineJustUnlocked ? 'bg-emerald-500/12 star-pop' : ''
                }`}>
                  {lineJustUnlocked ? 'New line unlocked!' : 'Line unlocked!'} <Star size={14} fill="currentColor" />
                </p>
              ) : recordsProgress ? (
                <p className="text-xs text-slate-400">Complete with zero mistakes to unlock this line.</p>
              ) : (
                <p className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-200">
                  Now complete step-by-step or full-line practice to unlock this line.
                </p>
              )}
            </div>

            {!canContinue && (
              <p className="mb-4 text-sm text-amber-300">
                This line ends the game, so there is no free-play continuation from this position.
              </p>
            )}

            <div className="flex flex-col gap-3">
              {mode === 'learn' && (
                <button
                  onClick={() => startPractice('step-by-step')}
                  className="w-full rounded-xl bg-emerald-400 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-300 cursor-pointer"
                >
                  Train this line
                </button>
              )}

              <button
                onClick={restart}
                className="w-full rounded-xl bg-amber-400 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-300 cursor-pointer"
              >
                {mode === 'learn' ? 'Repeat walkthrough' : 'Continue'}
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
          </>
        )}
      </div>
    </div>
  );
}

function StreakStep({
  currentStreak,
  streakDays,
  onContinue,
}: {
  currentStreak: number;
  streakDays: ReturnType<typeof getRecentStreakDays>;
  onContinue: () => void;
}) {
  return (
    <>
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-amber-400/10 text-amber-300 sm:h-28 sm:w-28 sm:rounded-[32px]">
        <Flame size={64} fill="currentColor" />
      </div>
      <div className="mt-5 text-6xl font-black leading-none text-amber-400 sm:text-7xl">
        {Math.max(1, currentStreak)}
      </div>
      <h2 className="mt-4 text-2xl font-black text-amber-400">{Math.max(1, currentStreak)} day streak</h2>
      <p className="mt-2 text-sm font-semibold text-slate-300">First completed line today.</p>

      <div className="mx-auto mt-5 grid max-w-sm grid-cols-5 gap-2 rounded-xl border border-slate-700/70 bg-slate-900/70 p-3">
        {streakDays.map((day) => (
          <div key={day.key} className="text-center">
            <div className={`text-xs font-black ${day.today ? 'text-amber-300' : 'text-slate-200'}`}>{day.label}</div>
            <div className={`mt-2 flex aspect-square items-center justify-center rounded-full ${
              day.active || day.today ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-500'
            }`}>
              {(day.active || day.today) && <Check size={18} strokeWidth={4} />}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onContinue}
        className="mt-6 w-full rounded-xl bg-amber-400 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-300 cursor-pointer"
      >
        Continue
      </button>
    </>
  );
}

function getGameResultLabel(fen: string, playerColor: 'white' | 'black') {
  try {
    const chess = new Chess(fen);
    if (!isGameOver(fen)) return null;
    if (chess.isCheckmate()) {
      const sideToMove = chess.turn() === 'w' ? 'white' : 'black';
      return sideToMove === playerColor ? 'Loss' : 'Win';
    }
    return 'Draw';
  } catch {
    return null;
  }
}

function StatRow({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={`font-bold ${good ? 'text-emerald-400' : 'text-red-400'}`}>{value}</span>
    </div>
  );
}
