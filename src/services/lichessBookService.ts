import { Chess } from 'chess.js';
import { buildRatingsParam } from '../store/settingsStore';
import { LICHESS_FALLBACKS } from '../data/lichessFallbacks';

export interface LichessBookMove {
  san: string;
  white: number;
  draws: number;
  black: number;
  total: number;
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

interface ExplorerMove {
  san: string;
  white: number;
  draws: number;
  black: number;
}

interface ExplorerResponse {
  white?: number;
  draws?: number;
  black?: number;
  moves?: ExplorerMove[];
}

interface FetchBookOptions {
  minRating?: number;
  moveLimit?: number;
  playedMoves?: string[];
}

interface PickMoveOptions extends FetchBookOptions {
  topMovesToInclude: number;
}

const DEFAULT_MOVE_LIMIT = 12;
const DEFAULT_SPEEDS = 'bullet,blitz,rapid,classical,correspondence,ultraBullet';
const EXPLORER_TIMEOUT_MS = 8000;
const cache = new Map<string, Promise<LichessBookPosition | null>>();
let requestQueue = Promise.resolve();

export function normalizeFenForLichessDatabase(fen: string): string | null {
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 4) return null;
  return parts.slice(0, 4).join(' ');
}

function getFallbackPosition(rawFen: string, normalizedFen: string): LichessBookPosition | null {
  return LICHESS_FALLBACKS[normalizedFen] ?? LICHESS_FALLBACKS[rawFen] ?? null;
}

function sanMovesToUciPath(sans?: string[]): string[] {
  if (!sans || sans.length === 0) return [];

  const chess = new Chess();
  const path: string[] = [];

  for (const san of sans) {
    try {
      const move = chess.move(san);
      if (!move) break;
      path.push(`${move.from}${move.to}${move.promotion ?? ''}`);
    } catch {
      break;
    }
  }

  return path;
}

function toBookMoves(moves: ExplorerMove[], totalGames: number): LichessBookMove[] {
  return moves
    .map((move) => {
      const total = move.white + move.draws + move.black;
      return {
        san: move.san,
        white: move.white,
        draws: move.draws,
        black: move.black,
        total,
        whitePct: total ? Math.round((move.white / total) * 100) : 0,
        drawPct: total ? Math.round((move.draws / total) * 100) : 0,
        blackPct: total ? Math.round((move.black / total) * 100) : 0,
        playPct: totalGames ? Math.round((total / totalGames) * 100) : 0,
      };
    })
    .filter((move) => move.total > 0)
    .sort((a, b) => b.total - a.total);
}

function getCacheKey(fen: string, minRating: number, moveLimit: number, playedPath: string): string {
  return `${fen}|${minRating}|${moveLimit}|${playedPath}`;
}

function queueExplorerRequest<T>(task: () => Promise<T>): Promise<T> {
  const next = requestQueue.catch(() => undefined).then(task);
  requestQueue = next.catch(() => undefined).then(() => undefined);
  return next;
}

async function fetchFromExplorer(
  query: { fen?: string; playedMoves?: string[] },
  minRating: number,
  moveLimit: number,
): Promise<LichessBookPosition | null> {
  const ratingsParam = buildRatingsParam(minRating);
  const params = new URLSearchParams({
    variant: 'standard',
    speeds: DEFAULT_SPEEDS,
    topGames: '0',
    recentGames: '0',
    moves: String(moveLimit),
  });

  if (ratingsParam) {
    params.set('ratings', ratingsParam.replace('&ratings=', ''));
  }

  const playedPath = sanMovesToUciPath(query.playedMoves);
  if (playedPath.length > 0) {
    params.set('play', playedPath.join(','));
  } else if (query.fen) {
    params.set('fen', query.fen);
  }

  const url = `https://explorer.lichess.ovh/lichess?${params.toString()}`;

  return queueExplorerRequest(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EXPLORER_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) return null;

      const data = await response.json() as ExplorerResponse;
      const totalGames = (data.white ?? 0) + (data.draws ?? 0) + (data.black ?? 0);
      const moves = toBookMoves(data.moves ?? [], totalGames);
      if (moves.length === 0) return null;

      return {
        fen: query.fen ?? '',
        moves,
        totalGames,
        white: data.white ?? moves.reduce((sum, move) => sum + move.white, 0),
        draws: data.draws ?? moves.reduce((sum, move) => sum + move.draws, 0),
        black: data.black ?? moves.reduce((sum, move) => sum + move.black, 0),
        source: 'lichess-db' as const,
      };
    } finally {
      clearTimeout(timeout);
    }
  }).catch(() => null);
}

export async function fetchLichessBookPosition(
  fen: string,
  options: FetchBookOptions = {},
): Promise<LichessBookPosition | null> {
  const rawFen = fen.trim();
  const normalizedFen = normalizeFenForLichessDatabase(fen);
  if (!rawFen || !normalizedFen) return null;

  const minRating = options.minRating ?? 0;
  const moveLimit = options.moveLimit ?? DEFAULT_MOVE_LIMIT;
  const playedPath = sanMovesToUciPath(options.playedMoves).join(',');
  const key = getCacheKey(normalizedFen, minRating, moveLimit, playedPath);

  const cached = cache.get(key);
  if (cached) return cached;

  const request = (async () => {
    const candidates = [
      { query: { playedMoves: options.playedMoves, fen: rawFen }, minRating },
      { query: { playedMoves: options.playedMoves, fen: normalizedFen }, minRating },
      { query: { fen: rawFen }, minRating },
      { query: { fen: normalizedFen }, minRating },
      { query: { playedMoves: options.playedMoves, fen: rawFen }, minRating: 0 },
      { query: { playedMoves: options.playedMoves, fen: normalizedFen }, minRating: 0 },
      { query: { fen: rawFen }, minRating: 0 },
      { query: { fen: normalizedFen }, minRating: 0 },
    ];

    for (const candidate of candidates) {
      const result = await fetchFromExplorer(candidate.query, candidate.minRating, moveLimit)
        .catch(() => null);
      if (result) return result;
    }

    return getFallbackPosition(rawFen, normalizedFen);
  })();

  cache.set(key, request);
  return request;
}

export function getTopBookMoves(
  position: LichessBookPosition | null,
  topMovesToInclude: number,
): LichessBookMove[] {
  if (!position) return [];
  return position.moves.slice(0, Math.max(1, topMovesToInclude));
}

export async function pickLichessBookMove(
  fen: string,
  options: PickMoveOptions,
): Promise<{ move: LichessBookMove | null; position: LichessBookPosition | null }> {
  const position = await fetchLichessBookPosition(fen, options);
  const candidates = getTopBookMoves(position, options.topMovesToInclude);
  if (candidates.length === 0) {
    return { move: null, position };
  }

  const totalWeight = candidates.reduce((sum, move) => sum + move.total, 0);
  let roll = Math.random() * totalWeight;

  for (const move of candidates) {
    roll -= move.total;
    if (roll <= 0) {
      return { move, position };
    }
  }

  return { move: candidates[candidates.length - 1], position };
}
