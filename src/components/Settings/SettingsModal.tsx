import { useState } from 'react';
import { LogIn, LogOut, ShieldCheck, X } from 'lucide-react';
import { useTrainingStore } from '../../store/trainingStore';
import { useProgressStore } from '../../store/progressStore';
import { useSettingsStore, RATING_OPTIONS } from '../../store/settingsStore';
import { useProfileStore } from '../../store/profileStore';
import { useLichessAuthStore } from '../../store/lichessAuthStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { randomTopX, setRandomTopX } = useTrainingStore();
  const { reset } = useProgressStore();
  const {
    restartFrom,
    setRestartFrom,
    minRating,
    setMinRating,
    explorerOpponentMode,
    setExplorerOpponentMode,
    enableSRReminders,
    setEnableSRReminders,
    showEvalBar,
    setShowEvalBar,
  } = useSettingsStore();
  const { displayName, isLoggedIn } = useProfileStore();
  const { login, logout, error: authError, status: authStatus } = useLichessAuthStore();

  const [confirmReset, setConfirmReset] = useState(false);

  function handleReset() {
    reset();
    setConfirmReset(false);
  }

  function handleBackdropClick() {
    setConfirmReset(false);
    onClose();
  }

  function handleClose() {
    setConfirmReset(false);
    onClose();
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px]"
          onClick={handleBackdropClick}
        />
      )}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-[21rem] flex-col bg-stone-900 shadow-2xl shadow-black/60 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button
            onClick={handleClose}
            className="rounded-xl border border-stone-700/45 bg-stone-800 px-2.5 py-2 text-stone-300 transition-colors hover:bg-stone-700 hover:text-white cursor-pointer"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-6 py-6">
          <section>
            <div className="mb-1 text-sm font-semibold text-white">Account</div>
            <p className="mb-3 text-xs leading-relaxed text-stone-400">
              Connect a Lichess session to unlock live player-move continuation.
            </p>

            <div className="mb-4 rounded-2xl border border-stone-700/45 bg-stone-800 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <ShieldCheck size={16} className="text-sky-300" />
                    {isLoggedIn ? 'Connected to Lichess' : 'Not connected'}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-stone-400">
                    {isLoggedIn
                      ? 'Explorer lookups now use your authenticated Lichess session.'
                      : 'Lichess now requires authentication for opening explorer access.'}
                  </p>
                </div>
                <button
                  onClick={isLoggedIn ? logout : login}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    isLoggedIn
                      ? 'border border-stone-700/45 bg-stone-900 text-stone-200 hover:bg-stone-700'
                      : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                  }`}
                >
                  {isLoggedIn ? <LogOut size={14} /> : <LogIn size={14} />}
                  {isLoggedIn ? 'Sign out' : authStatus === 'authenticating' ? 'Connecting...' : 'Sign in'}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-stone-700/45 bg-stone-800 px-3 py-2">
              <div className="text-xs text-stone-400">Account name</div>
              <div className="mt-1 text-sm font-semibold text-white">
                {isLoggedIn ? displayName || 'Lichess Player' : 'Connect Lichess to continue'}
              </div>
            </div>

            {authError && (
              <p className="mt-3 text-xs text-amber-300">{authError}</p>
            )}
          </section>

          <section>
            <label className="mb-1 block text-sm font-semibold text-white">
              Restart Line from
            </label>
            <p className="mb-3 text-xs text-stone-400">
              Choose where restart begins.
            </p>
            <div className="flex overflow-hidden rounded-xl border border-stone-700/45">
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

          <section>
            <label className="mb-1 block text-sm font-semibold text-white">
              Opponent Depth
            </label>
            <p className="mb-4 text-xs text-stone-400">
              How many top moves the opponent can choose from.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={randomTopX}
                onChange={(e) => setRandomTopX(Number(e.target.value))}
                className="flex-1 cursor-pointer accent-sky-500"
              />
              <span className="w-5 text-center text-sm font-bold text-white">
                {randomTopX}
              </span>
            </div>
          </section>

          <section>
            <label className="mb-1 block text-sm font-semibold text-white">
              Lichess opponent mode
            </label>
            <p className="mb-3 text-xs text-stone-400">
              Choose how the opponent reply is selected from the live explorer data.
            </p>
            <div className="grid gap-2">
              <button
                onClick={() => setExplorerOpponentMode('most_popular')}
                className={`rounded-xl border px-3 py-3 text-left transition-colors cursor-pointer ${
                  explorerOpponentMode === 'most_popular'
                    ? 'border-sky-400/55 bg-sky-500/14 text-white'
                    : 'border-stone-700/45 bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                <div className="text-sm font-semibold">Most popular move</div>
                <div className="mt-1 text-xs text-stone-400">
                  Always play the single most played Lichess reply.
                </div>
              </button>
              <button
                onClick={() => setExplorerOpponentMode('top3_weighted')}
                className={`rounded-xl border px-3 py-3 text-left transition-colors cursor-pointer ${
                  explorerOpponentMode === 'top3_weighted'
                    ? 'border-sky-400/55 bg-sky-500/14 text-white'
                    : 'border-stone-700/45 bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                <div className="text-sm font-semibold">Top 3 weighted by popularity</div>
                <div className="mt-1 text-xs text-stone-400">
                  Randomly choose among the top 3 replies using game-count weights.
                </div>
              </button>
            </div>
          </section>

          <section>
            <label className="mb-1 block text-sm font-semibold text-white">
              Analysis rating filter
            </label>
            <p className="mb-3 text-xs text-stone-400">
              Minimum average rating for Lichess database moves.
            </p>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full cursor-pointer rounded-xl border border-stone-700/45 bg-stone-800 px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-sky-400/55"
            >
              {RATING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </section>

          <section>
            <label className="mb-1 block text-sm font-semibold text-white">
              Evaluation Bar
            </label>
            <p className="mb-3 text-xs text-stone-400">
              Show the evaluation bar beside the board.
            </p>
            <ToggleButton active={showEvalBar} onClick={() => setShowEvalBar(!showEvalBar)}>
              {showEvalBar ? 'Eval Bar On' : 'Eval Bar Off'}
            </ToggleButton>
          </section>

          <section>
            <label className="mb-1 block text-sm font-semibold text-white">
              Spaced Repetition
            </label>
            <p className="mb-3 text-xs text-stone-400">
              Show review reminders on favourited lines.
            </p>
            <ToggleButton active={enableSRReminders} onClick={() => setEnableSRReminders(!enableSRReminders)}>
              {enableSRReminders ? 'Reminders On' : 'Reminders Off'}
            </ToggleButton>
          </section>

          <section>
            <div className="mb-1 text-sm font-semibold text-white">Reset Progress</div>
            <p className="mb-4 text-xs text-stone-400">
              Permanently clear all line completion data.
            </p>
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full rounded-xl border border-rose-400/18 bg-rose-400/10 py-2.5 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-400/14 cursor-pointer"
              >
                Reset All Progress
              </button>
            ) : (
              <div className="rounded-xl border border-rose-400/18 bg-rose-400/10 p-4">
                <p className="mb-3 text-sm font-semibold text-rose-200">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 rounded-xl bg-rose-500 py-2 text-sm font-bold text-white transition-colors hover:bg-rose-400 cursor-pointer"
                  >
                    Yes, Reset
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
      </div>
    </>
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
