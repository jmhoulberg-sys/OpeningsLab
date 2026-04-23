import type { LichessBookPosition } from '../services/lichessBookService';

const STAFFORD_QH4_FEN = 'r1b1k2r/ppp2ppp/2p2p2/3P4/7q/8/PPP3PP/R1BQKBNR w kq -';

export const LICHESS_FALLBACKS: Record<string, LichessBookPosition> = {
  [STAFFORD_QH4_FEN]: {
    fen: STAFFORD_QH4_FEN,
    source: 'lichess-db',
    totalGames: 331,
    white: 51,
    draws: 16,
    black: 264,
    moves: [
      {
        san: 'g3',
        white: 51,
        draws: 14,
        black: 218,
        total: 283,
        playPct: 85,
        whitePct: 18,
        drawPct: 5,
        blackPct: 77,
      },
      {
        san: 'Ke2',
        white: 0,
        draws: 2,
        black: 46,
        total: 48,
        playPct: 15,
        whitePct: 0,
        drawPct: 4,
        blackPct: 96,
      },
    ],
  },
};
