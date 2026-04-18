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

  // Auto-scroll to bottom when new moves arrive (only when not reviewing)
  useEffect(() => {
    if (viewMoveIndex === null && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [playedMoves, viewMoveIndex]);

  // Scroll reviewed move into view
  useEffect(() => {
    if (viewMoveIndex !== null && containerRef.current) {
      const el = containerRef.current.querySelector(
        `[data-move-index="${viewMoveIndex}"]`,
      );
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [viewMoveIndex]);

  if (!opening) return null;

  // Group into pairs [white, black]
  const pairs: Array<{ white: string; black?: string; number: number }> = [];
  for (let i = 0; i < playedMoves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: playedMoves[i],
      black: playedMoves[i + 1],
    });
  }

  // Pair index where free play starts
  const freePlayPairStart =
    postLine && postLineStartMoveCount !== null
      ? Math.ceil(postLineStartMoveCount / 2)
      : null;

  // Which half-move index is currently highlighted (0-based in playedMoves)
  const highlightIdx = viewMoveIndex; // null = live (no highlight offset)

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
        Moves
      </h3>

      <div ref={containerRef} className="flex-1 overflow-y-auto pr-1 min-h-0">
        {pairs.length === 0 && (
          <p className="text-slate-500 text-xs italic">No moves yet.</p>
        )}

        <div className="space-y-0.5">
          {pairs.map((pair, pairIdx) => (
            <div key={pair.number}>
              {/* Free-play divider */}
              {freePlayPairStart !== null && pairIdx === freePlayPairStart && (
                <div className="flex items-center gap-2 my-1.5">
                  <div className="flex-1 h-px bg-emerald-700/50" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 shrink-0 select-none">
                    Free play
                  </span>
                  <div className="flex-1 h-px bg-emerald-700/50" />
                </div>
              )}

              <div className="grid grid-cols-[28px_1fr_1fr] gap-1 text-sm">
                <span className="text-slate-500 text-xs pt-0.5 select-none">
                  {pair.number}.
                </span>

                {/* White move — half-move index = pairIdx*2 */}
                <MoveChip
                  san={pair.white}
                  halfMoveIdx={pairIdx * 2}
                  color="white"
                  opening={opening}
                  isFreePlay={freePlayPairStart !== null && pairIdx >= freePlayPairStart}
                  isHighlighted={highlightIdx === pairIdx * 2}
                  onClick={() => navigateToMove(pairIdx * 2)}
                />

                {/* Black move — half-move index = pairIdx*2+1 */}
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
        <div className="mt-2 pt-2 border-t border-slate-700/50 text-xs text-slate-500 select-none">
          {playedMoves.length} half-move{playedMoves.length !== 1 ? 's' : ''} played
          {viewMoveIndex !== null && (
            <span className="text-amber-400 ml-1">· reviewing</span>
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

  let textClass = isPlayerMove ? 'text-emerald-300 font-semibold' : 'text-slate-300';
  if (isFreePlay) textClass = 'text-emerald-600 italic';

  return (
    <button
      data-move-index={halfMoveIdx}
      onClick={onClick}
      className={`
        px-1.5 py-0.5 rounded font-mono text-xs text-left w-full transition-colors cursor-pointer
        ${isHighlighted
          ? 'bg-amber-500/25 text-amber-300 font-bold'
          : `hover:bg-slate-700/50 ${textClass}`
        }
      `}
    >
      {san}
    </button>
  );
}
