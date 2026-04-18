import { useLichessAnalysis, formatEval, type LichessMove } from '../../hooks/useLichessAnalysis';
import { useTrainingStore } from '../../store/trainingStore';
import { useSettingsStore } from '../../store/settingsStore';

/**
 * Panel shown below the board during free play.
 * Always rendered so the user can toggle eval/top-moves on from here.
 */
export default function AnalysisPanel() {
  const {
    currentFen,
    showEval,
    showTopMoves,
    toggleShowEval,
    toggleShowTopMoves,
    opening,
  } = useTrainingStore();

  const { minRating } = useSettingsStore();
  const enabled = showEval || showTopMoves;
  const { moves, evalCp, evalMate, loading } = useLichessAnalysis(
    enabled ? currentFen : null,
    enabled,
    minRating,
  );

  const playerColor = opening?.playerColor ?? 'white';

  // Flip eval sign when playing as Black (Lichess returns eval from White's POV)
  const displayCp   = playerColor === 'black' && evalCp   !== null ? -evalCp   : evalCp;
  const displayMate = playerColor === 'black' && evalMate !== null ? -evalMate : evalMate;

  const evalStr = formatEval(displayCp, displayMate);
  const evalPositive =
    displayMate !== null
      ? displayMate > 0
      : displayCp !== null && displayCp > 0;

  return (
    <div className="w-full max-w-[520px] bg-slate-800/70 border border-slate-700/50 rounded-xl p-3 space-y-2.5">
      {/* Header: label + toggles — always visible */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Lichess Analysis
        </span>
        <div className="flex gap-1.5">
          <ToggleChip label="Eval"       active={showEval}     onClick={toggleShowEval} />
          <ToggleChip label="Top moves"  active={showTopMoves} onClick={toggleShowTopMoves} />
        </div>
      </div>

      {/* Content — only when at least one toggle is on */}
      {enabled && (
        <>
          {loading && (
            <p className="text-xs text-slate-500 animate-pulse">Fetching…</p>
          )}

          {/* Evaluation */}
          {showEval && !loading && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 shrink-0">Evaluation</span>
              <span
                className={`font-mono font-bold text-sm ${
                  evalStr === '?'
                    ? 'text-slate-500'
                    : evalPositive
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {evalStr}
              </span>
              <span className="text-xs text-slate-600">
                ({playerColor === 'white' ? 'White' : 'Black'}'s perspective)
              </span>
            </div>
          )}

          {/* Top 3 moves */}
          {showTopMoves && !loading && (
            <div>
              {moves.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  No database games found for this position.
                </p>
              ) : (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-[36px_1fr_52px_52px_52px] gap-x-1 text-[10px] text-slate-500 uppercase tracking-wider mb-1 px-0.5">
                    <span>Move</span>
                    <span />
                    <span className="text-center">W%</span>
                    <span className="text-center">D%</span>
                    <span className="text-center">L%</span>
                  </div>
                  {moves.map((m) => (
                    <MoveRow key={m.san} move={m} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function ToggleChip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
        active
          ? 'bg-brand-accent/20 border-brand-accent/50 text-brand-accent'
          : 'bg-transparent border-slate-600/50 text-slate-500 hover:text-slate-300'
      }`}
    >
      {label}
    </button>
  );
}

function MoveRow({ move }: { move: LichessMove }) {
  const total = move.total;
  const games = total >= 1000 ? `${(total / 1000).toFixed(1)}k` : `${total}`;

  return (
    <div className="grid grid-cols-[36px_1fr_52px_52px_52px] gap-x-1 items-center">
      <span className="font-mono font-bold text-white text-xs">{move.san}</span>

      {/* Stacked win/draw/loss bar */}
      <div className="h-3 rounded-sm overflow-hidden flex" title={`${games} games`}>
        <div className="bg-slate-100"        style={{ width: `${move.whitePct}%` }} />
        <div className="bg-slate-500"        style={{ width: `${move.drawPct}%` }} />
        <div className="bg-slate-900 border-l border-slate-700" style={{ width: `${move.blackPct}%` }} />
      </div>

      <span className="text-[11px] text-center text-slate-200 font-semibold tabular-nums">
        {move.whitePct}%
      </span>
      <span className="text-[11px] text-center text-slate-400 tabular-nums">
        {move.drawPct}%
      </span>
      <span className="text-[11px] text-center text-slate-500 tabular-nums">
        {move.blackPct}%
      </span>
    </div>
  );
}
