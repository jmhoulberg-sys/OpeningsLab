interface EvalBarProps {
  fen: string;
  height: number;
  playerColor?: 'white' | 'black';
}

export default function EvalBar({ fen: _fen, height, playerColor = 'white' }: EvalBarProps) {
  const whitePercent = 50;
  const blackPercent = 50;
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
      <span className="text-[9px] font-bold text-slate-500 leading-none">--</span>
    </div>
  );
}
