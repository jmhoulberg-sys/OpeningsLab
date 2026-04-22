import { useEffect, useState } from 'react';
import { BookOpen, CalendarClock, ChevronRight, Layers, Lock, Route, Star, X } from 'lucide-react';
import type { OpeningLine, TrainingMode } from '../../types';
import { useTrainingStore } from '../../store/trainingStore';
import { useProgressStore } from '../../store/progressStore';
import { useSettingsStore } from '../../store/settingsStore';

export default function TrainingSetupModal() {
  const { phase, opening, selectLine, setMode } = useTrainingStore();
  const { isLineUnlocked, isFavorite, toggleFavorite, isDue } = useProgressStore();
  const { enableSRReminders } = useSettingsStore();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (phase === 'line-select') {
      setDismissed(false);
    }
  }, [phase, opening?.id]);

  if (phase !== 'line-select' || !opening) return null;

  const lineStates = opening.lines.map((line, index) => {
    const unlocked = isLineUnlocked(opening.id, line.id);
    const previousUnlocked = index === 0 || isLineUnlocked(opening.id, opening.lines[index - 1].id);
    const availableToLearn = !unlocked && previousUnlocked;
    return {
      line,
      unlocked,
      availableToLearn,
      locked: !unlocked && !availableToLearn,
    };
  });

  const completedLines = lineStates.filter((entry) => entry.unlocked).length;
  const totalLines = lineStates.length;
  const nextLine = lineStates.find((entry) => entry.availableToLearn)?.line ?? null;
  const practiceLines = lineStates.filter((entry) => entry.unlocked).map((entry) => entry.line);
  const lockedLines = lineStates.filter((entry) => entry.locked).map((entry) => entry.line);
  const progressPct = totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0;

  if (dismissed) {
    return (
      <div className="fixed inset-0 z-40 flex items-end justify-center pb-8 pointer-events-none">
        <button
          onClick={() => setDismissed(false)}
          className="pointer-events-auto rounded-full bg-sky-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-black/40 transition-colors hover:bg-sky-400 cursor-pointer"
        >
          Open next step
        </button>
      </div>
    );
  }

  function launchLine(line: OpeningLine, mode: TrainingMode) {
    setMode(mode);
    selectLine(line);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={() => setDismissed(true)}
    >
      <div
        className="w-full max-w-3xl rounded-[28px] border border-stone-800/70 bg-stone-950/95 p-6 shadow-2xl shadow-black/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
              Step 2 of 2
            </div>
            <h2 className="mt-1 text-2xl font-bold text-white">Choose what to do next</h2>
            <p className="mt-2 text-sm text-stone-400">
              Finish one line cleanly to unlock the next. Unlocked lines can be practiced in chunks or as one guided full line.
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-xl border border-stone-800/70 bg-stone-900/80 p-2 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white cursor-pointer"
            title="Dismiss"
          >
            <X size={18} />
          </button>
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
                {nextLine ? `Next line to learn: ${nextLine.name}` : 'All current lines unlocked.'}
              </div>
            </div>
            <div className="text-sm font-semibold text-emerald-300">{progressPct}%</div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-stone-800">
            <div className="h-2 rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {nextLine && (
            <section className="rounded-[22px] border border-sky-400/15 bg-sky-400/8 p-4">
              <div className="flex items-center gap-2 text-sky-300">
                <BookOpen size={18} />
                <div className="text-sm font-semibold uppercase tracking-[0.18em]">Next line to learn</div>
              </div>
              <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="text-xl font-bold text-white">{nextLine.name}</div>
                  <div className="mt-1 text-sm text-stone-300">
                    {nextLine.description || 'Guided learning with prompts, hints, and answer help.'}
                  </div>
                </div>
                <button
                  onClick={() => launchLine(nextLine, 'learn')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 cursor-pointer"
                >
                  Learn line
                  <ChevronRight size={16} />
                </button>
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
                Unlock your first line to open practice modes.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {practiceLines.map((line) => (
                  <PracticeLineCard
                    key={line.id}
                    line={line}
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

          {lockedLines.length > 0 && (
            <section className="rounded-[22px] border border-stone-800/70 bg-stone-900/60 p-4">
              <div className="flex items-center gap-2 text-stone-400">
                <Lock size={18} />
                <div className="text-sm font-semibold uppercase tracking-[0.18em]">Still locked</div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {lockedLines.map((line) => (
                  <div
                    key={line.id}
                    className="rounded-2xl border border-stone-800/70 bg-stone-950/70 px-4 py-3 text-sm text-stone-500"
                  >
                    <div className="font-semibold text-stone-300">{line.name}</div>
                    <div className="mt-1 text-xs text-stone-500">
                      Finish the line above to unlock this one.
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function PracticeLineCard({
  line,
  enableDueBadge,
  isFavorite,
  isDue,
  onToggleFavorite,
  onStepByStep,
  onFullLine,
}: {
  line: OpeningLine;
  enableDueBadge: boolean;
  isFavorite: boolean;
  isDue: boolean;
  onToggleFavorite: () => void;
  onStepByStep: () => void;
  onFullLine: () => void;
}) {
  const dueBadge = enableDueBadge && isFavorite && isDue;

  return (
    <div className="rounded-2xl border border-stone-800/70 bg-stone-950/75 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-bold text-white">{line.name}</div>
          <div className="mt-1 text-sm text-stone-400">
            {line.description || 'Practice this unlocked line from memory or with guided help.'}
          </div>
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
