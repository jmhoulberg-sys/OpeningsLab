import type { ReactNode } from 'react';
import { ArrowRight, BookOpen, ChevronRight, Clock3, Play, Sparkles } from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import type { Opening, OpeningLine } from '../../types';
import { fenAfterMoves } from '../../engine/chessEngine';

const MINI_BOARD_SIZE = 112;
const WOOD_LIGHT = '#ead1ab';
const WOOD_DARK = '#9d6b3f';

export interface OpeningSummary {
  opening: Opening;
  totalLines: number;
  completedLines: number;
  firstLine: OpeningLine;
  setupComplete: boolean;
}

export interface ContinueTrainingSummary {
  opening: Opening;
  line: OpeningLine;
  completedLines: number;
  totalLines: number;
  setupComplete: boolean;
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
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-6 py-8 shadow-[0_30px_100px_rgba(0,0,0,0.28)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(234,209,171,0.22),transparent_42%)] lg:block" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-200/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
            <Sparkles size={14} />
            Opening Training
          </div>
          <h1 className="max-w-xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-stone-300 sm:text-lg">
            {subheadline}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onPrimaryClick}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-accent px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-rose-500 cursor-pointer"
            >
              <Play size={16} />
              {primaryLabel}
            </button>
            <button
              onClick={onSecondaryClick}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/14 bg-white/5 px-5 py-3 text-sm font-semibold text-stone-100 transition-colors hover:bg-white/10 cursor-pointer"
            >
              <BookOpen size={16} />
              {secondaryLabel}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
          <MetricCard value="Board-first" label="Learn on the board, not in a spreadsheet." />
          <MetricCard value="Fast setup" label="Static-first UI with local progress only." />
          <MetricCard value="Line-by-line" label="Treat each opening like a training course." />
          <MetricCard value="Real replies" label="Practice against common responses after the line." />
        </div>
      </div>

      {continueSummary && onContinueClick && (
        <div className="relative mt-8 rounded-[24px] border border-emerald-300/15 bg-emerald-300/8 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Continue where you left off
              </div>
              <div className="mt-1 text-lg font-bold text-white">
                {continueSummary.opening.name}
              </div>
              <p className="mt-1 text-sm text-stone-300">
                {continueSummary.setupComplete ? 'Resume training in' : 'Jump back into'} {continueSummary.line.name}.
                {' '}You have completed {continueSummary.completedLines}/{continueSummary.totalLines} lines.
              </p>
            </div>
            <button
              onClick={onContinueClick}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 cursor-pointer"
            >
              Continue Training
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="mt-1 text-sm leading-6 text-stone-300">{label}</div>
    </div>
  );
}

export function HowItWorksStrip({ steps }: HowItWorksStripProps) {
  return (
    <section className="rounded-[28px] border border-white/8 bg-stone-900/60 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">How training works</h2>
          <p className="mt-1 text-sm text-stone-400">
            A simple flow for getting from first click to confident recall.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="rounded-[22px] border border-white/8 bg-white/4 p-4"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-stone-900">
              {index + 1}
            </div>
            <h3 className="text-base font-semibold text-white">{step.label}</h3>
            <p className="mt-2 text-sm leading-6 text-stone-400">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FeaturedOpeningsSection({
  openings,
  onOpenOpening,
  onStartLine,
}: FeaturedOpeningsSectionProps) {
  return (
    <section className="space-y-4" id="featured-openings">
      <SectionHeading
        eyebrow="Featured openings"
        title="Start with a focused opening course"
        description="Pick a featured repertoire, review the line count, and launch straight into the first training unit."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {openings.map((summary) => (
          <FeaturedOpeningCard
            key={summary.opening.id}
            summary={summary}
            onOpenOpening={onOpenOpening}
            onStartLine={onStartLine}
          />
        ))}
      </div>
    </section>
  );
}

function FeaturedOpeningCard({
  summary,
  onOpenOpening,
  onStartLine,
}: {
  summary: OpeningSummary;
  onOpenOpening: (opening: Opening) => void;
  onStartLine: (opening: Opening, line: OpeningLine) => void;
}) {
  const { opening, totalLines, completedLines, firstLine } = summary;
  const setupFen = fenAfterMoves(opening.setupMoves);
  const progress = totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0;

  return (
    <article className="flex h-full flex-col rounded-[26px] border border-white/8 bg-stone-900/70 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">
            Featured
          </div>
          <h3 className="mt-2 text-xl font-bold text-white">{opening.name}</h3>
        </div>
        <CourseStatPill icon={<Clock3 size={14} />} label={`${totalLines} lines`} />
      </div>

      <p className="mt-3 text-sm leading-6 text-stone-400">{opening.description}</p>

      <div className="mt-5 overflow-hidden rounded-[20px] border border-black/10 bg-stone-950/60 p-3">
        <div className="flex items-center gap-4">
          <MiniBoardPreview opening={opening} fen={setupFen} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white">{firstLine.name}</div>
            <div className="mt-1 text-sm text-stone-400">
              First training unit
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-white/8">
              <div
                className="h-1.5 rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-xs font-medium text-stone-400">
              {completedLines}/{totalLines} lines completed
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <button
          onClick={() => onStartLine(opening, firstLine)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-200 px-4 py-3 text-sm font-semibold text-stone-900 transition-colors hover:bg-amber-100 cursor-pointer"
        >
          Try first line
          <ArrowRight size={16} />
        </button>
        <button
          onClick={() => onOpenOpening(opening)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 cursor-pointer"
        >
          Open opening
          <ChevronRight size={16} />
        </button>
      </div>
    </article>
  );
}

export function OpeningLibrarySection({
  openings,
  onOpenOpening,
  onStartLine,
}: OpeningLibrarySectionProps) {
  return (
    <section className="space-y-4" id="opening-library">
      <SectionHeading
        eyebrow="Training units"
        title="Browse every opening in the library"
        description="A lighter course grid for comparing repertoires quickly and starting the next unit in one tap."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {openings.map((summary) => (
          <OpeningLibraryCard
            key={summary.opening.id}
            summary={summary}
            onOpenOpening={onOpenOpening}
            onStartLine={onStartLine}
          />
        ))}
      </div>
    </section>
  );
}

function OpeningLibraryCard({
  summary,
  onOpenOpening,
  onStartLine,
}: {
  summary: OpeningSummary;
  onOpenOpening: (opening: Opening) => void;
  onStartLine: (opening: Opening, line: OpeningLine) => void;
}) {
  const { opening, totalLines, completedLines, firstLine, setupComplete } = summary;
  const progress = totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0;

  return (
    <article className="flex h-full flex-col rounded-[24px] border border-white/8 bg-stone-900/50 p-4 transition-colors hover:border-white/12 hover:bg-stone-900/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">{opening.name}</h3>
          <p className="mt-1 text-sm text-stone-400">
            {totalLines} training units
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold text-stone-300">
          {setupComplete ? 'In progress' : 'New'}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-stone-400">{opening.description}</p>

      <div className="mt-4 flex items-center justify-between text-sm text-stone-400">
        <span>First line</span>
        <span className="font-medium text-stone-200">{firstLine.name}</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/8">
        <div
          className="h-1.5 rounded-full bg-sky-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 text-xs text-stone-500">
        {completedLines}/{totalLines} lines completed
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onStartLine(opening, firstLine)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-stone-950 transition-colors hover:bg-stone-100 cursor-pointer"
        >
          <Play size={15} />
          Try first line
        </button>
        <button
          onClick={() => onOpenOpening(opening)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 cursor-pointer"
        >
          Open
        </button>
      </div>
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
    <div className="max-w-2xl">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">
        {eyebrow}
      </div>
      <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-400 sm:text-base">
        {description}
      </p>
    </div>
  );
}

function CourseStatPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-stone-200">
      {icon}
      {label}
    </span>
  );
}

function MiniBoardPreview({ opening, fen }: { opening: Opening; fen: string }) {
  return (
    <div
      className="flex-shrink-0 overflow-hidden rounded-[18px] border border-black/12 shadow-[0_8px_22px_rgba(0,0,0,0.22)]"
      style={{ width: MINI_BOARD_SIZE, height: MINI_BOARD_SIZE }}
    >
      <Chessboard
        position={fen}
        boardWidth={MINI_BOARD_SIZE}
        boardOrientation={opening.playerColor}
        arePiecesDraggable={false}
        customBoardStyle={{
          borderRadius: '18px',
          backgroundColor: 'transparent',
          boxShadow: 'none',
        }}
        customDarkSquareStyle={{ backgroundColor: WOOD_DARK }}
        customLightSquareStyle={{ backgroundColor: WOOD_LIGHT }}
        animationDuration={0}
      />
    </div>
  );
}
