import { Flame, LogIn, Settings, UserCircle2 } from 'lucide-react';
import { useProfileStore } from '../../store/profileStore';
import { getLevelInfo, useProgressionStore } from '../../store/progressionStore';
import BrandMark from '../Brand/BrandMark';
import StreakBadge from '../Streak/StreakBadge';

interface HeaderProps {
  onSettingsClick: () => void;
  onHomeClick: () => void;
  onProfileClick: () => void;
  titleOverride?: string;
  subtitleOverride?: string;
}

export default function Header({ onSettingsClick, onHomeClick, onProfileClick }: HeaderProps) {
  const { isLoggedIn, displayName, openAuthModal } = useProfileStore();
  const xpTotal = useProgressionStore((state) => state.xpTotal);
  const accountLabel = typeof displayName === 'string' && displayName.trim()
    ? displayName.trim()
    : 'Opening Player';
  const levelInfo = getLevelInfo(xpTotal);

  return (
    <header className="relative z-[80] border-b border-stone-800/80 bg-stone-950">
      <div className="mx-auto grid max-w-[1600px] grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6">
        <button
          onClick={onHomeClick}
          className="group flex items-center gap-3 justify-self-start cursor-pointer"
        >
          <div className="transition-transform duration-200 group-hover:translate-x-0.5">
            <BrandMark />
          </div>
        </button>

        <div className="hidden min-w-0 justify-self-center lg:block">
          <div />
        </div>

        <div className="flex items-center gap-2 justify-self-end sm:gap-2.5">
          {isLoggedIn ? (
            <div className="relative z-[90]">
              <StreakBadge size="medium" />
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="hidden h-10 items-center gap-2 rounded-xl border border-stone-700/45 bg-stone-900 px-3 text-sm font-semibold text-stone-300 transition-colors hover:bg-stone-800 hover:text-white sm:flex cursor-pointer"
              title="Log in to see streak"
            >
              <Flame size={18} className="text-stone-500" />
            </button>
          )}
          {isLoggedIn ? (
            <button
              onClick={onProfileClick}
              className="hidden h-10 min-w-[132px] items-center gap-2 rounded-xl border border-stone-700/45 bg-stone-800 px-3 text-sm text-stone-200 transition-colors hover:bg-stone-700 sm:flex cursor-pointer"
              title="My Profile"
            >
              <UserCircle2 size={17} className="text-stone-300" />
              <div className="min-w-0">
                <div className="max-w-[120px] truncate text-left font-semibold text-white">
                  {accountLabel}
                </div>
                <div className="mt-1 h-1 w-[90px] rounded-full bg-stone-700">
                  <div
                    className="h-1 rounded-full bg-emerald-400"
                    style={{ width: `${levelInfo.progressPct}%` }}
                  />
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('signup')}
              className="hidden h-10 min-w-[104px] items-center justify-center gap-2 rounded-xl bg-sky-500 px-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 sm:flex cursor-pointer"
            >
              <LogIn size={16} />
              Sign in
            </button>
          )}
          <button
            onClick={onSettingsClick}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-700/45 bg-stone-800 text-stone-300 transition-colors hover:bg-stone-700 hover:text-white cursor-pointer"
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
