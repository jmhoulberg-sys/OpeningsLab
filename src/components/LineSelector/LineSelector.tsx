import { Check, Lock, Minus, Star } from 'lucide-react';
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
  const totalLines = opening.lines.length;
  const completedLines = opening.lines.filter((line) => isLineUnlocked(opening.id, line.id)).length;

  return (
    <div className="rounded-[20px] border border-stone-800/60 bg-stone-950/55 p-3">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-800/70 bg-stone-900/80 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Lines</span>
          <span className="text-xs font-semibold text-stone-400">
            <span className={completedLines > 0 ? 'text-emerald-400' : ''}>{completedLines}</span>
            /{totalLines} done
          </span>
        </div>
        <div className="h-1 w-16 rounded-full bg-stone-800">
          <div
            className="h-1 rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0}%` }}
          />
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <SetupRow
          active={phase === 'setup'}
          complete={setupDone}
        />

        {opening.lines.map((line) => (
          <LineRow
            key={line.id}
            line={line}
            openingId={opening.id}
            isSelected={selectedLine?.id === line.id}
            isSetupDone={setupDone}
            isUnlocked={isLineUnlocked(opening.id, line.id)}
            progress={getLineProgress(opening.id, line.id)}
            onSelect={() => {
              if (setupDone) {
                selectLine(line);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SetupRow({
  active,
  complete,
}: {
  active: boolean;
  complete: boolean;
}) {
  return (
    <div className={`rounded-xl border px-3 py-3 text-left text-sm ${
      active
        ? 'border-sky-500/45 bg-sky-500/10 text-white'
        : complete
          ? 'border-emerald-500/25 bg-emerald-500/10 text-stone-100'
          : 'border-stone-700/60 bg-stone-900/85 text-stone-200'
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={complete ? 'text-emerald-400' : active ? 'text-sky-300' : 'text-stone-500'}>
            {complete ? <Check size={14} strokeWidth={3} /> : <Minus size={14} />}
          </span>
          <span className="font-semibold">Setup</span>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
          complete
            ? 'bg-emerald-400 text-slate-950'
            : active
              ? 'bg-sky-400 text-slate-950'
              : 'bg-stone-800 text-stone-400'
        }`}>
          {complete ? 'Done' : active ? 'Current step' : 'Open'}
        </span>
      </div>
      <div className="mt-1 text-xs text-stone-400">
        Play the shared setup moves before choosing a line.
      </div>
    </div>
  );
}

interface LineRowProps {
  line: OpeningLine;
  openingId: string;
  isSelected: boolean;
  isSetupDone: boolean;
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
  const locked = !isSetupDone && !isUnlocked;
  const favorite = isFavorite(openingId, line.id);

  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    toggleFavorite(openingId, line.id);
  }

  return (
    <button
      onClick={onSelect}
      disabled={locked}
      className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition-all duration-150 ${
        locked
          ? 'border-stone-800/50 bg-stone-900/45 opacity-55 cursor-not-allowed'
          : isSelected
            ? 'border-sky-500/45 bg-sky-500/10 text-white shadow-md shadow-sky-500/10'
            : isUnlocked
              ? 'border-emerald-500/20 bg-emerald-500/8 text-stone-100 hover:border-emerald-400/35 hover:bg-emerald-500/12 cursor-pointer'
              : 'border-stone-700/60 bg-stone-900/85 text-stone-200 hover:border-stone-600 hover:bg-stone-800/85 cursor-pointer'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={isUnlocked ? 'text-emerald-400' : locked ? 'text-stone-600' : 'text-sky-300'}>
            {isUnlocked ? <Check size={14} strokeWidth={3} /> : locked ? <Lock size={14} /> : <Minus size={14} />}
          </span>
          <span className="truncate font-semibold">{line.name}</span>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {progress && progress.attempts > 0 && (
            <span className="text-[10px] text-stone-500">{progress.attempts}x</span>
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
      <div className="mt-1 text-xs text-stone-500">
        {isUnlocked
          ? 'Unlocked for practice'
          : locked
            ? 'Finish setup to unlock line choice'
            : 'Choose this line to learn or unlock'}
      </div>
    </button>
  );
}
