import { useEffect, useRef, useState } from 'react';
import { buildRatingsParam } from '../store/settingsStore';

// ─── Types ──────────────────────────────────────────────────────────

export interface LichessMove {
  san: string;
  white: number;
  draws: number;
  black: number;
  total: number;
  whitePct: number;
  drawPct: number;
  blackPct: number;
}

export interface LichessAnalysis {
  moves: LichessMove[];
  evalCp: number | null;
  evalMate: number | null;
  loading: boolean;
  error: string | null;
}

const EMPTY: LichessAnalysis = {
  moves: [],
  evalCp: null,
  evalMate: null,
  loading: false,
  error: null,
};

// ─── Hook ───────────────────────────────────────────────────────────

/**
 * Fetches position evaluation and top moves from Lichess.
 * Uses the full Lichess game database (all speeds) filtered by minRating.
 * Debounced at 600 ms to avoid API hammering.
 *
 * @param fen       FEN to analyse (null = disabled).
 * @param enabled   When false, returns EMPTY immediately.
 * @param minRating Minimum average rating filter (0 = all games).
 */
export function useLichessAnalysis(
  fen: string | null,
  enabled: boolean,
  minRating = 0,
): LichessAnalysis {
  const [state, setState] = useState<LichessAnalysis>(EMPTY);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !fen) {
      setState(EMPTY);
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const enc = encodeURIComponent(fen);
        const ratingsParam = buildRatingsParam(minRating);

        // All speeds, all time controls — maximum coverage
        const explorerUrl =
          `https://explorer.lichess.ovh/lichess?variant=standard` +
          `${ratingsParam}&topGames=0&recentGames=0&moves=3&fen=${enc}`;

        const [explorerResult, evalResult] = await Promise.allSettled([
          fetch(explorerUrl),
          fetch(`https://lichess.org/api/cloud-eval?fen=${enc}&multiPv=1`),
        ]);

        let moves: LichessMove[] = [];
        let evalCp: number | null = null;
        let evalMate: number | null = null;

        // ── Opening explorer ──────────────────────────────────────
        if (explorerResult.status === 'fulfilled' && explorerResult.value.ok) {
          const data = await explorerResult.value.json();
          moves = ((data.moves ?? []) as Array<{
            san: string; white: number; draws: number; black: number;
          }>)
            .slice(0, 3)
            .map((m) => {
              const total = m.white + m.draws + m.black;
              return {
                san: m.san,
                white: m.white,
                draws: m.draws,
                black: m.black,
                total,
                whitePct: total ? Math.round((m.white / total) * 100) : 0,
                drawPct:  total ? Math.round((m.draws / total) * 100) : 0,
                blackPct: total ? Math.round((m.black / total) * 100) : 0,
              };
            });
        }

        // ── Cloud eval ───────────────────────────────────────────
        if (evalResult.status === 'fulfilled' && evalResult.value.ok) {
          const data = await evalResult.value.json();
          const pv = (data.pvs as Array<{ cp?: number; mate?: number }>)?.[0];
          if (pv) {
            if (pv.mate !== undefined) evalMate = pv.mate;
            else if (pv.cp !== undefined) evalCp = pv.cp;
          }
        }

        setState({ moves, evalCp, evalMate, loading: false, error: null });
      } catch {
        setState((s) => ({ ...s, loading: false, error: 'Could not reach Lichess' }));
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fen, enabled, minRating]);

  return state;
}

// ─── Helpers ────────────────────────────────────────────────────────

export function formatEval(cp: number | null, mate: number | null): string {
  if (mate !== null) return mate > 0 ? `M${mate}` : `-M${Math.abs(mate)}`;
  if (cp === null) return '?';
  const pawns = cp / 100;
  return (pawns >= 0 ? '+' : '') + pawns.toFixed(2);
}
