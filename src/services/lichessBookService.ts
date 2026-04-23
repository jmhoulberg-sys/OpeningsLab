import { buildRatingsParam } from '../store/settingsStore';
import type { ExplorerOpponentMode } from '../types';

export interface ExplorerMove {
  uci: string;
  san: string;
  averageRating: number;
  white: number;
  draws: number;
  black: number;
}

interface ExplorerResponse {
  opening?: unknown;
  white?: number;
  draws?: number;
  black?: number;
  moves?: ExplorerMove[];
  topGames?: unknown[];
  recentGames?: unknown[];
  history?: unknown[];
}

export interface LichessBookMove extends ExplorerMove {
  count: number;
  whitePct: number;
  drawPct: number;
  blackPct: number;
  playPct: number;
}

export interface LichessBookPosition {
  fen: string;
  moves: LichessBookMove[];
  totalGames: number;
  white: number;
  draws: number;
  black: number;
  source: 'lichess-db';
}

export interface LichessBookFetchResult {
  status: 'ok' | 'out_of_database' | 'api_error';
  position: LichessBookPosition | null;
  raw: ExplorerResponse | null;
  error?: string;
}

interface FetchBookOptions {
  minRating?: number;
}

interface PickMoveOptions extends FetchBookOptions {
  playedMoves?: string[];
  mode: ExplorerOpponentMode;
}

export interface LichessMoveDecision {
  status: 'ok' | 'out_of_database' | 'api_error';
  move: LichessBookMove | null;
  position: LichessBookPosition | null;
  error?: string;
}

const DEFAULT_SPEEDS = 'bullet,blitz,rapid,classical,correspondence';
const DEFAULT_MOVE_LIMIT = 12;
const EXPLORER_TIMEOUT_MS = 8000;
const EXPLORER_BASE_URL = 'https://explorer.lichess.org/lichess';
const cache = new Map<string, Promise<LichessBookFetchResult>>();
let requestQueue = Promise.resolve();

export function normalizeFenForLichessDatabase(fen: string): string | null {
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 4) return null;
  return parts.slice(0, 4).join(' ');
}

export function moveCount(move: ExplorerMove): number {
  return move.white + move.draws + move.black;
}

export function sortMovesByPopularity<T extends ExplorerMove>(moves: T[]): T[] {
  return [...moves].sort((a, b) => moveCount(b) - moveCount(a));
}

export function pickMostPopularMove<T extends ExplorerMove>(moves: T[]): T | null {
  const sorted = sortMovesByPopularity(moves);
  return sorted[0] ?? null;
}

export function pickWeightedTop3Move<T extends ExplorerMove>(
  moves: T[],
): { move: T | null; totalWeight: number; randomRoll: number | null; candidates: T[] } {
  const candidates = sortMovesByPopularity(moves).slice(0, 3);

  if (!candidates.length) {
    return { move: null, totalWeight: 0, randomRoll: null, candidates };
  }

  if (candidates.length === 1) {
    return { move: candidates[0], totalWeight: moveCount(candidates[0]), randomRoll: null, candidates };
  }

  const totalWeight = candidates.reduce((sum, move) => sum + moveCount(move), 0);
  if (totalWeight <= 0) {
    return { move: candidates[0] ?? null, totalWeight, randomRoll: 0, candidates };
  }

  const randomRoll = Math.random() * totalWeight;
  let cumulative = 0;

  for (const move of candidates) {
    cumulative += moveCount(move);
    if (randomRoll < cumulative) {
      return { move, totalWeight, randomRoll, candidates };
    }
  }

  return {
    move: candidates[candidates.length - 1] ?? null,
    totalWeight,
    randomRoll,
    candidates,
  };
}

function isExplorerResponse(data: unknown): data is ExplorerResponse {
  if (!data || typeof data !== 'object') return false;
  return Array.isArray((data as ExplorerResponse).moves);
}

function toBookMoves(moves: ExplorerMove[], totalGames: number): LichessBookMove[] {
  return sortMovesByPopularity(moves)
    .map((move) => {
      const count = moveCount(move);
      return {
        ...move,
        count,
        whitePct: count ? Math.round((move.white / count) * 100) : 0,
        drawPct: count ? Math.round((move.draws / count) * 100) : 0,
        blackPct: count ? Math.round((move.black / count) * 100) : 0,
        playPct: totalGames ? Math.round((count / totalGames) * 100) : 0,
      };
    })
    .filter((move) => move.count > 0);
}

function getCacheKey(fen: string, minRating: number): string {
  return `${fen}|${minRating}`;
}

function queueExplorerRequest<T>(task: () => Promise<T>): Promise<T> {
  const next = requestQueue.catch(() => undefined).then(task);
  requestQueue = next.catch(() => undefined).then(() => undefined);
  return next;
}

function buildExplorerUrl(fen: string, minRating: number) {
  const ratingsParam = buildRatingsParam(minRating);
  const params = new URLSearchParams({
    variant: 'standard',
    speeds: DEFAULT_SPEEDS,
    fen,
    moves: String(DEFAULT_MOVE_LIMIT),
    topGames: '0',
    recentGames: '0',
  });

  if (ratingsParam) {
    params.set('ratings', ratingsParam.replace('&ratings=', ''));
  }

  return `${EXPLORER_BASE_URL}?${params.toString()}`;
}

export async function fetchLichessBookPosition(
  fen: string,
  options: FetchBookOptions = {},
): Promise<LichessBookFetchResult> {
  const normalizedFen = normalizeFenForLichessDatabase(fen);
  if (!normalizedFen) {
    return {
      status: 'api_error',
      position: null,
      raw: null,
      error: 'Invalid FEN for Lichess explorer',
    };
  }

  const minRating = options.minRating ?? 0;
  const key = getCacheKey(normalizedFen, minRating);
  const cached = cache.get(key);
  if (cached) return cached;

  const request = queueExplorerRequest(async () => {
    const url = buildExplorerUrl(normalizedFen, minRating);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EXPLORER_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        return {
          status: 'api_error' as const,
          position: null,
          raw: null,
          error: `Lichess explorer returned ${response.status}`,
        };
      }

      const raw = await response.json() as unknown;
      if (!isExplorerResponse(raw)) {
        return {
          status: 'api_error' as const,
          position: null,
          raw: null,
          error: 'Lichess explorer payload did not match the expected schema',
        };
      }

      const totalGames = (raw.white ?? 0) + (raw.draws ?? 0) + (raw.black ?? 0);
      const moves = toBookMoves(raw.moves ?? [], totalGames);

      if (!moves.length) {
        return {
          status: 'out_of_database' as const,
          position: null,
          raw,
        };
      }

      return {
        status: 'ok' as const,
        position: {
          fen: normalizedFen,
          moves,
          totalGames,
          white: raw.white ?? 0,
          draws: raw.draws ?? 0,
          black: raw.black ?? 0,
          source: 'lichess-db' as const,
        },
        raw,
      };
    } catch (error) {
      return {
        status: 'api_error' as const,
        position: null,
        raw: null,
        error: error instanceof Error ? error.message : 'Unknown Lichess explorer error',
      };
    } finally {
      clearTimeout(timeout);
    }
  });

  cache.set(key, request);
  return request;
}

export function getTopBookMoves(
  result: LichessBookFetchResult,
  limit = 3,
): LichessBookMove[] {
  if (result.status !== 'ok' || !result.position) return [];
  return result.position.moves.slice(0, Math.max(1, limit));
}

function debugExplorerDecision(input: {
  mode: ExplorerOpponentMode;
  queriedFen: string;
  raw: ExplorerResponse | null;
  parsedMoves: LichessBookMove[];
  sortedMoves: LichessBookMove[];
  top3: LichessBookMove[];
  totalWeight: number;
  randomRoll: number | null;
  selectedMove: LichessBookMove | null;
  status: LichessMoveDecision['status'];
  legalAccepted?: boolean;
  error?: string;
}) {
  console.groupCollapsed(`[Lichess Explorer] ${input.mode} :: ${input.queriedFen}`);
  console.log('selectedMode', input.mode);
  console.log('currentFen', input.queriedFen);
  console.log('rawExplorerJson', input.raw);
  console.log('parsedMoves', input.parsedMoves);
  console.table(
    input.parsedMoves.map((move) => ({
      san: move.san,
      uci: move.uci,
      averageRating: move.averageRating,
      white: move.white,
      draws: move.draws,
      black: move.black,
      count: move.count,
      playPct: move.playPct,
    })),
  );
  console.log('sortedMoves', input.sortedMoves);
  console.log('top3Candidates', input.top3);
  console.log('totalWeight', input.totalWeight);
  console.log('randomNumber', input.randomRoll);
  console.log('finalSelectedMove', input.selectedMove);
  console.log('legalAccepted', input.legalAccepted);
  console.log('status', input.status);
  if (input.error) console.warn('explorerError', input.error);
  console.groupEnd();
}

export async function pickLichessBookMove(
  fen: string,
  options: PickMoveOptions,
): Promise<LichessMoveDecision> {
  const normalizedFen = normalizeFenForLichessDatabase(fen) ?? fen.trim();
  const result = await fetchLichessBookPosition(normalizedFen, options);
  const parsedMoves = result.status === 'ok' && result.position ? result.position.moves : [];
  const sortedMoves = sortMovesByPopularity(parsedMoves);

  if (result.status !== 'ok' || !result.position) {
    debugExplorerDecision({
      mode: options.mode,
      queriedFen: normalizedFen,
      raw: result.raw,
      parsedMoves,
      sortedMoves,
      top3: [],
      totalWeight: 0,
      randomRoll: null,
      selectedMove: null,
      status: result.status,
      error: result.error,
    });

    return {
      status: result.status,
      move: null,
      position: null,
      error: result.error,
    };
  }

  let selectedMove: LichessBookMove | null = null;
  let totalWeight = 0;
  let randomRoll: number | null = null;
  let top3 = sortedMoves.slice(0, 3);

  if (options.mode === 'most_popular') {
    selectedMove = pickMostPopularMove(sortedMoves);
    totalWeight = selectedMove ? selectedMove.count : 0;
    top3 = selectedMove ? [selectedMove] : [];
  } else {
    const weighted = pickWeightedTop3Move(sortedMoves);
    selectedMove = weighted.move;
    totalWeight = weighted.totalWeight;
    randomRoll = weighted.randomRoll;
    top3 = weighted.candidates;
  }

  debugExplorerDecision({
    mode: options.mode,
    queriedFen: normalizedFen,
    raw: result.raw,
    parsedMoves,
    sortedMoves,
    top3,
    totalWeight,
    randomRoll,
    selectedMove,
    status: 'ok',
  });

  return {
    status: 'ok',
    move: selectedMove,
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
