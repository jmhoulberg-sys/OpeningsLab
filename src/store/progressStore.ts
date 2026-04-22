import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProgressState, OpeningProgress, LineProgress } from '../types';
import { useProgressionStore } from './progressionStore';

interface ProgressActions {
  markSetupComplete(openingId: string): void;
  recordLineAttempt(openingId: string, lineId: string, mistakes: number): void;
  recordSpacedRepetition(openingId: string, lineId: string, perfect: boolean): void;
  isDue(openingId: string, lineId: string): boolean;
  isSetupComplete(openingId: string): boolean;
  isLineUnlocked(openingId: string, lineId: string): boolean;
  getLineProgress(openingId: string, lineId: string): LineProgress | undefined;
  toggleFavorite(openingId: string, lineId: string): void;
  isFavorite(openingId: string, lineId: string): boolean;
  reset(): void;
}

interface FullProgressState extends ProgressState {
  favorites: Record<string, string[]>;
}

interface PersistedProgressStore {
  openings?: unknown;
  favorites?: unknown;
}

const defaultOpeningProgress = (openingId: string): OpeningProgress => ({
  openingId,
  setupCompleted: false,
  lines: {},
});

const defaultLineProgress = (lineId: string): LineProgress => ({
  lineId,
  unlocked: false,
  bestMistakes: Infinity,
  attempts: 0,
  srInterval: 0,
  nextReviewDate: null,
});

function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function asFiniteNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function sanitiseLineProgress(lineId: string, value: unknown): LineProgress {
  if (!value || typeof value !== 'object') return defaultLineProgress(lineId);
  const line = value as Partial<LineProgress>;
  return {
    lineId,
    unlocked: asBoolean(line.unlocked),
    bestMistakes: typeof line.bestMistakes === 'number' ? line.bestMistakes : Infinity,
    attempts: asFiniteNumber(line.attempts, 0),
    srInterval: asFiniteNumber(line.srInterval, 0),
    nextReviewDate: asNullableString(line.nextReviewDate),
  };
}

function sanitiseOpeningProgress(openingId: string, value: unknown): OpeningProgress {
  if (!value || typeof value !== 'object') return defaultOpeningProgress(openingId);
  const opening = value as Partial<OpeningProgress> & { lines?: unknown };
  const lines = opening.lines && typeof opening.lines === 'object'
    ? Object.fromEntries(
      Object.entries(opening.lines).map(([lineId, lineValue]) => [lineId, sanitiseLineProgress(lineId, lineValue)]),
    )
    : {};

  return {
    openingId,
    setupCompleted: asBoolean(opening.setupCompleted),
    lines,
  };
}

function sanitiseOpenings(value: unknown): Record<string, OpeningProgress> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value).map(([openingId, openingValue]) => [openingId, sanitiseOpeningProgress(openingId, openingValue)]),
  );
}

function sanitiseFavorites(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value).map(([openingId, lineIds]) => [openingId, asStringArray(lineIds)]),
  );
}

function sanitiseProgressStore(state?: PersistedProgressStore): FullProgressState {
  return {
    openings: sanitiseOpenings(state?.openings),
    favorites: sanitiseFavorites(state?.favorites),
  };
}

export const useProgressStore = create<FullProgressState & ProgressActions>()(
  persist(
    (set, get) => ({
      openings: {},
      favorites: {},

      markSetupComplete(openingId) {
        set((state) => {
          const existing = state.openings[openingId] ?? defaultOpeningProgress(openingId);
          if (!existing.setupCompleted) {
            useProgressionStore.getState().awardSetup(openingId);
          }
          return {
            openings: {
              ...state.openings,
              [openingId]: { ...existing, setupCompleted: true },
            },
          };
        });
      },

      recordLineAttempt(openingId, lineId, mistakes) {
        set((state) => {
          const opening = state.openings[openingId] ?? defaultOpeningProgress(openingId);
          const existing = opening.lines[lineId] ?? defaultLineProgress(lineId);

          const unlocked = existing.unlocked || mistakes === 0;
          const bestMistakes = Math.min(
            existing.bestMistakes === Infinity ? mistakes : existing.bestMistakes,
            mistakes,
          );

          return {
            openings: {
              ...state.openings,
              [openingId]: {
                ...opening,
                lines: {
                  ...opening.lines,
                  [lineId]: {
                    ...existing,
                    unlocked,
                    bestMistakes,
                    attempts: existing.attempts + 1,
                  },
                },
              },
            },
          };
        });
        useProgressionStore.getState().awardLineCompletion(openingId, lineId, mistakes);
      },

      recordSpacedRepetition(openingId, lineId, perfect) {
        set((state) => {
          const opening = state.openings[openingId] ?? defaultOpeningProgress(openingId);
          const existing = opening.lines[lineId] ?? defaultLineProgress(lineId);

          const today = new Date();
          const newInterval = perfect ? Math.max(1, existing.srInterval * 2) : 1;
          const next = new Date(today);
          next.setDate(today.getDate() + newInterval);
          const nextDate = next.toISOString().split('T')[0];

          return {
            openings: {
              ...state.openings,
              [openingId]: {
                ...opening,
                lines: {
                  ...opening.lines,
                  [lineId]: {
                    ...existing,
                    srInterval: newInterval,
                    nextReviewDate: nextDate,
                  },
                },
              },
            },
          };
        });
      },

      isDue(openingId, lineId) {
        const progress = get().openings[openingId]?.lines[lineId];
        if (!progress?.nextReviewDate) return true;
        const today = new Date().toISOString().split('T')[0];
        return progress.nextReviewDate <= today;
      },

      isSetupComplete(openingId) {
        return get().openings[openingId]?.setupCompleted ?? false;
      },

      isLineUnlocked(openingId, lineId) {
        return get().openings[openingId]?.lines[lineId]?.unlocked ?? false;
      },

      getLineProgress(openingId, lineId) {
        return get().openings[openingId]?.lines[lineId];
      },

      toggleFavorite(openingId, lineId) {
        set((state) => {
          const current = state.favorites[openingId] ?? [];
          const next = current.includes(lineId)
            ? current.filter((id) => id !== lineId)
            : [...current, lineId];
          return { favorites: { ...state.favorites, [openingId]: next } };
        });
      },

      isFavorite(openingId, lineId) {
        return (get().favorites[openingId] ?? []).includes(lineId);
      },

      reset() {
        set({ openings: {}, favorites: {} });
      },
    }),
    {
      name: 'openingslab-progress-v1',
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitiseProgressStore(persistedState as PersistedProgressStore | undefined),
      }),
    },
  ),
);
