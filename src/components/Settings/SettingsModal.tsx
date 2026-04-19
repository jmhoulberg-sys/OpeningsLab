import { useState } from 'react';
import { X } from 'lucide-react';
import { useTrainingStore } from '../../store/trainingStore';
import { useProgressStore } from '../../store/progressStore';
import { useSettingsStore, RATING_OPTIONS } from '../../store/settingsStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { randomTopX, setRandomTopX } = useTrainingStore();
  const { reset } = useProgressStore();
  const { restartFrom, setRestartFrom, minRating, setMinRating, enableSRReminders, setEnableSRReminders, showEvalBar, setShowEvalBar } = useSettingsStore();

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
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={handleBackdropClick}
        />
      )}

      {/* Slide-in panel */}
      <div
        className={`fixed right-0 top-0 h-full w-80 z-50 bg-brand-surface border-l border-slate-700/60 shadow-2xl shadow-black/60 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/60">
          <h2 className="text-white font-bold text-lg">Settings</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8">

          {/* Restart from */}
          <section>
            <label className="block text-white font-semibold text-sm mb-1">
              Restart Line from
            </label>
            <p className="text-slate-400 text-xs mb-3">
              Where "Restart Line" resets the board to.
            </p>
            <div className="flex rounded-lg overflow-hidden border border-slate-600/50">
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
                      ? 'bg-brand-accent text-white'
                      : 'bg-slate-700/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Opponent Depth */}
          <section>
            <label className="block text-white font-semibold text-sm mb-1">
              Opponent Depth (top moves)
            </label>
            <p className="text-slate-400 text-xs mb-4">
              How many of the most popular moves the opponent can choose from.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={randomTopX}
                onChange={(e) => setRandomTopX(Number(e.target.value))}
                className="flex-1 accent-brand-accent cursor-pointer"
              />
              <span className="text-white font-bold text-sm w-5 text-center">
                {randomTopX}
              </span>
            </div>
          </section>

          {/* Analysis rating filter */}
          <section>
            <label className="block text-white font-semibold text-sm mb-1">
              Analysis rating filter
            </label>
            <p className="text-slate-400 text-xs mb-3">
              Minimum average rating for Lichess top-moves database.
              Lower = more games; higher = stronger players.
            </p>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full bg-slate-700/60 border border-slate-600/50 text-slate-200 text-sm rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:border-brand-accent/60"
            >
              {RATING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </section>

          {/* Evaluation Bar */}
          <section>
            <label className="block text-white font-semibold text-sm mb-1">
              Evaluation Bar
            </label>
            <p className="text-slate-400 text-xs mb-3">
              Show position evaluation bar next to the board.
            </p>
            <button
              onClick={() => setShowEvalBar(!showEvalBar)}
              className={`w-full py-2 text-sm font-semibold rounded-lg border transition-colors cursor-pointer ${
                showEvalBar
                  ? 'bg-brand-accent text-white border-brand-accent/50'
                  : 'bg-slate-700/40 text-slate-400 border-slate-600/50 hover:text-slate-200'
              }`}
            >
              {showEvalBar ? 'Eval Bar On' : 'Eval Bar Off'}
            </button>
          </section>

          {/* Spaced Repetition Reminders */}
          <section>
            <label className="block text-white font-semibold text-sm mb-1">
              Spaced Repetition
            </label>
            <p className="text-slate-400 text-xs mb-3">
              Show review reminders on favourited lines.
            </p>
            <button
              onClick={() => setEnableSRReminders(!enableSRReminders)}
              className={`w-full py-2 text-sm font-semibold rounded-lg border transition-colors cursor-pointer ${
                enableSRReminders
                  ? 'bg-brand-accent text-white border-brand-accent/50'
                  : 'bg-slate-700/40 text-slate-400 border-slate-600/50 hover:text-slate-200'
              }`}
            >
              {enableSRReminders ? 'Reminders On' : 'Reminders Off'}
            </button>
          </section>

          {/* Reset Progress */}
          <section>
            <div className="text-white font-semibold text-sm mb-1">Reset Progress</div>
            <p className="text-slate-400 text-xs mb-4">
              Permanently clear all line completion and unlock data.
            </p>
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full py-2.5 rounded-xl bg-red-900/40 border border-red-700/50 text-red-300 font-semibold text-sm hover:bg-red-800/50 transition-colors cursor-pointer"
              >
                Reset All Progress
              </button>
            ) : (
              <div className="rounded-xl border border-red-700/50 bg-red-900/30 p-4">
                <p className="text-red-300 text-sm font-semibold mb-3">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-sm transition-colors cursor-pointer"
                  >
                    Yes, Reset
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-sm transition-colors cursor-pointer"
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
