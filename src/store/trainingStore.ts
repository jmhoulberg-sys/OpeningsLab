import { create } from 'zustand';
import { Chess } from 'chess.js';
import type {
  Opening,
  OpeningLine,
  TrainingPhase,
  TrainingMode,
  OpponentMode,
  PostLineMode,
} from '../types';
import {
  STARTING_FEN,
  isStudentMove,
  validateStudentMove,
  getOpponentMoveSan,
  applyMove,
  applyUciMove,
  dropToSan,
  isGameOver,
  getComputerMoveSan,
  repetitionTarget,
  getSetupFen,
} from '../engine/chessEngine';
import { useSettingsStore } from './settingsStore';
import { useProgressStore } from './progressStore';
import {
  logExplorerMoveAcceptance,
  pickLichessBookMove,
  type LichessBookMove,
} from '../services/lichessBookService';
import { useProgressionStore } from './progressionStore';

// ─── State shape ────────────────────────────────────────────────────

interface TrainingState {
  opening: Opening | null;
  selectedLine: OpeningLine | null;
  phase: TrainingPhase;
  /** Index of the NEXT move to be played (0-based half-move index). */
  currentMoveIndex: number;
  currentFen: string;
  playedMoves: string[];
  /**
   * FEN history for board navigation.
   * fenHistory[0] = initial FEN for this session (before any moves).
   * fenHistory[k] = FEN after the k-th move in playedMoves.
   * Length always equals playedMoves.length + 1.
   */
  fenHistory: string[];
  /**
   * When not null, the board shows fenHistory[viewMoveIndex] instead of currentFen.
   * null = live view.
   */
  viewMoveIndex: number | null;
  mistakes: number;
  isAwaitingUserMove: boolean;
  wrongMoveSan: string | null;
  showingCorrectMove: boolean;
  /** Square the student tried to move TO on a wrong move (for X badge). */
  wrongMoveSquare: string | null;
  /** FEN after the wrong move was played — used to show the piece on the wrong square. */
  wrongMoveFen: string | null;
  /** FROM square of the expected move, highlighted when hint is active. */
  hintSquare: string | null;
  mode: TrainingMode;
  opponentMode: OpponentMode;
  randomTopX: number;
  lineSelectModalNonce: number;
  drillQueue: string[];
  postLine: boolean;
  postLineMode: PostLineMode | null;
  postLineSource: 'lichess-db' | null;
  postLineOutOfBook: boolean;
  postLineError: string | null;
  postLineChoices: LichessBookMove[];
  previewUciMove: string | null;
  /** playedMoves.length at the moment postLine started — used for move list divider. */
  postLineStartMoveCount: number | null;
  /** Show position evaluation panel during free play. */
  showEval: boolean;
  /** Show top-3 Lichess moves panel during free play. */
  showTopMoves: boolean;
  autoplayLichessMoves: boolean;
  repetitionBlock: number;
  streak: number;
  timeLeft: number;
  timerRunning: boolean;
  freePlayResult: 'win' | 'loss' | 'draw' | null;
  showFreePlayResult: boolean;
}

// ─── Action shape ───────────────────────────────────────────────────

interface TrainingActions {
  startOpening(opening: Opening): void;
  selectLine(line: OpeningLine): void;
  handleBoardMove(from: string, to: string, promotion?: string): 'correct' | 'wrong' | 'ignored';
  advanceOpponent(): Promise<void>;
  showAnswer(): void;
  showHint(): void;
  restart(): void;
  backToLineSelect(): void;
  openLineSelectModal(mode?: TrainingMode): void;
  startDrill(): void;
  advanceDrillLine(): void;
  /** Clear the wrong-move overlay and return to the correct position. */
  clearWrongMove(): void;
  startPostLine(mode?: PostLineMode, showEval?: boolean, showTopMoves?: boolean): void;
  choosePostLineMove(uci: string): void;
  continuePostLineAgainstComputer(mode: Extract<PostLineMode, 'computer-beginner' | 'computer-advanced' | 'computer-pro'>): void;
  setPreviewUciMove(uci: string | null): void;
  setMode(mode: TrainingMode): void;
  setOpponentMode(mode: OpponentMode): void;
  setRandomTopX(x: number): void;
  toggleShowEval(): void;
  toggleShowTopMoves(): void;
  toggleAutoplayLichessMoves(): void;
  /** Navigate to a historical position. Pass null to return to live. */
  navigateToMove(idx: number | null): void;
  tickTimer(): void;
  addTimerBonus(): void;
  stopTimer(): void;
  clearFreePlayResult(): void;
}

// ─── Helpers ────────────────────────────────────────────────────────

function buildInitialState(): TrainingState {
  return {
    opening: null,
    selectedLine: null,
    phase: 'idle',
    currentMoveIndex: 0,
    currentFen: STARTING_FEN,
    playedMoves: [],
    fenHistory: [STARTING_FEN],
    viewMoveIndex: null,
    mistakes: 0,
    isAwaitingUserMove: false,
    wrongMoveSan: null,
    showingCorrectMove: false,
    wrongMoveSquare: null,
    wrongMoveFen: null,
    hintSquare: null,
    mode: 'learn',
    opponentMode: 'forced',
    randomTopX: 3,
    lineSelectModalNonce: 0,
    drillQueue: [],
    postLine: false,
    postLineMode: null,
    postLineSource: null,
    postLineOutOfBook: false,
    postLineError: null,
    postLineChoices: [],
    previewUciMove: null,
    postLineStartMoveCount: null,
    showEval: false,
    showTopMoves: true,
    autoplayLichessMoves: true,
    repetitionBlock: 1,
    streak: 0,
    timeLeft: -1,
    timerRunning: false,
    freePlayResult: null,
    showFreePlayResult: false,
  };
}

function normalise(san: string): string {
  return san.replace(/[+#!?]/g, '').trim();
}

/** Build a FEN history array starting from initialFen and replaying sans. */
function buildFenHistory(initialFen: string, sans: string[]): string[] {
  const history: string[] = [initialFen];
  let chess: Chess;
  try { chess = new Chess(initialFen); } catch { return [initialFen]; }
  for (const san of sans) {
    try {
      chess.move(san);
      history.push(chess.fen());
    } catch {
      break;
    }
  }
  return history;
}

function getExpectedUserSan(state: {
  phase: TrainingPhase;
  opening: Opening | null;
  selectedLine: OpeningLine | null;
  currentMoveIndex: number;
}) {
  if (state.phase === 'setup' && state.opening) {
    return state.opening.setupMoves[state.currentMoveIndex] ?? null;
  }

  if (state.phase === 'training' && state.selectedLine) {
    return state.selectedLine.moves[state.currentMoveIndex]?.san ?? null;
  }

  return null;
}

function dispatchChessEvent<T>(name: string, detail: T) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function countStudentMovesInLine(opening: Opening, line: OpeningLine) {
  return line.moves.filter((_, index) => isStudentMove(opening, index)).length;
}

function shuffleLines(lines: OpeningLine[]) {
  const next = [...lines];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function getUnlockedLines(opening: Opening) {
  const progress = useProgressStore.getState();
  return opening.lines.filter((line) => progress.isLineUnlocked(opening.id, line.id));
}

// ─── Store ──────────────────────────────────────────────────────────

export const useTrainingStore = create<TrainingState & TrainingActions>()(
  (set, get) => ({
    ...buildInitialState(),

    // ── startOpening ──────────────────────────────────────────────
    startOpening(opening) {
      if (opening.setupMoves.length === 0) {
        set({
          ...buildInitialState(),
          opening,
          phase: 'line-select',
          isAwaitingUserMove: false,
        });
        return;
      }

      set({
        ...buildInitialState(),
        opening,
        phase: 'setup',
        isAwaitingUserMove: false,
      });

      if (isStudentMove(opening, 0)) {
        set({ isAwaitingUserMove: true });
      } else {
        setTimeout(() => get().advanceOpponent(), 500);
      }
    },

    // ── selectLine ────────────────────────────────────────────────
    selectLine(line) {
      const { opening, mode } = get();
      if (!opening) return;

      const { restartFrom } = useSettingsStore.getState();
      const isTimeTrial = mode === 'time-trial';

      if (restartFrom === 'setup') {
        // Start from the setup position
        const setupFen = getSetupFen(opening);
        const setupLen = opening.setupMoves.length;

        // Build full fen history including setup move history so user can navigate back
        const setupFenHistory = buildFenHistory(STARTING_FEN, opening.setupMoves);

        set({
          selectedLine: line,
          phase: 'training',
          currentMoveIndex: setupLen,
          currentFen: setupFen,
          playedMoves: [...opening.setupMoves],
          fenHistory: setupFenHistory,
          viewMoveIndex: null,
          mistakes: 0,
          wrongMoveSan: null,
          wrongMoveSquare: null,
          wrongMoveFen: null,
          hintSquare: null,
          showingCorrectMove: false,
          postLine: false,
          postLineSource: null,
          postLineOutOfBook: false,
          postLineError: null,
          postLineStartMoveCount: null,
          isAwaitingUserMove: false,
          repetitionBlock: 1,
          streak: 0,
          ...(isTimeTrial ? { timeLeft: 60, timerRunning: true } : {}),
        });

        if (isStudentMove(opening, setupLen)) {
          set({ isAwaitingUserMove: true });
        } else {
          setTimeout(() => get().advanceOpponent(), 400);
        }
      } else {
        // Start from the very beginning
        set({
          selectedLine: line,
          phase: 'training',
          currentMoveIndex: 0,
          currentFen: STARTING_FEN,
          playedMoves: [],
          fenHistory: [STARTING_FEN],
          viewMoveIndex: null,
          mistakes: 0,
          wrongMoveSan: null,
          wrongMoveSquare: null,
          wrongMoveFen: null,
          hintSquare: null,
          showingCorrectMove: false,
          postLine: false,
          postLineSource: null,
          postLineOutOfBook: false,
          postLineError: null,
          postLineStartMoveCount: null,
          isAwaitingUserMove: false,
          repetitionBlock: 1,
          streak: 0,
          ...(isTimeTrial ? { timeLeft: 60, timerRunning: true } : {}),
        });

        if (isStudentMove(opening, 0)) {
          set({ isAwaitingUserMove: true });
        } else {
          setTimeout(() => get().advanceOpponent(), 400);
        }
      }
    },

    startDrill() {
      const state = get();
      if (!state.opening) return;
      const unlocked = shuffleLines(getUnlockedLines(state.opening));
      const first = unlocked[0];
      if (!first) return;

      const setupFen = getSetupFen(state.opening);
      const setupFenHistory = buildFenHistory(STARTING_FEN, state.opening.setupMoves);
      const setupLen = state.opening.setupMoves.length;
      set({
        mode: 'drill',
        selectedLine: first,
        phase: 'training',
        currentMoveIndex: setupLen,
        currentFen: setupFen,
        playedMoves: [...state.opening.setupMoves],
        fenHistory: setupFenHistory,
        viewMoveIndex: null,
        mistakes: 0,
        wrongMoveSan: null,
        wrongMoveSquare: null,
        wrongMoveFen: null,
        hintSquare: null,
        showingCorrectMove: false,
        postLine: false,
        postLineSource: null,
        postLineOutOfBook: false,
        postLineError: null,
        postLineChoices: [],
        postLineStartMoveCount: null,
        previewUciMove: null,
        isAwaitingUserMove: false,
        repetitionBlock: 1,
        streak: 0,
        drillQueue: unlocked.slice(1).map((line) => line.id),
      });

      if (isStudentMove(state.opening, setupLen)) {
        set({ isAwaitingUserMove: true });
      } else {
        setTimeout(() => get().advanceOpponent(), 400);
      }
    },

    advanceDrillLine() {
      const state = get();
      if (!state.opening) return;
      const [nextLineId, ...remaining] = state.drillQueue;
      const nextLine = state.opening.lines.find((line) => line.id === nextLineId);
      if (!nextLine) {
        set({
          phase: 'completed',
          isAwaitingUserMove: false,
          drillQueue: [],
          wrongMoveSan: null,
          wrongMoveSquare: null,
          wrongMoveFen: null,
          showingCorrectMove: false,
        });
        return;
      }

      const setupFen = getSetupFen(state.opening);
      const setupFenHistory = buildFenHistory(STARTING_FEN, state.opening.setupMoves);
      const setupLen = state.opening.setupMoves.length;
      set({
        selectedLine: nextLine,
        phase: 'training',
        currentMoveIndex: setupLen,
        currentFen: setupFen,
        playedMoves: [...state.opening.setupMoves],
        fenHistory: setupFenHistory,
        viewMoveIndex: null,
        wrongMoveSan: null,
        wrongMoveSquare: null,
        wrongMoveFen: null,
        hintSquare: null,
        showingCorrectMove: false,
        isAwaitingUserMove: false,
        drillQueue: remaining,
      });

      if (isStudentMove(state.opening, setupLen)) {
        set({ isAwaitingUserMove: true });
      } else {
        setTimeout(() => get().advanceOpponent(), 400);
      }
    },

    // ── handleBoardMove ───────────────────────────────────────────
    handleBoardMove(from, to, promotion) {
      const state = get();
      if (!state.opening) return 'ignored';
      if (!state.isAwaitingUserMove) return 'ignored';
      if (state.phase !== 'setup' && state.phase !== 'training') return 'ignored';
      // If in review mode, snap back to live first but don't process the move
      if (state.viewMoveIndex !== null) {
        set({ viewMoveIndex: null });
        return 'ignored';
      }

      const san = dropToSan(state.currentFen, from, to, promotion);
      if (!san) return 'ignored';

      // ── SETUP phase ─────────────────────────────────────────────
      if (state.phase === 'setup') {
        const setupMoves = state.opening.setupMoves;
        const expectedSan = setupMoves[state.currentMoveIndex] ?? null;

        if (!expectedSan || normalise(san) !== normalise(expectedSan)) {
          const wrongMoveFen = applyMove(state.currentFen, san) ?? null;
          set({ wrongMoveSan: expectedSan, wrongMoveSquare: to, wrongMoveFen, showingCorrectMove: false });
          dispatchChessEvent('chess:move_wrong', {
            lineId: 'setup',
            openingId: state.opening.id,
          });
          return 'wrong';
        }

        const newFen = applyMove(state.currentFen, san);
        if (!newFen) return 'ignored';

        const newIdx = state.currentMoveIndex + 1;
        const done = newIdx >= setupMoves.length;

        set({
          currentFen: newFen,
          playedMoves: [...state.playedMoves, san],
          fenHistory: [...state.fenHistory, newFen],
          currentMoveIndex: newIdx,
          wrongMoveSan: null,
          wrongMoveSquare: null,
          wrongMoveFen: null,
          showingCorrectMove: false,
          isAwaitingUserMove: false,
          ...(done ? { phase: 'line-select' as TrainingPhase } : {}),
        });
        dispatchChessEvent('chess:move_correct', {
          san,
          lineId: 'setup',
          openingId: state.opening.id,
        });

        if (!done) {
          if (isStudentMove(state.opening, newIdx)) {
            set({ isAwaitingUserMove: true });
          } else {
            setTimeout(() => get().advanceOpponent(), 350);
          }
        }
        return 'correct';
      }

      // ── TRAINING phase ──────────────────────────────────────────
      const line = state.selectedLine;
      if (!line) return 'ignored';

      // ── Post-line free play ─────────────────────────────────────
      if (state.postLine) {
        const newFen = applyMove(state.currentFen, san);
        if (!newFen) return 'ignored';

        const newIdx = state.currentMoveIndex + 1;
        set({
          currentFen: newFen,
          playedMoves: [...state.playedMoves, san],
          fenHistory: [...state.fenHistory, newFen],
          currentMoveIndex: newIdx,
          isAwaitingUserMove: false,
          wrongMoveSan: null,
          showingCorrectMove: false,
          postLineError: null,
          postLineOutOfBook: false,
          postLineChoices: [],
          previewUciMove: null,
        });

        if (isGameOver(newFen)) {
          const chess = new Chess(newFen);
          let result: 'win' | 'loss' | 'draw' = 'draw';
          if (chess.isCheckmate()) {
            // state.isAwaitingUserMove was true = user just moved = user won
            result = 'win';
          } else if (chess.isDraw() || chess.isStalemate()) {
            result = 'draw';
          }
          useProgressionStore.getState().awardTopResponseResult(result);
          set({
            phase: 'line-select' as TrainingPhase,
            postLine: false,
            postLineSource: null,
            postLineOutOfBook: false,
            freePlayResult: result,
            showFreePlayResult: true,
          });
          return 'correct';
        }

        setTimeout(() => get().advanceOpponent(), 350);
        return 'correct';
      }

      // ── Scripted training ───────────────────────────────────────
      const correct = validateStudentMove(state.playedMoves, line, san);

      if (!correct) {
        const expected = line.moves[state.playedMoves.length]?.san ?? null;
        const wrongMoveFen = applyMove(state.currentFen, san) ?? null;
        set((s) => ({
          mistakes: s.mistakes + 1,
          wrongMoveSan: expected,
          wrongMoveSquare: to,
          wrongMoveFen,
          showingCorrectMove: false,
          streak: 0,
          hintSquare: null,
        }));
        dispatchChessEvent('chess:move_wrong', {
          lineId: line.id,
          openingId: state.opening.id,
        });
        if (state.mode === 'drill') {
          setTimeout(() => get().advanceDrillLine(), 1300);
        }
        return 'wrong';
      }

      const newFen = applyMove(state.currentFen, san);
      if (!newFen) return 'ignored';

      const justPlayedIndex = state.currentMoveIndex;
      const newPlayed = [...state.playedMoves, san];
      const newIdx = state.currentMoveIndex + 1;
      const lineComplete = newIdx >= line.moves.length;

      set((s) => ({
        currentFen: newFen,
        playedMoves: newPlayed,
        fenHistory: [...s.fenHistory, newFen],
        currentMoveIndex: newIdx,
        wrongMoveSan: null,
        wrongMoveSquare: null,
        wrongMoveFen: null,
        hintSquare: null,
        showingCorrectMove: false,
        isAwaitingUserMove: false,
        streak: s.streak + 1,
        ...(lineComplete && state.mode !== 'drill' ? { phase: 'completed' as TrainingPhase } : {}),
      }));
      dispatchChessEvent('chess:move_correct', {
        san,
        lineId: line.id,
        openingId: state.opening.id,
      });

      if (lineComplete) {
        dispatchChessEvent('chess:session_complete', {
          errors: state.mistakes,
          moves: countStudentMovesInLine(state.opening, line),
          lineId: line.id,
          openingId: state.opening.id,
        });
        if (state.mode === 'drill') {
          setTimeout(() => get().advanceDrillLine(), 700);
          return 'correct';
        }
      }

      if (state.mode === 'time-trial') {
        get().addTimerBonus();
      }

      if (!lineComplete) {
        if (state.mode === 'step-by-step') {
          const target = repetitionTarget(state.opening, line, state.repetitionBlock);
          if (target < line.moves.length && justPlayedIndex >= target) {
            const opening = state.opening;
            const nextBlock = state.repetitionBlock + 1;
            const { restartFrom } = useSettingsStore.getState();
            setTimeout(() => {
              if (restartFrom === 'setup') {
                // Restart from setup position (skip replaying the shared opening moves)
                const setupFen = getSetupFen(opening);
                const setupLen = opening.setupMoves.length;
                const setupFenHistory = buildFenHistory(STARTING_FEN, opening.setupMoves);
                set({
                  phase: 'training',
                  currentMoveIndex: setupLen,
                  currentFen: setupFen,
                  playedMoves: [...opening.setupMoves],
                  fenHistory: setupFenHistory,
                  viewMoveIndex: null,
                  mistakes: 0,
                  wrongMoveSan: null,
                  wrongMoveSquare: null,
                  hintSquare: null,
                  showingCorrectMove: false,
                  postLine: false,
                  postLineSource: null,
                  postLineOutOfBook: false,
                  postLineError: null,
                  postLineStartMoveCount: null,
                  isAwaitingUserMove: false,
                  selectedLine: line,
                  repetitionBlock: nextBlock,
                });
                if (isStudentMove(opening, setupLen)) {
                  set({ isAwaitingUserMove: true });
                } else {
                  setTimeout(() => get().advanceOpponent(), 400);
                }
              } else {
                // Restart from the very beginning
                set({
                  phase: 'training',
                  currentMoveIndex: 0,
                  currentFen: STARTING_FEN,
                  playedMoves: [],
                  fenHistory: [STARTING_FEN],
                  viewMoveIndex: null,
                  mistakes: 0,
                  wrongMoveSan: null,
                  wrongMoveSquare: null,
                  hintSquare: null,
                  showingCorrectMove: false,
                  postLine: false,
                  postLineSource: null,
                  postLineOutOfBook: false,
                  postLineError: null,
                  postLineStartMoveCount: null,
                  isAwaitingUserMove: false,
                  selectedLine: line,
                  repetitionBlock: nextBlock,
                });
                if (isStudentMove(opening, 0)) {
                  set({ isAwaitingUserMove: true });
                } else {
                  setTimeout(() => get().advanceOpponent(), 400);
                }
              }
            }, 1200);
            return 'correct';
          }
        }
        setTimeout(() => get().advanceOpponent(), 350);
      }
      return 'correct';
    },

    // ── advanceOpponent ───────────────────────────────────────────
    async advanceOpponent() {
      const state = get();
      if (!state.opening) return;
      if (state.isAwaitingUserMove) return;
      if (state.phase !== 'setup' && state.phase !== 'training') return;

      const opening = state.opening;

      // ── SETUP phase ─────────────────────────────────────────────
      if (state.phase === 'setup') {
        const setupMoves = opening.setupMoves;
        const idx = state.currentMoveIndex;

        if (idx >= setupMoves.length) {
          set({ phase: 'line-select' });
          return;
        }

        if (isStudentMove(opening, idx)) {
          set({ isAwaitingUserMove: true });
          return;
        }

        const san = setupMoves[idx];
        const newFen = applyMove(state.currentFen, san);
        if (!newFen) return;

        const newIdx = idx + 1;
        const done = newIdx >= setupMoves.length;

        set({
          currentFen: newFen,
          playedMoves: [...state.playedMoves, san],
          fenHistory: [...state.fenHistory, newFen],
          currentMoveIndex: newIdx,
          ...(done ? { phase: 'line-select' as TrainingPhase } : {}),
        });

        if (!done) {
          if (isStudentMove(opening, newIdx)) {
            set({ isAwaitingUserMove: true });
          } else {
            setTimeout(() => get().advanceOpponent(), 350);
          }
        }
        return;
      }

      // ── POST-LINE free play ─────────────────────────────────────
      if (state.postLine) {
        let opponentSan: string | null = null;

        if (state.postLineMode === 'top-moves' || state.postLineMode === 'top-moves-choice') {
          const { lichessTopMoves, lichessSpeeds, lichessRatings, lichessVariant } = useSettingsStore.getState();
          const decision = await pickLichessBookMove(state.currentFen, {
            topMoves: lichessTopMoves,
            speeds: lichessSpeeds,
            ratings: lichessRatings,
            variant: lichessVariant,
            playedSans: state.playedMoves,
          });

          if (
            (state.postLineMode === 'top-moves-choice' ||
              (state.postLineMode === 'top-moves' && !state.autoplayLichessMoves)) &&
            decision.position?.moves.length
          ) {
            set({
              isAwaitingUserMove: false,
              postLineOutOfBook: false,
              postLineError: null,
              postLineChoices: decision.position.moves.slice(0, lichessTopMoves),
            });
            return;
          }

          if (decision.move) {
            const legalMove = applyUciMove(state.currentFen, decision.move.uci);
            logExplorerMoveAcceptance(state.currentFen, decision.move, !!legalMove);

            if (!legalMove) {
              set({
                isAwaitingUserMove: false,
                postLineOutOfBook: false,
                postLineError: `Lichess returned illegal move ${decision.move.san} for the current board`,
              });
              return;
            }

            opponentSan = legalMove.san;
          } else if (decision.status === 'api_error' || decision.status === 'rate_limited') {
            set({
              isAwaitingUserMove: false,
              postLineOutOfBook: false,
              postLineError: decision.error ?? 'Could not reach Lichess explorer',
              postLineChoices: [],
            });
            return;
          }
        } else if (state.postLineMode?.startsWith('computer-')) {
          const level = state.postLineMode.replace('computer-', '') as 'beginner' | 'advanced' | 'pro';
          opponentSan = getComputerMoveSan(state.currentFen, level);
        }

        if (!opponentSan) {
          set({
            isAwaitingUserMove: false,
            postLineOutOfBook: true,
            postLineError: null,
            postLineChoices: [],
          });
          return;
        }

        const newFen = applyMove(state.currentFen, opponentSan);
        if (!newFen) return;

        const newIdx = state.currentMoveIndex + 1;
        const gameEnded = isGameOver(newFen);

        if (gameEnded) {
          const chess = new Chess(newFen);
          let result: 'win' | 'loss' | 'draw' = 'draw';
          if (chess.isCheckmate()) {
            // opponent just moved and delivered checkmate = user lost
            result = 'loss';
          } else if (chess.isDraw() || chess.isStalemate()) {
            result = 'draw';
          }
          useProgressionStore.getState().awardTopResponseResult(result);
          set({
            currentFen: newFen,
            playedMoves: [...state.playedMoves, opponentSan],
            fenHistory: [...state.fenHistory, newFen],
            currentMoveIndex: newIdx,
            phase: 'line-select' as TrainingPhase,
            postLine: false,
            postLineSource: null,
            postLineOutOfBook: false,
            postLineError: null,
            freePlayResult: result,
            showFreePlayResult: true,
          });
        } else {
          set({
            currentFen: newFen,
            playedMoves: [...state.playedMoves, opponentSan],
            fenHistory: [...state.fenHistory, newFen],
            currentMoveIndex: newIdx,
            postLineOutOfBook: false,
            postLineError: null,
            postLineChoices: [],
            previewUciMove: null,
            isAwaitingUserMove: true,
          });
        }
        return;
      }

      // ── TRAINING phase (scripted) ───────────────────────────────
      const line = state.selectedLine;
      if (!line) return;

      if (isStudentMove(opening, state.currentMoveIndex)) {
        set({ isAwaitingUserMove: true });
        return;
      }

      let opponentSan = getOpponentMoveSan(
        line,
        state.currentMoveIndex,
        state.opponentMode,
        state.randomTopX,
      );
      if (!opponentSan) return;

      let newFen = applyMove(state.currentFen, opponentSan);
      if (!newFen && state.opponentMode === 'random') {
        opponentSan = line.moves[state.currentMoveIndex].san;
        newFen = applyMove(state.currentFen, opponentSan);
      }
      if (!newFen) {
        set({ isAwaitingUserMove: true });
        return;
      }

      const newIdx = state.currentMoveIndex + 1;
      const lineComplete = newIdx >= line.moves.length;

      set({
        currentFen: newFen,
        playedMoves: [...state.playedMoves, opponentSan],
        fenHistory: [...state.fenHistory, newFen],
        currentMoveIndex: newIdx,
        ...(lineComplete && state.mode !== 'drill' ? { phase: 'completed' as TrainingPhase } : {}),
      });

      if (lineComplete) {
        dispatchChessEvent('chess:session_complete', {
          errors: state.mistakes,
          moves: countStudentMovesInLine(opening, line),
          lineId: line.id,
          openingId: opening.id,
        });
        if (state.mode === 'drill') {
          setTimeout(() => get().advanceDrillLine(), 700);
        }
      }

      if (!lineComplete) {
        if (isStudentMove(opening, newIdx)) {
          set({ isAwaitingUserMove: true });
        } else {
          setTimeout(() => get().advanceOpponent(), 350);
        }
      }
    },

    // ── showAnswer ────────────────────────────────────────────────
    showAnswer() {
      const state = get();
      if (!state.isAwaitingUserMove) return;
      if (state.mode === 'time-trial') return;
      // Exit review mode first
      if (state.viewMoveIndex !== null) set({ viewMoveIndex: null });

      const expected = getExpectedUserSan(state);

      set({ wrongMoveSan: expected, showingCorrectMove: true, hintSquare: null });
      dispatchChessEvent('chess:hint_used', {
        type: 'answer',
        lineId: state.selectedLine?.id,
        openingId: state.opening?.id,
      });
    },

    // ── showHint ──────────────────────────────────────────────────
    showHint() {
      const state = get();
      if (!state.isAwaitingUserMove) return;
      if (state.mode === 'time-trial') return;
      if (state.viewMoveIndex !== null) set({ viewMoveIndex: null });

      const expectedSan = getExpectedUserSan(state);
      if (!expectedSan) return;

      try {
        const chess = new Chess(state.currentFen);
        const norm = (s: string) => s.replace(/[+#!?]/g, '').trim();
        const found = chess.moves({ verbose: true }).find(
          (m) => norm(m.san) === norm(expectedSan!),
        );
        if (found) {
          set({ hintSquare: found.from });
          dispatchChessEvent('chess:hint_used', {
            type: 'hint',
            lineId: state.selectedLine?.id,
            openingId: state.opening?.id,
          });
        }
      } catch { /* ignore */ }
    },

    // ── restart ───────────────────────────────────────────────────
    restart() {
      const state = get();
      if (!state.opening) return;

      const { restartFrom } = useSettingsStore.getState();
      const isTimeTrial = state.mode === 'time-trial';

      if (state.selectedLine) {
        const line = state.selectedLine;
        const opening = state.opening;

        if (restartFrom === 'setup') {
          const setupFen = getSetupFen(opening);
          const setupLen = opening.setupMoves.length;
          const setupFenHistory = buildFenHistory(STARTING_FEN, opening.setupMoves);

          set({
            phase: 'training',
            currentMoveIndex: setupLen,
            currentFen: setupFen,
            playedMoves: [...opening.setupMoves],
            fenHistory: setupFenHistory,
            viewMoveIndex: null,
            mistakes: 0,
            wrongMoveSan: null,
            wrongMoveSquare: null,
            hintSquare: null,
            showingCorrectMove: false,
            postLine: false,
            postLineSource: null,
            postLineOutOfBook: false,
            postLineError: null,
            postLineStartMoveCount: null,
            isAwaitingUserMove: false,
            selectedLine: line,
            repetitionBlock: 1,
            streak: 0,
            freePlayResult: null,
            showFreePlayResult: false,
            ...(isTimeTrial ? { timeLeft: 60, timerRunning: true } : {}),
          });

          if (isStudentMove(opening, setupLen)) {
            set({ isAwaitingUserMove: true });
          } else {
            setTimeout(() => get().advanceOpponent(), 400);
          }
        } else {
          set({
            phase: 'training',
            currentMoveIndex: 0,
            currentFen: STARTING_FEN,
            playedMoves: [],
            fenHistory: [STARTING_FEN],
            viewMoveIndex: null,
            mistakes: 0,
            wrongMoveSan: null,
            wrongMoveSquare: null,
            hintSquare: null,
            showingCorrectMove: false,
            postLine: false,
            postLineSource: null,
            postLineOutOfBook: false,
            postLineError: null,
            postLineStartMoveCount: null,
            isAwaitingUserMove: false,
            selectedLine: line,
            repetitionBlock: 1,
            streak: 0,
            freePlayResult: null,
            showFreePlayResult: false,
            ...(isTimeTrial ? { timeLeft: 60, timerRunning: true } : {}),
          });

          if (isStudentMove(opening, 0)) {
            set({ isAwaitingUserMove: true });
          } else {
            setTimeout(() => get().advanceOpponent(), 400);
          }
        }
      } else {
        get().startOpening(state.opening);
      }
    },

    // ── startPostLine ─────────────────────────────────────────────
    startPostLine(mode?: PostLineMode, showEval = false, showTopMoves = true) {
      set({
        phase: 'training',
        postLine: true,
        postLineStartMoveCount: get().playedMoves.length,
        isAwaitingUserMove: false,
        postLineMode: mode ?? null,
        postLineSource: mode === 'top-moves' || mode === 'top-moves-choice' ? 'lichess-db' : null,
        postLineOutOfBook: false,
        postLineError: null,
        postLineChoices: [],
        previewUciMove: null,
        showEval,
        showTopMoves,
        viewMoveIndex: null,
      });
      setTimeout(() => get().advanceOpponent(), 500);
    },

    choosePostLineMove(uci) {
      const state = get();
      if (
        !state.postLine ||
        (state.postLineMode !== 'top-moves-choice' &&
          !(state.postLineMode === 'top-moves' && !state.autoplayLichessMoves))
      ) return;

      const legalMove = applyUciMove(state.currentFen, uci);
      if (!legalMove) {
        set({
          postLineError: 'That Lichess move is not legal on the current board.',
          postLineChoices: [],
          previewUciMove: null,
        });
        return;
      }

      const newIdx = state.currentMoveIndex + 1;
      const gameEnded = isGameOver(legalMove.fen);
      if (gameEnded) {
        const chess = new Chess(legalMove.fen);
        let result: 'win' | 'loss' | 'draw' = 'draw';
        if (chess.isCheckmate()) result = 'loss';
        else if (chess.isDraw() || chess.isStalemate()) result = 'draw';
        useProgressionStore.getState().awardTopResponseResult(result);
        set({
          currentFen: legalMove.fen,
          playedMoves: [...state.playedMoves, legalMove.san],
          fenHistory: [...state.fenHistory, legalMove.fen],
          currentMoveIndex: newIdx,
          phase: 'line-select' as TrainingPhase,
          postLine: false,
          postLineSource: null,
          postLineOutOfBook: false,
          postLineError: null,
          postLineChoices: [],
          previewUciMove: null,
          freePlayResult: result,
          showFreePlayResult: true,
        });
        return;
      }

      set({
        currentFen: legalMove.fen,
        playedMoves: [...state.playedMoves, legalMove.san],
        fenHistory: [...state.fenHistory, legalMove.fen],
        currentMoveIndex: newIdx,
        postLineOutOfBook: false,
        postLineError: null,
        postLineChoices: [],
        previewUciMove: null,
        isAwaitingUserMove: true,
      });
    },

    continuePostLineAgainstComputer(mode) {
      set({
        postLine: true,
        postLineMode: mode,
        postLineSource: null,
        postLineOutOfBook: false,
        postLineError: null,
        postLineChoices: [],
        previewUciMove: null,
        isAwaitingUserMove: false,
      });
      setTimeout(() => get().advanceOpponent(), 250);
    },

    setPreviewUciMove(previewUciMove) {
      set({ previewUciMove });
    },

    // ── backToLineSelect ──────────────────────────────────────────
    backToLineSelect() {
      const state = get();
      if (!state.opening) return;

      const chess = new Chess();
      for (const san of state.opening.setupMoves) {
        chess.move(san);
      }

      set({
        selectedLine: null,
        phase: 'line-select',
        currentMoveIndex: state.opening.setupMoves.length,
        currentFen: chess.fen(),
        playedMoves: [...state.opening.setupMoves],
        fenHistory: buildFenHistory(STARTING_FEN, state.opening.setupMoves),
        viewMoveIndex: null,
        mistakes: 0,
        wrongMoveSan: null,
        wrongMoveSquare: null,
        wrongMoveFen: null,
        hintSquare: null,
        showingCorrectMove: false,
        isAwaitingUserMove: false,
        postLine: false,
        postLineSource: null,
        postLineOutOfBook: false,
        postLineError: null,
        postLineChoices: [],
        previewUciMove: null,
        postLineStartMoveCount: null,
        repetitionBlock: 1,
        streak: 0,
        drillQueue: [],
        timeLeft: -1,
        timerRunning: false,
        freePlayResult: null,
        showFreePlayResult: false,
      });
    },

    openLineSelectModal(mode) {
      set((state) => ({
        ...(mode ? { mode } : {}),
        lineSelectModalNonce: state.lineSelectModalNonce + 1,
      }));
    },

    // ── clearWrongMove ────────────────────────────────────────────
    clearWrongMove() {
      set({ wrongMoveFen: null, wrongMoveSquare: null, wrongMoveSan: null, showingCorrectMove: false });
    },

    // ── navigateToMove ────────────────────────────────────────────
    navigateToMove(idx) {
      const { fenHistory, playedMoves } = get();
      if (idx === null || idx >= playedMoves.length) {
        // Return to live
        set({ viewMoveIndex: null });
      } else {
        const clamped = Math.max(0, Math.min(idx, playedMoves.length - 1));
        // fenHistory[0] = initial, fenHistory[k] = after k-th move
        if (clamped + 1 < fenHistory.length) {
          set({ viewMoveIndex: clamped });
        }
      }
    },

    setMode(mode) { set({ mode }); },
    setOpponentMode(opponentMode) { set({ opponentMode }); },
    setRandomTopX(x) { set({ randomTopX: Math.min(10, Math.max(1, x)) }); },
    toggleShowEval() { set((s) => ({ showEval: !s.showEval })); },
    toggleShowTopMoves() { set((s) => ({ showTopMoves: !s.showTopMoves })); },
    toggleAutoplayLichessMoves() { set((s) => ({ autoplayLichessMoves: !s.autoplayLichessMoves })); },

    tickTimer() {
      set((s) => {
        if (s.timeLeft <= 1) {
          return { timeLeft: 0, timerRunning: false, phase: 'completed' as TrainingPhase };
        }
        return { timeLeft: s.timeLeft - 1 };
      });
    },

    addTimerBonus() {
      set((s) => ({ timeLeft: s.timeLeft + 5 }));
    },

    stopTimer() {
      set({ timerRunning: false });
    },

    clearFreePlayResult() {
      set({ freePlayResult: null, showFreePlayResult: false });
    },
  }),
);
