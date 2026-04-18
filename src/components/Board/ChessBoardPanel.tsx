import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { Square } from 'react-chessboard/dist/chessboard/types';
import { useTrainingStore } from '../../store/trainingStore';
import { isStudentMove } from '../../engine/chessEngine';
import AnalysisPanel from '../Analysis/AnalysisPanel';

// Arrow colours
const WRONG_ARROW_COLOR  = 'rgba(220, 50,  50,  0.90)';
const ANSWER_ARROW_COLOR = 'rgba(0,   210, 90,  0.92)';
const SELECTED_HIGHLIGHT = 'rgba(255, 255, 0,   0.4)';

// ─── Resolve from/to squares for a SAN in a given position ──────────
function resolveArrow(fen: string, san: string): [Square, Square] | null {
  try {
    const chess = new Chess(fen);
    const norm = (s: string) => s.replace(/[+#!?]/g, '').trim();
    const found = chess.moves({ verbose: true }).find((m) => norm(m.san) === norm(san));
    return found ? [found.from as Square, found.to as Square] : null;
  } catch {
    return null;
  }
}

export default function ChessBoardPanel() {
  const {
    opening,
    phase,
    mode,
    currentFen,
    fenHistory,
    viewMoveIndex,
    isAwaitingUserMove,
    wrongMoveSan,
    showingCorrectMove,
    postLine,
    repetitionBlock,
    selectedLine,
    handleBoardMove,
    navigateToMove,
    playedMoves,
  } = useTrainingStore();

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [boardFlashing, setBoardFlashing] = useState(false);
  const prevBlockRef = useRef(repetitionBlock);
  const flashKeyRef = useRef(0);

  const boardOrientation: 'white' | 'black' = opening?.playerColor ?? 'white';
  const showAnalysis = postLine;

  // FEN shown on the board — historical when in review mode, otherwise live
  const isReviewing = viewMoveIndex !== null;
  const displayFen = isReviewing
    ? (fenHistory[viewMoveIndex + 1] ?? currentFen) // viewMoveIndex=0 → after 1st move
    : currentFen;

  // ── Green flash when repetition block increments ─────────────────
  useEffect(() => {
    if (repetitionBlock > prevBlockRef.current) {
      flashKeyRef.current += 1;
      setBoardFlashing(true);
      const t = setTimeout(() => setBoardFlashing(false), 750);
      prevBlockRef.current = repetitionBlock;
      return () => clearTimeout(t);
    }
    prevBlockRef.current = repetitionBlock;
  }, [repetitionBlock]);

  // ── Drill progress bar ───────────────────────────────────────────
  let drillTotal = 0;
  let drillDone = 0;
  if (mode === 'repetition' && !postLine && opening && selectedLine && phase === 'training') {
    const setupLen = opening.setupMoves.length;
    drillTotal = selectedLine.moves
      .slice(setupLen)
      .filter((_, i) => isStudentMove(opening, setupLen + i)).length;
    drillDone = Math.min(repetitionBlock - 1, drillTotal);
  }
  const showDrillBar = drillTotal > 0;

  // ── Custom square styles ─────────────────────────────────────────
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (!isReviewing && selectedSquare) {
    customSquareStyles[selectedSquare] = { backgroundColor: SELECTED_HIGHLIGHT };
  }

  // ── Arrows ───────────────────────────────────────────────────────
  const customArrows: [Square, Square, string][] = [];

  if (!isReviewing && wrongMoveSan) {
    const arrow = resolveArrow(currentFen, wrongMoveSan);
    if (arrow) {
      const color = showingCorrectMove ? ANSWER_ARROW_COLOR : WRONG_ARROW_COLOR;
      customArrows.push([arrow[0], arrow[1], color]);
    }
  }

  // ── Click-click moves ────────────────────────────────────────────
  const onSquareClick = useCallback(
    (square: Square) => {
      // If reviewing history, clicking the board returns to live
      if (isReviewing) {
        navigateToMove(null);
        return;
      }
      if (!isAwaitingUserMove) return;

      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
          return;
        }
        const result = handleBoardMove(selectedSquare, square);
        setSelectedSquare(null);
        if (result === 'ignored') {
          setSelectedSquare(square);
        }
      } else {
        setSelectedSquare(square);
      }
    },
    [isAwaitingUserMove, selectedSquare, handleBoardMove, isReviewing, navigateToMove],
  );

  // ── Drag-and-drop ────────────────────────────────────────────────
  const onPieceDrop = useCallback(
    (from: Square, to: Square, piece: string): boolean => {
      if (isReviewing) { navigateToMove(null); return false; }
      if (!isAwaitingUserMove) return false;
      setSelectedSquare(null);

      const isPromotion =
        piece[1] === 'P' &&
        ((piece[0] === 'w' && to[1] === '8') || (piece[0] === 'b' && to[1] === '1'));

      const result = handleBoardMove(from, to, isPromotion ? 'q' : undefined);
      return result === 'correct';
    },
    [isAwaitingUserMove, handleBoardMove, isReviewing, navigateToMove],
  );

  // ── Status text ──────────────────────────────────────────────────
  let statusText = '';
  let statusColor = 'text-slate-400';

  if (isReviewing) {
    const moveNum = Math.floor(viewMoveIndex / 2) + 1;
    const side = viewMoveIndex % 2 === 0 ? 'W' : 'B';
    statusText = `Reviewing move ${moveNum}${side} — click board to return`;
    statusColor = 'text-amber-400';
  } else if (phase === 'setup') {
    if (isAwaitingUserMove) {
      statusText = 'Your turn — play the next setup move';
      statusColor = 'text-blue-300';
    } else {
      statusText = 'Opponent is playing...';
      statusColor = 'text-slate-500';
    }
  } else if (phase === 'line-select') {
    statusText = 'Select a line to begin';
    statusColor = 'text-yellow-300';
  } else if (phase === 'training') {
    if (postLine) {
      statusText = isAwaitingUserMove ? 'Your move (free play)' : 'Opponent is thinking...';
      statusColor = isAwaitingUserMove ? 'text-emerald-400' : 'text-slate-500';
    } else if (isAwaitingUserMove) {
      statusText = 'Your move';
      statusColor = 'text-emerald-400';
    } else {
      statusText = 'Opponent is thinking...';
      statusColor = 'text-slate-500';
    }
  } else if (phase === 'completed') {
    statusText = 'Line complete!';
    statusColor = 'text-yellow-300';
  }

  const isDraggable =
    !isReviewing && isAwaitingUserMove && (phase === 'training' || phase === 'setup');

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Status */}
      <div className={`text-sm font-semibold tracking-wide h-5 ${statusColor}`}>
        {statusText}
      </div>

      {/* Drill progress bar */}
      {showDrillBar ? (
        <div className="w-full max-w-[520px] space-y-1">
          <div className="flex justify-between text-xs text-amber-300 font-semibold">
            <span>Step-by-step drill</span>
            <span>{drillDone} / {drillTotal} moves learned</span>
          </div>
          <div className="w-full bg-slate-700/60 rounded-full h-2">
            <div
              className="bg-amber-400 h-2 rounded-full transition-all duration-500"
              style={{ width: drillTotal > 0 ? `${Math.round((drillDone / drillTotal) * 100)}%` : '0%' }}
            />
          </div>
        </div>
      ) : (
        <>
          {wrongMoveSan && !showingCorrectMove && (
            <div className="bg-red-700/80 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Wrong move — follow the arrow
            </div>
          )}
          {wrongMoveSan && showingCorrectMove && (
            <div className="bg-emerald-700/80 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Follow the arrow — now play it
            </div>
          )}
          {!wrongMoveSan && <div className="h-6" />}
        </>
      )}
      {showDrillBar && wrongMoveSan && !showingCorrectMove && (
        <div className="bg-red-700/80 text-white text-xs font-semibold px-3 py-1 rounded-full">
          Wrong move — follow the arrow
        </div>
      )}
      {showDrillBar && wrongMoveSan && showingCorrectMove && (
        <div className="bg-emerald-700/80 text-white text-xs font-semibold px-3 py-1 rounded-full">
          Follow the arrow — now play it
        </div>
      )}
      {showDrillBar && !wrongMoveSan && <div className="h-6" />}

      {/* Board */}
      <div
        key={boardFlashing ? `flash-${flashKeyRef.current}` : 'board'}
        className={`rounded-lg overflow-hidden shadow-2xl shadow-black/60 ${boardFlashing ? 'board-flash-green' : ''} ${isReviewing ? 'opacity-90 ring-2 ring-amber-500/40' : ''}`}
        style={{ width: 520, height: 520 }}
      >
        <Chessboard
          id="training-board"
          position={displayFen}
          boardOrientation={boardOrientation}
          onPieceDrop={onPieceDrop}
          onSquareClick={onSquareClick}
          arePiecesDraggable={isDraggable}
          customSquareStyles={customSquareStyles}
          customArrows={customArrows}
          boardWidth={520}
          customBoardStyle={{ borderRadius: '4px' }}
          customDarkSquareStyle={{ backgroundColor: '#b58863' }}
          customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
          animationDuration={isReviewing ? 0 : 200}
        />
      </div>

      {/* History navigation bar */}
      {(phase === 'training' || phase === 'completed') && playedMoves.length > 0 && (
        <HistoryNav />
      )}

      {/* Analysis panel — only during free play */}
      {showAnalysis && <AnalysisPanel />}
    </div>
  );
}

// ─── History navigation bar ──────────────────────────────────────────

function HistoryNav() {
  const { viewMoveIndex, playedMoves, navigateToMove } = useTrainingStore();

  const isLive = viewMoveIndex === null;
  // Current position in history: null → playedMoves.length (latest)
  const currentIdx = isLive ? playedMoves.length - 1 : viewMoveIndex;

  function goBack() {
    const prev = currentIdx - 1;
    if (prev < 0) return;
    navigateToMove(prev);
  }

  function goForward() {
    const next = currentIdx + 1;
    if (next >= playedMoves.length) {
      navigateToMove(null); // return to live
    } else {
      navigateToMove(next);
    }
  }

  const canBack = currentIdx > 0;
  const canForward = currentIdx < playedMoves.length - 1 || !isLive;

  return (
    <div className="flex items-center gap-2">
      <NavButton onClick={goBack} disabled={!canBack} title="Previous move">
        ◀
      </NavButton>
      <NavButton onClick={goForward} disabled={!canForward} title="Next move">
        ▶
      </NavButton>
      {!isLive && (
        <button
          onClick={() => navigateToMove(null)}
          className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-600/40 hover:border-amber-500/60 transition-colors cursor-pointer"
        >
          ▶▶ Live
        </button>
      )}
    </div>
  );
}

function NavButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/60 border border-slate-600/40 text-slate-300 hover:bg-slate-600/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm"
    >
      {children}
    </button>
  );
}
