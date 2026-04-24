import {
  type BackendErrorResponse,
  type BackendSuccessResponse,
  type LichessExplorerResponse,
  type NormalizedLichessRequest,
  buildCacheKey,
  buildExplorerUrl,
  buildWeightedCandidates,
  selectWeightedMove,
} from './lichessResponseCore';

interface CachedExplorerResult {
  status: 'ok' | 'no_moves';
  payload: LichessExplorerResponse;
}

interface LichessExplorerServiceOptions {
  token?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

type FetchResult = BackendSuccessResponse | BackendErrorResponse;

export class LichessExplorerService {
  private readonly token?: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly cache = new Map<string, CachedExplorerResult>();
  private readonly inFlight = new Map<string, Promise<FetchResult>>();
  private requestQueue = Promise.resolve();
  private cooldownUntil = 0;

  constructor(options: LichessExplorerServiceOptions = {}) {
    this.token = options.token;
    this.baseUrl = options.baseUrl || 'https://explorer.lichess.org';
    this.fetchImpl = options.fetchImpl || fetch;
    this.now = options.now || (() => Date.now());
  }

  async getResponse(
    request: NormalizedLichessRequest,
    randomValue?: number,
  ): Promise<FetchResult> {
    const cacheKey = buildCacheKey(request);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return this.buildResponseFromPayload(cached.payload, request, true, randomValue);
    }

    if (!this.token) {
      return {
        ok: false,
        reason: 'missing_token',
        message: 'LICHESS_TOKEN is not configured on the server.',
      };
    }

    if (this.cooldownUntil > this.now()) {
      return {
        ok: false,
        reason: 'lichess_rate_limited',
        message: 'Live opening database temporarily unavailable.',
      };
    }

    const existing = this.inFlight.get(cacheKey);
    if (existing) {
      return existing;
    }

    const promise = this.enqueue(async () => {
      try {
        const cachedAfterQueue = this.cache.get(cacheKey);
        if (cachedAfterQueue) {
          return this.buildResponseFromPayload(cachedAfterQueue.payload, request, true, randomValue);
        }

        const url = buildExplorerUrl(this.baseUrl, request);
        const response = await this.fetchImpl(url, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          return {
            ok: false,
            reason: 'lichess_unauthorised',
            message: 'Server Lichess token was rejected by Opening Explorer.',
          } satisfies BackendErrorResponse;
        }

        if (response.status === 429) {
          this.cooldownUntil = this.now() + 60_000;
          return {
            ok: false,
            reason: 'lichess_rate_limited',
            message: 'Live opening database temporarily unavailable.',
          } satisfies BackendErrorResponse;
        }

        if (!response.ok) {
          return {
            ok: false,
            reason: 'lichess_unavailable',
            message: 'Opening database unavailable.',
          } satisfies BackendErrorResponse;
        }

        const payload = (await response.json()) as LichessExplorerResponse;
        if (!payload || !Array.isArray(payload.moves)) {
          return {
            ok: false,
            reason: 'lichess_unavailable',
            message: 'Opening database unavailable.',
          } satisfies BackendErrorResponse;
        }

        const status = payload.moves.length > 0 ? 'ok' : 'no_moves';
        this.cache.set(cacheKey, {
          status,
          payload,
        });

        return this.buildResponseFromPayload(payload, request, false, randomValue);
      } catch {
        return {
          ok: false,
          reason: 'lichess_unavailable',
          message: 'Opening database unavailable.',
        } satisfies BackendErrorResponse;
      } finally {
        this.inFlight.delete(cacheKey);
      }
    });

    this.inFlight.set(cacheKey, promise);
    return promise;
  }

  private enqueue<T>(task: () => Promise<T>) {
    const next = this.requestQueue.catch(() => undefined).then(task);
    this.requestQueue = next.catch(() => undefined).then(() => undefined);
    return next;
  }

  private buildResponseFromPayload(
    payload: LichessExplorerResponse,
    request: NormalizedLichessRequest,
    cached: boolean,
    randomValue?: number,
  ): FetchResult {
    const candidateMoves = buildWeightedCandidates(payload.moves, request.topMoves);
    if (candidateMoves.length === 0) {
      return {
        ok: false,
        reason: payload.moves.length === 0 ? 'out_of_database' : 'no_moves',
        message: 'Out of database.',
      };
    }

    const { selectedMove } = selectWeightedMove(candidateMoves, randomValue);
    if (!selectedMove) {
      return {
        ok: false,
        reason: 'no_moves',
        message: 'No playable Lichess responses were available.',
      };
    }

    return {
      ok: true,
      selectedMove: {
        uci: selectedMove.uci,
        san: selectedMove.san,
        popularity: selectedMove.popularity,
        weight: selectedMove.weight,
        averageRating: selectedMove.averageRating,
      },
      candidateMoves,
      source: 'lichess-opening-explorer',
      cached,
    };
  }
}
