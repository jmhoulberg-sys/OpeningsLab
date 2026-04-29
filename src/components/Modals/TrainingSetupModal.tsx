import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CalendarClock,
  ChevronRight,
  Lock,
  Route,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  X,
} from 'lucide-react';
import type { OpeningLine, TrainingMode } from '../../types';
import { useTrainingStore } from '../../store/trainingStore';
import { useProgressStore } from '../../store/progressStore';
import { useSettingsStore } from '../../store/settingsStore';

type SetupMode = TrainingMode;

export default function TrainingSetupModal() {
  const { phase, opening, selectLine, setMode } = useTrainingStore();
  const { isLineUnlocked, isFavorite, toggleFavorite, isDue } = useProgressStore();
  const { enableSRReminders } = useSettingsStore();
  const [selectedMode, setSelectedMode] = useState<SetupMode>('learn');
  const [newlyUnlockedId, setNewlyUnlockedId] = useState<string | null>(null);
  const [unlockingLineId, setUnlockingLineId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const previousUnlockedRef = useRef<string[]>([]);

  const openingId = opening?.id ?? '';
  const lineStates = (opening?.lines ?? []).map((line) => ({
    line,
    unlocked: opening ? isLineUnlocked(opening.id, line.id) : false,
  }));
  const unlockedLineIds = lineStates.filter((entry) => entry.unlocked).map((entry) => entry.line.id);
  const unlockedLineKey = unlockedLineIds.join('|');
  const completedLines = unlockedLineIds.length;
  const totalLines = lineStates.length;
  const progressPct = totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0;
  const learnableLines = lineStates.filter((entry) => !entry.unlocked);
  const speedUnlocked = completedLines >= 3;
  const visibleLines = useMemo(() => {
    if (selectedMode === 'learn' && learnableLines.length > 0) return learnableLines;
    return lineStates;
  }, [learnableLines, lineStates, selectedMode]);

  useEffect(() => {
    const previousUnlocked = previousUnlockedRef.current;
    const freshUnlock = unlockedLineIds.find((id) => !previousUnlocked.includes(id)) ?? null;
    setNewlyUnlockedId(freshUnlock);
    previousUnlockedRef.current = unlockedLineIds;
  }, [unlockedLineKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setDismissed(false);
    setUnlockingLineId(null);
    setSelectedMode('learn');
  }, [phase, openingId]);

  if (phase !== 'line-select' || !opening) return null;

  function launchLine(line: OpeningLine, mode: SetupMode) {
    if (mode === 'time-trial' && !speedUnlocked) return;

    if (mode === 'learn') {
      setUnlockingLineId(line.id);
      window.setTimeout(() => {
        setMode(mode);
        selectLine(line);
      }, 650);
      return;
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
        className="max-h-[calc(100vh-1rem)] w-full max-w-[560px] overflow-hidden rounded-[26px] border border-stone-800/70 bg-stone-950 shadow-2xl shadow-black/70 sm:max-h-[calc(100vh-2rem)] lg:max-w-[760px] 2xl:max-w-[860px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-800/70 px-5 py-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">Next run</div>
            <h2 className="mt-1 text-xl font-black text-white">Choose training mode</h2>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-xl border border-stone-700/45 bg-stone-900 px-2.5 py-2 text-stone-300 transition-colors hover:bg-stone-800 hover:text-white cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(100vh-7rem)] overflow-y-auto px-5 py-5">
          <section className="rounded-[20px] border border-stone-800/55 bg-stone-950/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <BookOpen size={17} className="text-sky-300" />
                Coach
              </div>
              <span className="text-xs font-semibold text-stone-500">{opening.name}</span>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-stone-950 shadow-[0_14px_30px_rgba(0,0,0,0.25)]">
              {getCoachCopy(selectedMode, learnableLines.length)}
            </div>
          </section>

          <section className="mt-3 rounded-[20px] border border-stone-800/55 bg-stone-900/55 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Progress</div>
                <div className="mt-1 text-sm font-black text-white">
                  {completedLines}/{totalLines} lines mastered
                </div>
              </div>
              <div className="text-sm font-black text-emerald-300">{progressPct}%</div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-stone-800">
              <div
                className="h-2 rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </section>

          <ModePicker
            selectedMode={selectedMode}
            setSelectedMode={setSelectedMode}
            speedUnlocked={speedUnlocked}
          />

          <section className="mt-3 rounded-[20px] border border-stone-800/55 bg-stone-950/55 p-3">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Line</div>
              <div className="text-xs font-semibold text-stone-500">
                {visibleLines.length} available
              </div>
            </div>

            <div className="grid gap-2 lg:grid-cols-2">
              {visibleLines.map(({ line, unlocked }) => (
                <LineChoice
                  key={line.id}
                  line={line}
                  unlocked={unlocked}
                  mode={selectedMode}
                  isUnlocking={unlockingLineId === line.id}
                  isNewlyUnlocked={newlyUnlockedId === line.id}
                  enableDueBadge={enableSRReminders}
                  isFavorite={isFavorite(opening.id, line.id)}
                  isDue={isDue(opening.id, line.id)}
                  modeLocked={selectedMode === 'time-trial' && !speedUnlocked}
                  onToggleFavorite={() => toggleFavorite(opening.id, line.id)}
                  onLaunch={() => launchLine(line, selectedMode)}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ModePicker({
  selectedMode,
  setSelectedMode,
  speedUnlocked,
}: {
  selectedMode: SetupMode;
  setSelectedMode: (mode: SetupMode) => void;
  speedUnlocked: boolean;
}) {
  const modes: Array<{
    value: SetupMode;
    label: string;
    icon: React.ReactNode;
    locked?: boolean;
    lockLabel?: string;
  }> = [
    { value: 'learn', label: 'Learn', icon: <BookOpen size={16} /> },
    { value: 'step-by-step', label: 'Step', icon: <Target size={16} /> },
    { value: 'full-line', label: 'Full line', icon: <Trophy size={16} /> },
    { value: 'time-trial', label: 'Speed', icon: <Timer size={16} />, locked: !speedUnlocked, lockLabel: 'Master 3' },
  ];

  return (
    <section className="mt-3 rounded-[20px] border border-stone-800/55 bg-stone-950/55 p-3">
      <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Mode</div>
      <div className="grid grid-cols-2 gap-2">
        {modes.map((mode) => {
          const active = selectedMode === mode.value;
          return (
            <button
              key={mode.value}
              onClick={() => {
                if (!mode.locked) setSelectedMode(mode.value);
              }}
              disabled={mode.locked}
              className={`min-h-[58px] rounded-2xl border px-3 py-2 text-left transition-colors ${
                active
                  ? 'border-sky-300/45 bg-sky-500/16 text-white'
                  : mode.locked
                    ? 'border-stone-800/45 bg-stone-900/35 text-stone-600 cursor-not-allowed'
                    : 'border-stone-800/70 bg-stone-900/80 text-stone-200 hover:bg-stone-800 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-black">
                <span className={active ? 'text-sky-300' : mode.locked ? 'text-stone-600' : 'text-stone-300'}>
                  {mode.locked ? <Lock size={15} /> : mode.icon}
                </span>
                {mode.label}
              </div>
              {mode.locked && (
                <div className="mt-1 text-[11px] font-semibold text-stone-600">{mode.lockLabel}</div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function LineChoice({
  line,
  unlocked,
  mode,
  isUnlocking,
  isNewlyUnlocked,
  enableDueBadge,
  isFavorite,
  isDue,
  modeLocked,
  onToggleFavorite,
  onLaunch,
}: {
  line: OpeningLine;
  unlocked: boolean;
  mode: SetupMode;
  isUnlocking: boolean;
  isNewlyUnlocked: boolean;
  enableDueBadge: boolean;
  isFavorite: boolean;
  isDue: boolean;
  modeLocked: boolean;
  onToggleFavorite: () => void;
  onLaunch: () => void;
}) {
  const dueBadge = enableDueBadge && isFavorite && isDue;
  const actionLabel = getActionLabel(mode, unlocked);

  return (
    <div
      className={`rounded-2xl border bg-stone-950/75 p-3 transition-colors ${
        isUnlocking || isNewlyUnlocked
          ? 'unlock-outline border-sky-400/45 shadow-[0_10px_24px_rgba(14,165,233,0.14)]'
          : 'border-stone-800/70'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
            unlocked ? 'bg-emerald-400/10 text-emerald-300' : 'bg-stone-900 text-stone-500'
          }`}
        >
          {unlocked ? <Sparkles size={17} /> : <Lock size={17} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-black text-white">{line.name}</div>
          <div className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-stone-400">
            {getPlainLanguageSummary(line)}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {isNewlyUnlocked && (
              <span className="rounded-full bg-sky-500/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300">
                Newly mastered
              </span>
            )}
            {dueBadge && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">
                <CalendarClock size={11} />
                Due
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onToggleFavorite}
          title={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
          className={`shrink-0 rounded-xl border px-2.5 py-2 transition-colors cursor-pointer ${
            isFavorite
              ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/15'
              : 'border-stone-800/70 bg-stone-900/70 text-stone-500 hover:text-stone-300'
          }`}
        >
          <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <button
        onClick={onLaunch}
        disabled={modeLocked || isUnlocking}
        className={`mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl px-3.5 text-sm font-black transition-colors ${
          modeLocked || isUnlocking
            ? 'cursor-not-allowed bg-stone-900 text-stone-600'
            : mode === 'learn'
              ? 'bg-sky-500 text-slate-950 hover:bg-sky-400 cursor-pointer'
              : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 cursor-pointer'
        }`}
      >
        {mode === 'learn' ? <BookOpen size={16} /> : <Route size={16} />}
        {isUnlocking ? 'Opening walkthrough...' : actionLabel}
        {!modeLocked && <ChevronRight size={16} />}
      </button>
    </div>
  );
}

function getActionLabel(mode: SetupMode, unlocked: boolean) {
  if (mode === 'learn') return unlocked ? 'Review walkthrough' : 'Start walkthrough';
  if (mode === 'step-by-step') return 'Practice step by step';
  if (mode === 'full-line') return 'Practice full line';
  return 'Start speed run';
}

function getCoachCopy(mode: SetupMode, lockedCount: number) {
  if (mode === 'learn') {
    return lockedCount > 0
      ? 'Start with a walkthrough. I will show the move and explain the idea, so you can learn the pattern before testing it.'
      : 'All lines are mastered. Use Learn if you want a calm refresher before a harder run.';
  }
  if (mode === 'step-by-step') {
    return 'Use Step when you know the idea but still want each move checked as you go.';
  }
  if (mode === 'full-line') {
    return 'Full line is the real test: play the whole sequence cleanly and prove the pattern is yours.';
  }
  return 'Speed is locked until you have three mastered lines. Accuracy comes first, then tempo.';
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

  return 'A guided line that teaches the key idea before asking you to remember it.';
}
