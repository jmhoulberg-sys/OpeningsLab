import { useRef } from 'react';
import { LogIn, Route, Settings, UserCircle2 } from 'lucide-react';
import type { Opening, OpeningLine } from '../types';
import { OPENINGS } from '../data/openings';
import { useProgressStore } from '../store/progressStore';
import { useProfileStore } from '../store/profileStore';
import {
  getLevelInfo,
  getQuestProgress,
  getTodayProgress,
  useProgressionStore,
} from '../store/progressionStore';
import {
  FeaturedOpeningsSection,
  HeroSection,
  HowItWorksStrip,
  OpeningLibrarySection,
  QuestStrip,
  type ContinueTrainingSummary,
  type OpeningSummary,
} from '../components/Home/HomeSections';
import {
  FEATURED_OPENING_IDS,
  HOME_HERO,
  HOW_IT_WORKS_STEPS,
} from '../components/Home/homeContent';
import BrandMark from '../components/Brand/BrandMark';
import StreakBadge from '../components/Streak/StreakBadge';

interface HomePageProps {
  onSelectOpening: (opening: Opening) => void;
  onStartOpeningLine: (opening: Opening, line: OpeningLine) => void;
  onSettingsClick: () => void;
  onProfileClick: () => void;
  onOpenFinder: () => void;
}

export default function HomePage({
  onSelectOpening,
  onStartOpeningLine,
  onSettingsClick,
  onProfileClick,
  onOpenFinder,
}: HomePageProps) {
  const openingProgress = useProgressStore((state) => state.openings);
  const isDue = useProgressStore((state) => state.isDue);
  const xpTotal = useProgressionStore((state) => state.xpTotal);
  const daily = useProgressionStore((state) => state.daily);
  const { isLoggedIn, displayName, openAuthModal } = useProfileStore();
  const featuredRef = useRef<HTMLDivElement | null>(null);
  const libraryRef = useRef<HTMLDivElement | null>(null);
  const accountLabel = typeof displayName === 'string' && displayName.trim()
    ? displayName.trim()
    : 'Opening Player';
  const levelInfo = getLevelInfo(xpTotal);
  const todayProgress = getTodayProgress(daily);
  const quests = getQuestProgress(todayProgress);

  const openingSummaries: OpeningSummary[] = OPENINGS.map((opening) => {
    const progress = openingProgress[opening.id];
    const linesProgress = progress?.lines ?? {};
    const completedLines = opening.lines.filter((line) => linesProgress[line.id]?.unlocked).length;
    const totalLines = opening.lines.length;
    const dueLines = opening.lines.filter((line) => linesProgress[line.id]?.unlocked && isDue(opening.id, line.id)).length;

    return {
      opening,
      totalLines,
      completedLines,
      firstLine: opening.lines[0] ?? null,
      setupComplete: progress?.setupCompleted ?? false,
      dueLines,
      masteryPct: totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0,
      statusLabel: totalLines === 0
        ? 'Coming soon'
        : getOpeningStatusLabel(progress?.setupCompleted ?? false, completedLines, totalLines),
      modeUnlocks: getModeUnlocks(progress?.setupCompleted ?? false, completedLines),
    } satisfies OpeningSummary;
  });

  const defaultFeaturedOpenings = FEATURED_OPENING_IDS
    .map((id) => openingSummaries.find((summary) => summary.opening.id === id))
    .filter((summary): summary is OpeningSummary => summary !== undefined);
  const learningOpenings = openingSummaries
    .filter((summary) => summary.firstLine && (summary.setupComplete || summary.completedLines > 0))
    .sort((a, b) => {
      if (b.masteryPct !== a.masteryPct) return b.masteryPct - a.masteryPct;
      if (b.completedLines !== a.completedLines) return b.completedLines - a.completedLines;
      return b.totalLines - a.totalLines;
    });
  const showFeaturedOpenings = !isLoggedIn || learningOpenings.length > 0;
  const featuredOpenings = isLoggedIn && learningOpenings.length > 0
    ? learningOpenings.slice(0, 4)
    : defaultFeaturedOpenings;

  const continueSummary = getContinueTrainingSummary(openingSummaries, openingProgress);

  const heroPrimaryLabel = continueSummary ? 'Continue Training' : HOME_HERO.primaryCta;

  function scrollToLibrary() {
    libraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handlePrimaryAction() {
    if (continueSummary) {
      onStartOpeningLine(continueSummary.opening, continueSummary.line);
      return;
    }

    const defaultOpening = defaultFeaturedOpenings[0]?.opening ?? OPENINGS.find((opening) => opening.lines.length > 0);
    if (defaultOpening) onSelectOpening(defaultOpening);
  }

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-6 sm:px-5 sm:py-8">
      <div className="sticky top-0 z-40 -mx-4 mb-5 border-b border-stone-800/80 bg-stone-950 shadow-[0_14px_40px_rgba(0,0,0,0.24)] sm:-mx-5">
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:px-6">
          <div className="justify-self-start">
            <BrandMark />
          </div>

          <div />

          <div className="flex items-center gap-2.5 justify-self-end">
            <StreakBadge />
            {isLoggedIn ? (
              <button
                onClick={onProfileClick}
                className="hidden h-[68px] min-w-[172px] items-center gap-2 rounded-2xl border border-stone-700/45 bg-stone-800 px-4 text-sm text-slate-200 transition-colors hover:bg-stone-700 hover:text-white sm:flex cursor-pointer"
                title="My Profile"
              >
                <UserCircle2 size={18} className="text-stone-300" />
                <div className="min-w-0">
                  <div className="max-w-[120px] truncate text-left font-semibold text-white">
                    {accountLabel}
                  </div>
                  <div className="mt-1 h-1.5 w-[120px] rounded-full bg-stone-700">
                    <div
                      className="h-1.5 rounded-full bg-emerald-400"
                      style={{ width: `${levelInfo.progressPct}%` }}
                    />
                  </div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('signup')}
                className="hidden h-[68px] min-w-[172px] items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 sm:flex cursor-pointer"
              >
                <LogIn size={18} />
                Sign in
              </button>
            )}
            <button
              onClick={onOpenFinder}
              className="flex h-[68px] items-center gap-2 rounded-2xl border border-stone-700/45 bg-stone-800 px-4 text-sm font-semibold text-stone-200 transition-colors hover:bg-stone-700 hover:text-white cursor-pointer"
            >
              <Route size={18} />
              <span className="hidden md:inline">Finder beta</span>
            </button>
            <button
              onClick={onSettingsClick}
              title="Settings"
              className="h-[68px] rounded-2xl border border-stone-700/45 bg-stone-800 px-4 text-slate-300 transition-colors hover:bg-stone-700 hover:text-white cursor-pointer"
              aria-label="Open settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1500px]">

        {!isLoggedIn ? (
          <>
            <HeroSection
              headline={HOME_HERO.headline}
              subheadline={HOME_HERO.subheadline}
              primaryLabel={heroPrimaryLabel}
              secondaryLabel={HOME_HERO.secondaryCta}
              onPrimaryClick={handlePrimaryAction}
              onSecondaryClick={scrollToLibrary}
              continueSummary={continueSummary}
              onContinueClick={
                continueSummary
                  ? () => onStartOpeningLine(continueSummary.opening, continueSummary.line)
                  : undefined
              }
            />

            <div className="mt-5">
              <HowItWorksStrip steps={HOW_IT_WORKS_STEPS} />
            </div>
          </>
        ) : null}

        {showFeaturedOpenings && (
          <div className="mt-5" ref={featuredRef}>
            <FeaturedOpeningsSection
              openings={featuredOpenings}
              eyebrow={isLoggedIn && learningOpenings.length > 0 ? 'Continue courses' : undefined}
              title={isLoggedIn && learningOpenings.length > 0 ? 'Keep building your repertoire' : undefined}
              description={isLoggedIn && learningOpenings.length > 0 ? 'Openings you have already started, sorted by progress.' : undefined}
              onOpenOpening={onSelectOpening}
              onStartLine={onStartOpeningLine}
            />
          </div>
        )}

        {isLoggedIn && (
          <div className="mt-8">
            <QuestStrip isLoggedIn={isLoggedIn} quests={quests} />
          </div>
        )}

        <div className="mt-8" ref={libraryRef}>
          <OpeningLibrarySection
            openings={openingSummaries}
            onOpenOpening={onSelectOpening}
            onStartLine={onStartOpeningLine}
          />
        </div>
      </div>
    </div>
  );
}

function getModeUnlocks(setupComplete: boolean, completedLines: number) {
  return {
    learn: true,
    practice: setupComplete,
    fullLine: completedLines >= 1,
    topResponses: completedLines >= 1,
    speed: completedLines >= 3,
  };
}

function getOpeningStatusLabel(setupComplete: boolean, completedLines: number, totalLines: number) {
  if (completedLines >= totalLines && totalLines > 0) return 'Mastered';
  if (completedLines >= Math.max(2, Math.ceil(totalLines / 2))) return 'Practice ready';
  if (setupComplete || completedLines > 0) return 'Learning';
  return 'New';
}

function getContinueTrainingSummary(
  summaries: OpeningSummary[],
  progressState: ReturnType<typeof useProgressStore.getState>['openings'],
): ContinueTrainingSummary | undefined {
  const ranked = summaries
    .map((summary) => {
      const progress = progressState[summary.opening.id];
      const lineAttempts = Object.values(progress?.lines ?? {}).reduce(
        (total, lineProgress) => total + lineProgress.attempts,
        0,
      );
      const started = summary.setupComplete || lineAttempts > 0 || summary.completedLines > 0;

      return {
        summary,
        lineAttempts,
        started,
      };
    })
    .filter((item) => item.started)
    .sort((a, b) => {
      if (b.lineAttempts !== a.lineAttempts) return b.lineAttempts - a.lineAttempts;
      if (b.summary.completedLines !== a.summary.completedLines) {
        return b.summary.completedLines - a.summary.completedLines;
      }
      return Number(b.summary.setupComplete) - Number(a.summary.setupComplete);
    });

  const next = ranked[0]?.summary;
  if (!next) return undefined;

  const openingProgress = progressState[next.opening.id];
  const continueLine =
    next.opening.lines.find((line) => openingProgress?.lines[line.id]?.unlocked) ??
    next.firstLine;
  if (!continueLine) return undefined;

  return {
    opening: next.opening,
    line: continueLine,
    completedLines: next.completedLines,
    totalLines: next.totalLines,
    setupComplete: next.setupComplete,
  };
}
