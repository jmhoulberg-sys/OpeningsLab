import { Crown, LogIn, Settings, UserCircle2 } from 'lucide-react';
import { useTrainingStore } from '../../store/trainingStore';
import { useProfileStore } from '../../store/profileStore';
import { getLevelInfo, useProgressionStore } from '../../store/progressionStore';
import BrandMark from '../Brand/BrandMark';

interface HeaderProps {
  onSettingsClick: () => void;
  onHomeClick: () => void;
  onProfileClick: () => void;
}

export default function Header({ onSettingsClick, onHomeClick, onProfileClick }: HeaderProps) {
  const { opening, selectedLine } = useTrainingStore();
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
    <header className="border-b border-stone-800/80 bg-stone-950">
      <div className="mx-auto grid max-w-[1600px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={onHomeClick}
          className="group flex items-center gap-3 justify-self-start cursor-pointer"
        >
          <div className="transition-transform duration-200 group-hover:translate-x-0.5">
            <BrandMark />
          </div>
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
          <div className="hidden h-[68px] min-w-[138px] rounded-2xl bg-stone-900 px-3.5 py-2.5 sm:flex sm:flex-col sm:justify-between">
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
            <div className="h-[14px] text-[11px] text-stone-500">
              {isLoggedIn ? `${xpToNext} XP to next` : 'Log in to see details'}
            </div>
          </div>
          <button
            onClick={onProfileClick}
            className="hidden h-[68px] min-w-[156px] items-center justify-center gap-2 rounded-2xl border border-stone-700/45 bg-stone-800 px-4 text-sm font-semibold text-stone-100 transition-colors hover:bg-stone-700 sm:flex cursor-pointer"
            title="My Profile"
          >
            <UserCircle2 size={17} className="text-sky-300" />
            My Profile
          </button>
          {isLoggedIn ? (
            <button
              onClick={onProfileClick}
              className="hidden h-[68px] min-w-[172px] items-center gap-2 rounded-2xl border border-stone-700/45 bg-stone-800 px-4 text-sm text-stone-200 transition-colors hover:bg-stone-700 sm:flex cursor-pointer"
              title="My Profile"
            >
              <UserCircle2 size={17} className="text-sky-300" />
              <span className="max-w-[120px] truncate font-semibold">{accountLabel}</span>
            </button>
          ) : (
            <button
              onClick={login}
              className="hidden h-[68px] min-w-[172px] items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 sm:flex cursor-pointer"
            >
              <LogIn size={16} />
              Sign in
            </button>
          )}
          <button
            onClick={onSettingsClick}
            className="h-[68px] rounded-2xl border border-stone-700/45 bg-stone-800 px-4 text-stone-300 transition-colors hover:bg-stone-700 hover:text-white cursor-pointer"
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
