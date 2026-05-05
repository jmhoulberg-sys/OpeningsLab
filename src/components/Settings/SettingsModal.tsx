import { useState } from 'react';
import { ArrowLeft, LogIn, LogOut, UserCircle2 } from 'lucide-react';
import { useProgressStore } from '../../store/progressStore';
import {
  DEFAULT_LICHESS_RATINGS,
  DEFAULT_LICHESS_SPEEDS,
  LICHESS_RATING_OPTIONS,
  LICHESS_SPEED_OPTIONS,
  useSettingsStore,
} from '../../store/settingsStore';
import { useProfileStore } from '../../store/profileStore';
import { useProgressionStore } from '../../store/progressionStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { reset } = useProgressStore();
  const resetProgression = useProgressionStore((state) => state.reset);
  const {
    restartFrom,
    setRestartFrom,
    lichessTopMoves,
    setLichessTopMoves,
    lichessSpeeds,
    toggleLichessSpeed,
    lichessRatings,
    toggleLichessRating,
    lichessVariant,
    enableSRReminders,
    setEnableSRReminders,
    showEvalBar,
    setShowEvalBar,
  } = useSettingsStore();
  const {
    isLoggedIn,
    openAuthModal,
    logout,
    resetProfile,
  } = useProfileStore();

  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) {
    return null;
  }

  function handleReset() {
    reset();
    resetProgression();
    resetProfile();
    setConfirmReset(false);
    onClose();
  }

  function handleClose() {
    setConfirmReset(false);
    onClose();
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-brand-bg text-slate-100">
      <header className="border-b border-stone-800/80 bg-stone-950">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6">
          <button
            onClick={handleClose}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-stone-700/45 bg-stone-900 px-3 text-sm font-semibold text-stone-300 transition-colors hover:bg-stone-800 hover:text-white cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 className="text-lg font-bold text-white">Settings</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[20px] border border-stone-800/70 bg-stone-900/55 p-4">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Account</div>
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <UserCircle2 size={16} className="text-sky-300" />
                    {isLoggedIn ? 'Signed in locally' : 'No account connected'}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-stone-400">
                    {isLoggedIn
                      ? 'This browser is signed in locally. Open your profile from the header to see progress.'
                      : 'Create an account or log in from the popup to save your identity on this browser.'}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {!isLoggedIn ? (
                  <>
                    <button
                      onClick={() => {
                        openAuthModal('signup');
                        onClose();
                      }}
                      className="flex-1 rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 cursor-pointer"
                    >
                      Create account
                    </button>
                    <button
                      onClick={() => {
                        openAuthModal('login');
                        onClose();
                      }}
                      className="flex-1 rounded-xl border border-stone-700/45 bg-stone-900 px-3 py-2 text-sm font-semibold text-stone-200 transition-colors hover:bg-stone-700 cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-2">
                        <LogIn size={14} />
                        Log in
                      </span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-700/45 bg-stone-900 px-3 py-2 text-sm font-semibold text-stone-200 transition-colors hover:bg-stone-700 cursor-pointer"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[20px] border border-stone-800/70 bg-stone-900/55 p-4">
            <label className="mb-3 block text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
              Restart line from
            </label>
            <div className="flex flex-col overflow-hidden rounded-xl border border-stone-700/45 sm:flex-row">
              {(
                [
                  { value: 'setup', label: 'Setup position' },
                  { value: 'start', label: 'Very start' },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setRestartFrom(value)}
                  className={`flex-1 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                    restartFrom === value
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[20px] border border-stone-800/70 bg-stone-900/55 p-4 lg:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
              Lichess response settings
            </label>

            <div className="mt-3 rounded-2xl border border-stone-800/70 bg-stone-950/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Top moves used</div>
                  <div className="mt-1 text-xs text-stone-400">
                    Choose how many of the most popular moves can be sampled.
                  </div>
                </div>
                <div className="text-lg font-bold text-sky-300">{lichessTopMoves}</div>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={lichessTopMoves}
                onChange={(e) => setLichessTopMoves(Number(e.target.value))}
                className="mt-3 w-full cursor-pointer accent-sky-500"
              />
            </div>

            <div className="mt-3 rounded-2xl border border-stone-800/70 bg-stone-950/50 p-4">
              <div className="text-sm font-semibold text-white">Speeds</div>
              <div className="mt-1 text-xs text-stone-400">
                Current default: {DEFAULT_LICHESS_SPEEDS.join(', ')}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {LICHESS_SPEED_OPTIONS.map((speed) => {
                  const active = lichessSpeeds.includes(speed);
                  return (
                    <button
                      key={speed}
                      onClick={() => toggleLichessSpeed(speed)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-sky-500 text-slate-950'
                          : 'border border-stone-700/45 bg-stone-900 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      {speed}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-stone-800/70 bg-stone-950/50 p-4">
              <div className="text-sm font-semibold text-white">Ratings</div>
              <div className="mt-1 text-xs text-stone-400">
                Current default: {DEFAULT_LICHESS_RATINGS.join(', ')}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {LICHESS_RATING_OPTIONS.map((rating) => {
                  const active = lichessRatings.includes(rating);
                  return (
                    <button
                      key={rating}
                      onClick={() => toggleLichessRating(rating)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-emerald-500 text-slate-950'
                          : 'border border-stone-700/45 bg-stone-900 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      {rating}+
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-stone-800/70 bg-stone-950/50 p-4">
              <div className="text-sm font-semibold text-white">Variant</div>
              <div className="mt-1 text-xs text-stone-400">
                {lichessVariant}
              </div>
            </div>
          </section>

          <section className="rounded-[20px] border border-stone-800/70 bg-stone-900/55 p-4">
            <label className="mb-3 block text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
              Evaluation Bar
            </label>
            <ToggleButton active={showEvalBar} onClick={() => setShowEvalBar(!showEvalBar)}>
              {showEvalBar ? 'Eval Bar On' : 'Eval Bar Off'}
            </ToggleButton>
          </section>

          <section className="rounded-[20px] border border-stone-800/70 bg-stone-900/55 p-4">
            <label className="mb-3 block text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
              Spaced Repetition
            </label>
            <ToggleButton active={enableSRReminders} onClick={() => setEnableSRReminders(!enableSRReminders)}>
              {enableSRReminders ? 'Reminders On' : 'Reminders Off'}
            </ToggleButton>
          </section>

          <section className="rounded-[20px] border border-rose-400/15 bg-rose-400/5 p-4 lg:col-span-2">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-rose-200/80">Reset profile</div>
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full rounded-xl border border-rose-400/18 bg-rose-400/10 py-2.5 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-400/14 cursor-pointer"
              >
                Reset Profile and Progress
              </button>
            ) : (
              <div className="rounded-xl border border-rose-400/18 bg-rose-400/10 p-4">
                <p className="mb-3 text-sm font-semibold text-rose-200">
                  This will wipe the local test profile and all training progress.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 rounded-xl bg-rose-500 py-2 text-sm font-bold text-white transition-colors hover:bg-rose-400 cursor-pointer"
                  >
                    Yes, reset all
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                  className="flex-1 rounded-xl border border-stone-700/45 bg-stone-800 py-2 text-sm font-semibold text-stone-200 transition-colors hover:bg-stone-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border py-2 text-sm font-semibold transition-colors cursor-pointer ${
        active
          ? 'border-emerald-400/40 bg-emerald-500 text-slate-950'
          : 'border-stone-700/45 bg-stone-800 text-stone-300 hover:bg-stone-700'
      }`}
    >
      {children}
    </button>
  );
}
