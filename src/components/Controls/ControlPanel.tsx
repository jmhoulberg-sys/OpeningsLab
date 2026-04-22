import { RotateCcw, ArrowLeft, House } from 'lucide-react';
import { useTrainingStore } from '../../store/trainingStore';

export default function ControlPanel({ onHomeClick }: { onHomeClick: () => void }) {
  const {
    phase,
    selectedLine,
    streak,
    postLine,
    restart,
    backToLineSelect,
  } = useTrainingStore();

  const canRestart = !!selectedLine || phase === 'training' || phase === 'completed';
  const canGoBack = phase === 'training' || phase === 'completed';

  return (
    <div>
      <div className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">
        Actions {streak >= 2 && phase === 'training' && !postLine && (
          <span className="ml-1 text-emerald-300 font-bold normal-case tracking-normal">{streak}</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <ActionButton
          label="Choose Another Line"
          icon={<ArrowLeft size={14} />}
          onClick={backToLineSelect}
          disabled={!canGoBack}
          variant="primary"
        />
        <ActionButton
          label="Front Page"
          icon={<House size={14} />}
          onClick={onHomeClick}
          variant="ghost"
        />
        <ActionButton
          label="Restart Line"
          icon={<RotateCcw size={14} />}
          onClick={restart}
          disabled={!canRestart}
          variant="secondary"
        />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled,
  variant,
}: {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant: 'primary' | 'secondary' | 'ghost' | 'hint';
}) {
  const base =
    'flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150';

  const variants = {
    primary:
      'bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:opacity-40 shadow-md',
    secondary:
      'border border-stone-700/40 bg-stone-800/85 text-stone-100 hover:bg-stone-700/85 disabled:opacity-40',
    ghost:
      'border border-stone-700/35 bg-transparent text-stone-400 hover:bg-stone-800/70 hover:text-stone-200 disabled:opacity-30 disabled:cursor-not-allowed',
    hint:
      'bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-40',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {icon && <span className="flex-shrink-0 opacity-80">{icon}</span>}
      {label}
    </button>
  );
}
