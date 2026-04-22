import { Settings } from 'lucide-react';
import { useTrainingStore } from '../../store/trainingStore';

interface HeaderProps {
  onSettingsClick: () => void;
  onHomeClick: () => void;
}

export default function Header({ onSettingsClick, onHomeClick }: HeaderProps) {
  const { opening, selectedLine, phase, mistakes } = useTrainingStore();

  return (
    <header className="bg-stone-900/92 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={onHomeClick}
          className="group flex items-center gap-3 cursor-pointer"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-sky-400 flex-shrink-0">
            <circle cx="12" cy="5" r="3" />
            <path d="M10 8l-2 6h8l-2-6z" />
            <path d="M7 15l-1 3h12l-1-3z" />
          </svg>
          <span className="text-lg font-bold tracking-tight text-white transition-colors group-hover:text-sky-300">
            OpeningsLab
          </span>
        </button>

        <div className="hidden min-w-0 items-center gap-2 text-sm md:flex">
          {opening && (
            <>
              <span className="truncate font-semibold text-stone-200">{opening.name}</span>
              {selectedLine && (
                <>
                  <span className="text-stone-600">/</span>
                  <span className="truncate text-stone-400">{selectedLine.name}</span>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {phase === 'training' && (
            <div className="hidden items-center gap-1.5 text-sm sm:flex">
              <span className="text-stone-400">Mistakes</span>
              <span className={`font-bold tabular-nums ${mistakes > 0 ? 'text-rose-300' : 'text-stone-200'}`}>
                {mistakes}
              </span>
            </div>
          )}
          <PhaseBadge phase={phase} />
          <button
            onClick={onSettingsClick}
            className="rounded-xl border border-stone-700/45 bg-stone-800 px-3.5 py-2.5 text-stone-300 transition-colors hover:bg-stone-700 hover:text-white cursor-pointer"
            title="Settings"
            aria-label="Open settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

function PhaseBadge({ phase }: { phase: string }) {
  const config: Record<string, { label: string; color: string }> = {
    idle: { label: 'Idle', color: 'border-stone-700/45 bg-stone-800 text-stone-400' },
    setup: { label: 'Setup', color: 'border-sky-400/15 bg-sky-400/10 text-sky-300' },
    'line-select': { label: 'Pick Line', color: 'border-sky-400/18 bg-sky-400/10 text-sky-300' },
    training: { label: 'Training', color: 'border-emerald-300/15 bg-emerald-300/10 text-emerald-300' },
    completed: { label: 'Done', color: 'border-emerald-300/15 bg-emerald-300/10 text-emerald-300' },
  };

  const { label, color } = config[phase] ?? config.idle;

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}
