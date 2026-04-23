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
              if (setupDone && isLineUnlocked(opening.id, line.id)) {
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
        ? 'border-sky-500/35 bg-sky-500/6 text-white'
        : complete
          ? 'border-emerald-500/18 bg-emerald-500/6 text-stone-100'
          : 'border-stone-700/50 bg-stone-900/60 text-stone-200'
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={complete ? 'text-emerald-400' : active ? 'text-sky-300' : 'text-stone-500'}>
            {complete ? <Check size={14} strokeWidth={3} /> : <Minus size={14} />}
          </span>
          <span className="font-semibold">Setup</span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
          {complete ? 'Done' : active ? 'Current step' : 'Open'}
        </span>
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
  const locked = !isSetupDone || !isUnlocked;
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
              : 'border-stone-700/60 bg-stone-900/85 text-stone-200 opacity-85 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className={`mt-0.5 ${isUnlocked ? 'text-emerald-400' : 'text-stone-500'}`}>
            {isUnlocked ? <Check size={14} strokeWidth={3} /> : <Lock size={16} />}
          </span>
          <div className="min-w-0">
            <span className="truncate font-semibold">{line.name}</span>
            <div className="mt-1 text-xs text-stone-500">
              {getShortLineSummary(line)}
            </div>
            {!isUnlocked && (
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                Choose from unlock list
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {progress && progress.attempts > 0 && (
            <span className="text-[10px] text-stone-500">{progress.attempts}x</span>
          )}
          {isUnlocked && (
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

function getShortLineSummary(line: OpeningLine) {
  const label = line.name.toLowerCase();

  if (label.includes('queen')) return 'A sharp trap that punishes a greedy queen grab.';
  if (label.includes('knight')) return 'A tactical line that leaves White tied up and exposed.';
  if (label.includes('rook')) return 'A forcing attack that wins major material for Black.';
  if (label.includes('natural development')) return 'A clean punishment line against automatic development.';
  if (label.includes('favorite trap')) return 'A direct attacking idea that builds fast pressure on the king.';
  if (label.includes('everyone falls for this')) return 'A reliable trap that hits natural-looking moves hard.';
  if (label.includes('drag')) return 'An aggressive line that drags the king into danger.';

  return 'A guided attacking line built around one clear tactical idea.';
}
