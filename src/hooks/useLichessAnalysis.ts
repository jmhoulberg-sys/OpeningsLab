import { useEffect, useRef, useState } from 'react';
import {
  fetchLichessBookPosition,
  getTopBookMoves,
  type LichessBookMove as LichessMove,
} from '../services/lichessBookService';
import {
  DEFAULT_LICHESS_RATINGS,
  DEFAULT_LICHESS_SPEEDS,
} from '../store/settingsStore';

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
  playedSans: string[],
  enabled: boolean,
  topMoves: number,
  speeds: string[] = [...DEFAULT_LICHESS_SPEEDS],
  ratings: number[] = [...DEFAULT_LICHESS_RATINGS],
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
      const positionResult = await fetchLichessBookPosition(fen, {
        topMoves,
        speeds,
        ratings,
        playedSans,
      });

      const moves = getTopBookMoves(positionResult, topMoves);
      const error = positionResult.status === 'api_error' || positionResult.status === 'rate_limited'
        ? positionResult.error ?? 'Opening database unavailable.'
        : null;

      setState({
        moves,
        evalCp: null,
        evalMate: null,
        loading: false,
        error,
      });
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [enabled, fen, playedSans, ratings, speeds, topMoves]);

  return state;
}

export function formatEval(cp: number | null, mate: number | null): string {
  if (mate !== null) return mate > 0 ? `M${mate}` : `-M${Math.abs(mate)}`;
  if (cp === null) return '?';
  const pawns = cp / 100;
  return (pawns >= 0 ? '+' : '') + pawns.toFixed(2);
}
