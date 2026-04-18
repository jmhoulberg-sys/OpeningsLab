import type { Opening } from '../types';
import { OPENINGS } from '../data/openings';

interface HomePageProps {
  onSelectOpening: (opening: Opening) => void;
  onSettingsClick: () => void;
}

const PLACEHOLDER_CARDS = [
  { name: "King's Indian Defense", id: 'kings-indian' },
  { name: "Queen's Gambit Accepted", id: 'queens-gambit-accepted' },
];

const COLOR_LABELS: Record<string, string> = {
  white: 'White',
  black: 'Black',
};

export default function HomePage({ onSelectOpening, onSettingsClick }: HomePageProps) {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center py-12 px-4">
      {/* Header */}
      <div className="text-center mb-10 relative w-full max-w-2xl">
        {/* Settings gear — top-right of header */}
        <button
          onClick={onSettingsClick}
          title="Settings"
          className="absolute right-0 top-0 text-slate-400 hover:text-white text-2xl leading-none transition-colors cursor-pointer select-none"
          aria-label="Open settings"
        >
          ⚙
        </button>

        <div className="text-5xl mb-3 select-none">♟</div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          OpeningsLab
        </h1>
        <p className="text-slate-400 mt-2 text-base">Choose your opening</p>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
        {/* Real openings from registry */}
        {OPENINGS.map((opening) => (
          <button
            key={opening.id}
            onClick={() => onSelectOpening(opening)}
            className="bg-brand-surface border border-slate-700/60 rounded-2xl p-6 text-left hover:border-brand-accent/60 hover:shadow-lg hover:shadow-brand-accent/10 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-white font-bold text-lg group-hover:text-brand-accent transition-colors">
                {opening.name}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 ml-2 shrink-0">
                {COLOR_LABELS[opening.playerColor]}
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
              {opening.description}
            </p>
          </button>
        ))}

        {/* Placeholder cards */}
        {PLACEHOLDER_CARDS.map((card) => (
          <div
            key={card.id}
            className="bg-brand-surface border border-slate-700/40 rounded-2xl p-6 text-left opacity-50 cursor-not-allowed"
          >
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-slate-400 font-bold text-lg">{card.name}</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-500 ml-2 shrink-0">
                Coming Soon
              </span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              This opening is not yet available.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
