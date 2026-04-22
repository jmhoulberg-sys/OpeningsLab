import { useState } from 'react';
import { Star, Check, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { useTrainingStore } from '../../store/trainingStore';
import { useProgressStore } from '../../store/progressStore';
import type { Opening, OpeningLine, LineProgress } from '../../types';

interface LineSelectorProps {
  opening: Opening;
}

export default function LineSelector({ opening }: LineSelectorProps) {
  const { selectedLine, selectLine, phase } = useTrainingStore();
  const { isSetupComplete, isLineUnlocked, getLineProgress } = useProgressStore();
  const [expanded, setExpanded] = useState(false);

  const setupDone = isSetupComplete(opening.id);
  const isActive = phase === 'line-select' || phase === 'training' || phase === 'completed';
  const totalLines = opening.lines.length;
  const completedLines = opening.lines.filter((line) => isLineUnlocked(opening.id, line.id)).length;

  return (
    <div className="relative rounded-[20px] border border-stone-800/60 bg-stone-950/55 p-3">
      <button
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between rounded-xl border border-stone-800/70 bg-stone-900/80 px-3 py-2.5 transition-colors hover:bg-stone-800/85 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Lines</span>
          {setupDone && totalLines > 0 && (
            <span className="text-xs font-semibold text-stone-400">
              <span className={completedLines > 0 ? 'text-emerald-400' : ''}>{completedLines}</span>
              /{totalLines} done
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {setupDone && totalLines > 0 && (
            <div className="h-1 w-16 rounded-full bg-stone-800">
              <div
                className="h-1 rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.round((completedLines / totalLines) * 100)}%` }}
              />
            </div>
          )}
          {expanded ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
        </div>
      </button>

      {expanded && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[28rem] overflow-y-auto rounded-2xl border border-stone-800/70 bg-stone-950 p-2 shadow-2xl">
          {!setupDone && (
            <p className="px-1 py-1 text-xs italic text-stone-500">
              Complete the opening setup to unlock lines.
            </p>
          )}
          <div className="space-y-1.5">
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
                  if (setupDone) {
                    selectLine(line);
                    setExpanded(false);
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
    e.stopPropagation();
    toggleFavorite(openingId, line.id);
  }

  return (
    <button
      onClick={onSelect}
      disabled={locked}
      className={`
        w-full rounded-xl border px-3 py-3 text-left text-sm transition-all duration-150
        ${locked
          ? 'border-stone-800/40 bg-stone-900/40 opacity-40 cursor-not-allowed'
          : isSelected
            ? 'border-sky-500/50 bg-sky-500/12 text-white shadow-md shadow-sky-500/10'
            : 'border-stone-800/70 bg-stone-900/65 text-stone-200 hover:border-stone-600 hover:bg-stone-800/80 cursor-pointer'}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <span className="mt-0.5 flex-shrink-0">
            {isUnlocked ? (
              <span title="Completed" className="text-emerald-400">
                <Check size={14} strokeWidth={3} />
              </span>
            ) : (
              <span title="Not yet completed" className="text-stone-600">
                <Minus size={14} />
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <span className="block font-semibold leading-snug">{line.name}</span>
            {line.description && (
              <span className="mt-1.5 block whitespace-normal text-[11px] leading-relaxed text-stone-400">
                {line.description}
              </span>
            )}
          </div>
        </div>

        <div className="mt-0.5 flex flex-shrink-0 items-center gap-2">
          {progress && (
            <span className="flex items-center gap-0.5 text-[10px] text-stone-500">
              {progress.attempts}x
              {progress.bestMistakes < Infinity && (
                <> / {progress.bestMistakes === 0 ? <Check size={10} strokeWidth={3} className="inline text-emerald-400" /> : `${progress.bestMistakes} mistakes`}</>
              )}
            </span>
          )}
          {!locked && (
            <button
              onClick={handleFavorite}
              title={favorite ? 'Remove from favourites' : 'Add to favourites'}
              className={`leading-none transition-colors cursor-pointer ${
                favorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-stone-600 hover:text-stone-400'
              }`}
            >
              <Star size={14} fill={favorite ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>
    </button>
  );
}
