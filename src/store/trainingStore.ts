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
  dropToSan,
  getRandomLegalMove,
  isGameOver,
  repetitionTarget,
  getSetupFen,
} from '../engine/chessEngine';
import { useSettingsStore, buildRatingsParam } from './settingsStore';

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
  postLine: boolean;
  postLineMode: PostLineMode | null;
  /** playedMoves.length at the moment postLine started — used for move list divider. */
  postLineStartMoveCount: number | null;
  /** Show position evaluation panel during free play. */
  showEval: boolean;
  /** Show top-3 Lichess moves panel during free play. */
  showTopMoves: boolean;
  repetitionBlock: number;
  streak: number;
  timeLeft: number;
  timerRunning: boolean;
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
  /** Clear the wrong-move overlay and return to the correct position. */
  clearWrongMove(): void;
  startPostLine(mode?: PostLineMode, showEval?: boolean, showTopMoves?: boolean): void;
  setMode(mode: TrainingMode): void;
  setOpponentMode(mode: OpponentMode): void;
  setRandomTopX(x: number): void;
  toggleShowEval(): void;
  toggleShowTopMoves(): void;
  /** Navigate to a historical position. Pass null to return to live. */
  navigateToMove(idx: number | null): void;
  tickTimer(): void;
  addTimerBonus(): void;
  stopTimer(): void;
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
    postLine: false,
    postLineMode: null,
    postLineStartMoveCount: null,
    showEval: false,
    showTopMoves: true,
    repetitionBlock: 1,
    streak: 0,
    timeLeft: -1,
    timerRunning: false,
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

// ─── Store ──────────────────────────────────────────────────────────

export const useTrainingStore = create<TrainingState & TrainingActions>()(
  (set, get) => ({
    ...buildInitialState(),

    // ── startOpening ──────────────────────────────────────────────
    startOpening(opening) {
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
        });

        if (isGameOver(newFen)) {
          set({ phase: 'line-select' as TrainingPhase, postLine: false });
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
        ...(lineComplete ? { phase: 'completed' as TrainingPhase } : {}),
      }));

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

        if (state.postLineMode === 'top-moves') {
          // Try to get most popular Lichess move
          try {
            const enc = encodeURIComponent(state.currentFen);
            const { minRating } = useSettingsStore.getState();
            const ratingsParam = buildRatingsParam(minRating);
            const res = await fetch(
              `https://explorer.lichess.ovh/lichess?variant=standard${ratingsParam}&topGames=0&recentGames=0&moves=5&fen=${enc}`
            );
            if (res.ok) {
              const data = await res.json() as { moves?: Array<{ san: string; white: number; draws: number; black: number }> };
              const topMove = data.moves?.[0];
              if (topMove) opponentSan = topMove.san;
            }
          } catch { /* fall through to random */ }
        }

        // Fallback to random legal move
        if (!opponentSan) opponentSan = getRandomLegalMove(state.currentFen);

        if (!opponentSan) {
          set({ phase: 'line-select' as TrainingPhase, postLine: false });
          return;
        }

        const newFen = applyMove(state.currentFen, opponentSan);
        if (!newFen) return;

        const newIdx = state.currentMoveIndex + 1;
        const gameEnded = isGameOver(newFen);

        set({
          currentFen: newFen,
          playedMoves: [...state.playedMoves, opponentSan],
          fenHistory: [...state.fenHistory, newFen],
          currentMoveIndex: newIdx,
          ...(gameEnded
            ? { phase: 'line-select' as TrainingPhase, postLine: false }
            : { isAwaitingUserMove: true }),
        });
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
        ...(lineComplete ? { phase: 'completed' as TrainingPhase } : {}),
      });

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
      if (state.mode === 'drill' || state.mode === 'time-trial') return;
      // Exit review mode first
      if (state.viewMoveIndex !== null) set({ viewMoveIndex: null });

      let expected: string | null = null;

      if (state.phase === 'setup' && state.opening) {
        expected = state.opening.setupMoves[state.currentMoveIndex] ?? null;
      } else if (state.phase === 'training' && state.selectedLine) {
        expected = state.selectedLine.moves[state.currentMoveIndex]?.san ?? null;
      }

      set({ wrongMoveSan: expected, showingCorrectMove: true, hintSquare: null });
    },

    // ── showHint ──────────────────────────────────────────────────
    showHint() {
      const state = get();
      if (!state.isAwaitingUserMove) return;
      if (state.mode === 'drill' || state.mode === 'time-trial') return;
      if (state.viewMoveIndex !== null) set({ viewMoveIndex: null });

      let expectedSan: string | null = null;
      if (state.phase === 'setup' && state.opening) {
        expectedSan = state.opening.setupMoves[state.currentMoveIndex] ?? null;
      } else if (state.phase === 'training' && state.selectedLine) {
        expectedSan = state.selectedLine.moves[state.currentMoveIndex]?.san ?? null;
      }
      if (!expectedSan) return;

      try {
        const chess = new Chess(state.currentFen);
        const norm = (s: string) => s.replace(/[+#!?]/g, '').trim();
        const found = chess.moves({ verbose: true }).find(
          (m) => norm(m.san) === norm(expectedSan!),
        );
        if (found) {
          set({ hintSquare: found.from });
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
            postLineStartMoveCount: null,
            isAwaitingUserMove: false,
            selectedLine: line,
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
            postLineStartMoveCount: null,
            isAwaitingUserMove: false,
            selectedLine: line,
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
        showEval,
        showTopMoves,
        viewMoveIndex: null,
      });
      setTimeout(() => get().advanceOpponent(), 500);
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
        postLineStartMoveCount: null,
        repetitionBlock: 1,
        streak: 0,
        timeLeft: -1,
        timerRunning: false,
      });
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
  }),
);
