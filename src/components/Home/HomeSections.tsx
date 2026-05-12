import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  CalendarClock,
  Check,
  Crown,
  Filter,
  Play,
  Route,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import type { Opening, OpeningLine } from '../../types';
import { fenAfterMoves } from '../../engine/chessEngine';
import { useSettingsStore } from '../../store/settingsStore';
import { getCustomPieces } from '../Board/pieceThemes';
import { TwoPawnsLogo, type LogoVariant } from '../Brand/BrandMark';

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
  compactCards?: boolean;
  onOpenOpening: (opening: Opening) => void;
  onStartLine: (opening: Opening, line: OpeningLine) => void;
}

interface OpeningLibrarySectionProps {
  openings: OpeningSummary[];
  onOpenFinder: () => void;
  onOpenOpening: (opening: Opening) => void;
  onStartLine: (opening: Opening, line: OpeningLine) => void;
}

type OpeningFilter = 'all' | 'white' | 'black' | 'gambits' | 'refutations';
type OpeningSort = 'progress' | 'az' | 'lines';

const OPENING_FILTERS: Array<{ id: Exclude<OpeningFilter, 'all'>; label: string }> = [
  { id: 'white', label: 'White' },
  { id: 'black', label: 'Black' },
  { id: 'gambits', label: 'Gambits' },
  { id: 'refutations', label: 'Refutations' },
];

const OPENING_SORTS: Array<{ id: OpeningSort; label: string }> = [
  { id: 'progress', label: 'Progress' },
  { id: 'az', label: 'A-Z' },
  { id: 'lines', label: 'Line count' },
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
    <section className="relative overflow-hidden rounded-[24px] border border-stone-800/55 bg-stone-900 px-5 py-5 sm:px-6">
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {headline}
          </h1>
          <p className="mt-1.5 text-base text-stone-300">
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
      <div className="rounded-[18px] border border-stone-800/55 bg-stone-900/75 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">
              Level progress
            </div>
            <div className="mt-0.5 text-3xl font-black text-white">
              {isLoggedIn ? `Level ${level}` : 'Sign in to see level'}
            </div>
          </div>
          <div className="rounded-2xl bg-stone-800 p-3 text-stone-200">
            <Crown size={24} />
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-stone-800">
          <div
            className="h-2 rounded-full bg-emerald-400 transition-all duration-500"
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
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Today</div>
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
      <SectionHeading eyebrow="Daily quests" title="Today's training session" />
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
    <section className="rounded-xl bg-stone-800/45 p-2.5 sm:p-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="flex min-h-[92px] items-center gap-4 rounded-xl bg-stone-900/45 p-4"
          >
            <div className="shrink-0 text-5xl font-extrabold leading-none text-sky-400">
              {index + 1}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white">{step.label}</h3>
              <p className="mt-1 text-sm text-stone-400">{step.description}</p>
            </div>
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
  compactCards = false,
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
            compact={compactCards}
            onStartLine={onStartLine}
          />
        ))}
      </div>
    </section>
  );
}

export function OpeningLibrarySection({
  openings,
  onOpenFinder,
  onStartLine,
}: OpeningLibrarySectionProps) {
  const [activeFilters, setActiveFilters] = useState<Array<Exclude<OpeningFilter, 'all'>>>([]);
  const [sortMode, setSortMode] = useState<OpeningSort>('progress');
  const [filterOpen, setFilterOpen] = useState(false);
  const rankedOpenings = [...openings]
    .filter((summary) => openingMatchesFilters(summary.opening, activeFilters))
    .sort((a, b) => compareOpenings(a, b, sortMode));

  return (
    <section className="space-y-3" id="opening-library">
      <SectionHeading
        eyebrow="Library"
        title="All openings"
        description={activeFilters.length > 0 ? `${rankedOpenings.length} openings match your filters.` : 'Sorted by your progress.'}
        action={(
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setFilterOpen((value) => !value)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-stone-700/45 bg-stone-800 px-3 text-sm font-semibold text-stone-100 transition-colors hover:bg-stone-700 hover:text-white cursor-pointer"
              >
                <Filter size={16} />
                Filters
                {activeFilters.length > 0 && (
                  <span className="rounded-full bg-sky-400 px-1.5 py-0.5 text-[10px] font-black text-slate-950">
                    {activeFilters.length}
                  </span>
                )}
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-12 z-30 w-72 rounded-xl border border-stone-700/70 bg-stone-950 p-2 shadow-2xl shadow-black/45">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">Filters</div>
                    <button
                      onClick={() => setFilterOpen(false)}
                      className="rounded-lg p-1 text-stone-500 hover:bg-stone-800 hover:text-white"
                      aria-label="Close filters"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {OPENING_FILTERS.map((filter) => {
                      const active = activeFilters.includes(filter.id);
                      return (
                        <button
                          key={filter.id}
                          onClick={() => {
                            setActiveFilters((current) =>
                              current.includes(filter.id)
                                ? current.filter((id) => id !== filter.id)
                                : [...current, filter.id],
                            );
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-stone-200 transition-colors hover:bg-stone-800 cursor-pointer"
                        >
                          {filter.label}
                          <span className={`flex h-5 w-5 items-center justify-center rounded border ${active ? 'border-sky-300 bg-sky-400 text-slate-950' : 'border-stone-600 text-transparent'}`}>
                            <Check size={13} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="my-2 h-px bg-stone-800" />
                  <div className="px-2 py-1 text-xs font-black uppercase tracking-[0.18em] text-stone-500">Sort</div>
                  <div className="space-y-1">
                    {OPENING_SORTS.map((sort) => (
                      <button
                        key={sort.id}
                        onClick={() => setSortMode(sort.id)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition-colors cursor-pointer ${
                          sortMode === sort.id ? 'bg-sky-400 text-slate-950' : 'text-stone-200 hover:bg-stone-800'
                        }`}
                      >
                        {sort.label}
                        {sortMode === sort.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                  {(activeFilters.length > 0 || sortMode !== 'progress') && (
                    <button
                      onClick={() => {
                        setActiveFilters([]);
                        setSortMode('progress');
                      }}
                      className="mt-2 w-full rounded-lg border border-stone-700/60 px-3 py-2 text-sm font-semibold text-stone-300 hover:bg-stone-800 hover:text-white"
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onOpenFinder}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-stone-700/45 bg-stone-800 px-3 text-sm font-semibold text-stone-200 transition-colors hover:bg-stone-700 hover:text-white cursor-pointer"
            >
              <Route size={16} />
              Explorer
            </button>
          </div>
        )}
      />
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filterId) => {
            const label = OPENING_FILTERS.find((filter) => filter.id === filterId)?.label ?? filterId;
            return (
              <button
                key={filterId}
                onClick={() => setActiveFilters((current) => current.filter((id) => id !== filterId))}
                className="inline-flex items-center gap-1.5 rounded-full bg-stone-800 px-2.5 py-1 text-xs font-semibold text-stone-200 hover:bg-stone-700"
              >
                {label}
                <X size={12} />
              </button>
            );
          })}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {rankedOpenings.map((summary) => (
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

export function LogoOptionsSection() {
  const options: Array<{ id: LogoVariant; label: string; description: string }> = [
    { id: 'side-by-side', label: 'Side-by-side pawns', description: 'Simple pair, strongest small-size read.' },
    { id: 'light-dark', label: 'White + black pawns', description: 'Clear chess signal with color contrast.' },
    { id: 'diagonal-2', label: 'Diagonal 2', description: 'Offset pieces hint at the number 2.' },
    { id: 'boxed-pair', label: 'Boxed pair', description: 'Best match for the current app header.' },
    { id: 'wordmark', label: 'Text-first mark', description: 'Small icon supports the 2pawns name.' },
    { id: 'minimal', label: 'Minimal icon', description: 'Clean favicon or compact app icon.' },
  ];

  return (
    <section className="space-y-3">
      <SectionHeading
        eyebrow="Brand"
        title="2pawns logo options"
        description="Six directions using the same two-pawn idea."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => (
          <div key={option.id} className="rounded-xl border border-stone-800/60 bg-stone-900/55 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-stone-800/70">
                <TwoPawnsLogo variant={option.id} size={44} />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-black text-white">
                  {option.id === 'wordmark' ? (
                    <span>2<span className="text-sky-300">pawns</span></span>
                  ) : (
                    option.label
                  )}
                </div>
                <div className="mt-1 text-sm leading-snug text-stone-400">{option.description}</div>
              </div>
            </div>
          </div>
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
    ? 'border-stone-700/45 bg-stone-800 text-stone-200'
    : 'border-emerald-300/15 bg-emerald-400/16 text-emerald-200';

  return (
    <div className="rounded-[18px] border border-stone-800/55 bg-stone-900/75 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">
          {eyebrow}
        </div>
        <div className={`rounded-2xl border p-3 ${toneClasses}`}>
          {icon}
        </div>
      </div>
      <div className="mt-1.5 text-3xl font-black text-white">{value}</div>
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
    sky: 'border-stone-700/45 bg-stone-800/80 text-stone-100 hover:bg-stone-700/80',
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
      className={`group flex h-full flex-col rounded-xl border border-stone-800/55 bg-stone-900/62 p-2.5 transition-colors duration-200 ${muted ? 'opacity-45 grayscale-[0.25]' : 'opacity-100'} ${isClickable ? 'cursor-pointer hover:border-stone-500/80 hover:bg-stone-800/85' : ''}`}
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
        className={`overflow-hidden rounded-lg text-left ${isComingSoon ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
      >
        <BoardPreview opening={opening} fen={setupFen} isClickable={isClickable} />
      </div>

      <div className="mt-3 grid items-start gap-2" style={{ gridTemplateColumns: '1fr auto' }}>
        <div className={`min-w-0 ${cardTitleHeight}`}>
          <h3 className="line-clamp-2 text-xl font-bold leading-tight text-white md:text-[1.35rem]">
            {opening.name}
          </h3>
          <div className="mt-1 text-sm text-stone-400">{isComingSoon ? 'Coming soon' : `${totalLines} lines`}</div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${isMastered ? 'bg-emerald-500/12 text-emerald-300' : 'bg-stone-800 text-stone-200'}`}>
          {isMastered && <Trophy size={12} />}
          {statusLabel}
        </span>
      </div>

      <div className="mt-1.5 h-1.5 rounded-full bg-stone-800">
        <div
          className="h-1.5 rounded-full bg-emerald-400 transition-all duration-500"
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

function openingMatchesFilters(opening: Opening, filters: Array<Exclude<OpeningFilter, 'all'>>) {
  if (filters.length === 0) return true;
  return filters.every((filter) => openingMatchesFilter(opening, filter));
}

function compareOpenings(a: OpeningSummary, b: OpeningSummary, sort: OpeningSort) {
  if (sort === 'az') return a.opening.name.localeCompare(b.opening.name);
  if (sort === 'lines') {
    if (b.totalLines !== a.totalLines) return b.totalLines - a.totalLines;
    return a.opening.name.localeCompare(b.opening.name);
  }
  if (b.masteryPct !== a.masteryPct) return b.masteryPct - a.masteryPct;
  if (b.completedLines !== a.completedLines) return b.completedLines - a.completedLines;
  if (b.totalLines !== a.totalLines) return b.totalLines - a.totalLines;
  return a.opening.name.localeCompare(b.opening.name);
}

function SectionHeading({
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-xl">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">{title}</h2>
        {description && (
          <p className="mt-1.5 text-sm text-stone-400 sm:text-base">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
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
  const pieceStyle = useSettingsStore((state) => state.pieceStyle);
  const customPieces = getCustomPieces(pieceStyle);

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
      className={`relative aspect-square w-full overflow-hidden rounded-lg ${isClickable ? 'cursor-pointer ring-1 ring-transparent transition-colors duration-200 group-hover:ring-sky-400/35 board-preview-clickable' : ''}`}
    >
      <Chessboard
        position={fen}
        boardWidth={boardWidth}
        boardOrientation={opening.playerColor}
        arePiecesDraggable={false}
        customBoardStyle={{
          borderRadius: '8px',
          backgroundColor: 'transparent',
          boxShadow: 'none',
        }}
        customDarkSquareStyle={{ backgroundColor: WOOD_DARK }}
        customLightSquareStyle={{ backgroundColor: WOOD_LIGHT }}
        customPieces={customPieces}
        animationDuration={0}
      />
      {isClickable && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/10 via-white/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          <div className="pointer-events-none absolute inset-0 rounded-lg border border-sky-300/0 transition-colors duration-200 group-hover:border-sky-300/25" />
        </>
      )}
    </div>
  );
}
