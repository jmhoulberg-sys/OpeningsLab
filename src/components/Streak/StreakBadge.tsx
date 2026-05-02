import { useState } from 'react';
import { Flame } from 'lucide-react';
import { getCurrentStreak, getRecentStreakDays, useProgressionStore } from '../../store/progressionStore';

interface StreakBadgeProps {
  compact?: boolean;
}

export default function StreakBadge({ compact = false }: StreakBadgeProps) {
  const daily = useProgressionStore((state) => state.daily);
  const [open, setOpen] = useState(false);
  const streak = getCurrentStreak(daily);
  const days = getRecentStreakDays(daily);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center justify-center gap-1.5 rounded-2xl border border-stone-700/45 bg-stone-900 text-white transition-colors hover:bg-stone-800 cursor-pointer ${
          compact ? 'h-10 px-3 text-base' : 'h-[68px] px-4 text-lg'
        }`}
        title={`${streak} day streak`}
        aria-expanded={open}
      >
        <Flame size={compact ? 18 : 22} className="text-amber-400" fill="currentColor" />
        <span className="font-black">{streak}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-xl border border-stone-700/70 bg-stone-950 p-4 text-left shadow-xl shadow-black/45">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xl font-black text-white">
                {streak} day streak
              </div>
              <div className="mt-1 text-sm font-semibold text-stone-300">
                {streak > 0 ? "You've done your line for today!" : 'Complete one line to start.'}
              </div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/35 bg-amber-400/12 text-amber-300">
              <Flame size={31} fill="currentColor" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1.5 rounded-lg bg-stone-900/85 p-2">
            {days.map((day) => (
              <div key={day.key} className="text-center">
                <div className={`text-[11px] font-black ${day.today ? 'text-amber-300' : 'text-stone-200'}`}>
                  {day.label}
                </div>
                <div
                  className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
                    day.active
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-stone-700 text-stone-500'
                  }`}
                >
                  {day.active ? '✓' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
