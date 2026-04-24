import { describe, expect, it, vi } from 'vitest';
import {
  buildCacheKey,
  buildWeightedCandidates,
  selectWeightedMove,
  validateAndNormalizeRequest,
  type LichessExplorerResponse,
} from './lichessResponseCore';
import { LichessExplorerService } from './lichessResponseService';

describe('validateAndNormalizeRequest', () => {
  it('clamps topMoves and keeps defaults', () => {
    const result = validateAndNormalizeRequest({
      fen: 'test-fen',
      topMoves: 99,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.topMoves).toBe(10);
    expect(result.value.speeds).toEqual(['blitz', 'rapid', 'classical']);
    expect(result.value.ratings).toEqual([1600, 1800, 2000, 2200, 2500]);
  });

  it('rejects invalid UCI play arrays', () => {
    const result = validateAndNormalizeRequest({
      play: ['e2e4', 'bad-move'],
    });

    expect(result.ok).toBe(false);
  });
});

describe('weighted move helpers', () => {
  const moves: LichessExplorerResponse['moves'] = [
    { uci: 'e7e5', san: 'e5', white: 800, draws: 100, black: 600, averageRating: 2115 },
    { uci: 'c7c5', san: 'c5', white: 300, draws: 50, black: 250, averageRating: 2084 },
    { uci: 'e7e6', san: 'e6', white: 150, draws: 25, black: 125, averageRating: 2032 },
  ];

  it('calculates popularity and weights correctly', () => {
    const candidates = buildWeightedCandidates(moves, 3);

    expect(candidates.map((move) => move.popularity)).toEqual([1500, 600, 300]);
    expect(candidates.map((move) => Number(move.weight.toFixed(3)))).toEqual([0.625, 0.25, 0.125]);
  });

  it('selects deterministically with injected random values', () => {
    const candidates = buildWeightedCandidates(moves, 3);

    expect(selectWeightedMove(candidates, 0.0).selectedMove?.uci).toBe('e7e5');
    expect(selectWeightedMove(candidates, 0.62).selectedMove?.uci).toBe('e7e5');
    expect(selectWeightedMove(candidates, 0.63).selectedMove?.uci).toBe('c7c5');
    expect(selectWeightedMove(candidates, 0.88).selectedMove?.uci).toBe('e7e6');
  });
});

describe('cache behaviour', () => {
  it('reuses cached explorer payloads without calling Lichess again', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        white: 1250,
        draws: 175,
        black: 975,
        moves: [
          { uci: 'e7e5', san: 'e5', white: 800, draws: 100, black: 600, averageRating: 2115 },
          { uci: 'c7c5', san: 'c5', white: 300, draws: 50, black: 250, averageRating: 2084 },
        ],
      } satisfies LichessExplorerResponse),
    })) as unknown as typeof fetch;

    const service = new LichessExplorerService({
      token: 'server-token',
      fetchImpl: fetchMock,
    });

    const requestResult = validateAndNormalizeRequest({
      play: ['e2e4', 'e7e5', 'g1f3'],
      topMoves: 2,
    });

    expect(requestResult.ok).toBe(true);
    if (!requestResult.ok) return;

    const first = await service.getResponse(requestResult.value, 0.1);
    const second = await service.getResponse(requestResult.value, 0.9);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(buildCacheKey(requestResult.value)).toContain('top2:e2e4,e7e5,g1f3');
  });

  it('enters cooldown after a 429 and serves a clean temporary unavailable response', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 429,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    const service = new LichessExplorerService({
      token: 'server-token',
      fetchImpl: fetchMock,
      now: () => 1_000,
    });

    const requestResult = validateAndNormalizeRequest({
      fen: 'test-fen',
    });

    expect(requestResult.ok).toBe(true);
    if (!requestResult.ok) return;

    const first = await service.getResponse(requestResult.value, 0.2);
    const second = await service.getResponse(requestResult.value, 0.2);

    expect(first.ok).toBe(false);
    if (first.ok) return;
    expect(first.reason).toBe('lichess_rate_limited');
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.reason).toBe('lichess_rate_limited');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
