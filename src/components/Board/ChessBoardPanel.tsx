import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { Square } from 'react-chessboard/dist/chessboard/types';
import { useTrainingStore } from '../../store/trainingStore';
import { useSettingsStore } from '../../store/settingsStore';
import { isStudentMove } from '../../engine/chessEngine';
import EvalBar from './EvalBar';

const ANSWER_ARROW_COLOR = 'rgba(0, 222, 136, 1)';
const SELECTED_HIGHLIGHT = 'rgba(255, 214, 94, 0.42)';
const LAST_MOVE_FROM = 'rgba(255, 200, 0, 0.26)';
const LAST_MOVE_TO = 'rgba(255, 196, 0, 0.52)';
const HINT_HIGHLIGHT = 'rgba(0, 216, 153, 0.74)';
const WOOD_LIGHT = '#e6d0a9';
const WOOD_DARK = '#9b6a3c';

function isKnightMove(from: string, to: string): boolean {
  const df = Math.abs(from.charCodeAt(0) - to.charCodeAt(0));
  const dr = Math.abs(parseInt(from[1]) - parseInt(to[1]));
  return (df === 1 && dr === 2) || (df === 2 && dr === 1);
}

function KnightArrowOverlay({
  from,
  to,
  boardSize,
  orientation,
  color,
}: {
  from: string;
  to: string;
  boardSize: number;
  orientation: 'white' | 'black';
  color: string;
}) {
  const sqSize = boardSize / 8;
  const center = (sq: string) => {
    const { x, y } = squareToXY(sq, boardSize, orientation);
    return { x: x + sqSize / 2, y: y + sqSize / 2 };
  };

  const fromC = center(from);
  const toC = center(to);

  const dFile = Math.abs(from.charCodeAt(0) - to.charCodeAt(0));
  const cornerSq = dFile === 2 ? `${to[0]}${from[1]}` : `${from[0]}${to[1]}`;
  const cornerC = center(cornerSq);

  const sw = sqSize * 0.14;
  const aw = sqSize * 0.18;
  const al = sqSize * 0.25;

  const dx = toC.x - cornerC.x;
  const dy = toC.y - cornerC.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
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
        x1={fromC.x}
        y1={fromC.y}
        x2={cornerC.x}
        y2={cornerC.y}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        opacity="0.85"
      />
      <line
        x1={cornerC.x}
        y1={cornerC.y}
        x2={arrowBase.x}
        y2={arrowBase.y}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        opacity="0.85"
      />
      <polygon
        points={`${arrowTip.x},${arrowTip.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`}
        fill={color}
        opacity="0.85"
      />
    </svg>
  );
}

function resolveArrow(fen: string, san: string): [Square, Square] | null {
  try {
    const chess = new Chess(fen);
    const norm = (value: string) => value.replace(/[+#!?]/g, '').trim();
    const found = chess.moves({ verbose: true }).find((move) => norm(move.san) === norm(san));
    return found ? [found.from as Square, found.to as Square] : null;
  } catch {
    return null;
  }
}

function squareToXY(
  square: string,
  boardSize: number,
  orientation: 'white' | 'black',
): { x: number; y: number; size: number } {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(square[1]) - 1;
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
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'correct' | 'wrong' } | null>(null);

  const prevBlockRef = useRef(repetitionBlock);
  const prevStreakRef = useRef(streak);
  const prevMistakesRef = useRef(mistakes);
  const flashKeyRef = useRef(0);

  const boardOrientation: 'white' | 'black' = opening?.playerColor ?? 'white';
  const isReviewing = viewMoveIndex !== null;
  const displayFen = isReviewing
    ? (fenHistory[viewMoveIndex + 1] ?? currentFen)
    : (wrongMoveFen ?? currentFen);

  useEffect(() => {
    if (repetitionBlock > prevBlockRef.current) {
      flashKeyRef.current += 1;
      setBoardFlashing(true);
      const timer = setTimeout(() => setBoardFlashing(false), 750);
      prevBlockRef.current = repetitionBlock;
      return () => clearTimeout(timer);
    }
    prevBlockRef.current = repetitionBlock;
  }, [repetitionBlock]);

  useEffect(() => {
    if (streak > prevStreakRef.current) {
      const messages = ['Nice!', 'Sharp!', 'Excellent!', "That's it!", 'On the money!', 'Perfect!'];
      setFeedbackMsg({
        text: messages[Math.floor(Math.random() * messages.length)],
        type: 'correct',
      });
      const timer = setTimeout(() => setFeedbackMsg(null), 2500);
      prevStreakRef.current = streak;
      return () => clearTimeout(timer);
    }
    prevStreakRef.current = streak;
  }, [streak]);

  useEffect(() => {
    if (mistakes > prevMistakesRef.current) {
      const messages = ['Not quite!', 'Wrong move!', 'Remember the plan!', 'Stay on the line!'];
      setFeedbackMsg({
        text: messages[Math.floor(Math.random() * messages.length)],
        type: 'wrong',
      });
      const timer = setTimeout(() => setFeedbackMsg(null), 2500);
      prevMistakesRef.current = mistakes;
      return () => clearTimeout(timer);
    }
    prevMistakesRef.current = mistakes;
  }, [mistakes]);

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
      for (let i = setupLen; i < currentMoveIndex; i += 1) {
        if (isStudentMove(opening, i)) done += 1;
      }
      progressTotal = studentTotal;
      progressDone = done;
      if (mode === 'learn') {
        progressLabel = 'Line progress';
        progressColor = 'bg-sky-400';
      } else if (mode === 'drill') {
        progressLabel = 'Drill';
        progressColor = 'bg-red-400';
      } else {
        progressLabel = 'Time Trial';
        progressColor = 'bg-cyan-400';
      }
    }
  }

  const showProgressBar = progressTotal > 0;
  const customSquareStyles: Record<string, React.CSSProperties> = {};

  if (
    !isReviewing &&
    !wrongMoveFen &&
    isAwaitingUserMove &&
    !postLine &&
    opening &&
    playedMoves.length > 0 &&
    currentMoveIndex > 0
  ) {
    const lastMoveIsComputer = !isStudentMove(opening, currentMoveIndex - 1);
    if (lastMoveIsComputer && fenHistory.length >= 2) {
      const prevFen = fenHistory[fenHistory.length - 2];
      const lastSan = playedMoves[playedMoves.length - 1];
      const arrow = resolveArrow(prevFen, lastSan);
      if (arrow) {
        customSquareStyles[arrow[0]] = { backgroundColor: LAST_MOVE_FROM };
        customSquareStyles[arrow[1]] = { backgroundColor: LAST_MOVE_TO };
      }
    }
  }

  if (!isReviewing && selectedSquare) {
    customSquareStyles[selectedSquare] = { backgroundColor: SELECTED_HIGHLIGHT };
  }

  if (!isReviewing && hintSquare) {
    customSquareStyles[hintSquare] = {
      ...(customSquareStyles[hintSquare] ?? {}),
      backgroundColor: HINT_HIGHLIGHT,
      boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.12)',
    };
  }

  const customArrows: [Square, Square, string][] = [];
  let knightArrow: [Square, Square] | null = null;

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

  const onSquareClick = useCallback(
    (square: Square) => {
      if (isReviewing) {
        navigateToMove(null);
        return;
      }
      if (wrongMoveFen || !isAwaitingUserMove) return;

      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
          return;
        }
        const result = handleBoardMove(selectedSquare, square);
        setSelectedSquare(null);
        if (result === 'ignored') setSelectedSquare(square);
      } else {
        setSelectedSquare(square);
      }
    },
    [handleBoardMove, isAwaitingUserMove, isReviewing, navigateToMove, selectedSquare, wrongMoveFen],
  );

  const onPieceDrop = useCallback(
    (from: Square, to: Square, piece: string): boolean => {
      if (isReviewing) {
        navigateToMove(null);
        return false;
      }
      if (wrongMoveFen || !isAwaitingUserMove) return false;
      setSelectedSquare(null);

      const isPromotion =
        piece[1] === 'P' &&
        ((piece[0] === 'w' && to[1] === '8') || (piece[0] === 'b' && to[1] === '1'));

      if (isPromotion && postLine) {
        setPromotionPending({ from, to });
        return false;
      }

      const result = handleBoardMove(from, to, isPromotion ? 'q' : undefined);
      return result === 'correct' || result === 'wrong';
    },
    [handleBoardMove, isAwaitingUserMove, isReviewing, navigateToMove, postLine, wrongMoveFen],
  );

  const onPromotionPieceSelect = useCallback(
    (piece?: string): boolean => {
      if (!promotionPending || !piece) {
        setPromotionPending(null);
        return false;
      }
      const { from, to } = promotionPending;
      setPromotionPending(null);
      const promo = piece[1]?.toLowerCase() ?? 'q';
      const result = handleBoardMove(from, to, promo);
      return result === 'correct';
    },
    [handleBoardMove, promotionPending],
  );

  let statusText = '';
  let statusColor = 'text-stone-400';

  if (isReviewing) {
    const moveNum = Math.floor(viewMoveIndex / 2) + 1;
    const side = viewMoveIndex % 2 === 0 ? 'W' : 'B';
    statusText = `Reviewing move ${moveNum}${side} - click board to return`;
    statusColor = 'text-amber-300';
  } else if (wrongMoveFen) {
    statusText = 'Wrong move - tap back to undo';
    statusColor = 'text-rose-300';
  } else if (phase === 'setup') {
    statusText = isAwaitingUserMove ? 'Play the next setup move' : 'Opponent is playing...';
    statusColor = isAwaitingUserMove ? 'text-sky-300' : 'text-stone-500';
  } else if (phase === 'line-select') {
    statusText = 'Choose a line';
    statusColor = 'text-amber-300';
  } else if (phase === 'training') {
    if (postLine) {
      statusText = isAwaitingUserMove ? 'Your move' : 'Opponent is thinking...';
      statusColor = isAwaitingUserMove ? 'text-emerald-300' : 'text-stone-500';
    } else if (isAwaitingUserMove) {
      statusText = 'Your move';
      statusColor = 'text-emerald-300';
    } else {
      statusText = 'Opponent is thinking...';
      statusColor = 'text-stone-500';
    }
  } else if (phase === 'completed') {
    statusText = 'Line complete!';
    statusColor = 'text-amber-300';
  }

  const isDraggable =
    !isReviewing &&
    !wrongMoveFen &&
    isAwaitingUserMove &&
    (phase === 'training' || phase === 'setup');

  return (
    <div className="flex w-full max-w-full flex-col items-center gap-2">
      <div className={`text-sm font-semibold tracking-wide ${statusColor}`}>
        {statusText}
      </div>

      <div className={`w-full ${showProgressBar ? 'visible' : 'invisible'}`} style={{ maxWidth: boardSize }}>
        <div className="mb-1 flex justify-between text-xs font-semibold text-stone-400">
          <span>{progressLabel}</span>
          <span>{progressDone} / {progressTotal} moves</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/8">
          <div
            className={`${progressColor} h-2 rounded-full transition-all duration-300`}
            style={{
              width: progressTotal > 0
                ? `${Math.round((progressDone / progressTotal) * 100)}%`
                : '0%',
            }}
          />
        </div>
      </div>

      <div className="flex h-6 items-center justify-center">
        {feedbackMsg ? (
          <span
            className={`rounded-full px-4 py-1 text-xs font-bold ${
              feedbackMsg.type === 'correct'
                ? 'bg-emerald-500/90 text-slate-950'
                : 'bg-rose-500/90 text-white'
            }`}
          >
            {feedbackMsg.text}
          </span>
        ) : wrongMoveFen && !showingCorrectMove ? (
          <span className="rounded-full bg-rose-500/85 px-3 py-1 text-xs font-semibold text-white">
            Wrong move - tap back to undo
          </span>
        ) : wrongMoveSan && showingCorrectMove ? (
          <span className="rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-slate-950">
            Follow the arrow
          </span>
        ) : null}
      </div>

      <div className="flex w-full items-center justify-center gap-3 sm:gap-4">
        {showEvalBar && !postLine && (phase === 'training' || phase === 'setup' || phase === 'completed') && (
          <EvalBar fen={displayFen} height={boardSize} playerColor={opening?.playerColor ?? 'white'} />
        )}
        <div
          key={boardFlashing ? `flash-${flashKeyRef.current}` : 'board'}
          className={[
            'board-frame relative isolate overflow-hidden rounded-[18px]',
            'border border-black/12 bg-[#2f2116] shadow-[0_20px_50px_rgba(0,0,0,0.34)]',
            boardFlashing ? 'board-flash-green' : '',
            isReviewing ? 'opacity-90 ring-2 ring-amber-500/30' : '',
          ].join(' ')}
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
            customBoardStyle={{
              borderRadius: '18px',
              backgroundColor: 'transparent',
              boxShadow: 'none',
            }}
            customDarkSquareStyle={{ backgroundColor: WOOD_DARK }}
            customLightSquareStyle={{ backgroundColor: WOOD_LIGHT }}
            animationDuration={isReviewing ? 0 : 200}
            {...(postLine && isAwaitingUserMove
              ? {
                  promotionDialogVariant: 'modal' as const,
                  onPromotionPieceSelect,
                }
              : {})}
          />

          {knightArrow && !isReviewing && (
            <KnightArrowOverlay
              from={knightArrow[0]}
              to={knightArrow[1]}
              boardSize={boardSize}
              orientation={boardOrientation}
              color={ANSWER_ARROW_COLOR}
            />
          )}

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
                <div className="flex h-full w-full items-center justify-center rounded-full border-[3px] border-rose-500 bg-slate-900 shadow-xl shadow-black/60">
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
    </div>
  );
}

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
  const {
    viewMoveIndex,
    playedMoves,
    navigateToMove,
    mistakes,
    isAwaitingUserMove,
    showHint,
    showAnswer,
    hintSquare,
    showingCorrectMove,
  } = useTrainingStore();

  const isLive = viewMoveIndex === null;
  const currentIdx = isLive ? playedMoves.length - 1 : viewMoveIndex;

  function goBack() {
    if (wrongMoveFen) {
      clearWrongMove();
      return;
    }
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
    <div className="flex items-center justify-between gap-2" style={{ width: boardSize, maxWidth: '100%' }}>
      <div style={{ width: sqPx }} className="flex-shrink-0">
        {mistakes > 0 && (
          <span className="text-xs font-bold text-rose-300">x {mistakes}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <NavButton
          onClick={goBack}
          disabled={!canBack}
          title={wrongMoveFen ? 'Undo wrong move' : 'Previous move'}
        >
          ←
        </NavButton>
        <NavButton onClick={goForward} disabled={!canForward} title="Next move">
          →
        </NavButton>
        {!isLive && !wrongMoveFen && (
          <button
            onClick={() => navigateToMove(null)}
            className="rounded-xl border border-white/6 bg-white/[0.035] px-2.5 py-1 text-xs font-semibold text-amber-200 transition-colors hover:bg-white/[0.06] cursor-pointer"
          >
            Live
          </button>
        )}
      </div>

      <div style={{ width: sqPx }} className="flex flex-shrink-0 justify-end">
        {!hideHint && showHintBtn && (
          <button
            onClick={showHint}
            title="Hint"
            style={{ width: sqPx, height: 32 }}
            className="rounded-xl bg-emerald-500 text-xs font-semibold text-slate-950 transition-colors hover:bg-emerald-400 cursor-pointer"
          >
            Hint
          </button>
        )}
        {!hideHint && showAnswerBtn && (
          <button
            onClick={showAnswer}
            title="Show answer"
            style={{ width: sqPx, height: 32 }}
            className="rounded-xl bg-emerald-500 text-xs font-semibold text-slate-950 transition-colors hover:bg-emerald-400 cursor-pointer"
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
      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/6 bg-white/[0.035] text-sm text-stone-300 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
    >
      {children}
    </button>
  );
}
