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
  const completedLines = opening.lines.filter((l) =>
    isLineUnlocked(opening.id, l.id),
  ).length;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Collapsible header button */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors cursor-pointer flex-shrink-0 mb-2"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Lines</span>
          {setupDone && totalLines > 0 && (
            <span className="text-xs font-semibold text-slate-400">
              <span className={completedLines > 0 ? 'text-emerald-400' : ''}>
                {completedLines}
              </span>
              /{totalLines} done
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mini progress bar */}
          {setupDone && totalLines > 0 && (
            <div className="w-16 bg-slate-700/60 rounded-full h-1">
              <div
                className="bg-emerald-500 h-1 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((completedLines / totalLines) * 100)}%` }}
              />
            </div>
          )}
          {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>

      {/* Currently selected line label */}
      {!expanded && selectedLine && (
        <div className="px-3 py-1.5 bg-brand-accent/10 border border-brand-accent/30 rounded-lg mb-2 flex-shrink-0">
          <p className="text-xs text-brand-accent font-semibold truncate">{selectedLine.name}</p>
        </div>
      )}

      {/* Expandable line list */}
      {expanded && (
        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 pr-1">
          {!setupDone && (
            <p className="text-xs text-slate-500 italic px-1">
              Complete the opening setup to unlock lines.
            </p>
          )}
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
      )}
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
    e.stopPropagation();
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
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="mt-0.5 flex-shrink-0">
            {isUnlocked ? (
              <span title="Completed" className="text-emerald-400">
                <Check size={14} strokeWidth={3} />
              </span>
            ) : (
              <span title="Not yet completed" className="text-slate-600">
                <Minus size={14} />
              </span>
            )}
          </span>
          <div className="min-w-0">
            <span className="font-semibold block leading-snug">{line.name}</span>
            {line.description && (
              <span className="text-[11px] text-slate-400 leading-relaxed mt-1 block">
                {line.description}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          {progress && (
            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
              {progress.attempts}×
              {progress.bestMistakes < Infinity && (
                <> · {progress.bestMistakes === 0 ? <Check size={10} strokeWidth={3} className="text-emerald-400 inline" /> : `${progress.bestMistakes}✗`}</>
              )}
            </span>
          )}
          {!locked && (
            <button
              onClick={handleFavorite}
              title={favorite ? 'Remove from favourites' : 'Add to favourites'}
              className={`leading-none transition-colors cursor-pointer ${
                favorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-600 hover:text-slate-400'
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
