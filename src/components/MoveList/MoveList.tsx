import { useEffect, useRef } from 'react';
import { useTrainingStore } from '../../store/trainingStore';

export default function MoveList() {
  const {
    playedMoves,
    opening,
    phase,
    postLine,
    postLineStartMoveCount,
    viewMoveIndex,
    navigateToMove,
  } = useTrainingStore();

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewMoveIndex === null && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [playedMoves, viewMoveIndex]);

  useEffect(() => {
    if (viewMoveIndex !== null && containerRef.current) {
      const el = containerRef.current.querySelector(`[data-move-index="${viewMoveIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [viewMoveIndex]);

  if (!opening) return null;

  const pairs: Array<{ white: string; black?: string; number: number }> = [];
  for (let i = 0; i < playedMoves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: playedMoves[i],
      black: playedMoves[i + 1],
    });
  }

  const freePlayPairStart =
    postLine && postLineStartMoveCount !== null
      ? Math.ceil(postLineStartMoveCount / 2)
      : null;

  const highlightIdx = viewMoveIndex;

  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">
        Moves
      </h3>

      <div ref={containerRef} className="min-h-0 flex-1 overflow-y-auto pr-1">
        {pairs.length === 0 && (
          <p className="text-xs italic text-stone-500">No moves yet.</p>
        )}

        <div className="space-y-0.5">
          {pairs.map((pair, pairIdx) => (
            <div key={pair.number}>
              {freePlayPairStart !== null && pairIdx === freePlayPairStart && (
                <div className="my-1.5 flex items-center gap-2">
                  <div className="h-px flex-1 bg-emerald-700/30" />
                  <span className="shrink-0 select-none text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                    Free play
                  </span>
                  <div className="h-px flex-1 bg-emerald-700/30" />
                </div>
              )}

              <div className="grid grid-cols-[28px_1fr_1fr] gap-1 text-sm">
                <span className="select-none pt-0.5 text-xs text-stone-500">
                  {pair.number}.
                </span>

                <MoveChip
                  san={pair.white}
                  halfMoveIdx={pairIdx * 2}
                  color="white"
                  opening={opening}
                  isFreePlay={freePlayPairStart !== null && pairIdx >= freePlayPairStart}
                  isHighlighted={highlightIdx === pairIdx * 2}
                  onClick={() => navigateToMove(pairIdx * 2)}
                />

                {pair.black !== undefined ? (
                  <MoveChip
                    san={pair.black}
                    halfMoveIdx={pairIdx * 2 + 1}
                    color="black"
                    opening={opening}
                    isFreePlay={
                      freePlayPairStart !== null &&
                      (pairIdx > freePlayPairStart ||
                        (pairIdx === freePlayPairStart &&
                          postLineStartMoveCount !== null &&
                          pairIdx * 2 + 1 >= postLineStartMoveCount))
                    }
                    isHighlighted={highlightIdx === pairIdx * 2 + 1}
                    onClick={() => navigateToMove(pairIdx * 2 + 1)}
                  />
                ) : (
                  <span />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {phase === 'training' && (
        <div className="mt-3 border-t border-stone-800/40 pt-3 text-xs text-stone-500 select-none">
          {playedMoves.length} half-move{playedMoves.length !== 1 ? 's' : ''} played
          {viewMoveIndex !== null && (
            <span className="ml-1 text-sky-400">/ reviewing</span>
          )}
        </div>
      )}
    </div>
  );
}

function MoveChip({
  san,
  halfMoveIdx,
  color,
  opening,
  isFreePlay,
  isHighlighted,
  onClick,
}: {
  san: string;
  halfMoveIdx: number;
  color: 'white' | 'black';
  opening: { playerColor: 'white' | 'black' };
  isFreePlay?: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}) {
  const isPlayerMove =
    (color === 'white' && opening.playerColor === 'white') ||
    (color === 'black' && opening.playerColor === 'black');

  let textClass = isPlayerMove ? 'text-emerald-300 font-semibold' : 'text-stone-300';
  if (isFreePlay) textClass = 'text-emerald-500 italic';

  return (
    <button
      data-move-index={halfMoveIdx}
      onClick={onClick}
      className={`
        w-full rounded px-1.5 py-0.5 text-left font-mono text-xs transition-colors cursor-pointer
        ${isHighlighted
          ? 'bg-sky-500/20 text-sky-300 font-bold'
          : `hover:bg-stone-800/80 ${textClass}`
        }
      `}
    >
      {san}
    </button>
  );
}
