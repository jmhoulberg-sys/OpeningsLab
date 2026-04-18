import { useTrainingStore } from '../../store/trainingStore';

interface HeaderProps {
  onSettingsClick: () => void;
  onHomeClick: () => void;
}

export default function Header({ onSettingsClick, onHomeClick }: HeaderProps) {
  const { opening, selectedLine, phase, mistakes } = useTrainingStore();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-brand-surface/90 border-b border-slate-700/50 backdrop-blur-sm flex-shrink-0">
      {/* Logo / App name */}
      <button
        onClick={onHomeClick}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <span className="text-2xl select-none">♟</span>
        <span className="text-lg font-bold text-white tracking-tight group-hover:text-brand-accent transition-colors">
          OpeningsLab
        </span>
      </button>

      {/* Current context breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        {opening && (
          <>
            <span className="text-slate-300 font-semibold">{opening.name}</span>
            {selectedLine && (
              <>
                <span className="text-slate-600">›</span>
                <span className="text-slate-400">{selectedLine.name}</span>
              </>
            )}
          </>
        )}
      </div>

      {/* Right: mistakes + phase badge + settings */}
      <div className="flex items-center gap-4">
        {phase === 'training' && (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-slate-400">Mistakes:</span>
            <span className={`font-bold tabular-nums ${mistakes > 0 ? 'text-red-400' : 'text-slate-300'}`}>
              {mistakes}
            </span>
          </div>
        )}
        <PhaseBadge phase={phase} />
        <button
          onClick={onSettingsClick}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer text-lg leading-none"
          title="Settings"
          aria-label="Open settings"
        >
          ⚙
        </button>
      </div>
    </header>
  );
}

function PhaseBadge({ phase }: { phase: string }) {
  const config: Record<string, { label: string; color: string }> = {
    idle:          { label: 'Idle',       color: 'bg-slate-700 text-slate-400' },
    setup:         { label: 'Setup',      color: 'bg-blue-800/60 text-blue-300' },
    'line-select': { label: 'Pick Line',  color: 'bg-yellow-800/60 text-yellow-300' },
    training:      { label: 'Training',   color: 'bg-emerald-800/60 text-emerald-300' },
    completed:     { label: 'Done',       color: 'bg-purple-800/60 text-purple-300' },
  };

  const { label, color } = config[phase] ?? config.idle;

  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>
      {label}
    </span>
  );
}
