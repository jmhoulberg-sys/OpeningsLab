import { buildRatingsParam } from '../store/settingsStore';

export interface LichessBookMove {
  san: string;
  white: number;
  draws: number;
  black: number;
  total: number;
  whitePct: number;
  drawPct: number;
  blackPct: number;
}

export interface LichessBookPosition {
  fen: string;
  moves: LichessBookMove[];
  totalGames: number;
  source: 'lichess-db';
}

interface ExplorerMove {
  san: string;
  white: number;
  draws: number;
  black: number;
}

interface FetchBookOptions {
  minRating?: number;
  moveLimit?: number;
}

interface PickMoveOptions extends FetchBookOptions {
  topMovesToInclude: number;
}

const DEFAULT_MOVE_LIMIT = 12;
const cache = new Map<string, Promise<LichessBookPosition | null>>();

export function normalizeFenForLichessDatabase(fen: string): string | null {
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 4) return null;
  return parts.slice(0, 4).join(' ');
}

function toBookMove(move: ExplorerMove): LichessBookMove {
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
  };
}

function getCacheKey(fen: string, minRating: number, moveLimit: number): string {
  return `${fen}|${minRating}|${moveLimit}`;
}

async function fetchFromExplorer(
  fen: string,
  minRating: number,
  moveLimit: number,
): Promise<LichessBookPosition | null> {
  const enc = encodeURIComponent(fen);
  const ratingsParam = buildRatingsParam(minRating);
  const url =
    `https://explorer.lichess.ovh/lichess?variant=standard${ratingsParam}` +
    `&topGames=0&recentGames=0&moves=${moveLimit}&fen=${enc}`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json() as { moves?: ExplorerMove[] };
  const moves = (data.moves ?? [])
    .map(toBookMove)
    .filter((move) => move.total > 0)
    .sort((a, b) => b.total - a.total);

  if (moves.length === 0) return null;

  return {
    fen,
    moves,
    totalGames: moves.reduce((sum, move) => sum + move.total, 0),
    source: 'lichess-db',
  };
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
  const key = getCacheKey(rawFen, minRating, moveLimit);

  const cached = cache.get(key);
  if (cached) return cached;

  const request = (async () => {
    const candidates = [
      { fen: rawFen, minRating },
      { fen: normalizedFen, minRating },
      { fen: rawFen, minRating: 0 },
      { fen: normalizedFen, minRating: 0 },
    ];

    for (const candidate of candidates) {
      const result = await fetchFromExplorer(candidate.fen, candidate.minRating, moveLimit)
        .catch(() => null);
      if (result) return result;
    }

    return null;
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
