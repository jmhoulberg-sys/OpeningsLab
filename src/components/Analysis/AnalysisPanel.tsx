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
      <div className="flex items-center justify-between gap-3 border-b border-stone-800/60 bg-stone-900/65 px-4 py-3">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
          Lichess moves
        </div>
        {postLineMode === 'top-moves' && (
          <button
            onClick={toggleAutoplayLichessMoves}
            className={`rounded-xl border px-3 py-1.5 text-xs font-black transition-colors cursor-pointer ${
              autoplayLichessMoves
                ? 'border-sky-300/45 bg-sky-500 text-slate-950'
                : 'border-stone-700/55 bg-stone-950 text-stone-400 hover:text-stone-200'
            }`}
          >
            Autoplay
          </button>
        )}
      </div>

      <div className="px-4 py-3">
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
          <div className="grid grid-cols-[36px_34px_50px_1fr] gap-x-1.5 px-1 text-[9px] font-bold uppercase tracking-wider text-stone-500">
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
      className={`grid w-full grid-cols-[36px_34px_50px_1fr] items-center gap-x-1.5 rounded-xl border px-2 py-2 text-left transition-colors ${
        canChoose
          ? 'cursor-pointer border-stone-800/45 bg-stone-900/45 hover:border-sky-300/45 hover:bg-sky-400/10 focus:border-sky-300/55 focus:outline-none focus:ring-1 focus:ring-sky-300/40'
          : 'cursor-default border-stone-800/45 bg-stone-900/35 hover:border-slate-500/35 hover:bg-slate-800/35'
      }`}
    >
      <span className="font-mono text-xs font-black text-white">{move.san}</span>
      <span className="text-center text-[11px] font-black tabular-nums text-sky-300">
        {playPct}%
      </span>
      <span className="text-right text-[11px] font-semibold tabular-nums text-stone-300">{games}</span>

      <div className="flex h-6 overflow-hidden rounded-lg border border-stone-700/60 bg-stone-800" title={`${games} games`}>
        <div className="flex min-w-[24px] items-center justify-center bg-slate-100 px-1 text-[10px] font-black text-slate-950" style={{ width: `${whitePct}%` }}>
          {whitePct}%
        </div>
        <div className="flex min-w-[22px] items-center justify-center bg-slate-500 px-1 text-[10px] font-black text-white" style={{ width: `${drawPct}%` }}>
          {drawPct}%
        </div>
        <div className="flex min-w-[24px] items-center justify-center bg-slate-950 px-1 text-[10px] font-black text-white" style={{ width: `${blackPct}%` }}>
          {blackPct}%
        </div>
      </div>
    </button>
  );
}
