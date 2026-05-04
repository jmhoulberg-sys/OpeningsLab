// ─── Core Chess Types ──────────────────────────────────────────────

export type Color = 'white' | 'black';

export type TrainingMode = 'learn' | 'step-by-step' | 'full-line' | 'drill' | 'time-trial';

export type PostLineMode =
  | 'computer-beginner'
  | 'computer-advanced'
  | 'computer-pro'
  | 'top-moves'
  | 'top-moves-choice';
export type ExplorerOpponentMode = 'most_popular' | 'top3_weighted';

/** How the opponent selects its move during practice */
export type OpponentMode = 'forced' | 'random';

// ─── Opening Data Model ────────────────────────────────────────────

/**
 * A weighted move alternative for opponent positions.
 * Weights are relative (higher = more popular).
 */
export interface MoveWeight {
  san: string;
  weight: number; // 1–100
}

/**
 * A single move entry within a line.
 * `alternatives` are opponent move options used in random mode.
 */
export interface LineMove {
  san: string;
  /** Weighted alternatives for this move slot (opponent moves only). */
  alternatives?: MoveWeight[];
}

/**
 * A named variation / line. Moves are the FULL sequence from move 1.
 * The first N moves overlap with the opening's setupMoves.
 */
export interface OpeningLine {
  id: string;
  name: string;
  description?: string;
  /** Full SAN move sequence from the start of the game. */
  moves: LineMove[];
  /** Child lines that branch from this position. */
  children?: OpeningLine[];
}

export interface CoachingContext {
  openingId: string;
  lineId?: string;
  san: string;
  phase: 'setup' | 'training';
  moveIndex: number;
}

/**
 * An opening (e.g. Stafford Gambit).
 * setupMoves defines the sequence leading to the "opening position".
 * A user must play through setup before selecting a line.
 */
export interface Opening {
  id: string;
  name: string;
  description: string;
  /** The color the student plays. */
  playerColor: Color;
  /**
   * SAN moves that form the mandatory intro sequence
   * (e.g. 1.e4 e5 2.Nf3 Nf6 3.Nxe5 Nc6 4.Nxc6 dxc6).
   * These are shared across all lines.
   */
  setupMoves: string[];
  lines: OpeningLine[];
}

// ─── Training Session State ────────────────────────────────────────

export type TrainingPhase =
  | 'idle'        // No opening selected yet
  | 'setup'       // Playing through the intro sequence
  | 'line-select' // Setup done; user must pick a line
  | 'training'    // Actively training a chosen line
  | 'completed';  // Line finished (triggers completion screen)

export interface TrainingSession {
  opening: Opening;
  selectedLine: OpeningLine | null;
  phase: TrainingPhase;
  /** Index of the NEXT move to be played (into the full move sequence). */
  currentMoveIndex: number;
  /** FEN of the current board position. */
  currentFen: string;
  /** Moves played so far (SAN). */
  playedMoves: string[];
  mistakes: number;
  isAwaitingUserMove: boolean;
  /** Set when user plays a wrong move — shows the correct SAN on the board. */
  wrongMoveSan: string | null;
  mode: TrainingMode;
  opponentMode: OpponentMode;
  /** Top-X for random opponent selection (1–10). */
  randomTopX: number;
  /** Whether we're in "post-line" free play after the book ends. */
  postLine: boolean;
}

// ─── Progress / Persistence ────────────────────────────────────────

export interface LineProgress {
  /** Line id. */
  lineId: string;
  /** True once the user completes the line with zero mistakes. */
  unlocked: boolean;
  /** Best run mistake count. */
  bestMistakes: number;
  /** Total attempts. */
  attempts: number;
  /** Spaced repetition interval in days (0 = due immediately). */
  srInterval: number;
  /** ISO date string for next scheduled review, or null if never reviewed. */
  nextReviewDate: string | null;
}

export interface OpeningProgress {
  openingId: string;
  /** True once the setup sequence has been completed for the first time. */
  setupCompleted: boolean;
  lines: Record<string, LineProgress>;
}

export interface ProgressState {
  openings: Record<string, OpeningProgress>;
}
