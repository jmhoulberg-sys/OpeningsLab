import { useEffect, useRef, useState } from 'react';
import {
  fetchLichessBookPosition,
  getTopBookMoves,
  type LichessBookMove as LichessMove,
} from '../services/lichessBookService';

export type { LichessMove };

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

export function useLichessAnalysis(
  fen: string | null,
  enabled: boolean,
  minRating = 0,
  topMovesToInclude = 3,
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
        const [positionResult, evalResult] = await Promise.allSettled([
          fetchLichessBookPosition(fen, { minRating, moveLimit: 12 }),
          fetch(`https://lichess.org/api/cloud-eval?fen=${enc}&multiPv=1`),
        ]);

        let moves: LichessMove[] = [];
        let evalCp: number | null = null;
        let evalMate: number | null = null;

        if (positionResult.status === 'fulfilled') {
          moves = getTopBookMoves(positionResult.value, topMovesToInclude);
        }

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
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fen, enabled, minRating, topMovesToInclude]);

  return state;
}

export function formatEval(cp: number | null, mate: number | null): string {
  if (mate !== null) return mate > 0 ? `M${mate}` : `-M${Math.abs(mate)}`;
  if (cp === null) return '?';
  const pawns = cp / 100;
  return (pawns >= 0 ? '+' : '') + pawns.toFixed(2);
}
