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
  title?: string;
  description?: string;
  eyebrow?: string;
  onOpenOpening: (opening: Opening) => void;
  onStartLine: (opening: Opening, line: OpeningLine) => void;
}

interface OpeningLibrarySectionProps {
  openings: OpeningSummary[];
  onOpenOpening: (opening: Opening) => void;
  onStartLine: (opening: Opening, line: OpeningLine) => void;
}

type OpeningFilter = 'all' | 'white' | 'black' | 'gambits' | 'refutations';

const OPENING_FILTERS: Array<{ id: OpeningFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'white', label: 'White' },
  { id: 'black', label: 'Black' },
  { id: 'gambits', label: 'Gambits' },
  { id: 'refutations', label: 'Refutations' },
];

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
    <section className="grid gap-3 lg:grid-cols-[1.35fr_1fr_1fr]">
      <div className="rounded-[20px] border border-sky-300/15 bg-stone-900/75 p-4 shadow-[0_18px_42px_rgba(14,165,233,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-300">
              Level progress
            </div>
            <div className="mt-1 text-3xl font-black text-white">
              {isLoggedIn ? `Level ${level}` : 'Sign in to see level'}
            </div>
          </div>
          <div className="rounded-2xl bg-sky-400/18 p-3 text-sky-200 shadow-[0_0_28px_rgba(56,189,248,0.22)]">
            <Crown size={24} />
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-stone-800">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 transition-all duration-500"
            style={{ width: `${isLoggedIn ? progressPct : 100}%` }}
          />
        </div>
        <div className="mt-2 text-xs font-semibold text-stone-400">
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
    <section className="rounded-[22px] border border-stone-800/55 bg-stone-900/55 p-3">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
        <div className="px-1">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-300">Today</div>
          <h2 className="mt-1 text-xl font-black text-white">Choose your next run</h2>
          <p className="mt-0.5 text-sm text-stone-400">Continue, review, or learn something fresh.</p>
        </div>
        <TodayActionButton
          label="Continue"
          title={today.continueSummary?.opening.name ?? 'Resume training'}
          meta={today.continueLabel ?? 'Latest course'}
          icon={<Play size={17} />}
          tone="sky"
          onClick={onContinue}
        />
        <TodayActionButton
          label="Review"
          title={today.reviewOpening?.name ?? 'No reviews due'}
          meta={today.reviewLine ? today.reviewLine.name : today.reviewLabel ?? 'Nothing waiting'}
          icon={<CalendarClock size={17} />}
          tone="emerald"
          onClick={onReview}
        />
        <TodayActionButton
          label="New"
          title={today.newOpening?.name ?? 'Start new'}
          meta={today.newOpening ? `${today.newOpening.lines.length} lines ready` : 'Pick a course'}
          icon={<Sparkles size={17} />}
          tone="amber"
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
        title="Today’s training streak"
        description={isLoggedIn ? 'Clear these to bank XP and keep momentum.' : 'Log in to save daily progress.'}
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
  title = 'Board-first courses',
  description = 'Clean starts, clear line counts, fast entry.',
  eyebrow = 'Featured openings',
  onStartLine,
}: FeaturedOpeningsSectionProps) {
  return (
    <section className="space-y-3" id="featured-openings">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
  const [activeFilter, setActiveFilter] = useState<OpeningFilter>('all');
  const rankedOpenings = [...openings].sort((a, b) => {
    const aMatch = openingMatchesFilter(a.opening, activeFilter);
    const bMatch = openingMatchesFilter(b.opening, activeFilter);
    if (aMatch !== bMatch) return aMatch ? -1 : 1;
    return compareOpeningProgress(a, b);
  });

  return (
    <section className="space-y-3" id="opening-library">
      <SectionHeading
        eyebrow="Library"
        title="All openings"
        description="Sorted by your progress, with filters for color and themes."
      />
      <div className="flex flex-wrap gap-2">
        {OPENING_FILTERS.map((filter) => {
          const active = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                active
                  ? 'border-sky-400/45 bg-sky-500 text-slate-950'
                  : 'border-stone-700/45 bg-stone-900 text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {rankedOpenings.map((summary) => (
          <OpeningCard
            key={summary.opening.id}
            summary={summary}
            compact
            muted={activeFilter !== 'all' && !openingMatchesFilter(summary.opening, activeFilter)}
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
    ? 'border-sky-300/15 bg-sky-400/16 text-sky-200 shadow-[0_0_28px_rgba(56,189,248,0.14)]'
    : 'border-emerald-300/15 bg-emerald-400/16 text-emerald-200 shadow-[0_0_28px_rgba(52,211,153,0.14)]';

  return (
    <div className="rounded-[20px] border border-stone-800/55 bg-stone-900/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">
          {eyebrow}
        </div>
        <div className={`rounded-2xl border p-3 ${toneClasses}`}>
          {icon}
        </div>
      </div>
      <div className="mt-2 text-3xl font-black text-white">{value}</div>
      <div className="mt-0.5 text-xs font-semibold text-stone-400">{description}</div>
    </div>
  );
}

function TodayActionButton({
  label,
  title,
  tone,
  icon,
  meta,
  onClick,
}: {
  label: string;
  title: string;
  meta: string;
  tone: 'sky' | 'emerald' | 'amber';
  icon: ReactNode;
  onClick: () => void;
}) {
  const toneClasses = {
    sky: 'border-sky-300/25 bg-sky-500/14 text-sky-100 hover:bg-sky-500/22',
    emerald: 'border-emerald-300/25 bg-emerald-400/12 text-emerald-100 hover:bg-emerald-400/18',
    amber: 'border-amber-300/25 bg-amber-300/12 text-amber-100 hover:bg-amber-300/18',
  }[tone];

  return (
    <button
      onClick={onClick}
      className={`min-w-0 rounded-2xl border px-4 py-3 text-left transition-colors cursor-pointer lg:w-[250px] ${toneClasses}`}
    >
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] opacity-80">
        {icon}
        {label}
      </div>
      <div className="mt-2 truncate text-base font-black text-white">{title}</div>
      <div className="mt-0.5 truncate text-xs font-semibold text-stone-400">{meta}</div>
    </button>
  );
}

function OpeningCard({
  summary,
  compact,
  muted = false,
  onStartLine,
}: {
  summary: OpeningSummary;
  compact: boolean;
  muted?: boolean;
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
      className={`group flex h-full flex-col rounded-[24px] border border-stone-800/55 bg-stone-900/60 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.12)] transition-all duration-200 ${muted ? 'opacity-45 grayscale-[0.25]' : 'opacity-100'} ${isClickable ? 'cursor-pointer hover:border-stone-500/80 hover:bg-stone-700/55 hover:shadow-[0_22px_56px_rgba(0,0,0,0.18)]' : ''}`}
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

function openingMatchesFilter(opening: Opening, filter: OpeningFilter) {
  if (filter === 'all') return true;
  if (filter === 'white' || filter === 'black') return opening.playerColor === filter;

  const haystack = `${opening.id} ${opening.name} ${opening.description}`.toLowerCase();
  if (filter === 'gambits') return haystack.includes('gambit');
  if (filter === 'refutations') return haystack.includes('refutation') || haystack.includes('refute');

  return true;
}

function compareOpeningProgress(a: OpeningSummary, b: OpeningSummary) {
  if (b.masteryPct !== a.masteryPct) return b.masteryPct - a.masteryPct;
  if (b.completedLines !== a.completedLines) return b.completedLines - a.completedLines;
  if (b.totalLines !== a.totalLines) return b.totalLines - a.totalLines;
  return a.opening.name.localeCompare(b.opening.name);
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
