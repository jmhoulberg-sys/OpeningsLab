import { useRef } from 'react';
import { Settings } from 'lucide-react';
import type { Opening, OpeningLine } from '../types';
import { OPENINGS } from '../data/openings';
import { useProgressStore } from '../store/progressStore';
import {
  FeaturedOpeningsSection,
  HeroSection,
  HowItWorksStrip,
  OpeningLibrarySection,
  type ContinueTrainingSummary,
  type OpeningSummary,
} from '../components/Home/HomeSections';
import {
  FEATURED_OPENING_IDS,
  HOME_HERO,
  HOW_IT_WORKS_STEPS,
} from '../components/Home/homeContent';

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
  const featuredRef = useRef<HTMLDivElement | null>(null);
  const libraryRef = useRef<HTMLDivElement | null>(null);

  const openingSummaries = OPENINGS.map((opening) => {
    const progress = openingProgress[opening.id];
    const linesProgress = progress?.lines ?? {};
    const completedLines = opening.lines.filter((line) => linesProgress[line.id]?.unlocked).length;

    return {
      opening,
      totalLines: opening.lines.length,
      completedLines,
      firstLine: opening.lines[0],
      setupComplete: progress?.setupCompleted ?? false,
    } satisfies OpeningSummary;
  });

  const featuredOpenings = FEATURED_OPENING_IDS
    .map((id) => openingSummaries.find((summary) => summary.opening.id === id))
    .filter((summary): summary is OpeningSummary => Boolean(summary));

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

    const defaultOpening = featuredOpenings[0]?.opening ?? OPENINGS[0];
    if (defaultOpening) onSelectOpening(defaultOpening);
  }

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-6 sm:px-5 sm:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/70">
              OpeningsLab
            </div>
            <div className="mt-1 text-sm text-stone-400">Board-first opening training.</div>
          </div>
          <button
            onClick={onSettingsClick}
            title="Settings"
            className="rounded-2xl border border-stone-700/40 bg-stone-800/80 px-3.5 py-3 text-slate-300 transition-colors hover:bg-stone-700/80 hover:text-white cursor-pointer"
            aria-label="Open settings"
          >
            <Settings size={20} />
          </button>
        </div>

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

        <div className="mt-8" ref={featuredRef}>
          <FeaturedOpeningsSection
            openings={featuredOpenings}
            onOpenOpening={onSelectOpening}
            onStartLine={onStartOpeningLine}
          />
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

  return {
    opening: next.opening,
    line: continueLine,
    completedLines: next.completedLines,
    totalLines: next.totalLines,
    setupComplete: next.setupComplete,
  };
}
