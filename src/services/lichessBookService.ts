import { sansToUciMoves } from '../engine/chessEngine';
import {
  DEFAULT_RATINGS,
  DEFAULT_SPEEDS,
  DEFAULT_TOP_MOVES,
  DEFAULT_VARIANT,
  type BackendErrorReason,
} from '../server/lichessResponseCore';

export interface LichessBookMove {
  uci: string;
  san: string;
  popularity: number;
  weight: number;
  white: number;
  draws: number;
  black: number;
  averageRating?: number;
}

export interface LichessBookPosition {
  fen: string;
  moves: LichessBookMove[];
  totalGames: number;
  white: number;
  draws: number;
  black: number;
  source: 'lichess-opening-explorer';
  cached: boolean;
}

export interface LichessBookFetchResult {
  status: 'ok' | 'out_of_database' | 'rate_limited' | 'api_error';
  position: LichessBookPosition | null;
  raw: null;
  error?: string;
  reason?: BackendErrorReason;
}

interface FetchBookOptions {
  topMoves?: number;
  speeds?: string[];
  ratings?: number[];
  variant?: string;
  playedSans?: string[];
}

export interface LichessMoveDecision {
  status: LichessBookFetchResult['status'];
  move: LichessBookMove | null;
  position: LichessBookPosition | null;
  error?: string;
  reason?: BackendErrorReason;
}

interface BackendSuccessPayload {
  ok: true;
  selectedMove: {
    uci: string;
    san: string;
    popularity: number;
    weight: number;
    averageRating?: number;
  };
  candidateMoves: LichessBookMove[];
  source: 'lichess-opening-explorer';
  cached: boolean;
}

interface BackendErrorPayload {
  ok: false;
  reason: BackendErrorReason;
  message: string;
}

function buildTotals(moves: LichessBookMove[]) {
  return moves.reduce(
    (totals, move) => ({
      white: totals.white + move.white,
      draws: totals.draws + move.draws,
      black: totals.black + move.black,
    }),
    { white: 0, draws: 0, black: 0 },
  );
}

function mapErrorStatus(reason: BackendErrorReason): LichessBookFetchResult['status'] {
  if (reason === 'out_of_database' || reason === 'no_moves') return 'out_of_database';
  if (reason === 'lichess_rate_limited') return 'rate_limited';
  return 'api_error';
}

export async function fetchLichessBookPosition(
  fen: string,
  options: FetchBookOptions = {},
): Promise<LichessBookFetchResult> {
  const play = options.playedSans ? sansToUciMoves(options.playedSans) ?? [] : [];
  const payload = {
    fen,
    play,
    topMoves: options.topMoves ?? DEFAULT_TOP_MOVES,
    speeds: options.speeds ?? [...DEFAULT_SPEEDS],
    ratings: options.ratings ?? [...DEFAULT_RATINGS],
    variant: options.variant ?? DEFAULT_VARIANT,
  };

  try {
    const response = await fetch('/api/lichess-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as BackendSuccessPayload | BackendErrorPayload;
    if (!data.ok) {
      return {
        status: mapErrorStatus(data.reason),
        position: null,
        raw: null,
        error: data.message,
        reason: data.reason,
      };
    }

    const totals = buildTotals(data.candidateMoves);
    return {
      status: 'ok',
      position: {
        fen,
        moves: data.candidateMoves,
        totalGames: data.candidateMoves.reduce((sum, move) => sum + move.popularity, 0),
        white: totals.white,
        draws: totals.draws,
        black: totals.black,
        source: data.source,
        cached: data.cached,
      },
      raw: null,
    };
  } catch {
    return {
      status: 'api_error',
      position: null,
      raw: null,
      error: 'Opening database unavailable.',
      reason: 'lichess_unavailable',
    };
  }
}

export function getTopBookMoves(
  result: LichessBookFetchResult,
  limit = DEFAULT_TOP_MOVES,
): LichessBookMove[] {
  if (result.status !== 'ok' || !result.position) return [];
  return result.position.moves.slice(0, Math.max(1, limit));
}

export async function pickLichessBookMove(
  fen: string,
  options: FetchBookOptions = {},
): Promise<LichessMoveDecision> {
  const result = await fetchLichessBookPosition(fen, options);
  if (result.status !== 'ok' || !result.position) {
    return {
      status: result.status,
      move: null,
      position: null,
      error: result.error,
      reason: result.reason,
    };
  }

  return {
    status: 'ok',
    move: result.position.moves[0] ?? null,
    position: result.position,
  };
}

export function logExplorerMoveAcceptance(
  fen: string,
  move: LichessBookMove | null,
  legalAccepted: boolean,
) {
  console.log('[Lichess Explorer] legal move check', {
    fen,
    move,
    legalAccepted,
  });
}
