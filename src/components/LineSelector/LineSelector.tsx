import { useTrainingStore } from '../../store/trainingStore';
import { useProgressStore } from '../../store/progressStore';
import type { Opening, OpeningLine, LineProgress } from '../../types';

interface LineSelectorProps {
  opening: Opening;
}

export default function LineSelector({ opening }: LineSelectorProps) {
  const { selectedLine, selectLine, phase } = useTrainingStore();
  const { isSetupComplete, isLineUnlocked, getLineProgress } = useProgressStore();

  const setupDone = isSetupComplete(opening.id);
  const isActive = phase === 'line-select' || phase === 'training' || phase === 'completed';

  // Completion percentage
  const totalLines = opening.lines.length;
  const completedLines = opening.lines.filter((l) =>
    isLineUnlocked(opening.id, l.id),
  ).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header + completion % */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Lines
        </h3>
        {setupDone && totalLines > 0 && (
          <span className="text-[10px] font-semibold text-slate-500">
            <span className={completedLines > 0 ? 'text-emerald-400' : ''}>
              {completedLines}
            </span>
            /{totalLines} done
          </span>
        )}
      </div>

      {/* Completion bar */}
      {setupDone && totalLines > 0 && (
        <div className="w-full bg-slate-700/60 rounded-full h-1 mb-2.5">
          <div
            className="bg-emerald-500 h-1 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((completedLines / totalLines) * 100)}%` }}
          />
        </div>
      )}

      {!setupDone && (
        <p className="text-xs text-slate-500 italic">
          Complete the opening setup to unlock lines.
        </p>
      )}

      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 pr-1">
        {opening.lines.map((line) => (
          <LineRow
            key={line.id}
            line={line}
            openingId={opening.id}
            isSelected={selectedLine?.id === line.id}
            isSetupDone={setupDone}
            isActive={isActive}
            isUnlocked={isLineUnlocked(opening.id, line.id)}
            progress={getLineProgress(opening.id, line.id)}
            onSelect={() => {
              if (setupDone) selectLine(line);
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Line Row ────────────────────────────────────────────────────────

interface LineRowProps {
  line: OpeningLine;
  openingId: string;
  isSelected: boolean;
  isSetupDone: boolean;
  isActive: boolean;
  isUnlocked: boolean;
  progress: LineProgress | undefined;
  onSelect: () => void;
}

function LineRow({
  line,
  openingId,
  isSelected,
  isSetupDone,
  isUnlocked,
  progress,
  onSelect,
}: LineRowProps) {
  const { toggleFavorite, isFavorite } = useProgressStore();
  const locked = !isSetupDone;
  const favorite = isFavorite(openingId, line.id);

  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation(); // don't trigger line selection
    toggleFavorite(openingId, line.id);
  }

  return (
    <button
      onClick={onSelect}
      disabled={locked}
      className={`
        w-full text-left rounded-lg px-3 py-2.5 transition-all duration-150
        border text-sm
        ${locked
          ? 'border-slate-700/40 bg-slate-800/30 opacity-40 cursor-not-allowed'
          : isSelected
            ? 'border-brand-accent bg-brand-accent/15 text-white shadow-md shadow-brand-accent/20'
            : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-700/40 text-slate-200 cursor-pointer'
        }
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Completion indicator: green check if unlocked, dim dash if not */}
          {isUnlocked ? (
            <span
              title="Completed"
              className="text-emerald-400 text-sm leading-none flex-shrink-0 font-bold"
            >
              ✓
            </span>
          ) : (
            <span
              title="Not yet completed"
              className="text-slate-600 text-sm leading-none flex-shrink-0"
            >
              –
            </span>
          )}
          <span className="font-semibold truncate">{line.name}</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Stats */}
          {progress && (
            <span className="text-[10px] text-slate-500">
              {progress.attempts}×
              {progress.bestMistakes < Infinity && (
                <> · {progress.bestMistakes === 0 ? '✓' : `${progress.bestMistakes}✗`}</>
              )}
            </span>
          )}

          {/* Favourite star — always shown, clickable */}
          {!locked && (
            <button
              onClick={handleFavorite}
              title={favorite ? 'Remove from favourites' : 'Add to favourites'}
              className={`text-base leading-none transition-colors cursor-pointer ${
                favorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {favorite ? '★' : '☆'}
            </button>
          )}
        </div>
      </div>

      {line.description && (
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          {line.description}
        </p>
      )}
    </button>
  );
}
