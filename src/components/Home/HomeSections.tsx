import type { ReactNode } from 'react';
import { ArrowRight, Clock3, Play, Sparkles } from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import type { Opening, OpeningLine } from '../../types';
import { fenAfterMoves } from '../../engine/chessEngine';

const FEATURED_BOARD_SIZE = 176;
const LIBRARY_BOARD_SIZE = 148;
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
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-6 py-7 shadow-[0_30px_100px_rgba(0,0,0,0.24)] sm:px-8 sm:py-8">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(234,209,171,0.18),transparent_42%)] lg:block" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-200/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100">
            <Sparkles size={13} />
            Opening Training
          </div>
          <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-3 text-base text-stone-300 sm:text-lg">
            {subheadline}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
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
            {secondaryLabel}
          </button>
        </div>
      </div>

      {continueSummary && onContinueClick && (
        <button
          onClick={onContinueClick}
          className="relative mt-5 flex w-full items-center justify-between gap-4 rounded-[22px] border border-emerald-300/15 bg-emerald-300/8 px-4 py-4 text-left transition-colors hover:bg-emerald-300/12 cursor-pointer"
        >
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Continue
            </div>
            <div className="mt-1 text-base font-bold text-white">
              {continueSummary.opening.name} · {continueSummary.line.name}
            </div>
            <div className="mt-1 text-sm text-stone-300">
              {continueSummary.completedLines}/{continueSummary.totalLines} lines done
            </div>
          </div>
          <ArrowRight size={18} className="text-emerald-300" />
        </button>
      )}
    </section>
  );
}

export function HowItWorksStrip({ steps }: HowItWorksStripProps) {
  return (
    <section className="rounded-[24px] border border-white/8 bg-stone-900/55 p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="rounded-[18px] border border-white/8 bg-white/4 p-4"
          >
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/75">
              0{index + 1}
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
  onOpenOpening,
  onStartLine,
}: FeaturedOpeningsSectionProps) {
  return (
    <section className="space-y-4" id="featured-openings">
      <SectionHeading
        eyebrow="Start here"
        title="Tap a board to begin"
        description="Your fastest route into training."
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
  const { opening, totalLines, completedLines, firstLine, setupComplete } = summary;
  const setupFen = fenAfterMoves(opening.setupMoves);
  const progress = totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0;

  return (
    <article className="flex h-full flex-col rounded-[26px] border border-white/8 bg-stone-900/70 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
      <button
        onClick={() => onStartLine(opening, firstLine)}
        className="group overflow-hidden rounded-[22px] text-left cursor-pointer"
        aria-label={`Start ${opening.name}`}
      >
        <BoardPreview
          opening={opening}
          fen={setupFen}
          size={FEATURED_BOARD_SIZE}
          overlayLabel="Start on board"
        />
      </button>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-white">{opening.name}</h3>
          <div className="mt-1 text-sm text-stone-400">{firstLine.name}</div>
        </div>
        <CourseStatPill icon={<Clock3 size={14} />} label={`${totalLines} lines`} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-stone-400">
        <span>{setupComplete ? 'In progress' : 'New opening'}</span>
        <span>{completedLines}/{totalLines} complete</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/8">
        <div
          className="h-1.5 rounded-full bg-emerald-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onStartLine(opening, firstLine)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-200 px-3 py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:bg-amber-100 cursor-pointer"
        >
          <Play size={15} />
          Start
        </button>
        <button
          onClick={() => onOpenOpening(opening)}
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 cursor-pointer"
        >
          Open
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
        eyebrow="All openings"
        title="Choose your next line"
        description="Board-first library."
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
  const { opening, totalLines, completedLines, firstLine } = summary;
  const setupFen = fenAfterMoves(opening.setupMoves);

  return (
    <article className="flex h-full flex-col rounded-[24px] border border-white/8 bg-stone-900/50 p-4 transition-colors hover:border-white/12 hover:bg-stone-900/70">
      <button
        onClick={() => onStartLine(opening, firstLine)}
        className="group overflow-hidden rounded-[20px] text-left cursor-pointer"
        aria-label={`Start ${opening.name}`}
      >
        <BoardPreview
          opening={opening}
          fen={setupFen}
          size={LIBRARY_BOARD_SIZE}
          overlayLabel="Tap board to start"
        />
      </button>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">{opening.name}</h3>
          <p className="mt-1 text-sm text-stone-400">{totalLines} lines</p>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold text-stone-300">
          {completedLines}/{totalLines}
        </span>
      </div>

      <div className="mt-2 text-sm text-stone-400">{firstLine.name}</div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onStartLine(opening, firstLine)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-stone-950 transition-colors hover:bg-stone-100 cursor-pointer"
        >
          <Play size={15} />
          Start
        </button>
        <button
          onClick={() => onOpenOpening(opening)}
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 cursor-pointer"
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
    <div className="max-w-xl">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">
        {eyebrow}
      </div>
      <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-stone-400 sm:text-base">
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

function BoardPreview({
  opening,
  fen,
  size,
  overlayLabel,
}: {
  opening: Opening;
  fen: string;
  size: number;
  overlayLabel: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[20px] border border-black/12 shadow-[0_10px_24px_rgba(0,0,0,0.22)]"
      style={{ width: '100%', maxWidth: size, margin: '0 auto' }}
    >
      <Chessboard
        position={fen}
        boardWidth={size}
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
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-stone-900 shadow-sm">
          <Play size={13} />
          {overlayLabel}
        </div>
      </div>
    </div>
  );
}
