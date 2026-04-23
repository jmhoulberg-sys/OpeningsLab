import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  CalendarClock,
  Crown,
  Play,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import type { Opening, OpeningLine } from '../../types';
import { fenAfterMoves } from '../../engine/chessEngine';

const WOOD_LIGHT = '#e6d0a9';
const WOOD_DARK = '#9b6a3c';

export interface ModeUnlockSummary {
  learn: boolean;
  practice: boolean;
  fullLine: boolean;
  topResponses: boolean;
  speed: boolean;
}

export interface OpeningSummary {
  opening: Opening;
  totalLines: number;
  completedLines: number;
  firstLine: OpeningLine | null;
  setupComplete: boolean;
  dueLines: number;
  masteryPct: number;
  statusLabel: string;
  modeUnlocks: ModeUnlockSummary;
}

export interface ContinueTrainingSummary {
  opening: Opening;
  line: OpeningLine;
  completedLines: number;
  totalLines: number;
  setupComplete: boolean;
}

export interface TodaySummary {
  dueCount: number;
  weeklyXp: number;
  todayXp: number;
  continueSummary?: ContinueTrainingSummary;
  continueLabel?: string;
  reviewOpening?: Opening;
  reviewLine?: OpeningLine;
  reviewLabel?: string;
  newOpening?: Opening;
  newLine?: OpeningLine;
}

export interface QuestSummary {
  id: string;
  label: string;
  progress: number;
  target: number;
}

interface HeroSectionProps {
  headline: string;
  subheadline: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
  continueSummary?: ContinueTrainingSummary;
  onContinueClick?: () => void;
}

interface HowItWorksStep {
  id: string;
  label: string;
  description: string;
}

interface HowItWorksStripProps {
  steps: HowItWorksStep[];
}

interface ProgressOverviewProps {
  isLoggedIn: boolean;
  level: number;
  progressPct: number;
  xpToNextLevel: number;
  weeklyXp: number;
  todayXp: number;
  totalQuestsComplete: number;
  totalQuests: number;
}

interface TodayPanelProps {
  today: TodaySummary;
  onContinue: () => void;
  onReview: () => void;
  onStartNew: () => void;
}

interface QuestStripProps {
  isLoggedIn: boolean;
  quests: QuestSummary[];
}

interface FeaturedOpeningsSectionProps {
  openings: OpeningSummary[];
  onOpenOpening: (opening: Opening) => void;
  onStartLine: (opening: Opening, line: OpeningLine) => void;
}

interface OpeningLibrarySectionProps {
  openings: OpeningSummary[];
  onOpenOpening: (opening: Opening) => void;
  onStartLine: (opening: Opening, line: OpeningLine) => void;
}

export function HeroSection({
  headline,
  subheadline,
  primaryLabel,
  secondaryLabel,
  onPrimaryClick,
  onSecondaryClick,
  continueSummary,
  onContinueClick,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-stone-800/55 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800 px-5 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:px-7 sm:py-7">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.15),transparent_42%)] lg:block" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-2 text-base text-stone-300 sm:text-lg">
            {subheadline}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onPrimaryClick}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 hover:bg-sky-400 cursor-pointer"
          >
            <Play size={16} />
            {primaryLabel}
          </button>
          <button
            onClick={onSecondaryClick}
            className="inline-flex items-center justify-center rounded-2xl border border-stone-700/50 bg-stone-800/80 px-5 py-3 text-sm font-semibold text-stone-100 transition-colors hover:bg-stone-700/80 cursor-pointer"
          >
            {secondaryLabel}
          </button>
        </div>
      </div>

      {continueSummary && onContinueClick && (
        <button
          onClick={onContinueClick}
          className="relative mt-4 flex w-full items-center justify-between gap-4 rounded-[20px] border border-emerald-300/[0.08] bg-emerald-300/[0.06] px-4 py-3 text-left transition-colors hover:bg-emerald-300/[0.09] cursor-pointer"
        >
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Continue where you left off
            </div>
            <div className="mt-1 truncate text-base font-bold text-white">
              {continueSummary.opening.name}
            </div>
            <div className="mt-1 text-sm text-stone-300">
              {continueSummary.completedLines}/{continueSummary.totalLines} lines complete
            </div>
          </div>
          <ArrowRight size={18} className="flex-shrink-0 text-emerald-300" />
        </button>
      )}
    </section>
  );
}

export function ProgressOverview({
  isLoggedIn,
  level,
  progressPct,
  xpToNextLevel,
  weeklyXp,
  todayXp,
  totalQuestsComplete,
  totalQuests,
}: ProgressOverviewProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
      <div className="rounded-[24px] border border-stone-800/55 bg-stone-900/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/80">
              Level Progress
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white">
              {isLoggedIn ? `Level ${level}` : 'Sign in to see level'}
            </div>
          </div>
          <div className="rounded-2xl bg-sky-500/15 p-3 text-sky-300">
            <Crown size={24} />
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-stone-800">
          <div
            className="h-2 rounded-full bg-sky-400 transition-all duration-500"
            style={{ width: `${isLoggedIn ? progressPct : 100}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-stone-400">
          {isLoggedIn ? `${xpToNextLevel} XP to the next level` : 'Save XP, streaks, and progress to your account'}
        </div>
      </div>

      <MetricCard
        eyebrow="Weekly"
        value={`${weeklyXp} XP`}
        description={`${todayXp} XP earned today`}
        icon={<Sparkles size={21} />}
        tone="sky"
      />
      <MetricCard
        eyebrow="Quests"
        value={`${totalQuestsComplete}/${totalQuests}`}
        description="Daily training targets"
        icon={<Trophy size={21} />}
        tone="emerald"
      />
    </section>
  );
}

export function TodayPanel({ today, onContinue, onReview, onStartNew }: TodayPanelProps) {
  return (
    <section className="space-y-3">
      <SectionHeading
        eyebrow="Today"
        title="Pick up momentum fast"
        description="Continue, review, or start a fresh line."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <TodayActionCard
          eyebrow="Continue"
          title={today.continueSummary?.opening.name ?? 'Resume your latest line'}
          description={today.continueLabel ?? 'Jump back into your most recent opening.'}
          buttonLabel={today.continueSummary ? 'Continue training' : 'Start featured line'}
          tone="sky"
          icon={<Play size={18} />}
          onClick={onContinue}
        />
        <TodayActionCard
          eyebrow="Review"
          title={today.reviewOpening?.name ?? 'No reviews due'}
          description={today.reviewLabel ?? `${today.dueCount} due today`}
          buttonLabel={today.reviewLine ? 'Review due line' : 'Browse openings'}
          tone="emerald"
          icon={<CalendarClock size={18} />}
          onClick={onReview}
        />
        <TodayActionCard
          eyebrow="New"
          title={today.newOpening?.name ?? 'Start a new opening'}
          description={today.newOpening ? `${today.newOpening.lines.length} lines ready to learn` : 'Pick a fresh course and begin.'}
          buttonLabel="Try first line"
          tone="sky"
          icon={<Sparkles size={18} />}
          onClick={onStartNew}
        />
      </div>
    </section>
  );
}

export function QuestStrip({ isLoggedIn, quests }: QuestStripProps) {
  return (
    <section className="space-y-3">
      <SectionHeading
        eyebrow="Daily quests"
        title="Small targets that bring you back"
        description={isLoggedIn ? 'Fast wins for today.' : 'Log in to see details and save daily progress.'}
      />
      <div className="grid gap-3 md:grid-cols-3">
        {quests.map((quest) => {
          const pct = Math.round((quest.progress / quest.target) * 100);
          const done = quest.progress >= quest.target;
          return (
            <div
              key={quest.id}
              className="rounded-[20px] border border-stone-800/55 bg-stone-900/60 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">{quest.label}</div>
                {isLoggedIn ? (
                  <span className={`text-xs font-semibold ${done ? 'text-emerald-300' : 'text-stone-400'}`}>
                    {quest.progress}/{quest.target}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-stone-500">Log in to see details</span>
                )}
              </div>
              <div className="mt-3 h-2 rounded-full bg-stone-800">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${done ? 'bg-emerald-400' : 'bg-sky-400'}`}
                  style={{ width: `${Math.min(100, isLoggedIn ? pct : 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function HowItWorksStrip({ steps }: HowItWorksStripProps) {
  return (
    <section className="rounded-[24px] bg-stone-900/45 p-3 sm:p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="rounded-[18px] bg-stone-800/55 p-4"
          >
            <div className="mb-2 text-2xl font-extrabold text-sky-300">
              {index + 1}
            </div>
            <h3 className="text-sm font-semibold text-white">{step.label}</h3>
            <p className="mt-1 text-sm text-stone-400">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FeaturedOpeningsSection({
  openings,
  onStartLine,
}: FeaturedOpeningsSectionProps) {
  return (
    <section className="space-y-3" id="featured-openings">
      <SectionHeading
        eyebrow="Featured openings"
        title="Board-first courses"
        description="Clean starts, clear line counts, fast entry."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {openings.map((summary) => (
          <OpeningCard
            key={summary.opening.id}
            summary={summary}
            compact={false}
            onStartLine={onStartLine}
          />
        ))}
      </div>
    </section>
  );
}

export function OpeningLibrarySection({
  openings,
  onStartLine,
}: OpeningLibrarySectionProps) {
  return (
    <section className="space-y-3" id="opening-library">
      <SectionHeading
        eyebrow="Library"
        title="Choose the next course"
        description="Tap the board, try the first line, or open the full opening."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {openings.map((summary) => (
          <OpeningCard
            key={summary.opening.id}
            summary={summary}
            compact
            onStartLine={onStartLine}
          />
        ))}
      </div>
    </section>
  );
}

function MetricCard({
  eyebrow,
  value,
  description,
  icon,
  tone,
}: {
  eyebrow: string;
  value: string;
  description: string;
  icon: ReactNode;
  tone: 'sky' | 'emerald';
}) {
  const toneClasses = tone === 'sky'
    ? 'bg-sky-500/15 text-sky-300'
    : 'bg-emerald-500/15 text-emerald-300';

  return (
    <div className="rounded-[24px] border border-stone-800/55 bg-stone-900/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
          {eyebrow}
        </div>
        <div className={`rounded-2xl p-3 ${toneClasses}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 text-3xl font-extrabold text-white">{value}</div>
      <div className="mt-1 text-sm text-stone-400">{description}</div>
    </div>
  );
}

function TodayActionCard({
  eyebrow,
  title,
  description,
  buttonLabel,
  tone,
  icon,
  onClick,
}: {
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
  tone: 'sky' | 'emerald';
  icon: ReactNode;
  onClick: () => void;
}) {
  const toneClasses = tone === 'sky'
    ? 'bg-sky-500 text-slate-950 hover:bg-sky-400'
    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400';

  return (
    <div className="flex h-full flex-col rounded-[24px] border border-stone-800/55 bg-stone-900/70 p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
        {eyebrow}
      </div>
      <div className="mt-3 text-2xl font-bold leading-tight text-white">{title}</div>
      <div className="mt-2 flex-1 text-sm text-stone-400">{description}</div>
      <button
        onClick={onClick}
        className={`mt-4 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors cursor-pointer ${toneClasses}`}
      >
        {icon}
        {buttonLabel}
      </button>
    </div>
  );
}

function OpeningCard({
  summary,
  compact,
  onStartLine,
}: {
  summary: OpeningSummary;
  compact: boolean;
  onStartLine: (opening: Opening, line: OpeningLine) => void;
}) {
  const { opening, totalLines, completedLines, firstLine, masteryPct, statusLabel } = summary;
  const setupFen = fenAfterMoves(opening.setupMoves);
  const cardTitleHeight = compact ? 'min-h-[76px]' : 'min-h-[84px]';
  const isComingSoon = !firstLine;
  const isClickable = !isComingSoon;
  const isMastered = !isComingSoon && completedLines > 0 && completedLines === totalLines;

  return (
    <article
      onClick={() => {
        if (firstLine) onStartLine(opening, firstLine);
      }}
      className={`group flex h-full flex-col rounded-[24px] border border-stone-800/55 bg-stone-900/60 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.12)] transition-all duration-200 ${isClickable ? 'cursor-pointer hover:border-stone-500/80 hover:bg-stone-700/55 hover:shadow-[0_22px_56px_rgba(0,0,0,0.18)]' : ''}`}
      aria-label={isComingSoon ? `${opening.name} coming soon` : `Start ${opening.name}`}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(event) => {
        if (!isClickable) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (firstLine) onStartLine(opening, firstLine);
        }
      }}
    >
      <div
        className={`overflow-hidden rounded-[20px] text-left ${isComingSoon ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
      >
        <BoardPreview opening={opening} fen={setupFen} isClickable={isClickable} />
      </div>

      <div className={`mt-3 grid items-start gap-2 ${compact ? '' : ''}`} style={{ gridTemplateColumns: '1fr auto' }}>
        <div className={`min-w-0 ${cardTitleHeight}`}>
          <h3 className="line-clamp-2 text-[1.55rem] font-bold leading-[1.02] text-white md:text-[1.7rem]">
            {opening.name}
          </h3>
          <div className="mt-2 text-sm text-stone-400">{isComingSoon ? 'Coming soon' : `${totalLines} lines`}</div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${isMastered ? 'bg-emerald-500/12 text-emerald-300' : 'bg-stone-800 text-stone-200'}`}>
          {isMastered && <Trophy size={12} />}
          {statusLabel}
        </span>
      </div>

      <div className="mt-2 h-2 rounded-full bg-stone-800">
        <div
          className="h-2 rounded-full bg-emerald-400 transition-all duration-500"
          style={{ width: `${masteryPct}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
        <span>{isComingSoon ? 'Placeholder opening' : `${completedLines}/${totalLines} complete`}</span>
        <span>{isComingSoon ? 'More soon' : `${masteryPct}% mastery`}</span>
      </div>

      {isComingSoon && (
        <div className="mt-4 rounded-xl bg-stone-800/70 px-4 py-2.5 text-center text-sm font-semibold text-stone-500">
          Coming soon
        </div>
      )}
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-xl">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/80">
        {eyebrow}
      </div>
      <h2 className="mt-1.5 text-2xl font-bold text-white sm:text-3xl">{title}</h2>
      <p className="mt-1.5 text-sm text-stone-400 sm:text-base">
        {description}
      </p>
    </div>
  );
}

function BoardPreview({
  opening,
  fen,
  isClickable,
}: {
  opening: Opening;
  fen: string;
  isClickable: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(240);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => {
      setBoardWidth(Math.max(180, Math.floor(node.clientWidth)));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative aspect-square w-full overflow-hidden rounded-[20px] shadow-[0_10px_24px_rgba(0,0,0,0.22)] ${isClickable ? 'cursor-pointer ring-1 ring-transparent transition-all duration-200 group-hover:ring-sky-400/35 group-hover:shadow-[0_14px_30px_rgba(14,165,233,0.16)] board-preview-clickable' : ''}`}
    >
      <Chessboard
        position={fen}
        boardWidth={boardWidth}
        boardOrientation={opening.playerColor}
        arePiecesDraggable={false}
        customBoardStyle={{
          borderRadius: '20px',
          backgroundColor: 'transparent',
          boxShadow: 'none',
        }}
        customDarkSquareStyle={{ backgroundColor: WOOD_DARK }}
        customLightSquareStyle={{ backgroundColor: WOOD_LIGHT }}
        animationDuration={0}
      />
      {isClickable && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/10 via-white/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          <div className="pointer-events-none absolute inset-0 rounded-[20px] border border-sky-300/0 transition-colors duration-200 group-hover:border-sky-300/25" />
        </>
      )}
    </div>
  );
}
