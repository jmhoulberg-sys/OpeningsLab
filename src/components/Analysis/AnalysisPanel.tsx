import { useLichessAnalysis, type LichessMove } from '../../hooks/useLichessAnalysis';
import { useTrainingStore } from '../../store/trainingStore';
import { useSettingsStore } from '../../store/settingsStore';

export default function AnalysisPanel() {
  const {
    currentFen,
    playedMoves,
    showTopMoves,
    postLineOutOfBook,
    postLineError,
    postLineMode,
    isAwaitingUserMove,
    choosePostLineMove,
    continuePostLineAgainstComputer,
    setPreviewUciMove,
  } = useTrainingStore();
  const { lichessTopMoves, lichessSpeeds, lichessRatings } = useSettingsStore();

  const { moves, loading } = useLichessAnalysis(
    showTopMoves ? currentFen : null,
    playedMoves,
    showTopMoves,
    lichessTopMoves,
    lichessSpeeds,
    lichessRatings,
  );

  if (!showTopMoves) return null;
  const canChooseMove = postLineMode === 'top-moves-choice' && !isAwaitingUserMove;

  return (
    <div className="flex-shrink-0 px-4 pb-4 pt-3">
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
        Based on Lichess games
      </div>
      <p className="mb-2 text-[11px] text-slate-500">
        Top {lichessTopMoves} continuations by game count.
      </p>

      {loading && (
        <p className="animate-pulse text-xs text-slate-500">Fetching...</p>
      )}

      {!loading && postLineError && (
        <p className="text-xs italic text-amber-300">
          {postLineError}
        </p>
      )}

      {!loading && !postLineError && postLineOutOfBook && (
        <div className="space-y-2">
          <p className="text-xs italic text-amber-300">
            Out of database. Continue against a computer level.
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              ['Beginner', 'computer-beginner'],
              ['Advanced', 'computer-advanced'],
              ['Pro', 'computer-pro'],
            ].map(([label, mode]) => (
              <button
                key={mode}
                onClick={() => continuePostLineAgainstComputer(mode as 'computer-beginner' | 'computer-advanced' | 'computer-pro')}
                className="rounded-md border border-slate-600/60 bg-slate-800/70 px-2 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors hover:border-sky-400/60 hover:text-white"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && !postLineOutOfBook && !postLineError && moves.length === 0 && (
        <p className="text-xs italic text-slate-500">
          No Lichess game data found for this position.
        </p>
      )}

      {!loading && moves.length > 0 && (
        <div className="space-y-1.5">
          {canChooseMove && (
            <p className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-200">
              Choose the move you want to train against.
            </p>
          )}
          <div className="mb-1 grid grid-cols-[42px_40px_52px_1fr_34px_34px_34px] gap-x-1 px-0.5 text-[10px] uppercase tracking-wider text-slate-500">
            <span>Move</span>
            <span className="text-center">Use</span>
            <span className="text-right">Games</span>
            <span />
            <span className="text-center">W%</span>
            <span className="text-center">D%</span>
            <span className="text-center">B%</span>
          </div>
          {moves.map((move) => (
            <MoveRow
              key={move.uci}
              move={move}
              canChoose={canChooseMove}
              onChoose={() => choosePostLineMove(move.uci)}
              onPreview={() => setPreviewUciMove(move.uci)}
              onClearPreview={() => setPreviewUciMove(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MoveRow({
  move,
  canChoose,
  onChoose,
  onPreview,
  onClearPreview,
}: {
  move: LichessMove;
  canChoose: boolean;
  onChoose: () => void;
  onPreview: () => void;
  onClearPreview: () => void;
}) {
  const total = move.popularity;
  const games = total >= 1000 ? `${(total / 1000).toFixed(1)}k` : `${total}`;
  const whitePct = total ? Math.round((move.white / total) * 100) : 0;
  const drawPct = total ? Math.round((move.draws / total) * 100) : 0;
  const blackPct = total ? Math.round((move.black / total) * 100) : 0;
  const playPct = Math.round(move.weight * 100);

  return (
    <button
      type="button"
      onClick={canChoose ? onChoose : undefined}
      onMouseEnter={onPreview}
      onMouseLeave={onClearPreview}
      onFocus={onPreview}
      onBlur={onClearPreview}
      aria-disabled={!canChoose}
      className={`grid w-full grid-cols-[42px_40px_52px_1fr_34px_34px_34px] items-center gap-x-1 rounded-md px-0.5 py-0.5 text-left transition-colors ${
        canChoose
          ? 'cursor-pointer hover:bg-emerald-400/10 focus:outline-none focus:ring-1 focus:ring-emerald-300/40'
          : 'cursor-default'
      }`}
    >
      <span className="font-mono text-xs font-bold text-white">{move.san}</span>
      <span className="text-center text-[11px] font-semibold tabular-nums text-sky-300">
        {playPct}%
      </span>
      <span className="text-right text-[11px] tabular-nums text-slate-300">{games}</span>

      <div className="flex h-3 overflow-hidden rounded-sm" title={`${games} games`}>
        <div className="bg-slate-100" style={{ width: `${whitePct}%` }} />
        <div className="bg-slate-500" style={{ width: `${drawPct}%` }} />
        <div className="border-l border-slate-700 bg-slate-900" style={{ width: `${blackPct}%` }} />
      </div>

      <span className="text-center text-[11px] font-semibold tabular-nums text-slate-200">
        {whitePct}%
      </span>
      <span className="text-center text-[11px] tabular-nums text-slate-400">
        {drawPct}%
      </span>
      <span className="text-center text-[11px] tabular-nums text-slate-500">
        {blackPct}%
      </span>
    </button>
  );
}
