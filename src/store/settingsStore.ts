import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExplorerOpponentMode } from '../types';

// ─── Rating filter options ───────────────────────────────────────────
// Matches Lichess explorer rating buckets.
// 0 = all ratings (omit the ratings param entirely for max coverage).
export const RATING_OPTIONS: { label: string; value: number }[] = [
  { label: 'All ratings', value: 0 },
  { label: '1000+',       value: 1000 },
  { label: '1200+',       value: 1200 },
  { label: '1400+',       value: 1400 },
  { label: '1600+',       value: 1600 },
  { label: '1800+',       value: 1800 },
  { label: '2000+',       value: 2000 },
  { label: '2200+',       value: 2200 },
];

// All Lichess rating buckets used to build the API param string
const ALL_BUCKETS = [400, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500];

/**
 * Build the `ratings` query-string fragment for the Lichess explorer API.
 * Returns '' when minRating = 0 (include all games; omit param for max coverage).
 */
export function buildRatingsParam(minRating: number): string {
  if (minRating === 0) return '';
  const buckets = ALL_BUCKETS.filter((r) => r >= minRating);
  return `&ratings=${buckets.join(',')}`;
}

// ─── State ──────────────────────────────────────────────────────────

interface SettingsState {
  restartFrom: 'start' | 'setup';
  /** Minimum average rating filter for Lichess explorer. 0 = all. */
  minRating: number;
  explorerOpponentMode: ExplorerOpponentMode;
  enableSRReminders: boolean;
  showEvalBar: boolean;
}

interface SettingsActions {
  setRestartFrom(v: 'start' | 'setup'): void;
  setMinRating(v: number): void;
  setExplorerOpponentMode(v: ExplorerOpponentMode): void;
  setEnableSRReminders(v: boolean): void;
  setShowEvalBar(v: boolean): void;
}

interface PersistedSettingsState {
  restartFrom?: unknown;
  minRating?: unknown;
  explorerOpponentMode?: unknown;
  enableSRReminders?: unknown;
  showEvalBar?: unknown;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function sanitiseSettingsState(state?: PersistedSettingsState): SettingsState {
  const restartFrom = state?.restartFrom === 'start' || state?.restartFrom === 'setup'
    ? state.restartFrom
    : 'setup';
  const explorerOpponentMode = state?.explorerOpponentMode === 'most_popular' || state?.explorerOpponentMode === 'top3_weighted'
    ? state.explorerOpponentMode
    : 'top3_weighted';

  return {
    restartFrom,
    minRating: asNumber(state?.minRating, 0),
    explorerOpponentMode,
    enableSRReminders: asBoolean(state?.enableSRReminders, true),
    showEvalBar: asBoolean(state?.showEvalBar, true),
  };
}

// ─── Store ──────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      restartFrom: 'setup',
      minRating: 0,
      explorerOpponentMode: 'top3_weighted',
      enableSRReminders: true,
      showEvalBar: true,
      setRestartFrom: (v) => set({ restartFrom: v }),
      setMinRating: (v) => set({ minRating: v }),
      setExplorerOpponentMode: (v) => set({ explorerOpponentMode: v }),
      setEnableSRReminders: (v) => set({ enableSRReminders: v }),
      setShowEvalBar: (v) => set({ showEvalBar: v }),
    }),
    {
      name: 'openingslab-settings-v1',
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitiseSettingsState(persistedState as PersistedSettingsState | undefined),
      }),
    },
  ),
);
