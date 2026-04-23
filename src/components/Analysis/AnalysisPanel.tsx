import { useLichessAnalysis, type LichessMove } from '../../hooks/useLichessAnalysis';
import { useTrainingStore } from '../../store/trainingStore';
import { useSettingsStore } from '../../store/settingsStore';

export default function AnalysisPanel() {
  const { currentFen, playedMoves, showTopMoves, postLineOutOfBook } = useTrainingStore();
  const { minRating, topMovesToInclude } = useSettingsStore();

  const { moves, loading } = useLichessAnalysis(
    showTopMoves ? currentFen : null,
    playedMoves,
    showTopMoves,
    minRating,
    topMovesToInclude,
  );

  if (!showTopMoves) return null;

  return (
    <div className="flex-shrink-0 px-4 pb-4 pt-3">
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
        Based on Lichess games
      </div>
      <p className="mb-2 text-[11px] text-slate-500">
        Top {topMovesToInclude} continuation{topMovesToInclude === 1 ? '' : 's'} by game count.
      </p>

      {loading && (
        <p className="animate-pulse text-xs text-slate-500">Fetching...</p>
      )}

      {!loading && postLineOutOfBook && (
        <p className="text-xs italic text-amber-300">
          Live Lichess continuation data did not load for this position in this static build.
        </p>
      )}

      {!loading && !postLineOutOfBook && moves.length === 0 && (
        <p className="text-xs italic text-slate-500">
          No Lichess game data found for this position.
        </p>
      )}

      {!loading && moves.length > 0 && (
        <div className="space-y-1.5">
          <div className="mb-1 grid grid-cols-[46px_44px_1fr_46px_46px_46px] gap-x-1 px-0.5 text-[10px] uppercase tracking-wider text-slate-500">
            <span>Move</span>
            <span className="text-center">Use</span>
            <span />
            <span className="text-center">W%</span>
            <span className="text-center">D%</span>
            <span className="text-center">B%</span>
          </div>
          {moves.map((move) => (
            <MoveRow key={move.san} move={move} />
          ))}
        </div>
      )}
    </div>
  );
}

function MoveRow({ move }: { move: LichessMove }) {
  const total = move.total;
  const games = total >= 1000 ? `${(total / 1000).toFixed(1)}k` : `${total}`;
  const drawPct = move.drawPct;

  return (
    <div className="grid grid-cols-[46px_44px_1fr_46px_46px_46px] items-center gap-x-1">
      <span className="font-mono text-xs font-bold text-white">{move.san}</span>
      <span className="text-center text-[11px] font-semibold tabular-nums text-sky-300">
        {move.playPct}%
      </span>

      <div className="flex h-3 overflow-hidden rounded-sm" title={`${games} games`}>
        <div className="bg-slate-100" style={{ width: `${move.whitePct}%` }} />
        <div className="bg-slate-500" style={{ width: `${drawPct}%` }} />
        <div className="border-l border-slate-700 bg-slate-900" style={{ width: `${move.blackPct}%` }} />
      </div>

      <span className="text-center text-[11px] font-semibold tabular-nums text-slate-200">
        {move.whitePct}%
      </span>
      <span className="text-center text-[11px] tabular-nums text-slate-400">
        {drawPct}%
      </span>
      <span className="text-center text-[11px] tabular-nums text-slate-500">
        {move.blackPct}%
      </span>
    </div>
  );
}
