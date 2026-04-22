import { Crown, LogIn, Settings, UserCircle2 } from 'lucide-react';
import { useTrainingStore } from '../../store/trainingStore';
import { useProfileStore } from '../../store/profileStore';
import { getLevelInfo, useProgressionStore } from '../../store/progressionStore';

interface HeaderProps {
  onSettingsClick: () => void;
  onHomeClick: () => void;
}

export default function Header({ onSettingsClick, onHomeClick }: HeaderProps) {
  const { opening, selectedLine, phase, mistakes } = useTrainingStore();
  const { isLoggedIn, displayName, login } = useProfileStore();
  const xpTotal = useProgressionStore((state) => state.xpTotal);
  const accountLabel = displayName.trim() || 'Opening Player';
  const levelInfo = getLevelInfo(xpTotal);
  const xpToNext = Math.max(0, levelInfo.nextLevelXp - xpTotal);

  return (
    <header className="border-b border-stone-800/60 bg-stone-950/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={onHomeClick}
          className="group flex items-center gap-3 cursor-pointer"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-sky-400 flex-shrink-0">
            <circle cx="12" cy="5" r="3" />
            <path d="M10 8l-2 6h8l-2-6z" />
            <path d="M7 15l-1 3h12l-1-3z" />
          </svg>
          <span className="text-lg font-bold tracking-tight text-white transition-colors group-hover:text-sky-300">
            OpeningsLab
          </span>
        </button>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 lg:flex">
          {opening ? (
            <div className="flex min-w-0 max-w-3xl items-center gap-3 rounded-[20px] bg-stone-900/90 px-4 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                  Current opening
                </div>
                <div className="mt-1 flex min-w-0 items-center gap-2 text-sm">
                  <span className="truncate font-semibold text-stone-100">{opening.name}</span>
                  {selectedLine && (
                    <>
                      <span className="text-stone-600">/</span>
                      <span className="truncate text-stone-400">{selectedLine.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-stone-500">Choose a course and start training.</div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden rounded-2xl bg-stone-900 px-3.5 py-2.5 sm:block">
            <div className="flex items-center gap-2">
              <Crown size={15} className="text-sky-300" />
              <span className="text-sm font-semibold text-white">Level {levelInfo.level}</span>
            </div>
            <div className="mt-2 h-1.5 w-24 rounded-full bg-stone-800">
              <div
                className="h-1.5 rounded-full bg-sky-400 transition-all duration-500"
                style={{ width: `${levelInfo.progressPct}%` }}
              />
            </div>
            <div className="mt-1 text-[11px] text-stone-500">{xpToNext} XP to next</div>
          </div>
          {phase === 'training' && (
            <div className="hidden items-center gap-1.5 text-sm sm:flex">
              <span className="text-stone-400">Mistakes</span>
              <span className={`font-bold tabular-nums ${mistakes > 0 ? 'text-rose-300' : 'text-stone-200'}`}>
                {mistakes}
              </span>
            </div>
          )}
          <PhaseBadge phase={phase} />
          {isLoggedIn ? (
            <button
              onClick={onSettingsClick}
              className="hidden items-center gap-2 rounded-xl border border-stone-700/45 bg-stone-800 px-3.5 py-2.5 text-sm text-stone-200 transition-colors hover:bg-stone-700 sm:flex cursor-pointer"
              title="Account"
            >
              <UserCircle2 size={17} className="text-sky-300" />
              <span className="max-w-[120px] truncate font-semibold">{accountLabel}</span>
            </button>
          ) : (
            <button
              onClick={login}
              className="hidden items-center gap-2 rounded-xl bg-sky-500 px-3.5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 sm:flex cursor-pointer"
            >
              <LogIn size={16} />
              Sign in
            </button>
          )}
          <button
            onClick={onSettingsClick}
            className="rounded-xl border border-stone-700/45 bg-stone-800 px-3.5 py-2.5 text-stone-300 transition-colors hover:bg-stone-700 hover:text-white cursor-pointer"
            title="Settings"
            aria-label="Open settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

function PhaseBadge({ phase }: { phase: string }) {
  const config: Record<string, { label: string; color: string }> = {
    idle: { label: 'Idle', color: 'border-stone-700/45 bg-stone-800 text-stone-400' },
    setup: { label: 'Setup', color: 'border-sky-400/15 bg-sky-400/10 text-sky-300' },
    'line-select': { label: 'Pick Line', color: 'border-sky-400/18 bg-sky-400/10 text-sky-300' },
    training: { label: 'Training', color: 'border-emerald-300/15 bg-emerald-300/10 text-emerald-300' },
    completed: { label: 'Done', color: 'border-emerald-300/15 bg-emerald-300/10 text-emerald-300' },
  };

  const { label, color } = config[phase] ?? config.idle;

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}
