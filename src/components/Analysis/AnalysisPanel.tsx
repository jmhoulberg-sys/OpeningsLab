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
    autoplayLichessMoves,
    choosePostLineMove,
    continuePostLineAgainstComputer,
    setPreviewUciMove,
    toggleAutoplayLichessMoves,
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
  const canChooseMove =
    postLineMode === 'top-moves-choice'
      ? !isAwaitingUserMove
      : postLineMode === 'top-moves' && (isAwaitingUserMove || !autoplayLichessMoves);

  return (
    <section className="mt-3 flex-shrink-0 overflow-hidden rounded-[20px] border border-stone-800/60 bg-stone-950/60">
      <div className="border-b border-stone-800/60 bg-stone-900/65 px-4 py-3">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
          Lichess moves
        </div>
        <p className="mt-1 text-xs font-semibold text-stone-400">
          Top {lichessTopMoves} continuations by game count.
        </p>
      </div>

      <div className="px-4 py-3">

      {postLineMode === 'top-moves' && (
        <button
          onClick={toggleAutoplayLichessMoves}
          className={`mb-3 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
            autoplayLichessMoves
              ? 'border-emerald-300/30 bg-emerald-400/12 text-emerald-100'
              : 'border-sky-300/30 bg-sky-400/12 text-sky-100'
          }`}
        >
          <span>Autoplay opponent response</span>
          <span>{autoplayLichessMoves ? 'On' : 'Off'}</span>
        </button>
      )}

      {loading && (
        <p className="animate-pulse text-xs text-slate-500">Fetching...</p>
      )}

      {!loading && postLineError && (
        <p className="text-xs italic text-amber-300">
          {postLineError}
        </p>
      )}

      {!loading && postLineOutOfBook && (
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
        <div className="space-y-2">
          {canChooseMove && (
            <p className="rounded-xl border border-emerald-400/25 bg-emerald-400/12 px-3 py-2 text-xs font-bold text-emerald-100">
              Choose a move from this position.
            </p>
          )}
          <div className="grid grid-cols-[44px_42px_54px_1fr] gap-x-2 px-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            <span>Move</span>
            <span className="text-center">Use</span>
            <span className="text-right">Games</span>
            <span>Results</span>
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
    </section>
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
      className={`grid w-full grid-cols-[44px_42px_54px_1fr] items-center gap-x-2 rounded-xl border px-2 py-2 text-left transition-colors ${
        canChoose
          ? 'cursor-pointer border-stone-800/45 bg-stone-900/45 hover:border-emerald-300/45 hover:bg-emerald-400/10 focus:border-emerald-300/55 focus:outline-none focus:ring-1 focus:ring-emerald-300/40'
          : 'cursor-default border-stone-800/45 bg-stone-900/35 hover:border-slate-500/35 hover:bg-slate-800/35'
      }`}
    >
      <span className="font-mono text-sm font-black text-white">{move.san}</span>
      <span className="text-center text-xs font-black tabular-nums text-sky-300">
        {playPct}%
      </span>
      <span className="text-right text-xs font-semibold tabular-nums text-stone-300">{games}</span>

      <div className="flex h-6 overflow-hidden rounded-lg border border-stone-700/60 bg-stone-800" title={`${games} games`}>
        <div className="flex min-w-[28px] items-center justify-center bg-slate-100 px-1 text-[10px] font-black text-slate-950" style={{ width: `${whitePct}%` }}>
          W {whitePct}%
        </div>
        <div className="flex min-w-[24px] items-center justify-center bg-slate-500 px-1 text-[10px] font-black text-white" style={{ width: `${drawPct}%` }}>
          D {drawPct}%
        </div>
        <div className="flex min-w-[28px] items-center justify-center bg-slate-950 px-1 text-[10px] font-black text-white" style={{ width: `${blackPct}%` }}>
          B {blackPct}%
        </div>
      </div>
    </button>
  );
}
