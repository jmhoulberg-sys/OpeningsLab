import { useState } from 'react';
import { useTrainingStore } from '../../store/trainingStore';
import type { PostLineMode } from '../../types';

interface PlayOnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlayOnModal({ isOpen, onClose }: PlayOnModalProps) {
  const { startPostLine } = useTrainingStore();
  const [computerExpanded, setComputerExpanded] = useState(false);
  const [topMovesOn, setTopMovesOn] = useState(true);

  if (!isOpen) return null;

  function go(mode: PostLineMode) {
    startPostLine(mode, false, topMovesOn);
    onClose();
  }

  function handleClose() {
    setComputerExpanded(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-brand-surface border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 p-8 max-w-md w-full mx-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">Play On</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white text-lg leading-none transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Analysis toggles */}
        <div className="mb-5 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/40 space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
            Show during play
          </p>
          <Toggle
            label="Top 3 database moves"
            description="Win/draw/loss % from Lichess game database"
            value={topMovesOn}
            onChange={setTopMovesOn}
          />
        </div>

        <div className="flex flex-col gap-3">
          {/* Against Top Player Moves */}
          <button
            onClick={() => go('top-moves')}
            className="w-full rounded-xl border border-slate-600/50 bg-slate-800/60 p-4 text-left transition-all hover:border-sky-500/60 hover:bg-slate-700/60 cursor-pointer"
          >
            <div className="text-white font-bold text-sm mb-1">
              Against Top Player Moves
            </div>
            <div className="text-slate-400 text-xs">
              Opponent plays the most popular human responses
            </div>
          </button>

          {/* Against Computer — expandable */}
          <div className="rounded-xl border border-slate-600/50 bg-slate-800/60 overflow-hidden">
            <button
              onClick={() => setComputerExpanded((v) => !v)}
              className="w-full p-4 text-left flex items-center justify-between cursor-pointer hover:bg-slate-700/40 transition-colors"
            >
              <div>
                <div className="text-white font-bold text-sm inline mr-2">
                  Against Computer
                </div>
                <span className="text-slate-500 text-xs">(engine coming soon)</span>
                <div className="text-slate-400 text-xs mt-0.5">
                  Choose a difficulty level
                </div>
              </div>
              <span className="text-slate-400 text-xs ml-2 shrink-0">
                {computerExpanded ? '▲' : '▼'}
              </span>
            </button>

            {computerExpanded && (
              <div className="border-t border-slate-700/50 divide-y divide-slate-700/40">
                {(
                  [
                    { label: 'Beginner', mode: 'computer-beginner' as const },
                    { label: 'Advanced', mode: 'computer-advanced' as const },
                    { label: 'Pro', mode: 'computer-pro' as const },
                  ] as const
                ).map(({ label, mode }) => (
                  <button
                    key={mode}
                    onClick={() => go(mode)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors cursor-pointer"
                  >
                    <span className="text-slate-200 text-sm">{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle row ──────────────────────────────────────────────────────

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm text-white font-medium">{label}</div>
        <div className="text-xs text-slate-500 leading-tight">{description}</div>
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
          value ? 'bg-sky-500' : 'bg-slate-600'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
            value ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
