import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const LICHESS_SPEED_OPTIONS = ['bullet', 'blitz', 'rapid', 'classical', 'correspondence'] as const;
export const LICHESS_RATING_OPTIONS = [1600, 1800, 2000, 2200, 2500] as const;
export const DEFAULT_LICHESS_SPEEDS = ['blitz', 'rapid', 'classical'] as const;
export const DEFAULT_LICHESS_RATINGS = [1600, 1800, 2000, 2200, 2500] as const;

interface SettingsState {
  restartFrom: 'start' | 'setup';
  lichessTopMoves: number;
  lichessSpeeds: string[];
  lichessRatings: number[];
  lichessVariant: 'standard';
  enableSRReminders: boolean;
  showEvalBar: boolean;
}

interface SettingsActions {
  setRestartFrom(v: 'start' | 'setup'): void;
  setLichessTopMoves(v: number): void;
  toggleLichessSpeed(v: (typeof LICHESS_SPEED_OPTIONS)[number]): void;
  toggleLichessRating(v: (typeof LICHESS_RATING_OPTIONS)[number]): void;
  setEnableSRReminders(v: boolean): void;
  setShowEvalBar(v: boolean): void;
}

interface PersistedSettingsState {
  restartFrom?: unknown;
  lichessTopMoves?: unknown;
  lichessSpeeds?: unknown;
  lichessRatings?: unknown;
  lichessVariant?: unknown;
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

  const lichessSpeeds = Array.isArray(state?.lichessSpeeds)
    ? [...new Set(state.lichessSpeeds.filter((value): value is string =>
      typeof value === 'string' && LICHESS_SPEED_OPTIONS.includes(value as (typeof LICHESS_SPEED_OPTIONS)[number])))]
    : [...DEFAULT_LICHESS_SPEEDS];

  const lichessRatings = Array.isArray(state?.lichessRatings)
    ? [...new Set(state.lichessRatings.filter((value): value is number =>
      typeof value === 'number' && LICHESS_RATING_OPTIONS.includes(value as (typeof LICHESS_RATING_OPTIONS)[number])))]
    : [...DEFAULT_LICHESS_RATINGS];

  return {
    restartFrom,
    lichessTopMoves: Math.max(1, Math.min(10, Math.floor(asNumber(state?.lichessTopMoves, 3)))),
    lichessSpeeds: lichessSpeeds.length > 0 ? lichessSpeeds : [...DEFAULT_LICHESS_SPEEDS],
    lichessRatings: lichessRatings.length > 0 ? lichessRatings : [...DEFAULT_LICHESS_RATINGS],
    lichessVariant: state?.lichessVariant === 'standard' ? 'standard' : 'standard',
    enableSRReminders: asBoolean(state?.enableSRReminders, true),
    showEvalBar: asBoolean(state?.showEvalBar, false),
  };
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      restartFrom: 'setup',
      lichessTopMoves: 3,
      lichessSpeeds: [...DEFAULT_LICHESS_SPEEDS],
      lichessRatings: [...DEFAULT_LICHESS_RATINGS],
      lichessVariant: 'standard',
      enableSRReminders: true,
      showEvalBar: false,
      setRestartFrom: (v) => set({ restartFrom: v }),
      setLichessTopMoves: (v) => set({ lichessTopMoves: Math.max(1, Math.min(10, Math.floor(v))) }),
      toggleLichessSpeed: (value) => set((state) => {
        const exists = state.lichessSpeeds.includes(value);
        const next = exists
          ? state.lichessSpeeds.filter((speed) => speed !== value)
          : [...state.lichessSpeeds, value];
        return {
          lichessSpeeds: next.length > 0 ? next : [...DEFAULT_LICHESS_SPEEDS],
        };
      }),
      toggleLichessRating: (value) => set((state) => {
        const exists = state.lichessRatings.includes(value);
        const next = exists
          ? state.lichessRatings.filter((rating) => rating !== value)
          : [...state.lichessRatings, value];
        return {
          lichessRatings: next.length > 0 ? next.sort((a, b) => a - b) : [...DEFAULT_LICHESS_RATINGS],
        };
      }),
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
