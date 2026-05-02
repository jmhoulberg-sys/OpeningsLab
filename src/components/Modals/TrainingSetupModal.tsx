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
    if (selectedMode !== 'learn') return lineStates.filter((entry) => entry.unlocked);
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
          <section className="rounded-[20px] border border-sky-300/15 bg-stone-950/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <BookOpen size={17} className="text-sky-300" />
                Coach
              </div>
              <span className="text-xs font-semibold text-stone-500">{opening.name}</span>
            </div>
            <div className="max-w-[560px] rounded-2xl bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-stone-950">
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
            learnedLines={completedLines}
            totalLines={totalLines}
          />

          <section className="mt-3 rounded-[20px] border border-stone-800/55 bg-stone-950/55 p-3">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Line</div>
              <div className="text-xs font-semibold text-stone-500">
                {visibleLines.length} available
              </div>
            </div>

            <div className="grid gap-2 lg:grid-cols-2">
              {visibleLines.length === 0 && (
                <div className="rounded-2xl border border-stone-800/70 bg-stone-900/70 p-4 text-sm font-semibold text-stone-400 lg:col-span-2">
                  Learn one line first. Each learned line becomes one practice line.
                </div>
              )}
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
  learnedLines,
  totalLines,
}: {
  selectedMode: SetupMode;
  setSelectedMode: (mode: SetupMode) => void;
  learnedLines: number;
  totalLines: number;
}) {
  const practiceLineCount = learnedLines;
  const modes: Array<{
    value: SetupMode;
    label: string;
    icon: React.ReactNode;
    tone: string;
    help: string;
    group: 'learn' | 'practice';
    locked?: boolean;
    lockLabel?: string;
  }> = [
    {
      value: 'learn',
      label: 'Learn',
      icon: <BookOpen size={16} />,
      tone: 'sky',
      help: `${learnedLines}/${totalLines} lines learned`,
      group: 'learn',
    },
    {
      value: 'step-by-step',
      label: 'Practice',
      icon: <Target size={16} />,
      tone: 'emerald',
      help: `${practiceLineCount}/${practiceLineCount} lines available`,
      group: 'practice',
      locked: practiceLineCount === 0,
      lockLabel: 'Learn 1 line',
    },
  ];
  const learnMode = modes.find((mode) => mode.group === 'learn')!;
  const practiceMode = modes.find((mode) => mode.group === 'practice')!;

  return (
    <section className="mt-3 rounded-[20px] border border-stone-800/55 bg-stone-950/55 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Mode</div>
        <div className="text-[11px] font-semibold text-stone-500">Learn one line, then practice that line</div>
      </div>
      <div className="space-y-2">
        <ModeButton mode={learnMode} active={selectedMode === learnMode.value} setSelectedMode={setSelectedMode} />
        <ModeButton mode={practiceMode} active={selectedMode === practiceMode.value} setSelectedMode={setSelectedMode} />
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ['Drill', 'Learn 3 lines to unlock'],
            ['Time', 'Learn 3 lines to unlock'],
            ['Puzzles', 'Learn 2 lines to unlock'],
          ].map(([label, help]) => (
            <div key={label} className="min-h-[62px] rounded-2xl border border-stone-800/45 bg-stone-900/35 px-3 py-2 text-stone-600">
              <div className="text-sm font-black">{label}</div>
              <div className="mt-1 text-[11px] font-bold">{help}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ModeButton({
  mode,
  active,
  setSelectedMode,
}: {
  mode: {
    value: SetupMode;
    label: string;
    icon: React.ReactNode;
    tone: string;
    help: string;
    locked?: boolean;
    lockLabel?: string;
  };
  active: boolean;
  setSelectedMode: (mode: SetupMode) => void;
}) {
  return (
    <button
      onClick={() => {
        if (!mode.locked) setSelectedMode(mode.value);
      }}
      disabled={mode.locked}
      className={`min-h-[62px] w-full rounded-2xl border px-3 py-2 text-left transition-all ${
        active
          ? getActiveModeClasses(mode.tone)
          : mode.locked
            ? 'border-stone-800/45 bg-stone-900/35 text-stone-600 cursor-not-allowed'
            : `${getInactiveModeClasses(mode.tone)} cursor-pointer`
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-black">
        <span className={mode.locked ? 'text-stone-600' : getModeIconClass(mode.tone)}>
          {mode.locked ? <Lock size={15} /> : mode.icon}
        </span>
        {mode.label}
      </div>
      <div className={`mt-1 text-[11px] font-bold ${mode.locked ? 'text-stone-600' : active ? getActiveHelpClass(mode.tone) : 'text-stone-400'}`}>
        {mode.locked ? mode.lockLabel : mode.help}
      </div>
    </button>
  );
}

function getActiveModeClasses(tone: string) {
  if (tone === 'emerald') return 'border-emerald-200/55 bg-emerald-400/18 text-white';
  if (tone === 'amber') return 'border-amber-200/55 bg-amber-300/18 text-white';
  if (tone === 'rose') return 'border-rose-200/45 bg-rose-400/14 text-white';
  return 'border-sky-200/55 bg-sky-400/18 text-white';
}

function getInactiveModeClasses(tone: string) {
  if (tone === 'emerald') return 'border-emerald-300/16 bg-emerald-400/8 text-stone-100 hover:bg-emerald-400/12';
  if (tone === 'amber') return 'border-amber-300/16 bg-amber-300/8 text-stone-100 hover:bg-amber-300/12';
  if (tone === 'rose') return 'border-rose-300/16 bg-rose-400/8 text-stone-100 hover:bg-rose-400/12';
  return 'border-sky-300/16 bg-sky-400/8 text-stone-100 hover:bg-sky-400/12';
}

function getModeIconClass(tone: string) {
  if (tone === 'emerald') return 'text-emerald-300';
  if (tone === 'amber') return 'text-amber-300';
  if (tone === 'rose') return 'text-rose-300';
  return 'text-sky-300';
}

function getActiveHelpClass(tone: string) {
  if (tone === 'emerald') return 'text-emerald-100';
  if (tone === 'amber') return 'text-amber-100';
  if (tone === 'rose') return 'text-rose-100';
  return 'text-sky-100';
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
          ? 'unlock-outline border-sky-400/45'
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
            {getLineDifferenceSummary(line)}
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

function getLineDifferenceSummary(line: OpeningLine) {
  const label = line.name.toLowerCase();

  if (line.description) return toOneSentence(line.description);
  if (label.includes('queen')) return 'Choose this line to practice punishing early queen adventures.';
  if (label.includes('dragon') || label.includes('yugoslav')) return 'Choose this line for opposite-side castling and direct king-side attacking plans.';
  if (label.includes('najdorf')) return 'Choose this line for flexible Sicilian pressure before committing the center.';
  if (label.includes('scheveningen')) return 'Choose this line for a small-center Sicilian setup with patient counterplay.';
  if (label.includes('alapin')) return 'Choose this line to meet the anti-Sicilian 2.c3 structure cleanly.';
  if (label.includes('taimanov')) return 'Choose this line for queen-side flexibility and a less forcing Sicilian setup.';
  if (label.includes('rook')) return 'Choose this line for a forcing material win after White grabs the bait.';
  if (label.includes('knight')) return 'Choose this line for tactics around a loose knight and weak coordination.';
  if (label.includes('exchange')) return 'Choose this line to learn the quieter structure and its long-term targets.';
  if (label.includes('main')) return 'Choose this line for the core plan you will see most often.';
  if (label.includes('open')) return 'Choose this line for direct central play instead of trap-heavy sidelines.';

  return getPlainLanguageSummary(line);
}

function toOneSentence(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim();
  const match = clean.match(/^.*?[.!?](?:\s|$)/);
  return match ? match[0].trim() : clean;
}
