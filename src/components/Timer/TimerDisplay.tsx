import { useEffect } from 'react';
import { Timer } from 'lucide-react';
import { useTrainingStore } from '../../store/trainingStore';

export default function TimerDisplay() {
  const { timeLeft, timerRunning, tickTimer, mode } = useTrainingStore();

  useEffect(() => {
    if (!timerRunning || timeLeft <= 0) return;
    const id = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(id);
  }, [timerRunning, timeLeft, tickTimer]);

  if (mode !== 'time-trial' || timeLeft < 0) return null;

  const isUrgent = timeLeft <= 10;
  const pct = Math.min(100, (timeLeft / 60) * 100);

  return (
    <div className="px-4 py-2.5 bg-cyan-900/30 border-b border-cyan-800/40 flex-shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-1"><Timer size={14} className="inline" /> Time Trial</span>
        <span className={`text-sm font-bold tabular-nums ${isUrgent ? 'text-red-400 animate-pulse' : 'text-cyan-200'}`}>
          {timeLeft}s
        </span>
      </div>
      <div className="w-full bg-slate-700/60 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-cyan-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
