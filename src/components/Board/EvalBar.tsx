import { useEffect, useMemo, useRef, useState } from 'react';
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

let engineWorker: Worker | null = null;
let engineReady = false;
let activeEvalToken = 0;

function getEngineWorker() {
  if (typeof window === 'undefined') return null;
  if (engineWorker) return engineWorker;
  try {
    engineWorker = new Worker('/stockfish/stockfish-18-lite-single.js');
    engineWorker.postMessage('uci');
    engineWorker.postMessage('isready');
    return engineWorker;
  } catch {
    engineWorker = null;
    return null;
  }
}

function evaluateFen(fen: string): number | null {
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

    return score;
  } catch {
    return null;
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
  const lastScoreRef = useRef(0);
  const [engineScore, setEngineScore] = useState<number | null>(null);
  const materialScore = useMemo(() => evaluateFen(fen), [fen]);
  const evaluatedScore = engineScore ?? materialScore;

  useEffect(() => {
    let cancelled = false;
    const token = ++activeEvalToken;
    const worker = getEngineWorker();
    if (!worker) {
      setEngineScore(null);
      return;
    }

    let latestScore: number | null = null;
    const timeout = window.setTimeout(() => {
      if (!cancelled && token === activeEvalToken) setEngineScore(null);
    }, 2500);

    function handleMessage(event: MessageEvent<string>) {
      const message = String(event.data);
      if (message === 'readyok') {
        engineReady = true;
      }

      const cpMatch = message.match(/\bscore cp (-?\d+)/);
      if (cpMatch) {
        latestScore = Number(cpMatch[1]);
      }

      const mateMatch = message.match(/\bscore mate (-?\d+)/);
      if (mateMatch) {
        latestScore = Number(mateMatch[1]) > 0 ? 1200 : -1200;
      }

      if (message.startsWith('bestmove')) {
        window.clearTimeout(timeout);
        if (!cancelled && token === activeEvalToken && latestScore !== null) {
          setEngineScore(latestScore);
        }
      }
    }

    worker.addEventListener('message', handleMessage);
    if (!engineReady) worker.postMessage('isready');
    worker.postMessage('ucinewgame');
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage('go depth 10');

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      worker.postMessage('stop');
      worker.removeEventListener('message', handleMessage);
    };
  }, [fen]);

  if (evaluatedScore !== null) {
    lastScoreRef.current = evaluatedScore;
  }
  const score = evaluatedScore ?? lastScoreRef.current;
  const whitePercent = scoreToWhitePercent(score);
  const blackPercent = 100 - whitePercent;
  const flipped = playerColor === 'black';
  const topSection = flipped ? { color: '#f8fafc', pct: whitePercent } : { color: '#050505', pct: blackPercent };
  const bottomSection = flipped ? { color: '#050505', pct: blackPercent } : { color: '#f8fafc', pct: whitePercent };

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: 22 }}>
      <div
        className="relative w-full overflow-hidden rounded-md border border-stone-900/80 flex flex-col"
        style={{ height: height - 20 }}
      >
        <div
          className="w-full"
          style={{ height: `${topSection.pct}%`, backgroundColor: topSection.color }}
        />
        <div className="w-full h-px bg-stone-500 flex-shrink-0" />
        <div
          className="w-full"
          style={{ height: `${bottomSection.pct}%`, backgroundColor: bottomSection.color }}
        />
      </div>
      <span className="text-[9px] font-bold text-stone-400 leading-none">{formatScore(score, playerColor)}</span>
    </div>
  );
}
