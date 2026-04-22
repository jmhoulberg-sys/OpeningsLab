import { useState } from 'react';
import { LogIn, LogOut, ShieldCheck, X } from 'lucide-react';
import { useTrainingStore } from '../../store/trainingStore';
import { useProgressStore } from '../../store/progressStore';
import { useSettingsStore, RATING_OPTIONS } from '../../store/settingsStore';
import { useProfileStore } from '../../store/profileStore';

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
    topMovesToInclude,
    setTopMovesToInclude,
    enableSRReminders,
    setEnableSRReminders,
    showEvalBar,
    setShowEvalBar,
  } = useSettingsStore();
  const { profileId, displayName, setDisplayName, exportData, importData, isLoggedIn, login, logout } = useProfileStore();

  const [confirmReset, setConfirmReset] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState(false);
  const [exported, setExported] = useState(false);

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

  function handleExport() {
    const code = exportData();
    if (!code) return;
    navigator.clipboard.writeText(code).catch(() => {});
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  }

  function handleImport() {
    const ok = importData(importCode);
    if (!ok) setImportError(true);
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
              Local sign-in for now. Email auth can plug in later.
            </p>

            <div className="mb-4 rounded-2xl border border-stone-700/45 bg-stone-800 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <ShieldCheck size={16} className="text-sky-300" />
                    {isLoggedIn ? 'Signed in locally' : 'Guest mode'}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-stone-400">
                    {isLoggedIn
                      ? 'Your name and progress stay on this device until full auth is added.'
                      : 'Sign in locally to give the app an account state before full auth ships.'}
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
                  {isLoggedIn ? 'Sign out' : 'Sign in'}
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-stone-400">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. ChessKid42"
                maxLength={32}
                className="w-full rounded-xl border border-stone-700/45 bg-stone-800 px-3 py-2 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-sky-400/55"
              />
            </div>

            <div
              className="mb-3 truncate rounded-xl border border-stone-700/45 bg-stone-800 px-3 py-2 font-mono text-xs text-stone-500"
              title={`Local profile ID: ${profileId}`}
            >
              Local ID: {profileId.slice(0, 12)}...
            </div>

            <button
              onClick={handleExport}
              className="mb-2 w-full rounded-xl border border-stone-700/45 bg-stone-800 py-2.5 text-sm font-semibold text-stone-200 transition-colors hover:bg-stone-700 cursor-pointer"
            >
              {exported ? 'Copied to clipboard' : 'Copy backup code'}
            </button>

            <div className="flex gap-2">
              <input
                type="text"
                value={importCode}
                onChange={(e) => {
                  setImportCode(e.target.value);
                  setImportError(false);
                }}
                placeholder="Paste backup code..."
                className="min-w-0 flex-1 rounded-xl border border-stone-700/45 bg-stone-800 px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-sky-400/55"
              />
              <button
                onClick={handleImport}
                disabled={!importCode.trim()}
                className="flex-shrink-0 rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:opacity-40 cursor-pointer"
              >
                Import
              </button>
            </div>
            {importError && (
              <p className="mt-1.5 text-xs text-rose-300">
                Invalid sync code. Please check and try again.
              </p>
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
              Top moves to include
            </label>
            <p className="mb-4 text-xs text-stone-400">
              Use the top 1-5 Lichess database moves for post-line practice.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={topMovesToInclude}
                onChange={(e) => setTopMovesToInclude(Number(e.target.value))}
                className="flex-1 cursor-pointer accent-sky-500"
              />
              <span className="w-5 text-center text-sm font-bold text-white">
                {topMovesToInclude}
              </span>
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
