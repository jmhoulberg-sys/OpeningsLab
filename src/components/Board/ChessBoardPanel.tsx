import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { Square } from 'react-chessboard/dist/chessboard/types';
import { useTrainingStore } from '../../store/trainingStore';
import { useSettingsStore } from '../../store/settingsStore';
import { isStudentMove } from '../../engine/chessEngine';
import EvalBar from './EvalBar';

// Arrow colours
const ANSWER_ARROW_COLOR = 'rgba(0,   240, 100, 1.00)';
const SELECTED_HIGHLIGHT = 'rgba(255, 255, 0,   0.4)';

// ─── Knight move helpers ─────────────────────────────────────────────

function isKnightMove(from: string, to: string): boolean {
  const df = Math.abs(from.charCodeAt(0) - to.charCodeAt(0));
  const dr = Math.abs(parseInt(from[1]) - parseInt(to[1]));
  return (df === 1 && dr === 2) || (df === 2 && dr === 1);
}

function KnightArrowOverlay({ from, to, boardSize, orientation, color }: {
  from: string; to: string; boardSize: number;
  orientation: 'white' | 'black'; color: string;
}) {
  const sqSize = boardSize / 8;
  const center = (sq: string) => {
    const { x, y } = squareToXY(sq, boardSize, orientation);
    return { x: x + sqSize / 2, y: y + sqSize / 2 };
  };

  const fromC = center(from);
  const toC = center(to);

  const dFile = Math.abs(from.charCodeAt(0) - to.charCodeAt(0));
  let cornerSq: string;
  if (dFile === 2) {
    cornerSq = to[0] + from[1];
  } else {
    cornerSq = from[0] + to[1];
  }
  const cornerC = center(cornerSq);

  // Match react-chessboard arrow proportions
  const sw = sqSize * 0.14;   // stroke width proportional to square size
  const aw = sqSize * 0.18;   // arrowhead half-width
  const al = sqSize * 0.25;   // arrowhead length

  const dx = toC.x - cornerC.x;
  const dy = toC.y - cornerC.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len, uy = dy / len;
  const arrowTip = { x: toC.x, y: toC.y };
  const arrowBase = { x: toC.x - ux * al, y: toC.y - uy * al };
  const perp = { x: -uy, y: ux };
  const p1 = { x: arrowBase.x + perp.x * aw, y: arrowBase.y + perp.y * aw };
  const p2 = { x: arrowBase.x - perp.x * aw, y: arrowBase.y - perp.y * aw };

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={boardSize}
      height={boardSize}
      style={{ zIndex: 1 }}
    >
      <line
        x1={fromC.x} y1={fromC.y}
        x2={cornerC.x} y2={cornerC.y}
        stroke={color} strokeWidth={sw} strokeLinecap="round" opacity="0.85"
      />
      <line
        x1={cornerC.x} y1={cornerC.y}
        x2={arrowBase.x} y2={arrowBase.y}
        stroke={color} strokeWidth={sw} strokeLinecap="round" opacity="0.85"
      />
      <polygon
        points={`${arrowTip.x},${arrowTip.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`}
        fill={color} opacity="0.85"
      />
    </svg>
  );
}

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

/** Convert algebraic square to pixel {x, y} coordinates on the board. */
function squareToXY(
  square: string,
  boardSize: number,
  orientation: 'white' | 'black',
): { x: number; y: number; size: number } {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0–7
  const rank = parseInt(square[1]) - 1;                  // 0–7
  const size = boardSize / 8;
  const x = orientation === 'white' ? file * size : (7 - file) * size;
  const y = orientation === 'white' ? (7 - rank) * size : rank * size;
  return { x, y, size };
}

export default function ChessBoardPanel({ boardSize = 520 }: { boardSize?: number }) {
  const {
    opening,
    phase,
    mode,
    currentFen,
    fenHistory,
    viewMoveIndex,
    isAwaitingUserMove,
    wrongMoveSan,
    wrongMoveFen,
    wrongMoveSquare,
    showingCorrectMove,
    postLine,
    repetitionBlock,
    selectedLine,
    handleBoardMove,
    navigateToMove,
    clearWrongMove,
    playedMoves,
    currentMoveIndex,
    streak,
    mistakes,
    hintSquare,
  } = useTrainingStore();

  const { showEvalBar } = useSettingsStore();

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [boardFlashing, setBoardFlashing] = useState(false);
  const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square } | null>(null);
  const prevBlockRef = useRef(repetitionBlock);
  const flashKeyRef = useRef(0);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'correct' | 'wrong' } | null>(null);
  const prevStreakRef = useRef(streak);
  const prevMistakesRef = useRef(mistakes);

  const boardOrientation: 'white' | 'black' = opening?.playerColor ?? 'white';

  // FEN shown on the board — wrong move position → historical → live
  const isReviewing = viewMoveIndex !== null;
  const displayFen = isReviewing
    ? (fenHistory[viewMoveIndex + 1] ?? currentFen)
    : (wrongMoveFen ?? currentFen);

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

  // ── Feedback toast on streak/mistakes changes ─────────────────
  useEffect(() => {
    if (streak > prevStreakRef.current) {
      const msgs = ['Nice!', 'Sharp!', 'Excellent!', "That's it!", 'On the money!', 'Perfect!'];
      setFeedbackMsg({ text: msgs[Math.floor(Math.random() * msgs.length)], type: 'correct' });
      const t = setTimeout(() => setFeedbackMsg(null), 2500);
      prevStreakRef.current = streak;
      return () => clearTimeout(t);
    }
    prevStreakRef.current = streak;
  }, [streak]);

  useEffect(() => {
    if (mistakes > prevMistakesRef.current) {
      const msgs = ['Not quite!', 'Wrong move!', 'Remember the plan!', 'Stay on the line!'];
      setFeedbackMsg({ text: msgs[Math.floor(Math.random() * msgs.length)], type: 'wrong' });
      const t = setTimeout(() => setFeedbackMsg(null), 2500);
      prevMistakesRef.current = mistakes;
      return () => clearTimeout(t);
    }
    prevMistakesRef.current = mistakes;
  }, [mistakes]);

  // ── Progress bar (all training modes) ───────────────────────────
  let progressLabel = '';
  let progressDone = 0;
  let progressTotal = 0;
  let progressColor = 'bg-brand-accent';

  if (!postLine && opening && selectedLine && phase === 'training') {
    const setupLen = opening.setupMoves.length;
    const studentTotal = selectedLine.moves
      .slice(setupLen)
      .filter((_, i) => isStudentMove(opening, setupLen + i)).length;

    if (mode === 'step-by-step') {
      progressLabel = 'Step-by-step';
      progressTotal = studentTotal;
      progressDone = Math.min(repetitionBlock - 1, studentTotal);
      progressColor = 'bg-amber-400';
    } else {
      let done = 0;
      for (let i = setupLen; i < currentMoveIndex; i++) {
        if (isStudentMove(opening, i)) done++;
      }
      progressTotal = studentTotal;
      progressDone = done;
      if (mode === 'learn')       { progressLabel = 'Line progress'; progressColor = 'bg-blue-400'; }
      else if (mode === 'drill')  { progressLabel = 'Drill';         progressColor = 'bg-red-400'; }
      else                        { progressLabel = 'Time Trial';    progressColor = 'bg-cyan-400'; }
    }
  }
  const showProgressBar = progressTotal > 0;

  // ── Custom square styles ─────────────────────────────────────────
  const customSquareStyles: Record<string, React.CSSProperties> = {};

  // Yellow highlight for last computer move (only when live, not reviewing, no wrong move)
  if (!isReviewing && !wrongMoveFen && isAwaitingUserMove && !postLine && opening && playedMoves.length > 0 && currentMoveIndex > 0) {
    const lastMoveIsComputer = !isStudentMove(opening, currentMoveIndex - 1);
    if (lastMoveIsComputer && fenHistory.length >= 2) {
      const prevFen = fenHistory[fenHistory.length - 2];
      const lastSan = playedMoves[playedMoves.length - 1];
      const arrow = resolveArrow(prevFen, lastSan);
      if (arrow) {
        customSquareStyles[arrow[0]] = { backgroundColor: 'rgba(255, 200, 0, 0.35)' };
        customSquareStyles[arrow[1]] = { backgroundColor: 'rgba(255, 200, 0, 0.55)' };
      }
    }
  }

  if (!isReviewing && selectedSquare) {
    customSquareStyles[selectedSquare] = { backgroundColor: SELECTED_HIGHLIGHT };
  }

  // Subtle green background for hint square (like last-move yellow)
  if (!isReviewing && hintSquare) {
    customSquareStyles[hintSquare] = {
      ...(customSquareStyles[hintSquare] ?? {}),
      backgroundColor: 'rgba(5, 150, 105, 0.55)',
    };
  }

  // ── Arrows ───────────────────────────────────────────────────────
  const customArrows: [Square, Square, string][] = [];
  let knightArrow: [Square, Square] | null = null;

  // Only show the answer arrow when explicitly requested (showingCorrectMove),
  // not when just a wrong move is on screen
  if (!isReviewing && wrongMoveSan && showingCorrectMove && !wrongMoveFen) {
    const arrow = resolveArrow(currentFen, wrongMoveSan);
    if (arrow) {
      if (isKnightMove(arrow[0], arrow[1])) {
        knightArrow = arrow;
      } else {
        customArrows.push([arrow[0], arrow[1], ANSWER_ARROW_COLOR]);
      }
    }
  }

  // ── Click-click moves ────────────────────────────────────────────
  const onSquareClick = useCallback(
    (square: Square) => {
      if (isReviewing) { navigateToMove(null); return; }
      if (wrongMoveFen) return; // must undo wrong move first
      if (!isAwaitingUserMove) return;

      if (selectedSquare) {
        if (selectedSquare === square) { setSelectedSquare(null); return; }
        const result = handleBoardMove(selectedSquare, square);
        setSelectedSquare(null);
        if (result === 'ignored') setSelectedSquare(square);
      } else {
        setSelectedSquare(square);
      }
    },
    [isAwaitingUserMove, wrongMoveFen, selectedSquare, handleBoardMove, isReviewing, navigateToMove],
  );

  // ── Drag-and-drop ────────────────────────────────────────────────
  const onPieceDrop = useCallback(
    (from: Square, to: Square, piece: string): boolean => {
      if (isReviewing) { navigateToMove(null); return false; }
      if (wrongMoveFen) return false; // must undo wrong move first
      if (!isAwaitingUserMove) return false;
      setSelectedSquare(null);

      const isPromotion =
        piece[1] === 'P' &&
        ((piece[0] === 'w' && to[1] === '8') || (piece[0] === 'b' && to[1] === '1'));

      // In free play, let the built-in promotion dialog handle piece selection
      if (isPromotion && postLine) {
        setPromotionPending({ from, to });
        return false; // keep piece at source; dialog will show
      }

      const result = handleBoardMove(from, to, isPromotion ? 'q' : undefined);
      // Return true for both correct AND wrong — piece stays at destination;
      // for wrong moves the board shows wrongMoveFen, for correct it shows the new position.
      return result === 'correct' || result === 'wrong';
    },
    [isAwaitingUserMove, wrongMoveFen, handleBoardMove, isReviewing, navigateToMove, postLine],
  );

  // ── Promotion piece select (free play only) ──────────────────────
  const onPromotionPieceSelect = useCallback(
    (piece?: string): boolean => {
      if (!promotionPending || !piece) { setPromotionPending(null); return false; }
      const { from, to } = promotionPending;
      setPromotionPending(null);
      // piece is like 'wQ', 'bQ' etc — extract lowercase piece letter
      const promo = piece[1]?.toLowerCase() ?? 'q';
      const result = handleBoardMove(from, to, promo);
      return result === 'correct';
    },
    [promotionPending, handleBoardMove],
  );

  // ── Status text ──────────────────────────────────────────────────
  let statusText = '';
  let statusColor = 'text-slate-400';

  if (isReviewing) {
    const moveNum = Math.floor(viewMoveIndex / 2) + 1;
    const side = viewMoveIndex % 2 === 0 ? 'W' : 'B';
    statusText = `Reviewing move ${moveNum}${side} — click board to return`;
    statusColor = 'text-amber-400';
  } else if (wrongMoveFen) {
    statusText = 'Wrong move — click ◀ to undo';
    statusColor = 'text-red-400';
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
    !isReviewing && !wrongMoveFen && isAwaitingUserMove && (phase === 'training' || phase === 'setup');

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Status */}
      <div className={`text-sm font-semibold tracking-wide ${statusColor}`}>
        {statusText}
      </div>

      {/* Progress bar — always in layout, invisible when not applicable */}
      <div className={`w-full ${showProgressBar ? 'visible' : 'invisible'}`} style={{ maxWidth: boardSize }}>
        <div className="flex justify-between text-xs text-slate-400 font-semibold mb-1">
          <span>{progressLabel}</span>
          <span>{progressDone} / {progressTotal} moves</span>
        </div>
        <div className="w-full bg-slate-700/60 rounded-full h-2">
          <div
            className={`${progressColor} h-2 rounded-full transition-all duration-300`}
            style={{ width: progressTotal > 0 ? `${Math.round((progressDone / progressTotal) * 100)}%` : '0%' }}
          />
        </div>
      </div>

      {/* Feedback row — always h-6, never collapses */}
      <div className="h-6 flex items-center justify-center">
        {feedbackMsg ? (
          <span className={`text-xs font-bold px-4 py-1 rounded-full ${
            feedbackMsg.type === 'correct' ? 'bg-emerald-600/90 text-white' : 'bg-red-600/90 text-white'
          }`}>{feedbackMsg.text}</span>
        ) : wrongMoveFen && !showingCorrectMove ? (
          <span className="bg-red-700/80 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Wrong move — click ◀ to undo
          </span>
        ) : wrongMoveSan && showingCorrectMove ? (
          <span className="bg-emerald-700/80 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Follow the arrow — now play it
          </span>
        ) : null}
      </div>

      {/* Board + optional eval bar */}
      <div className="flex items-center gap-2">
        {showEvalBar && !postLine && (phase === 'training' || phase === 'setup' || phase === 'completed') && (
          <EvalBar fen={displayFen} height={boardSize} playerColor={opening?.playerColor ?? 'white'} />
        )}
        <div
          key={boardFlashing ? `flash-${flashKeyRef.current}` : 'board'}
          className={`relative rounded-lg overflow-hidden shadow-2xl shadow-black/60 ${boardFlashing ? 'board-flash-green' : ''} ${isReviewing ? 'opacity-90 ring-2 ring-amber-500/40' : ''}`}
          style={{ width: boardSize, height: boardSize }}
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
            boardWidth={boardSize}
            customBoardStyle={{ borderRadius: '4px' }}
            customDarkSquareStyle={{ backgroundColor: '#b58863' }}
            customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
            animationDuration={isReviewing ? 0 : 200}
            {...(postLine && isAwaitingUserMove ? {
              promotionDialogVariant: 'modal' as const,
              onPromotionPieceSelect,
            } : {})}
          />

          {/* Knight arrow overlay (L-shaped) */}
          {knightArrow && !isReviewing && (
            <KnightArrowOverlay
              from={knightArrow[0]}
              to={knightArrow[1]}
              boardSize={boardSize}
              orientation={boardOrientation}
              color={ANSWER_ARROW_COLOR}
            />
          )}

          {/* Wrong-move X badge — top-right corner of the destination square */}
          {wrongMoveSquare && !isReviewing && (() => {
            const { x, y, size } = squareToXY(wrongMoveSquare, boardSize, boardOrientation);
            const badge = Math.max(22, Math.min(34, size * 0.42));
            return (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: x + size - badge * 0.65,
                  top: y - badge * 0.35,
                  width: badge,
                  height: badge,
                }}
              >
                <div className="w-full h-full rounded-full bg-slate-900 border-[3px] border-red-500 flex items-center justify-center shadow-xl shadow-black/60">
                  <svg
                    width="52%"
                    height="52%"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Board nav row with mistake counter and hint button */}
      {(phase === 'training' || phase === 'setup' || phase === 'completed') && (
        <BoardNavRow
          wrongMoveFen={wrongMoveFen}
          clearWrongMove={clearWrongMove}
          boardSize={boardSize}
          phase={phase}
          mode={mode}
          postLine={postLine}
        />
      )}

      {/* Analysis panel moved to sidebar */}
    </div>
  );
}

// ─── Board nav row (mistake counter + nav arrows + hint button) ───────

function BoardNavRow({
  wrongMoveFen,
  clearWrongMove,
  boardSize,
  phase,
  mode,
  postLine,
}: {
  wrongMoveFen: string | null;
  clearWrongMove: () => void;
  boardSize: number;
  phase: string;
  mode: string;
  postLine: boolean;
}) {
  const { viewMoveIndex, playedMoves, navigateToMove, mistakes, isAwaitingUserMove, showHint, showAnswer, hintSquare, showingCorrectMove } = useTrainingStore();

  const isLive = viewMoveIndex === null;
  const currentIdx = isLive ? playedMoves.length - 1 : viewMoveIndex;

  function goBack() {
    if (wrongMoveFen) { clearWrongMove(); return; }
    const prev = currentIdx - 1;
    if (prev < 0) return;
    navigateToMove(prev);
  }

  function goForward() {
    const next = currentIdx + 1;
    if (next >= playedMoves.length) {
      navigateToMove(null);
    } else {
      navigateToMove(next);
    }
  }

  const canBack = wrongMoveFen != null || currentIdx > 0;
  const canForward = !wrongMoveFen && (currentIdx < playedMoves.length - 1 || !isLive);

  const inSession = phase === 'training' || phase === 'setup';
  const hideHint = mode === 'drill' || mode === 'time-trial';
  const canHint = inSession && isAwaitingUserMove && !postLine && !hideHint;

  const sqPx = boardSize / 8;
  const showHintBtn = canHint && !hintSquare && !showingCorrectMove;
  const showAnswerBtn = canHint && !!hintSquare && !showingCorrectMove;

  return (
    <div className="flex items-center justify-between gap-2" style={{ width: boardSize }}>
      {/* Left: mistake counter */}
      <div style={{ width: sqPx }} className="flex-shrink-0">
        {mistakes > 0 && (
          <span className="text-xs font-bold text-red-400">✗ {mistakes}</span>
        )}
      </div>

      {/* Center: nav arrows */}
      <div className="flex items-center gap-2">
        <NavButton onClick={goBack} disabled={!canBack} title={wrongMoveFen ? 'Undo wrong move' : 'Previous move'}>
          ◀
        </NavButton>
        <NavButton onClick={goForward} disabled={!canForward} title="Next move">
          ▶
        </NavButton>
        {!isLive && !wrongMoveFen && (
          <button
            onClick={() => navigateToMove(null)}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-600/40 hover:border-amber-500/60 transition-colors cursor-pointer"
          >
            ▶▶ Live
          </button>
        )}
      </div>

      {/* Right: hint / answer button */}
      <div style={{ width: sqPx }} className="flex-shrink-0 flex justify-end">
        {!hideHint && showHintBtn && (
          <button
            onClick={showHint}
            title="Hint"
            style={{ width: sqPx, height: 32 }}
            className="rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 cursor-pointer transition-colors"
          >
            Hint
          </button>
        )}
        {!hideHint && showAnswerBtn && (
          <button
            onClick={showAnswer}
            title="Show answer"
            style={{ width: sqPx, height: 32 }}
            className="rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-400 cursor-pointer transition-colors"
          >
            Answer
          </button>
        )}
      </div>
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
