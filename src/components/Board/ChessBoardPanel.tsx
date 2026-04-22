import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { Square } from 'react-chessboard/dist/chessboard/types';
import { ChevronLeft, ChevronRight, Lightbulb, Sparkles } from 'lucide-react';
import { useTrainingStore } from '../../store/trainingStore';
import { useSettingsStore } from '../../store/settingsStore';
import { isStudentMove } from '../../engine/chessEngine';
import EvalBar from './EvalBar';

const ANSWER_ARROW_COLOR = 'rgba(0, 222, 136, 1)';
const SELECTED_HIGHLIGHT = 'rgba(91, 176, 255, 0.34)';
const LAST_MOVE_FROM = 'rgba(255, 200, 0, 0.26)';
const LAST_MOVE_TO = 'rgba(255, 196, 0, 0.52)';
const HINT_HIGHLIGHT = 'rgba(0, 216, 153, 0.74)';
const WOOD_LIGHT = '#e6d0a9';
const WOOD_DARK = '#9b6a3c';

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

function getBoardMessage({
  isReviewing,
  viewMoveIndex,
  wrongMoveFen,
  phase,
  isAwaitingUserMove,
  postLine,
}: {
  isReviewing: boolean;
  viewMoveIndex: number | null;
  wrongMoveFen: string | null;
  phase: string;
  isAwaitingUserMove: boolean;
  postLine: boolean;
}) {
  if (isReviewing) {
    const moveNum = Math.floor((viewMoveIndex ?? 0) / 2) + 1;
    const side = (viewMoveIndex ?? 0) % 2 === 0 ? 'W' : 'B';
    return {
      eyebrow: 'Review',
      text: `Move ${moveNum}${side} from the line`,
      color: 'text-sky-300',
    };
  }

  if (wrongMoveFen) {
    return {
      eyebrow: 'Try again',
      text: 'Reset and play the move once more',
      color: 'text-rose-300',
    };
  }

  if (phase === 'setup') {
    return {
      eyebrow: 'Setup',
      text: isAwaitingUserMove
        ? 'Reach the shared opening position'
        : 'Hold the structure while the reply appears',
      color: isAwaitingUserMove ? 'text-sky-300' : 'text-stone-500',
    };
  }

  if (phase === 'line-select') {
    return {
      eyebrow: 'Line pick',
      text: 'Choose the variation you want to drill',
      color: 'text-sky-300',
    };
  }

  if (phase === 'training') {
    if (postLine) {
      return {
        eyebrow: 'Play on',
        text: isAwaitingUserMove
          ? 'Keep the initiative and find the best continuation'
          : 'Wait for the practical response',
        color: isAwaitingUserMove ? 'text-emerald-300' : 'text-stone-500',
      };
    }

    return {
      eyebrow: 'Training',
      text: isAwaitingUserMove
        ? 'Find the next move from memory'
        : 'Read the reply and prepare the next idea',
      color: isAwaitingUserMove ? 'text-emerald-300' : 'text-stone-500',
    };
  }

  if (phase === 'completed') {
    return {
      eyebrow: 'Complete',
      text: 'Line complete. Run it again or keep playing',
      color: 'text-emerald-300',
    };
  }

  return {
    eyebrow: '',
    text: '',
    color: 'text-stone-400',
  };
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
  const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square } | null>(
    null,
  );
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'correct' | 'wrong' } | null>(
    null,
  );

  const prevBlockRef = useRef(repetitionBlock);
  const prevStreakRef = useRef(streak);
  const prevMistakesRef = useRef(mistakes);
  const flashKeyRef = useRef(0);

  const boardOrientation: 'white' | 'black' = opening?.playerColor ?? 'white';
  const isReviewing = viewMoveIndex !== null;
  const displayFen = isReviewing
    ? (fenHistory[(viewMoveIndex ?? 0) + 1] ?? currentFen)
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
  let progressColor = 'bg-sky-500';

  if (!postLine && opening && selectedLine && phase === 'training') {
    const setupLen = opening.setupMoves.length;
    const studentTotal = selectedLine.moves
      .slice(setupLen)
      .filter((_, i) => isStudentMove(opening, setupLen + i)).length;

    if (mode === 'step-by-step') {
      progressLabel = 'Step-by-step';
      progressTotal = studentTotal;
      progressDone = Math.min(repetitionBlock - 1, studentTotal);
      progressColor = 'bg-sky-500';
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

  if (!isReviewing && wrongMoveSan && showingCorrectMove && !wrongMoveFen) {
    const arrow = resolveArrow(currentFen, wrongMoveSan);
    if (arrow) {
      customArrows.push([arrow[0], arrow[1], ANSWER_ARROW_COLOR]);
    }
  }

  const onSquareClick = useCallback(
    (square: Square) => {
      if (isReviewing) {
        navigateToMove(null);
        return;
      }
      if (wrongMoveFen) {
        clearWrongMove();
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
        if (result === 'ignored') setSelectedSquare(square);
      } else {
        setSelectedSquare(square);
      }
    },
    [
      clearWrongMove,
      handleBoardMove,
      isAwaitingUserMove,
      isReviewing,
      navigateToMove,
      selectedSquare,
      wrongMoveFen,
    ],
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

  const boardMessage = getBoardMessage({
    isReviewing,
    viewMoveIndex,
    wrongMoveFen,
    phase,
    isAwaitingUserMove,
    postLine,
  });

  const isDraggable =
    !isReviewing &&
    !wrongMoveFen &&
    isAwaitingUserMove &&
    (phase === 'training' || phase === 'setup');

  return (
    <div className="flex w-full max-w-full flex-col items-center gap-2">
      <div className="flex min-h-[52px] flex-col items-center justify-center text-center">
        {boardMessage.eyebrow && (
          <div className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${boardMessage.color}`}>
            {boardMessage.eyebrow}
          </div>
        )}
        <div className={`mt-1 text-sm font-semibold tracking-wide ${boardMessage.color}`}>
          {boardMessage.text}
        </div>
      </div>

      <div
        className={`w-full ${showProgressBar ? 'visible' : 'invisible'}`}
        style={{ maxWidth: boardSize }}
      >
        <div className="mb-1 flex justify-between text-xs font-semibold text-stone-400">
          <span>{progressLabel}</span>
          <span>{progressDone} / {progressTotal} moves</span>
        </div>
        <div className="h-2 w-full rounded-full bg-stone-700/50">
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
            Play it again
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
            isReviewing ? 'opacity-90 ring-2 ring-sky-500/30' : '',
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
                <div className="flex h-full w-full items-center justify-center rounded-full border border-white/10 bg-slate-950/94 shadow-[0_10px_24px_rgba(0,0,0,0.45)] ring-2 ring-rose-500/90">
                  <svg
                    width="50%"
                    height="50%"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f8fafc"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 8l8 8" />
                    <path d="M16 8l-8 8" />
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

      <div className="flex items-center gap-3">
        <NavButton
          onClick={goBack}
          disabled={!canBack}
          title={wrongMoveFen ? 'Undo wrong move' : 'Previous move'}
        >
          <ChevronLeft size={18} />
        </NavButton>
        <NavButton onClick={goForward} disabled={!canForward} title="Next move">
          <ChevronRight size={18} />
        </NavButton>
        {!isLive && !wrongMoveFen && (
          <button
            onClick={() => navigateToMove(null)}
            className="rounded-xl border border-stone-700/40 bg-stone-800/85 px-3 py-2 text-xs font-semibold text-sky-300 transition-colors hover:bg-stone-700/85 cursor-pointer"
          >
            Live
          </button>
        )}
      </div>

      <div style={{ width: Math.max(sqPx, 104) }} className="flex flex-shrink-0 justify-end">
        {!hideHint && showHintBtn && (
          <button
            onClick={showHint}
            title="Hint"
            style={{ minWidth: Math.max(sqPx, 84), height: 38 }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300/20 bg-gradient-to-r from-emerald-400 to-emerald-300 px-3 text-xs font-semibold text-slate-950 shadow-[0_10px_24px_rgba(16,185,129,0.25)] transition-all hover:-translate-y-0.5 hover:from-emerald-300 hover:to-emerald-200 cursor-pointer"
          >
            <Lightbulb size={14} />
            Hint
          </button>
        )}
        {!hideHint && showAnswerBtn && (
          <button
            onClick={showAnswer}
            title="Show answer"
            style={{ minWidth: Math.max(sqPx, 92), height: 38 }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300/20 bg-gradient-to-r from-emerald-500 to-emerald-400 px-3 text-xs font-semibold text-slate-950 shadow-[0_10px_24px_rgba(16,185,129,0.25)] transition-all hover:-translate-y-0.5 hover:from-emerald-400 hover:to-emerald-300 cursor-pointer"
          >
            <Sparkles size={14} />
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
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-600/55 bg-stone-800/95 text-stone-100 shadow-[0_8px_18px_rgba(0,0,0,0.2)] transition-colors hover:bg-stone-700/95 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
    >
      {children}
    </button>
  );
}
