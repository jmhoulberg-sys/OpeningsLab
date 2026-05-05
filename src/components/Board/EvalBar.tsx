import { Chess } from 'chess.js';

interface EvalBarProps {
  fen: string;
  height: number;
  playerColor?: 'white' | 'black';
}

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

function evaluateFen(fen: string) {
  try {
    const chess = new Chess(fen);
    if (chess.isCheckmate()) {
      return chess.turn() === 'w' ? -1200 : 1200;
    }
    if (chess.isDraw() || chess.isStalemate()) return 0;

    let score = 0;
    chess.board().forEach((rank) => {
      rank.forEach((piece) => {
        if (!piece) return;
        score += (piece.color === 'w' ? 1 : -1) * PIECE_VALUES[piece.type];
      });
    });

    const turn = chess.turn();
    const mobility = chess.moves().length * 3;
    score += turn === 'w' ? mobility : -mobility;
    return score;
  } catch {
    return 0;
  }
}

function scoreToWhitePercent(score: number) {
  const clamped = Math.max(-1000, Math.min(1000, score));
  return Math.round(50 + (clamped / 1000) * 42);
}

function formatScore(score: number, playerColor: 'white' | 'black') {
  const signed = playerColor === 'white' ? score : -score;
  if (Math.abs(signed) >= 1100) return signed > 0 ? 'M' : '-M';
  const pawns = signed / 100;
  return `${pawns >= 0 ? '+' : ''}${pawns.toFixed(1)}`;
}

export default function EvalBar({ fen, height, playerColor = 'white' }: EvalBarProps) {
  const score = evaluateFen(fen);
  const whitePercent = scoreToWhitePercent(score);
  const blackPercent = 100 - whitePercent;
  const flipped = playerColor === 'black';
  const topSection = flipped ? { color: 'bg-slate-100', pct: whitePercent } : { color: 'bg-slate-900', pct: blackPercent };
  const bottomSection = flipped ? { color: 'bg-slate-900', pct: blackPercent } : { color: 'bg-slate-100', pct: whitePercent };

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: 14 }}>
      <div
        className="relative w-full overflow-hidden rounded flex flex-col"
        style={{ height: height - 20 }}
      >
        <div
          className={`w-full ${topSection.color}`}
          style={{ height: `${topSection.pct}%` }}
        />
        <div className="w-full h-px bg-slate-500 flex-shrink-0" />
        <div
          className={`w-full ${bottomSection.color}`}
          style={{ height: `${bottomSection.pct}%` }}
        />
      </div>
      <span className="text-[9px] font-bold text-slate-500 leading-none">{formatScore(score, playerColor)}</span>
    </div>
  );
}
