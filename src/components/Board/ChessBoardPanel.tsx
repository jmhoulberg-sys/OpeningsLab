import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { Square } from 'react-chessboard/dist/chessboard/types';
import { ChevronLeft, ChevronRight, ChevronsRight, Lightbulb, Sparkles } from 'lucide-react';
import { useTrainingStore } from '../../store/trainingStore';
import { useSettingsStore } from '../../store/settingsStore';
import { isStudentMove } from '../../engine/chessEngine';
import EvalBar from './EvalBar';

const ANSWER_ARROW_COLOR = 'rgba(0, 222, 136, 1)';
const SELECTED_HIGHLIGHT = '#a9c7e2';
const LAST_MOVE_FROM = 'rgba(255, 200, 0, 0.26)';
const LAST_MOVE_TO = 'rgba(255, 196, 0, 0.52)';
const HINT_HIGHLIGHT = 'rgba(56, 189, 248, 0.72)';
const WOOD_LIGHT = '#e6d0a9';
const WOOD_DARK = '#9b6a3c';
const MOVE_DOT = 'radial-gradient(circle, rgba(92,82,61,0.48) 0 18%, transparent 20%)';

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

function resolveUciArrow(uci: string): [Square, Square] | null {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return null;
  return [uci.slice(0, 2) as Square, uci.slice(2, 4) as Square];
}

function legalDestinations(fen: string, from: Square): Square[] {
  try {
    const chess = new Chess(fen);
    return chess.moves({ square: from, verbose: true }).map((move) => move.to as Square);
  } catch {
    return [];
  }
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
    previewUciMove,
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
      } else if (mode === 'full-line') {
        progressLabel = 'Full line';
        progressColor = 'bg-sky-500';
      } else {
        progressLabel = 'Time Trial';
        progressColor = 'bg-cyan-400';
      }
    }
  }

  const showProgressBar = progressTotal > 0;
  const expectedSan = !isReviewing && isAwaitingUserMove
    ? (phase === 'setup'
      ? opening?.setupMoves[currentMoveIndex] ?? null
      : selectedLine?.moves[currentMoveIndex]?.san ?? null)
    : null;
  const customSquareStyles: Record<string, CSSProperties> = {};
  const guidedAnswerArrow = mode === 'learn' &&
    !isReviewing &&
    !wrongMoveFen &&
    isAwaitingUserMove &&
    expectedSan
    ? resolveArrow(currentFen, expectedSan)
    : null;

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
    legalDestinations(displayFen, selectedSquare).forEach((square) => {
      customSquareStyles[square] = {
        ...(customSquareStyles[square] ?? {}),
        background: MOVE_DOT,
      };
    });
  }

  if (!isReviewing && hintSquare) {
    customSquareStyles[hintSquare] = {
      ...(customSquareStyles[hintSquare] ?? {}),
      backgroundColor: HINT_HIGHLIGHT,
      boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.12)',
    };
  }

  if (guidedAnswerArrow) {
    customSquareStyles[guidedAnswerArrow[0]] = {
      ...(customSquareStyles[guidedAnswerArrow[0]] ?? {}),
      backgroundColor: 'rgba(56, 189, 248, 0.22)',
    };
    customSquareStyles[guidedAnswerArrow[1]] = {
      ...(customSquareStyles[guidedAnswerArrow[1]] ?? {}),
      backgroundColor: 'rgba(14, 165, 233, 0.54)',
    };
  }

  if (!isReviewing && wrongMoveSquare) {
    customSquareStyles[wrongMoveSquare] = {
      ...(customSquareStyles[wrongMoveSquare] ?? {}),
      backgroundColor: 'rgba(244, 63, 94, 0.36)',
      boxShadow: 'inset 0 0 0 4px rgba(255,255,255,0.28)',
    };
  }

  const customArrows: [Square, Square, string][] = [];
  const previewArrow = previewUciMove ? resolveUciArrow(previewUciMove) : null;

  if (previewArrow && !isReviewing) {
    customSquareStyles[previewArrow[0]] = {
      ...(customSquareStyles[previewArrow[0]] ?? {}),
      backgroundColor: 'rgba(52, 211, 153, 0.26)',
    };
    customSquareStyles[previewArrow[1]] = {
      ...(customSquareStyles[previewArrow[1]] ?? {}),
      backgroundColor: 'rgba(16, 185, 129, 0.48)',
    };
    customArrows.push([previewArrow[0], previewArrow[1], 'rgba(52, 211, 153, 0.95)']);
  }

  if (guidedAnswerArrow) {
    customArrows.push([guidedAnswerArrow[0], guidedAnswerArrow[1], 'rgba(56, 189, 248, 0.95)']);
  }

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

      if (isPromotion) {
        // Store pending promotion — the modal dialog calls onPromotionPieceSelect
        setPromotionPending({ from, to });
        return false;
      }

      const result = handleBoardMove(from, to);
      return result === 'correct' || result === 'wrong';
    },
    [handleBoardMove, isAwaitingUserMove, isReviewing, navigateToMove, wrongMoveFen],
  );

  const onPromotionPieceSelect = useCallback(
    (piece?: string, promoteFromSquare?: Square, promoteToSquare?: Square): boolean => {
      if (!piece) {
        setPromotionPending(null);
        return false;
      }
      const promo = piece[1]?.toLowerCase() ?? 'q';

      // Use stored pending squares (from drag) or the squares passed by the dialog
      const from = promotionPending?.from ?? promoteFromSquare;
      const to = promotionPending?.to ?? promoteToSquare;
      setPromotionPending(null);

      if (!from || !to) return false;

      const result = handleBoardMove(from, to, promo);
      return result === 'correct' || result === 'wrong';
    },
    [handleBoardMove, promotionPending],
  );

  const isDraggable =
    !isReviewing &&
    !wrongMoveFen &&
    (phase === 'training' || phase === 'setup');
  const boardColumnWidth = `${boardSize}px`;

  return (
    <div className="flex w-full max-w-full flex-col items-center gap-2">
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

      <div className="flex h-4 items-center justify-center">
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
        ) : null}
      </div>

      <div className="flex w-full items-start justify-center gap-3 sm:gap-4">
        {showEvalBar && !postLine && (phase === 'training' || phase === 'setup' || phase === 'completed') && (
          <EvalBar fen={displayFen} height={boardSize} playerColor={opening?.playerColor ?? 'white'} />
        )}
        <div className="flex flex-col items-center gap-3" style={{ width: boardColumnWidth }}>
          <div
            key={boardFlashing ? `flash-${flashKeyRef.current}` : 'board'}
            className={[
              'board-frame relative isolate overflow-hidden rounded-[18px]',
              'bg-[#2f2116]',
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
          </div>

          {(phase === 'training' || phase === 'setup' || phase === 'completed') && (
            <BoardNavRow
              wrongMoveFen={wrongMoveFen}
              clearWrongMove={clearWrongMove}
              phase={phase}
              mode={mode}
              postLine={postLine}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function BoardNavRow({
  wrongMoveFen,
  clearWrongMove,
  phase,
  mode,
  postLine,
}: {
  wrongMoveFen: string | null;
  clearWrongMove: () => void;
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
  const hideHint = mode === 'time-trial';
  const canHint = inSession && isAwaitingUserMove && !postLine && !hideHint;
  const isGuidedLearn = canHint && mode === 'learn' && phase === 'training';

  const showHintBtn = canHint && !isGuidedLearn && !hintSquare && !showingCorrectMove;
  const showAnswerBtn = canHint && !isGuidedLearn && (!!hintSquare || showingCorrectMove);
  const answerDisabled = showingCorrectMove;

  return (
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-2.5">
        <div className="flex min-w-0 items-center justify-start">
          {isGuidedLearn && (
            <div className="inline-flex h-10 min-w-[128px] items-center justify-center gap-2 rounded-2xl border border-sky-300/25 bg-sky-500/14 px-4 text-sm font-bold text-sky-200">
              <Sparkles size={15} />
              Answer shown
            </div>
          )}
          {!hideHint && showHintBtn && (
            <button
              onClick={showHint}
              title="Hint"
              className="inline-flex h-10 min-w-[102px] items-center justify-center gap-2 rounded-2xl border border-emerald-200/25 bg-emerald-400 px-4 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-300 cursor-pointer"
          >
            <Lightbulb size={15} />
            Hint
          </button>
        )}
        {!hideHint && showAnswerBtn && (
          <button
            onClick={showAnswer}
            disabled={answerDisabled}
            title="Show answer"
            className={`inline-flex h-10 min-w-[102px] items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold transition-colors ${
              answerDisabled
                ? 'cursor-not-allowed border-stone-700/45 bg-stone-800/90 text-stone-400'
                : 'cursor-pointer border-sky-200/20 bg-sky-500 text-slate-950 hover:bg-sky-400'
            }`}
          >
            <Sparkles size={15} />
            Answer
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-3">
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
            title="Return to live position"
            aria-label="Return to live position"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-500/14 text-sky-200 transition-colors hover:bg-sky-500/22 hover:text-white cursor-pointer"
          >
            <ChevronsRight size={18} />
          </button>
        )}
      </div>

        <div className="flex min-w-0 items-center justify-end">
        <div className={`inline-flex h-10 min-w-[100px] items-center justify-center rounded-2xl px-4 text-sm font-semibold ${
          mistakes > 0
            ? 'bg-rose-500/12 text-rose-300'
            : 'bg-stone-900/75 text-stone-400'
        }`}>
          Mistakes {mistakes}
        </div>
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
      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-500/80 bg-stone-700 text-white transition-colors hover:border-sky-300/45 hover:bg-stone-600 hover:text-sky-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
    >
      {children}
    </button>
  );
}
