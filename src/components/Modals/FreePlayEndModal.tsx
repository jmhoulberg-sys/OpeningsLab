import { useTrainingStore } from '../../store/trainingStore';

const CONFETTI_COLORS = [
  '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f97316', '#06b6d4', '#84cc16', '#a855f7',
];

function ConfettiPiece({ color, left, delay, size }: {
  color: string;
  left: number;
  delay: number;
  size: number;
}) {
  return (
    <div
      className="absolute confetti-piece pointer-events-none"
      style={{
        left: `${left}%`,
        top: '-10px',
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: size > 6 ? '2px' : '50%',
        animationDelay: `${delay}s`,
      }}
    />
  );
}

export default function FreePlayEndModal() {
  const { showFreePlayResult, freePlayResult, clearFreePlayResult, backToLineSelect } = useTrainingStore();

  if (!showFreePlayResult || freePlayResult === null) return null;

  const isWin = freePlayResult === 'win';
  const isDraw = freePlayResult === 'draw';

  const confettiPieces = isWin
    ? Array.from({ length: 24 }, (_, i) => ({
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        left: Math.round((i / 24) * 100 + (i % 3) * 3),
        delay: Math.round((i * 0.08) * 100) / 100,
        size: i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5,
      }))
    : [];

  function handleBack() {
    clearFreePlayResult();
    backToLineSelect();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative bg-brand-surface border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 p-8 max-w-sm w-full mx-4 text-center overflow-hidden">
        {/* Confetti container */}
        {isWin && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confettiPieces.map((p, i) => (
              <ConfettiPiece key={i} {...p} />
            ))}
          </div>
        )}

        {/* Emoji */}
        <div className="text-5xl mb-3 select-none">
          {isWin ? '🎉' : isDraw ? '🤝' : '😔'}
        </div>

        {/* Title */}
        <h2 className={`text-2xl font-bold mb-2 ${
          isWin ? 'text-emerald-400' : isDraw ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {isWin ? 'You Win!' : isDraw ? 'Draw' : 'You Lost'}
        </h2>

        {/* Subtitle */}
        <p className="text-slate-400 text-sm mb-6">
          {isWin
            ? 'Excellent play in free play mode!'
            : isDraw
            ? 'The game ended in a draw.'
            : 'Better luck next time!'}
        </p>

        {/* Button */}
        <button
          onClick={handleBack}
          className="w-full rounded-xl bg-sky-500 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-sky-400 cursor-pointer"
        >
          Back to Lines
        </button>
      </div>
    </div>
  );
}
