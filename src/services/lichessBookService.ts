import { sansToUciMoves } from '../engine/chessEngine';
import {
  buildExplorerUrl,
  buildWeightedCandidates,
  DEFAULT_RATINGS,
  DEFAULT_SPEEDS,
  DEFAULT_TOP_MOVES,
  DEFAULT_VARIANT,
  selectWeightedMove,
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
  selectedMove: LichessBookMove | null;
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

interface LichessExplorerPayload {
  white: number;
  draws: number;
  black: number;
  moves: Array<{
    uci: string;
    san: string;
    averageRating?: number;
    white: number;
    draws: number;
    black: number;
  }>;
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
    const selectedMove = data.candidateMoves.find((move) => move.uci === data.selectedMove.uci) ?? null;

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
        selectedMove,
      },
      raw: null,
    };
  } catch {
    return fetchLichessBookPositionDirect(payload);
  }
}

async function fetchLichessBookPositionDirect(
  request: {
    fen: string;
    play: string[];
    topMoves: number;
    speeds: string[];
    ratings: number[];
    variant: string;
  },
): Promise<LichessBookFetchResult> {
  try {
    const response = await fetch(buildExplorerUrl('https://explorer.lichess.org', request), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return {
        status: response.status === 429 ? 'rate_limited' : 'api_error',
        position: null,
        raw: null,
        error: response.status === 429 ? 'Lichess explorer rate limited this request.' : 'Opening database unavailable.',
        reason: response.status === 429 ? 'lichess_rate_limited' : 'lichess_unavailable',
      };
    }

    const data = (await response.json()) as LichessExplorerPayload;
    const candidateMoves = buildWeightedCandidates(data.moves, request.topMoves);
    const { selectedMove } = selectWeightedMove(candidateMoves);

    if (candidateMoves.length === 0) {
      return {
        status: 'out_of_database',
        position: null,
        raw: null,
        error: 'No opening database moves found.',
        reason: 'no_moves',
      };
    }

    const totals = buildTotals(candidateMoves);
    return {
      status: 'ok',
      position: {
        fen: request.fen,
        moves: candidateMoves,
        totalGames: candidateMoves.reduce((sum, move) => sum + move.popularity, 0),
        white: totals.white,
        draws: totals.draws,
        black: totals.black,
        source: 'lichess-opening-explorer',
        cached: false,
        selectedMove,
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
    move: result.position.selectedMove ?? result.position.moves[0] ?? null,
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
