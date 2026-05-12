import { useRef } from 'react';
import type { Opening, OpeningLine } from '../types';
import { OPENINGS } from '../data/openings';
import { useProgressStore } from '../store/progressStore';
import { useProfileStore } from '../store/profileStore';
import {
  getAccountDailyProgress,
  getQuestProgress,
  getTodayProgress,
  useProgressionStore,
} from '../store/progressionStore';
import {
  FeaturedOpeningsSection,
  HowItWorksStrip,
  LogoOptionsSection,
  OpeningLibrarySection,
  QuestStrip,
  type OpeningSummary,
} from '../components/Home/HomeSections';
import {
  FEATURED_OPENING_IDS,
  HOW_IT_WORKS_STEPS,
} from '../components/Home/homeContent';
import Header from '../components/Header/Header';

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
  const dailyByProfile = useProgressionStore((state) => state.dailyByProfile);
  const { isLoggedIn, displayName } = useProfileStore();
  const libraryRef = useRef<HTMLDivElement | null>(null);
  const accountDaily = getAccountDailyProgress(dailyByProfile, displayName, isLoggedIn);
  const todayProgress = getTodayProgress(accountDaily);
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
    .filter((summary) => summary.firstLine && summary.completedLines < summary.totalLines && (summary.setupComplete || summary.completedLines > 0))
    .sort((a, b) => {
      if (b.masteryPct !== a.masteryPct) return b.masteryPct - a.masteryPct;
      if (b.completedLines !== a.completedLines) return b.completedLines - a.completedLines;
      return b.totalLines - a.totalLines;
    });
  const showFeaturedOpenings = !isLoggedIn || learningOpenings.length > 0;
  const featuredOpenings = isLoggedIn && learningOpenings.length > 0
    ? learningOpenings.slice(0, 4)
    : defaultFeaturedOpenings;
  const masteredOpenings = openingSummaries
    .filter((summary) => summary.firstLine && summary.totalLines > 0 && summary.completedLines === summary.totalLines)
    .sort((a, b) => a.opening.name.localeCompare(b.opening.name));

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-6 sm:px-5 sm:py-8">
      <div className="sticky top-0 z-40 -mx-4 mb-5 shadow-[0_14px_40px_rgba(0,0,0,0.24)] sm:-mx-5">
        <Header
          onHomeClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onSettingsClick={onSettingsClick}
          onProfileClick={onProfileClick}
          titleOverride="Your repertoire"
          subtitleOverride="Courses you are building, reviewing, and exploring."
        />
      </div>

      <div className="mx-auto w-full max-w-[1500px]">
        {isLoggedIn && (
          <QuestStrip isLoggedIn={isLoggedIn} quests={quests} />
        )}

        {!isLoggedIn ? (
          <HowItWorksStrip steps={HOW_IT_WORKS_STEPS} />
        ) : null}

        {showFeaturedOpenings && (
          <div className="mt-5">
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

        {isLoggedIn && masteredOpenings.length > 0 && (
          <div className="mt-5">
            <FeaturedOpeningsSection
              openings={masteredOpenings}
              eyebrow="Mastered"
              title="Mastered openings"
              description="Completed courses, kept close by for quick review."
              compactCards
              onOpenOpening={onSelectOpening}
              onStartLine={onStartOpeningLine}
            />
          </div>
        )}

        <div className="mt-8" ref={libraryRef}>
          <OpeningLibrarySection
            openings={openingSummaries}
            onOpenFinder={onOpenFinder}
            onOpenOpening={onSelectOpening}
            onStartLine={onStartOpeningLine}
          />
        </div>

        <div className="mt-8">
          <LogoOptionsSection />
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
