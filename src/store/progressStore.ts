import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProgressState, OpeningProgress, LineProgress } from '../types';

interface ProgressActions {
  markSetupComplete(openingId: string): void;
  recordLineAttempt(openingId: string, lineId: string, mistakes: number): void;
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
