import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import type { Opening, OpeningLine } from '../../types';
import { fenAfterMoves } from '../../engine/chessEngine';

const WOOD_LIGHT = '#e6d0a9';
const WOOD_DARK = '#9b6a3c';

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
    <section className="relative overflow-hidden rounded-[30px] border border-stone-700/35 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800 px-5 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:px-7 sm:py-7">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(74,162,255,0.12),transparent_42%)] lg:block" />
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
            className="inline-flex items-center justify-center rounded-2xl border border-stone-700/35 bg-stone-800/80 px-5 py-3 text-sm font-semibold text-stone-100 transition-colors hover:bg-stone-700/80 cursor-pointer"
          >
            {secondaryLabel}
          </button>
        </div>
      </div>

      {continueSummary && onContinueClick && (
        <button
          onClick={onContinueClick}
          className="relative mt-4 flex w-full items-center justify-between gap-4 rounded-[20px] border border-emerald-300/[0.08] bg-emerald-300/[0.05] px-4 py-3 text-left transition-colors hover:bg-emerald-300/[0.08] cursor-pointer"
        >
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Continue
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

export function HowItWorksStrip({ steps }: HowItWorksStripProps) {
  return (
    <section className="rounded-[22px] border border-stone-700/35 bg-stone-900/45 p-3 sm:p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="rounded-[18px] border border-stone-700/35 bg-stone-800/55 p-4"
          >
            <div className="mb-2 text-lg font-extrabold text-sky-300">
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
  onOpenOpening,
  onStartLine,
}: FeaturedOpeningsSectionProps) {
  return (
    <section className="space-y-3" id="featured-openings">
      <SectionHeading
        eyebrow="Start here"
        title="Tap a board to begin"
        description="Fastest way into training."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {openings.map((summary) => (
          <OpeningCard
            key={summary.opening.id}
            summary={summary}
            boardLabel="Start"
            compact={false}
            onOpenOpening={onOpenOpening}
            onStartLine={onStartLine}
          />
        ))}
      </div>
    </section>
  );
}

export function OpeningLibrarySection({
  openings,
  onOpenOpening,
  onStartLine,
}: OpeningLibrarySectionProps) {
  return (
    <section className="space-y-3" id="opening-library">
      <SectionHeading
        eyebrow="All openings"
        title="Choose your next line"
        description="Board-first library."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {openings.map((summary) => (
          <OpeningCard
            key={summary.opening.id}
            summary={summary}
            boardLabel="Tap to start"
            compact
            onOpenOpening={onOpenOpening}
            onStartLine={onStartLine}
          />
        ))}
      </div>
    </section>
  );
}

function OpeningCard({
  summary,
  boardLabel,
  compact,
  onOpenOpening,
  onStartLine,
}: {
  summary: OpeningSummary;
  boardLabel: string;
  compact: boolean;
  onOpenOpening: (opening: Opening) => void;
  onStartLine: (opening: Opening, line: OpeningLine) => void;
}) {
  const { opening, totalLines, completedLines, firstLine, setupComplete } = summary;
  const setupFen = fenAfterMoves(opening.setupMoves);

  return (
    <article className="flex h-full flex-col rounded-[24px] border border-stone-700/35 bg-stone-900/55 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
      <button
        onClick={() => onStartLine(opening, firstLine)}
        className="group cursor-pointer overflow-hidden rounded-[20px] text-left"
        aria-label={`Start ${opening.name}`}
      >
        <BoardPreview opening={opening} fen={setupFen} overlayLabel={boardLabel} />
      </button>

      <div className={`grid items-start gap-2 ${compact ? 'mt-3' : 'mt-3.5'}`} style={{ gridTemplateColumns: '1fr auto' }}>
        <div className="min-w-0 min-h-[86px]">
          <h3 className="line-clamp-2 text-[1.7rem] font-bold leading-[1.02] text-white md:text-[1.82rem] lg:text-[1.62rem] xl:text-[1.72rem]">
            {opening.name}
          </h3>
          <div className="mt-1 text-sm text-stone-400">{totalLines} lines</div>
        </div>
        <span className="rounded-full border border-stone-700/35 bg-stone-800/80 px-3 py-1 text-xs font-semibold text-stone-200">
          {completedLines}/{totalLines}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-stone-400">
        <span>{setupComplete ? 'In progress' : 'New opening'}</span>
        <span>{completedLines}/{totalLines} complete</span>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onStartLine(opening, firstLine)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500 px-3 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 cursor-pointer"
        >
          <Play size={15} />
          Start
        </button>
        <button
          onClick={() => onOpenOpening(opening)}
          className="inline-flex items-center justify-center rounded-xl border border-stone-700/35 bg-stone-800/80 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700/80 cursor-pointer"
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
  overlayLabel,
}: {
  opening: Opening;
  fen: string;
  overlayLabel: string;
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
      className="relative aspect-square w-full overflow-hidden rounded-[20px] border border-black/8 shadow-[0_10px_24px_rgba(0,0,0,0.22)]"
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
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/68 via-black/24 to-transparent px-3 py-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-stone-900 shadow-sm">
          <Play size={12} />
          {overlayLabel}
        </div>
      </div>
    </div>
  );
}
