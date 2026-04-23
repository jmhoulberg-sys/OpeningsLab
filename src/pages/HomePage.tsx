import { useRef } from 'react';
import { LogIn, Settings, UserCircle2 } from 'lucide-react';
import type { Opening, OpeningLine } from '../types';
import { OPENINGS } from '../data/openings';
import { useProgressStore } from '../store/progressStore';
import { useProfileStore } from '../store/profileStore';
import {
  getLevelInfo,
  getQuestProgress,
  getTodayProgress,
  getWeeklyXp,
  useProgressionStore,
} from '../store/progressionStore';
import {
  FeaturedOpeningsSection,
  HeroSection,
  HowItWorksStrip,
  OpeningLibrarySection,
  ProgressOverview,
  QuestStrip,
  TodayPanel,
  type ContinueTrainingSummary,
  type OpeningSummary,
} from '../components/Home/HomeSections';
import {
  FEATURED_OPENING_IDS,
  HOME_HERO,
  HOW_IT_WORKS_STEPS,
} from '../components/Home/homeContent';
import BrandMark from '../components/Brand/BrandMark';

interface HomePageProps {
  onSelectOpening: (opening: Opening) => void;
  onStartOpeningLine: (opening: Opening, line: OpeningLine) => void;
  onSettingsClick: () => void;
}

export default function HomePage({
  onSelectOpening,
  onStartOpeningLine,
  onSettingsClick,
}: HomePageProps) {
  const openingProgress = useProgressStore((state) => state.openings);
  const isDue = useProgressStore((state) => state.isDue);
  const xpTotal = useProgressionStore((state) => state.xpTotal);
  const daily = useProgressionStore((state) => state.daily);
  const { isLoggedIn, displayName, login } = useProfileStore();
  const featuredRef = useRef<HTMLDivElement | null>(null);
  const libraryRef = useRef<HTMLDivElement | null>(null);
  const accountLabel = typeof displayName === 'string' && displayName.trim()
    ? displayName.trim()
    : 'Opening Player';
  const levelInfo = getLevelInfo(xpTotal);
  const todayProgress = getTodayProgress(daily);
  const weeklyXp = getWeeklyXp(daily);
  const quests = getQuestProgress(todayProgress);
  const questsComplete = quests.filter((quest) => quest.progress >= quest.target).length;

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

  const featuredOpenings = FEATURED_OPENING_IDS
    .map((id) => openingSummaries.find((summary) => summary.opening.id === id))
    .filter((summary): summary is OpeningSummary => summary !== undefined);

  const continueSummary = getContinueTrainingSummary(openingSummaries, openingProgress);
  const reviewSummary = getDueReviewSummary(openingSummaries, openingProgress, isDue);
  const nextOpening = openingSummaries.find((summary) => summary.firstLine && !summary.setupComplete)
    ?? openingSummaries.find((summary) => summary.firstLine)
    ?? openingSummaries[0];
  const dueCount = countDueReviews(openingSummaries);

  const heroPrimaryLabel = continueSummary ? 'Continue Training' : HOME_HERO.primaryCta;

  function scrollToLibrary() {
    libraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handlePrimaryAction() {
    if (continueSummary) {
      onStartOpeningLine(continueSummary.opening, continueSummary.line);
      return;
    }

    const defaultOpening = featuredOpenings[0]?.opening ?? OPENINGS.find((opening) => opening.lines.length > 0);
    if (defaultOpening) onSelectOpening(defaultOpening);
  }

  function handleReviewAction() {
    if (reviewSummary) {
      onStartOpeningLine(reviewSummary.opening, reviewSummary.line);
      return;
    }
    scrollToLibrary();
  }

  function handleStartNewAction() {
    if (nextOpening?.firstLine) {
      onStartOpeningLine(nextOpening.opening, nextOpening.firstLine);
      return;
    }
    scrollToLibrary();
  }

  const todaySummary = {
    dueCount,
    weeklyXp,
    todayXp: todayProgress.xp,
    continueSummary,
    continueLabel: continueSummary
      ? `${continueSummary.completedLines}/${continueSummary.totalLines} lines complete`
      : undefined,
    reviewOpening: reviewSummary?.opening,
    reviewLine: reviewSummary?.line,
    reviewLabel: reviewSummary
      ? `${dueCount} line${dueCount === 1 ? '' : 's'} due across your openings`
      : 'Nothing due yet. Keep building new lines.',
    newOpening: nextOpening?.opening,
    newLine: nextOpening?.firstLine ?? undefined,
  };

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-6 sm:px-5 sm:py-8">
      <div className="sticky top-0 z-40 -mx-4 mb-5 border-b border-stone-800/70 bg-stone-950/98 shadow-[0_14px_40px_rgba(0,0,0,0.2)] backdrop-blur-md sm:-mx-5">
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:px-6">
          <div className="justify-self-start">
            <BrandMark />
          </div>

          <div className="hidden min-w-0 justify-self-center lg:block">
            <div className="flex h-[72px] min-w-[430px] items-center justify-center rounded-[22px] border border-stone-800/60 bg-stone-900/88 px-5 shadow-[0_12px_34px_rgba(0,0,0,0.2)]">
              <div>
                <div className="text-center text-lg font-bold leading-tight text-white">
                  OpeningsLab
                </div>
                <div className="mt-1 max-w-[520px] truncate text-center text-sm text-stone-400">
                  Board-first opening training
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 justify-self-end">
            <div className="hidden h-[62px] min-w-[138px] rounded-2xl bg-stone-900 px-3.5 py-2.5 sm:block">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                Level
              </div>
              <div className="mt-1 flex items-center gap-3">
                <div className="text-lg font-bold text-white">{isLoggedIn ? levelInfo.level : '--'}</div>
                <div className="h-1.5 w-24 rounded-full bg-stone-800">
                  <div
                    className="h-1.5 rounded-full bg-sky-400 transition-all duration-500"
                    style={{ width: `${isLoggedIn ? levelInfo.progressPct : 100}%` }}
                  />
                </div>
              </div>
              {!isLoggedIn && <div className="mt-1 text-[11px] text-stone-500">Log in to see details</div>}
            </div>
            <div className="hidden h-[62px] min-w-[138px] rounded-2xl bg-stone-900 px-3.5 py-2.5 md:block">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">Weekly</div>
              <div className="mt-1 text-lg font-bold text-white">{isLoggedIn ? `${weeklyXp} XP` : '--'}</div>
              {!isLoggedIn && <div className="mt-1 text-[11px] text-stone-500">Log in to see details</div>}
            </div>
            <div className="hidden h-[62px] min-w-[138px] rounded-2xl bg-stone-900 px-3.5 py-2.5 lg:block">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">Daily</div>
              <div className="mt-1 text-lg font-bold text-white">{isLoggedIn ? `${questsComplete}/${quests.length}` : '--'}</div>
              {!isLoggedIn && <div className="mt-1 text-[11px] text-stone-500">Log in to see details</div>}
            </div>
            {isLoggedIn ? (
              <button
                onClick={onSettingsClick}
                className="hidden h-[62px] min-w-[172px] items-center gap-2 rounded-2xl border border-stone-700/45 bg-stone-800 px-4 text-sm text-slate-200 transition-colors hover:bg-stone-700 hover:text-white sm:flex cursor-pointer"
              >
                <UserCircle2 size={18} className="text-sky-300" />
                <span className="max-w-[120px] truncate font-semibold">{accountLabel}</span>
              </button>
            ) : (
              <button
                onClick={login}
                className="hidden h-[62px] min-w-[172px] items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 sm:flex cursor-pointer"
              >
                <LogIn size={18} />
                Sign in
              </button>
            )}
            <button
              onClick={onSettingsClick}
              title="Settings"
              className="h-[62px] rounded-2xl border border-stone-700/45 bg-stone-800 px-4 text-slate-300 transition-colors hover:bg-stone-700 hover:text-white cursor-pointer"
              aria-label="Open settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl">

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

        <div className="mt-5" ref={featuredRef}>
          <FeaturedOpeningsSection
            openings={featuredOpenings}
            onOpenOpening={onSelectOpening}
            onStartLine={onStartOpeningLine}
          />
        </div>

        {isLoggedIn && (
          <div className="mt-5">
            <ProgressOverview
              isLoggedIn={isLoggedIn}
              level={levelInfo.level}
              progressPct={levelInfo.progressPct}
              xpToNextLevel={Math.max(0, levelInfo.nextLevelXp - xpTotal)}
              weeklyXp={weeklyXp}
              todayXp={todayProgress.xp}
              totalQuestsComplete={questsComplete}
              totalQuests={quests.length}
            />
          </div>
        )}

        <div className="mt-5">
          <TodayPanel
            today={todaySummary}
            onContinue={handlePrimaryAction}
            onReview={handleReviewAction}
            onStartNew={handleStartNewAction}
          />
        </div>

        <div className="mt-8">
          <QuestStrip isLoggedIn={isLoggedIn} quests={quests} />
        </div>

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

function countDueReviews(summaries: OpeningSummary[]) {
  return summaries.reduce((total, summary) => total + summary.dueLines, 0);
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

function getDueReviewSummary(
  summaries: OpeningSummary[],
  progressState: ReturnType<typeof useProgressStore.getState>['openings'],
  isDue: ReturnType<typeof useProgressStore.getState>['isDue'],
): ContinueTrainingSummary | undefined {
  for (const summary of summaries) {
    const dueLine = summary.opening.lines.find((line) => {
      const lineProgress = progressState[summary.opening.id]?.lines[line.id];
      return lineProgress?.unlocked && isDue(summary.opening.id, line.id);
    });

    if (dueLine) {
      return {
        opening: summary.opening,
        line: dueLine,
        completedLines: summary.completedLines,
        totalLines: summary.totalLines,
        setupComplete: summary.setupComplete,
      };
    }
  }

  return undefined;
}
