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
              label="Answer"
              onClick={showAnswer}
              disabled={false}
              variant="secondary"
            />
          ) : (
            <ActionButton
              label="Hint"
              onClick={showHint}
              disabled={!canHint}
              variant="secondary"
            />
          )
        )}
        <ActionButton
          label="Restart Line"
          onClick={restart}
          disabled={!canRestart}
          variant="secondary"
        />
        <ActionButton
          label="← Select Line"
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
  onClick,
  disabled,
  variant,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant: 'primary' | 'secondary' | 'ghost';
}) {
  const base = 'w-full py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-150 text-left';
  const variants = {
    primary:
      'bg-brand-accent text-white hover:bg-red-500 disabled:opacity-40',
    secondary:
      'bg-slate-700/60 text-slate-200 hover:bg-slate-600/60 disabled:opacity-40 border border-slate-600/40',
    ghost:
      'bg-transparent text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {label}
    </button>
  );
}
