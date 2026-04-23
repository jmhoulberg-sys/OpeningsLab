import { Chess } from 'chess.js';
import type { Opening, OpeningLine, MoveWeight } from '../types';

export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * Replay a list of SAN moves from the starting position.
 * Returns the resulting Chess instance, or null if any move is illegal.
 */
export function replayMoves(sans: string[]): Chess | null {
  const chess = new Chess();
  for (const san of sans) {
    try {
      const result = chess.move(san);
      if (!result) return null;
    } catch {
      return null;
    }
  }
  return chess;
}

/**
 * Get FEN after replaying all supplied SAN moves.
 */
export function fenAfterMoves(sans: string[]): string {
  const chess = replayMoves(sans);
  return chess ? chess.fen() : STARTING_FEN;
}

export function sansToUciMoves(
  sans: string[],
  initialFen = STARTING_FEN,
): string[] | null {
  try {
    const chess = new Chess(initialFen);
    const uciMoves: string[] = [];

    for (const san of sans) {
      const result = chess.move(san);
      if (!result) return null;
      uciMoves.push(`${result.from}${result.to}${result.promotion ?? ''}`);
    }

    return uciMoves;
  } catch {
    return null;
  }
}

/**
 * Return the FEN reached after completing the setup sequence.
 */
export function getSetupFen(opening: Opening): string {
  return fenAfterMoves(opening.setupMoves);
}

/**
 * Determine whose turn it is at a given move index (0-based half-move index).
 * Even indices = White to move, odd = Black to move.
 */
export function colorToMoveAtIndex(index: number): 'white' | 'black' {
  return index % 2 === 0 ? 'white' : 'black';
}

/**
 * Check whether the move at `moveIndex` in the line is the student's move
 * (as opposed to the opponent's move).
 */
export function isStudentMove(
  opening: Opening,
  moveIndex: number,
): boolean {
  const mover = colorToMoveAtIndex(moveIndex);
  return mover === opening.playerColor;
}

/**
 * Validate that a SAN move played by the student is the correct next move
 * in the selected line.
 *
 * Returns true if correct, false otherwise.
 */
export function validateStudentMove(
  playedSans: string[],
  line: OpeningLine,
  attemptedSan: string,
): boolean {
  const expectedMove = line.moves[playedSans.length];
  if (!expectedMove) return false;

  // Normalise: chess.js SAN includes '+' and '#' markers. We compare
  // the move text but strip those for a loose match to be safe.
  const normalise = (s: string) => s.replace(/[+#!?]/g, '').trim();
  return normalise(expectedMove.san) === normalise(attemptedSan);
}

/**
 * Given a list of weighted alternatives, pick one at random using the
 * weights as a distribution. If the top-X limit is set, only the top X
 * entries (by weight) are considered.
 */
export function pickWeightedMove(
  alternatives: MoveWeight[],
  topX: number,
): string {
  const pool = [...alternatives]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, topX);

  const total = pool.reduce((sum, m) => sum + m.weight, 0);
  let rand = Math.random() * total;

  for (const move of pool) {
    rand -= move.weight;
    if (rand <= 0) return move.san;
  }
  return pool[pool.length - 1].san;
}

/**
 * Return the opponent's next move SAN given the current training state.
 *
 * In 'forced' mode: always returns the line's prescribed move.
 * In 'random' mode: picks from weighted alternatives (top-X).
 */
export function getOpponentMoveSan(
  line: OpeningLine,
  playedCount: number,
  opponentMode: 'forced' | 'random',
  randomTopX: number,
): string | null {
  const moveEntry = line.moves[playedCount];
  if (!moveEntry) return null;

  if (opponentMode === 'random' && moveEntry.alternatives && moveEntry.alternatives.length > 0) {
    return pickWeightedMove(moveEntry.alternatives, randomTopX);
  }

  return moveEntry.san;
}

/**
 * Apply a SAN move to a FEN position. Returns the new FEN or null if illegal.
 */
export function applyMove(fen: string, san: string): string | null {
  try {
    const chess = new Chess(fen);
    const result = chess.move(san);
    return result ? chess.fen() : null;
  } catch {
    return null;
  }
}

export function applyUciMove(
  fen: string,
  uci: string,
): { fen: string; san: string } | null {
  try {
    const chess = new Chess(fen);
    const result = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: (uci[4] as 'q' | 'r' | 'b' | 'n' | undefined) ?? undefined,
    });

    if (!result) return null;

    return {
      fen: chess.fen(),
      san: result.san,
    };
  } catch {
    return null;
  }
}

/**
 * Try to convert a UCI move (e.g. "e2e4") to SAN in the given position.
 * Returns the SAN string, or null if the move is illegal.
 */
export function uciToSan(fen: string, uci: string): string | null {
  try {
    const chess = new Chess(fen);
    const from = uci.slice(0, 2) as Parameters<typeof chess.move>[0] extends string ? never : never;
    const to   = uci.slice(2, 4);
    const promotion = uci[4] as 'q' | 'r' | 'b' | 'n' | undefined;
    const result = chess.move({ from: from as string, to, promotion });
    return result ? result.san : null;
  } catch {
    return null;
  }
}

/**
 * Convert a "from-to" drop from react-chessboard to SAN.
 * Returns SAN, or null if the move is illegal.
 */
export function dropToSan(
  fen: string,
  from: string,
  to: string,
  promotion?: string,
): string | null {
  try {
    const chess = new Chess(fen);
    const result = chess.move({ from, to, promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined });
    return result ? result.san : null;
  } catch {
    return null;
  }
}

/**
 * Get all legal moves for the current player in a position.
 */
export function getLegalMoves(fen: string): string[] {
  try {
    const chess = new Chess(fen);
    return chess.moves();
  } catch {
    return [];
  }
}

/**
 * True if there are no legal moves remaining (checkmate or stalemate).
 */
export function isGameOver(fen: string): boolean {
  try {
    return new Chess(fen).isGameOver();
  } catch {
    return true;
  }
}

/**
 * Pick a uniformly random legal move from the given position.
 * Returns null if the position is terminal (checkmate / stalemate).
 */
export function getRandomLegalMove(fen: string): string | null {
  try {
    const chess = new Chess(fen);
    const moves = chess.moves();
    if (moves.length === 0) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  } catch {
    return null;
  }
}

/**
 * Return the move index of the N-th student move in the line that occurs
 * AFTER the setup sequence (i.e. at index >= opening.setupMoves.length).
 *
 * Used by repetition mode to determine where the current drill block ends.
 * Returns line.moves.length when block >= total student line-moves,
 * meaning the full line should play out without interruption.
 */
export function repetitionTarget(
  opening: Opening,
  line: OpeningLine,
  block: number,
): number {
  const setupLen = opening.setupMoves.length;
  let studentMovesSeen = 0;
  for (let i = setupLen; i < line.moves.length; i++) {
    if (isStudentMove(opening, i)) {
      studentMovesSeen++;
      if (studentMovesSeen >= block) return i;
    }
  }
  // All student moves are already covered — play the full line.
  return line.moves.length;
}
