import { Lightbulb, Eye, RotateCcw, ArrowLeft } from 'lucide-react';
import { useTrainingStore } from '../../store/trainingStore';

export default function ControlPanel() {
  const {
    phase,
    mode,
    postLine,
    isAwaitingUserMove,
    showingCorrectMove,
    wrongMoveSan,
    selectedLine,
    streak,
    hintSquare,
    showAnswer,
    showHint,
    restart,
    backToLineSelect,
  } = useTrainingStore();

  const inSession = phase === 'training' || phase === 'setup';
  const hideHint = mode === 'drill' || mode === 'time-trial';
  const canRestart = !!selectedLine || phase === 'training' || phase === 'completed';
  const canGoBack = phase === 'training' || phase === 'completed';

  // Hint is available when awaiting move, no wrong move shown, no answer shown, not post-line
  const canHint = inSession && isAwaitingUserMove && !wrongMoveSan && !showingCorrectMove && !postLine && !hideHint;
  // Answer phase: hint square is shown, upgrade to full arrow
  const canAnswer = canHint && !!hintSquare;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
        Actions {streak >= 2 && phase === 'training' && !postLine && (
          <span className="text-amber-400 font-bold normal-case tracking-normal">🔥 {streak}</span>
        )}
      </h3>
      <div className="flex flex-col gap-2">
        {!hideHint && (
          canAnswer ? (
            <ActionButton
              label="Show Answer"
              icon={<Eye size={14} />}
              onClick={showAnswer}
              disabled={false}
              variant="hint"
            />
          ) : (
            <ActionButton
              label="Hint"
              icon={<Lightbulb size={14} />}
              onClick={showHint}
              disabled={!canHint}
              variant="hint"
            />
          )
        )}
        <ActionButton
          label="Restart Line"
          icon={<RotateCcw size={14} />}
          onClick={restart}
          disabled={!canRestart}
          variant="secondary"
        />
        <ActionButton
          label="Select Line"
          icon={<ArrowLeft size={14} />}
          onClick={backToLineSelect}
          disabled={!canGoBack}
          variant="ghost"
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
    'w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-2';

  const variants = {
    primary:
      'bg-brand-accent text-white hover:bg-red-500 disabled:opacity-40 shadow-md',
    secondary:
      'bg-slate-600/70 text-slate-100 hover:bg-slate-500/70 disabled:opacity-40 border border-slate-500/50 shadow-sm',
    ghost:
      'bg-slate-700/40 text-slate-400 hover:text-slate-200 hover:bg-slate-600/40 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700/40',
    hint:
      'bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 border border-emerald-500/60 shadow-lg shadow-emerald-500/40 disabled:shadow-none',
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
