import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProgressState, OpeningProgress, LineProgress } from '../types';

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
  /** openingId → set of favourite lineIds (stored as string[]) */
  favorites: Record<string, string[]>;
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

export const useProgressStore = create<FullProgressState & ProgressActions>()(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────
      openings: {},
      favorites: {},

      // ── Actions ────────────────────────────────────────────────────
      markSetupComplete(openingId) {
        set((state) => {
          const existing = state.openings[openingId] ?? defaultOpeningProgress(openingId);
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
      },

      recordSpacedRepetition(openingId, lineId, perfect) {
        set((state) => {
          const opening = state.openings[openingId] ?? defaultOpeningProgress(openingId);
          const existing = opening.lines[lineId] ?? defaultLineProgress(lineId);

          const today = new Date();
          let newInterval: number;
          let nextDate: string;

          if (perfect) {
            newInterval = Math.max(1, existing.srInterval * 2);
          } else {
            newInterval = 1;
          }

          const next = new Date(today);
          next.setDate(today.getDate() + newInterval);
          nextDate = next.toISOString().split('T')[0];

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
    },
  ),
);
