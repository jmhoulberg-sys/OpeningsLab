import { useLichessAnalysis, type LichessMove } from '../../hooks/useLichessAnalysis';
import { useTrainingStore } from '../../store/trainingStore';
import { useSettingsStore } from '../../store/settingsStore';

/**
 * Panel shown in the sidebar during free play.
 * Shows top database moves from Lichess (when showTopMoves is enabled).
 */
export default function AnalysisPanel() {
  const { currentFen, showTopMoves, opening } = useTrainingStore();
  const { minRating } = useSettingsStore();

  const { moves, loading } = useLichessAnalysis(
    showTopMoves ? currentFen : null,
    showTopMoves,
    minRating,
  );

  if (!showTopMoves) return null;

  return (
    <div className="px-4 pt-3 pb-4 border-b border-slate-700/40 flex-shrink-0">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
        Top Database Moves
      </div>

      {loading && (
        <p className="text-xs text-slate-500 animate-pulse">Fetching…</p>
      )}

      {!loading && moves.length === 0 && (
        <p className="text-xs text-slate-500 italic">
          No database games found for this position.
        </p>
      )}

      {!loading && moves.length > 0 && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-[36px_1fr_44px_44px_44px] gap-x-1 text-[10px] text-slate-500 uppercase tracking-wider mb-1 px-0.5">
            <span>Move</span>
            <span />
            <span className="text-center">W%</span>
            <span className="text-center">D%</span>
            <span className="text-center">L%</span>
          </div>
          {moves.map((m) => (
            <MoveRow key={m.san} move={m} playerColor={opening?.playerColor ?? 'white'} />
          ))}
        </div>
      )}
    </div>
  );
}

function MoveRow({ move, playerColor }: { move: LichessMove; playerColor: string }) {
  const total = move.total;
  const games = total >= 1000 ? `${(total / 1000).toFixed(1)}k` : `${total}`;

  // From player's perspective
  const winPct   = playerColor === 'white' ? move.whitePct : move.blackPct;
  const lossPct  = playerColor === 'white' ? move.blackPct : move.whitePct;
  const drawPct  = move.drawPct;

  return (
    <div className="grid grid-cols-[36px_1fr_44px_44px_44px] gap-x-1 items-center">
      <span className="font-mono font-bold text-white text-xs">{move.san}</span>

      {/* Stacked win/draw/loss bar */}
      <div className="h-3 rounded-sm overflow-hidden flex" title={`${games} games`}>
        <div className="bg-slate-100"     style={{ width: `${winPct}%` }} />
        <div className="bg-slate-500"     style={{ width: `${drawPct}%` }} />
        <div className="bg-slate-900 border-l border-slate-700" style={{ width: `${lossPct}%` }} />
      </div>

      <span className="text-[11px] text-center text-slate-200 font-semibold tabular-nums">
        {winPct}%
      </span>
      <span className="text-[11px] text-center text-slate-400 tabular-nums">
        {drawPct}%
      </span>
      <span className="text-[11px] text-center text-slate-500 tabular-nums">
        {lossPct}%
      </span>
    </div>
  );
}
