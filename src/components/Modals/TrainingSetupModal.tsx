import { useEffect, useRef, useState } from 'react';
import { BookOpen, CalendarClock, ChevronRight, Layers, Lock, Route, Star } from 'lucide-react';
import type { OpeningLine, TrainingMode } from '../../types';
import { useTrainingStore } from '../../store/trainingStore';
import { useProgressStore } from '../../store/progressStore';
import { useSettingsStore } from '../../store/settingsStore';

export default function TrainingSetupModal() {
  const { phase, opening, selectLine, setMode } = useTrainingStore();
  const { isLineUnlocked, isFavorite, toggleFavorite, isDue } = useProgressStore();
  const { enableSRReminders } = useSettingsStore();
  const [newlyUnlockedId, setNewlyUnlockedId] = useState<string | null>(null);
  const [unlockingLineId, setUnlockingLineId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const previousUnlockedRef = useRef<string[]>([]);

  if (phase !== 'line-select' || !opening) return null;

  const lineStates = opening.lines.map((line) => ({
    line,
    unlocked: isLineUnlocked(opening.id, line.id),
  }));

  const completedLines = lineStates.filter((entry) => entry.unlocked).length;
  const totalLines = lineStates.length;
  const practiceLines = lineStates.filter((entry) => entry.unlocked).map((entry) => entry.line);
  const learnableLines = lineStates.filter((entry) => !entry.unlocked).map((entry) => entry.line);
  const progressPct = totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0;

  useEffect(() => {
    const unlockedIds = practiceLines.map((line) => line.id);
    const previousUnlocked = previousUnlockedRef.current;
    const freshUnlock = unlockedIds.find((id) => !previousUnlocked.includes(id)) ?? null;
    setNewlyUnlockedId(freshUnlock);
    previousUnlockedRef.current = unlockedIds;
  }, [practiceLines]);

  useEffect(() => {
    setDismissed(false);
    setUnlockingLineId(null);
  }, [phase, opening.id]);

  function launchLine(line: OpeningLine, mode: TrainingMode) {
    if (mode === 'learn') {
      setUnlockingLineId(line.id);
    }
    setMode(mode);
    selectLine(line);
  }

  if (dismissed) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-5"
      onClick={() => setDismissed(true)}
    >
      <div
        className="max-h-[calc(100vh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-stone-800/70 bg-stone-950/95 p-5 shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-3rem)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
              Step 2 of 2
            </div>
            <h2 className="mt-1 text-2xl font-bold text-white">Choose what to do next</h2>
            <p className="mt-2 text-sm text-stone-400">
              Choose any line to learn. Once you finish it cleanly, it becomes available for practice in step-by-step or guided full-line mode.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[22px] border border-stone-800/70 bg-stone-900/80 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Opening progress
              </div>
              <div className="mt-1 text-lg font-bold text-white">
                {completedLines}/{totalLines} lines unlocked
              </div>
              <div className="mt-1 text-sm text-stone-400">
                {learnableLines.length > 0 ? 'Choose any locked line to learn next.' : 'All current lines are unlocked.'}
              </div>
            </div>
            <div className="text-sm font-semibold text-emerald-300">{progressPct}%</div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-stone-800">
            <div className="h-2 rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {learnableLines.length > 0 && (
            <section className="rounded-[22px] border border-sky-400/15 bg-sky-400/8 p-4">
              <div className="flex items-center gap-2 text-sky-300">
                <BookOpen size={18} />
                <div className="text-sm font-semibold uppercase tracking-[0.18em]">Choose a line to unlock</div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {learnableLines.map((line) => (
                  <div key={line.id} className={`relative flex min-h-[214px] flex-col rounded-2xl border border-stone-700/70 bg-stone-950/70 p-4 ${unlockingLineId === line.id ? 'star-pop ring-1 ring-sky-400/30 shadow-[0_14px_30px_rgba(14,165,233,0.18)]' : ''}`}>
                    <div className={`absolute right-4 top-4 ${unlockingLineId === line.id ? 'text-sky-300' : 'text-stone-500'}`}>
                      <Lock size={20} />
                    </div>
                    <div className="min-h-[72px] pr-10 text-[1.05rem] font-bold leading-tight text-white">{line.name}</div>
                    <div className="mt-2 flex-1 text-sm text-stone-300">
                      {getPlainLanguageSummary(line)}
                    </div>
                    <button
                      onClick={() => launchLine(line, 'learn')}
                      className="mt-4 inline-flex items-center justify-center gap-2 self-start rounded-2xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 cursor-pointer"
                    >
                      Unlock line
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-[22px] border border-stone-800/70 bg-stone-900/75 p-4">
            <div className="flex items-center gap-2 text-emerald-300">
              <Route size={18} />
              <div className="text-sm font-semibold uppercase tracking-[0.18em]">Practice unlocked lines</div>
            </div>
          <div className="mt-2 text-sm text-stone-400">
              When a line is unlocked, practice it either move-by-move or as a guided full line.
          </div>

            {practiceLines.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-stone-800/70 bg-stone-950/70 px-4 py-3 text-sm text-stone-500">
                Finish the next line cleanly to open practice modes.
            </div>
            ) : (
              <div className="mt-4 space-y-3">
                {practiceLines.map((line) => (
                  <PracticeLineCard
                    key={line.id}
                    line={line}
                    isNewlyUnlocked={newlyUnlockedId === line.id}
                    enableDueBadge={enableSRReminders}
                    isFavorite={isFavorite(opening.id, line.id)}
                    isDue={isDue(opening.id, line.id)}
                    onToggleFavorite={() => toggleFavorite(opening.id, line.id)}
                    onStepByStep={() => launchLine(line, 'step-by-step')}
                    onFullLine={() => launchLine(line, 'full-line')}
                  />
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

function PracticeLineCard({
  line,
  isNewlyUnlocked,
  enableDueBadge,
  isFavorite,
  isDue,
  onToggleFavorite,
  onStepByStep,
  onFullLine,
}: {
  line: OpeningLine;
  isNewlyUnlocked: boolean;
  enableDueBadge: boolean;
  isFavorite: boolean;
  isDue: boolean;
  onToggleFavorite: () => void;
  onStepByStep: () => void;
  onFullLine: () => void;
}) {
  const dueBadge = enableDueBadge && isFavorite && isDue;

  return (
    <div className={`rounded-2xl border border-stone-800/70 bg-stone-950/75 p-4 ${isNewlyUnlocked ? 'star-pop shadow-[0_14px_30px_rgba(16,185,129,0.18)] ring-1 ring-emerald-400/20' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-bold text-white">{line.name}</div>
          <div className="mt-1 text-sm text-stone-400">
            {getPlainLanguageSummary(line)}
          </div>
          {isNewlyUnlocked && (
            <div className="mt-2 inline-flex rounded-full bg-emerald-500/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
              Newly unlocked
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dueBadge && (
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/12 px-2.5 py-1 text-xs font-semibold text-cyan-300">
              <CalendarClock size={12} />
              Due
            </span>
          )}
          <button
            onClick={onToggleFavorite}
            title={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
            className={`rounded-xl border px-2.5 py-2 transition-colors cursor-pointer ${
              isFavorite
                ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/15'
                : 'border-stone-800/70 bg-stone-900/70 text-stone-500 hover:text-stone-300'
            }`}
          >
            <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          onClick={onStepByStep}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300 cursor-pointer"
        >
          <Layers size={16} />
          Practice step-by-step
        </button>
        <button
          onClick={onFullLine}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-500/12 px-4 py-3 text-sm font-semibold text-sky-200 transition-colors hover:bg-sky-500/18 cursor-pointer"
        >
          <Route size={16} />
          Practice full line
        </button>
      </div>
    </div>
  );
}

function getPlainLanguageSummary(line: OpeningLine) {
  const label = line.name.toLowerCase();

  if (label.includes('queen')) return 'A sharp trap that punishes a greedy queen grab.';
  if (label.includes('knight')) return 'A tactical line that turns one loose knight into a lasting weakness.';
  if (label.includes('rook')) return 'A forcing attack that wins heavy material if White grabs the bait.';
  if (label.includes('natural development')) return 'A simple punishment line against automatic developing moves.';
  if (label.includes('favorite trap')) return 'A direct attacking trap that keeps pressure on the king from the start.';
  if (label.includes('everyone falls for this')) return 'A reliable attacking idea that catches natural-looking replies.';
  if (label.includes('drag white\'s king')) return 'An aggressive line that pulls the king into danger and wins material.';

  return 'A guided attacking line that helps you learn the key idea without guessing from notation.';
}
