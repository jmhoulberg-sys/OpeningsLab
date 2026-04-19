import { useEffect, useState } from 'react';

interface EvalBarProps {
  fen: string;
  height: number;
}

export default function EvalBar({ fen, height }: EvalBarProps) {
  const [evalScore, setEvalScore] = useState<number | null>(null);
  const [isMate, setIsMate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=1`,
          { signal: AbortSignal.timeout(5000) },
        );
        if (!res.ok || cancelled) return;
        const data = await res.json() as {
          pvs?: Array<{ cp?: number; mate?: number }>;
        };
        const pv = data.pvs?.[0];
        if (!pv || cancelled) return;
        if (pv.mate !== undefined) {
          setIsMate(true);
          setEvalScore(pv.mate > 0 ? 10 : -10);
        } else if (pv.cp !== undefined) {
          setIsMate(false);
          setEvalScore(Math.max(-10, Math.min(10, pv.cp / 100)));
        }
      } catch { /* silently ignore */ }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fen]);

  // 50% = equal; each pawn = 5% shift; clamped to 5%–95%
  const whitePercent = evalScore !== null
    ? Math.max(5, Math.min(95, 50 + (evalScore / 10) * 45))
    : 50;

  const blackPercent = 100 - whitePercent;

  const displayText = evalScore === null
    ? ''
    : isMate
    ? `M${Math.abs(evalScore)}`
    : Math.abs(evalScore) < 0.1
    ? '0.0'
    : `${Math.abs(evalScore).toFixed(1)}`;

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: 14 }}>
      {/* The bar */}
      <div
        className="relative w-full rounded overflow-hidden flex flex-col"
        style={{ height: height - 20 }}
      >
        {/* Black section (top) */}
        <div
          className="w-full bg-slate-900 transition-all duration-500"
          style={{ height: `${blackPercent}%` }}
        />
        {/* Divider */}
        <div className="w-full h-px bg-slate-500 flex-shrink-0" />
        {/* White section (bottom) */}
        <div
          className="w-full bg-slate-100 transition-all duration-500"
          style={{ height: `${whitePercent}%` }}
        />
      </div>
      {/* Eval text */}
      <span className="text-[9px] font-bold text-slate-400 leading-none">
        {displayText}
      </span>
    </div>
  );
}
