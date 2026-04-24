export const DEFAULT_TOP_MOVES = 3;
export const DEFAULT_SPEEDS = ['blitz', 'rapid', 'classical'] as const;
export const DEFAULT_RATINGS = [1600, 1800, 2000, 2200, 2500] as const;
export const DEFAULT_VARIANT = 'standard' as const;

const VALID_SPEEDS = ['ultraBullet', 'bullet', 'blitz', 'rapid', 'classical', 'correspondence'] as const;
const VALID_VARIANTS = ['standard', 'chess960', 'antichess', 'atomic', 'horde', 'kingOfTheHill', 'racingKings', 'threeCheck', 'crazyhouse'] as const;
const UCI_RE = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

export interface LichessExplorerMove {
  uci: string;
  san: string;
  averageRating?: number;
  white: number;
  draws: number;
  black: number;
}

export interface LichessExplorerResponse {
  white: number;
  draws: number;
  black: number;
  moves: LichessExplorerMove[];
}

export interface LichessResponseRequestBody {
  fen?: unknown;
  play?: unknown;
  topMoves?: unknown;
  speeds?: unknown;
  ratings?: unknown;
  variant?: unknown;
}

export interface NormalizedLichessRequest {
  fen: string | null;
  play: string[];
  topMoves: number;
  speeds: string[];
  ratings: number[];
  variant: string;
}

export interface WeightedCandidateMove extends LichessExplorerMove {
  popularity: number;
  weight: number;
}

export type BackendErrorReason =
  | 'out_of_database'
  | 'lichess_unauthorised'
  | 'lichess_rate_limited'
  | 'lichess_unavailable'
  | 'invalid_position'
  | 'no_moves'
  | 'missing_token';

export interface BackendSuccessResponse {
  ok: true;
  selectedMove: {
    uci: string;
    san: string;
    popularity: number;
    weight: number;
    averageRating?: number;
  };
  candidateMoves: WeightedCandidateMove[];
  source: 'lichess-opening-explorer';
  cached: boolean;
}

export interface BackendErrorResponse {
  ok: false;
  reason: BackendErrorReason;
  message: string;
}

export interface WeightedSelectionResult {
  selectedMove: WeightedCandidateMove | null;
  candidateMoves: WeightedCandidateMove[];
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

function uniqueNumbers(values: number[]) {
  return [...new Set(values)].sort((a, b) => a - b);
}

export function isValidUciMove(value: string) {
  return UCI_RE.test(value);
}

export function validateAndNormalizeRequest(
  body: LichessResponseRequestBody,
): { ok: true; value: NormalizedLichessRequest } | { ok: false; message: string } {
  const playInput = body.play;
  const fenInput = body.fen;
  const topMovesInput = body.topMoves;
  const speedsInput = body.speeds;
  const ratingsInput = body.ratings;
  const variantInput = body.variant;

  const play = Array.isArray(playInput)
    ? playInput.filter((move): move is string => typeof move === 'string').map((move) => move.trim())
    : [];

  if (Array.isArray(playInput) && play.length !== playInput.length) {
    return { ok: false, message: 'play must be an array of UCI move strings' };
  }

  if (play.some((move) => !isValidUciMove(move))) {
    return { ok: false, message: 'play contains an invalid UCI move string' };
  }

  const fen = typeof fenInput === 'string' && fenInput.trim() ? fenInput.trim() : null;
  if (!fen && play.length === 0) {
    return { ok: false, message: 'Provide fen or play in the request body' };
  }

  const topMoves = Math.max(
    1,
    Math.min(
      10,
      typeof topMovesInput === 'number' && Number.isFinite(topMovesInput)
        ? Math.floor(topMovesInput)
        : DEFAULT_TOP_MOVES,
    ),
  );

  const speeds = Array.isArray(speedsInput)
    ? uniqueStrings(
        speedsInput.filter((speed): speed is string => typeof speed === 'string' && VALID_SPEEDS.includes(speed as (typeof VALID_SPEEDS)[number])),
      )
    : [...DEFAULT_SPEEDS];

  const ratings = Array.isArray(ratingsInput)
    ? uniqueNumbers(
        ratingsInput.filter((rating): rating is number => typeof rating === 'number' && Number.isFinite(rating)),
      )
    : [...DEFAULT_RATINGS];

  const variant = typeof variantInput === 'string' && VALID_VARIANTS.includes(variantInput as (typeof VALID_VARIANTS)[number])
    ? variantInput
    : DEFAULT_VARIANT;

  return {
    ok: true,
    value: {
      fen,
      play,
      topMoves,
      speeds: speeds.length > 0 ? speeds : [...DEFAULT_SPEEDS],
      ratings: ratings.length > 0 ? ratings : [...DEFAULT_RATINGS],
      variant,
    },
  };
}

export function buildCacheKey(request: NormalizedLichessRequest) {
  const positionPart = request.play.length > 0 ? request.play.join(',') : request.fen ?? 'no-fen';
  return `lichess:${request.variant}:${request.speeds.join(',')}:${request.ratings.join(',')}:top${request.topMoves}:${positionPart}`;
}

export function buildExplorerUrl(baseUrl: string, request: NormalizedLichessRequest) {
  const params = new URLSearchParams({
    variant: request.variant,
    speeds: request.speeds.join(','),
    ratings: request.ratings.join(','),
  });

  if (request.play.length > 0) {
    params.set('play', request.play.join(','));
  } else if (request.fen) {
    params.set('fen', request.fen);
  }

  return `${baseUrl.replace(/\/$/, '')}/lichess?${params.toString()}`;
}

export function movePopularity(move: Pick<LichessExplorerMove, 'white' | 'draws' | 'black'>) {
  return move.white + move.draws + move.black;
}

export function buildWeightedCandidates(
  moves: LichessExplorerMove[],
  topMoves: number,
): WeightedCandidateMove[] {
  const topCandidates = [...moves]
    .sort((a, b) => movePopularity(b) - movePopularity(a))
    .slice(0, topMoves)
    .map((move) => ({
      ...move,
      popularity: movePopularity(move),
      weight: 0,
    }))
    .filter((move) => move.popularity > 0);

  const totalPopularity = topCandidates.reduce((sum, move) => sum + move.popularity, 0);
  if (totalPopularity <= 0) {
    return [];
  }

  return topCandidates.map((move) => ({
    ...move,
    weight: move.popularity / totalPopularity,
  }));
}

export function selectWeightedMove(
  candidateMoves: WeightedCandidateMove[],
  randomValue = Math.random(),
): WeightedSelectionResult {
  if (candidateMoves.length === 0) {
    return {
      selectedMove: null,
      candidateMoves: [],
    };
  }

  if (candidateMoves.length === 1) {
    return {
      selectedMove: candidateMoves[0],
      candidateMoves,
    };
  }

  const clampedRandom = Math.max(0, Math.min(0.9999999999, randomValue));
  let cumulative = 0;

  for (const move of candidateMoves) {
    cumulative += move.weight;
    if (clampedRandom < cumulative) {
      return {
        selectedMove: move,
        candidateMoves,
      };
    }
  }

  return {
    selectedMove: candidateMoves[candidateMoves.length - 1],
    candidateMoves,
  };
}
