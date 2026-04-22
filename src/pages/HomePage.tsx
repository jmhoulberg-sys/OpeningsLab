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
  { name: 'French Defense', id: 'french-defense' },
];

const MINI_BOARD_SIZE = 130;
const WOOD_LIGHT = '#e4c79a';
const WOOD_DARK = '#9d6b3f';

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

function OpeningCard({
  opening,
  onSelect,
}: {
  opening: Opening;
  onSelect: () => void;
}) {
  const { isLineUnlocked } = useProgressStore();
  const totalLines = opening.lines.length;
  const completedLines = opening.lines.filter((line) =>
    isLineUnlocked(opening.id, line.id),
  ).length;
  const pct = totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0;
  const setupFen = fenAfterMoves(opening.setupMoves);

  return (
    <button
      onClick={onSelect}
      className="group w-full rounded-[24px] border border-white/10 bg-brand-card p-4 text-left transition-all duration-200 hover:border-brand-accent/60 hover:shadow-lg hover:shadow-brand-accent/10 cursor-pointer"
    >
      <div className="flex items-stretch gap-4">
        <div
          className="flex-shrink-0 overflow-hidden rounded-[18px] pointer-events-none shadow-[0_10px_24px_rgba(0,0,0,0.22)]"
          style={{ width: MINI_BOARD_SIZE, height: MINI_BOARD_SIZE }}
        >
          <Chessboard
            position={setupFen}
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

        <div className="flex flex-1 min-w-0 flex-col" style={{ height: MINI_BOARD_SIZE }}>
          <div className="mb-1 flex items-start justify-between gap-2">
            <h2 className="text-base font-bold leading-tight text-white transition-colors group-hover:text-brand-accent">
              {opening.name}
            </h2>
            <span
              title={opening.playerColor === 'white' ? 'You play White' : 'You play Black'}
              className="mt-0.5 flex-shrink-0"
            >
              <PawnIcon color={opening.playerColor} />
            </span>
          </div>

          <p className="line-clamp-3 flex-1 overflow-hidden text-xs leading-relaxed text-slate-300">
            {opening.description}
          </p>

          {totalLines > 0 && (
            <div className="mt-auto flex-shrink-0 border-t border-white/10 pt-1.5">
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="font-semibold text-slate-200">Lines completed</span>
                <span className={completedLines > 0 ? 'font-bold text-emerald-400' : 'text-slate-300'}>
                  {completedLines}/{totalLines}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-600/40">
                <div
                  className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
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
    <div className="min-h-screen bg-brand-bg px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center">
        <div className="relative mb-8 w-full max-w-5xl text-center">
          <button
            onClick={onSettingsClick}
            title="Settings"
            className="absolute right-0 top-0 text-slate-400 transition-colors hover:text-white cursor-pointer"
            aria-label="Open settings"
          >
            <Settings size={24} />
          </button>

          <div className="mb-3 flex justify-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-brand-accent"
            >
              <circle cx="12" cy="5" r="3" />
              <path d="M10 8l-2 6h8l-2-6z" />
              <path d="M7 15l-1 3h12l-1-3z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            OpeningsLab
          </h1>
          <p className="mt-2 text-base text-slate-400">Choose your opening</p>
        </div>

        <div className="grid w-full max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {OPENINGS.map((opening) => (
            <OpeningCard
              key={opening.id}
              opening={opening}
              onSelect={() => onSelectOpening(opening)}
            />
          ))}

          {PLACEHOLDER_CARDS.map((card) => (
            <div
              key={card.id}
              className="cursor-not-allowed rounded-[24px] border border-white/10 bg-brand-card p-4 text-left opacity-40"
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 rounded-[18px] border border-slate-700/40 bg-slate-800/60"
                  style={{ width: MINI_BOARD_SIZE, height: MINI_BOARD_SIZE }}
                />
                <div className="flex-1 min-w-0 pt-1">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h2 className="text-base font-bold text-slate-400">{card.name}</h2>
                    <span className="shrink-0 rounded-full bg-slate-700/60 px-2 py-0.5 text-xs font-semibold text-slate-500">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">This opening is not yet available.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
