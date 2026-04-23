import { Crown, LogIn, Settings, UserCircle2 } from 'lucide-react';
import { useTrainingStore } from '../../store/trainingStore';
import { useProfileStore } from '../../store/profileStore';
import { getLevelInfo, useProgressionStore } from '../../store/progressionStore';

interface HeaderProps {
  onSettingsClick: () => void;
  onHomeClick: () => void;
}

export default function Header({ onSettingsClick, onHomeClick }: HeaderProps) {
  const { opening, selectedLine, phase } = useTrainingStore();
  const { isLoggedIn, displayName, login } = useProfileStore();
  const xpTotal = useProgressionStore((state) => state.xpTotal);
  const accountLabel = typeof displayName === 'string' && displayName.trim()
    ? displayName.trim()
    : 'Opening Player';
  const levelInfo = getLevelInfo(xpTotal);
  const xpToNext = Math.max(0, levelInfo.nextLevelXp - xpTotal);
  const headerTitle = opening ? opening.name : 'Board-first opening training';
  const headerSubtitle = selectedLine
    ? selectedLine.name
    : opening
      ? 'Finish setup, unlock the next line, then practice it your way'
      : 'Choose a course and start training';

  return (
    <header className="border-b border-stone-800/60 bg-stone-950/95 backdrop-blur-sm">
      <div className="mx-auto grid max-w-[1600px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={onHomeClick}
          className="group flex items-center gap-3 justify-self-start cursor-pointer"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-sky-400 flex-shrink-0">
            <circle cx="12" cy="5" r="3" />
            <path d="M10 8l-2 6h8l-2-6z" />
            <path d="M7 15l-1 3h12l-1-3z" />
          </svg>
          <span className="text-[1.35rem] font-bold tracking-tight text-white transition-colors group-hover:text-sky-300">
            OpeningsLab
          </span>
        </button>

        <div className="hidden min-w-0 justify-self-center lg:block">
          <div className="flex h-[72px] min-w-[430px] items-center justify-center rounded-[22px] border border-stone-800/60 bg-stone-900/88 px-5 shadow-[0_12px_34px_rgba(0,0,0,0.2)]">
            <div>
            <div className="text-center text-lg font-bold leading-tight text-white">
              {headerTitle}
            </div>
            <div className="mt-1 max-w-[520px] truncate text-center text-sm text-stone-400">
              {headerSubtitle}
            </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 justify-self-end">
          <div className="hidden h-[62px] min-w-[138px] rounded-2xl bg-stone-900 px-3.5 py-2.5 sm:block">
            <div className="flex items-center gap-2">
              <Crown size={15} className="text-sky-300" />
              <span className="text-sm font-semibold text-white">
                {isLoggedIn ? `Level ${levelInfo.level}` : 'Sign in for level'}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-24 rounded-full bg-stone-800">
              <div
                className="h-1.5 rounded-full bg-sky-400 transition-all duration-500"
                style={{ width: `${isLoggedIn ? levelInfo.progressPct : 100}%` }}
              />
            </div>
            {!isLoggedIn && <div className="mt-1 text-[11px] text-stone-500">Log in to see details</div>}
            {isLoggedIn && <div className="mt-1 text-[11px] text-stone-500">{xpToNext} XP to next</div>}
          </div>
          <PhaseBadge phase={phase} />
          {isLoggedIn ? (
            <button
              onClick={onSettingsClick}
              className="hidden h-[62px] min-w-[172px] items-center gap-2 rounded-2xl border border-stone-700/45 bg-stone-800 px-4 text-sm text-stone-200 transition-colors hover:bg-stone-700 sm:flex cursor-pointer"
              title="Account"
            >
              <UserCircle2 size={17} className="text-sky-300" />
              <span className="max-w-[120px] truncate font-semibold">{accountLabel}</span>
            </button>
          ) : (
            <button
              onClick={login}
              className="hidden h-[62px] min-w-[172px] items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 sm:flex cursor-pointer"
            >
              <LogIn size={16} />
              Sign in
            </button>
          )}
          <button
            onClick={onSettingsClick}
            className="h-[62px] rounded-2xl border border-stone-700/45 bg-stone-800 px-4 text-stone-300 transition-colors hover:bg-stone-700 hover:text-white cursor-pointer"
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
