import { Settings } from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import type { Opening } from '../types';
import { OPENINGS } from '../data/openings';
import { fenAfterMoves } from '../engine/chessEngine';
import { useProgressStore } from '../store/progressStore';

interface HomePageProps {
  onSelectOpening: (opening: Opening) => void;
  onSettingsClick: () => void;
}

const PLACEHOLDER_CARDS = [
  { name: "King's Indian Defense", id: 'kings-indian' },
  { name: "French Defense", id: 'french-defense' },
];

function PawnIcon({ color }: { color: 'white' | 'black' }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={color === 'white' ? '#f1f5f9' : '#1e1e1e'}
      stroke="none"
    >
      <circle cx="12" cy="5" r="3" />
      <path d="M10 8l-2 6h8l-2-6z" />
      <path d="M7 15l-1 3h12l-1-3z" />
    </svg>
  );
}

const BOARD_H = 130; // mini board height — used to pin the right column

function OpeningCard({
  opening,
  onSelect,
}: {
  opening: Opening;
  onSelect: () => void;
}) {
  const { isLineUnlocked } = useProgressStore();
  const totalLines = opening.lines.length;
  const completedLines = opening.lines.filter((l) =>
    isLineUnlocked(opening.id, l.id),
  ).length;
  const pct = totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0;
  const setupFen = fenAfterMoves(opening.setupMoves);

  return (
    <button
      onClick={onSelect}
      className="bg-brand-card border border-white/10 rounded-2xl p-4 text-left hover:border-brand-accent/60 hover:shadow-lg hover:shadow-brand-accent/10 transition-all duration-200 cursor-pointer group w-full"
    >
      {/* items-stretch so the right column fills the mini-board height */}
      <div className="flex items-stretch gap-4">
        {/* Mini board — fixed size, oriented for the player */}
        <div
          className="flex-shrink-0 rounded-lg overflow-hidden pointer-events-none"
          style={{ width: BOARD_H, height: BOARD_H }}
        >
          <Chessboard
            position={setupFen}
            boardWidth={BOARD_H}
            boardOrientation={opening.playerColor}
            arePiecesDraggable={false}
            customBoardStyle={{ borderRadius: '4px' }}
            customDarkSquareStyle={{ backgroundColor: '#b58863' }}
            customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
            animationDuration={0}
          />
        </div>

        {/* Right column: fixed height = board height so progress always aligns */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ height: BOARD_H }}>
          {/* Title + pawn */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="text-white font-bold text-base leading-tight group-hover:text-brand-accent transition-colors">
              {opening.name}
            </h2>
            <span
              title={opening.playerColor === 'white' ? 'You play White' : 'You play Black'}
              className="flex-shrink-0 mt-0.5"
            >
              <PawnIcon color={opening.playerColor} />
            </span>
          </div>

          {/* Description — clipped with ellipsis, never pushes progress bar down */}
          <p className="text-slate-300 text-xs leading-relaxed flex-1 overflow-hidden line-clamp-3">
            {opening.description}
          </p>

          {/* Progress — pinned to the bottom, aligns with the mini board bottom */}
          {totalLines > 0 && (
            <div className="mt-auto pt-1.5 border-t border-white/10 flex-shrink-0">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-slate-400 font-semibold">Lines completed</span>
                <span className={completedLines > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {completedLines}/{totalLines}
                </span>
              </div>
              <div className="w-full bg-slate-600/40 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export default function HomePage({ onSelectOpening, onSettingsClick }: HomePageProps) {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center py-12 px-4">
      {/* Header */}
      <div className="text-center mb-10 relative w-full max-w-2xl">
        <button
          onClick={onSettingsClick}
          title="Settings"
          className="absolute right-0 top-0 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Open settings"
        >
          <Settings size={24} />
        </button>

        <div className="mb-3 flex justify-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="text-brand-accent">
            <circle cx="12" cy="5" r="3"/>
            <path d="M10 8l-2 6h8l-2-6z"/>
            <path d="M7 15l-1 3h12l-1-3z"/>
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          OpeningsLab
        </h1>
        <p className="text-slate-400 mt-2 text-base">Choose your opening</p>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
        {OPENINGS.map((opening) => (
          <OpeningCard
            key={opening.id}
            opening={opening}
            onSelect={() => onSelectOpening(opening)}
          />
        ))}

        {/* Placeholder cards */}
        {PLACEHOLDER_CARDS.map((card) => (
          <div
            key={card.id}
            className="bg-brand-card border border-white/10 rounded-2xl p-4 text-left opacity-40 cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-lg bg-slate-800/60 border border-slate-700/40" style={{ width: 130, height: 130 }} />
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="text-slate-400 font-bold text-base">{card.name}</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-500 shrink-0">
                    Coming Soon
                  </span>
                </div>
                <p className="text-slate-600 text-xs">This opening is not yet available.</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
