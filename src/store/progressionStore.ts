import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const SETUP_XP = 15;
const NEW_LINE_XP = 25;
const PERFECT_LINE_XP = 40;
const SESSION_XP = 10;
const TOP_RESPONSE_WIN_XP = 50;
const TOP_RESPONSE_DRAW_XP = 25;

export interface LevelInfo {
  level: number;
  levelStartXp: number;
  nextLevelXp: number;
  progressPct: number;
}

interface DailyProgress {
  xp: number;
  sessions: number;
  linesCompleted: string[];
  perfectLines: string[];
  topResponseWins: number;
}

interface ProgressionState {
  xpTotal: number;
  setupAwards: string[];
  discoveredLines: string[];
  daily: Record<string, DailyProgress>;
}

interface ProgressionActions {
  awardSetup(openingId: string): void;
  awardLineCompletion(openingId: string, lineId: string, mistakes: number): void;
  awardTopResponseResult(result: 'win' | 'loss' | 'draw'): void;
  reset(): void;
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function defaultDaily(): DailyProgress {
  return {
    xp: 0,
    sessions: 0,
    linesCompleted: [],
    perfectLines: [],
    topResponseWins: 0,
  };
}

function updateDaily(
  state: ProgressionState,
  todayKey: string,
  updater: (daily: DailyProgress) => DailyProgress,
) {
  const current = state.daily[todayKey] ?? defaultDaily();
  return {
    ...state.daily,
    [todayKey]: updater(current),
  };
}

export function getLevelInfo(xpTotal: number): LevelInfo {
  let level = 1;
  let levelStartXp = 0;
  let nextLevelXp = 120;

  while (xpTotal >= nextLevelXp) {
    level += 1;
    levelStartXp = nextLevelXp;
    nextLevelXp += 120 + (level - 1) * 35;
  }

  const span = Math.max(1, nextLevelXp - levelStartXp);
  const progressPct = Math.max(0, Math.min(100, Math.round(((xpTotal - levelStartXp) / span) * 100)));

  return { level, levelStartXp, nextLevelXp, progressPct };
}

export function getWeeklyXp(daily: Record<string, DailyProgress>) {
  const entries = Object.entries(daily);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6);
  const cutoffKey = cutoff.toISOString().split('T')[0];

  return entries.reduce((sum, [date, value]) => (
    date >= cutoffKey ? sum + value.xp : sum
  ), 0);
}

export function getTodayProgress(daily: Record<string, DailyProgress>) {
  return daily[getTodayKey()] ?? defaultDaily();
}

export function getQuestProgress(daily: DailyProgress) {
  return [
    {
      id: 'three-lines',
      label: 'Complete 3 lines',
      progress: Math.min(3, daily.linesCompleted.length),
      target: 3,
    },
    {
      id: 'perfect-line',
      label: 'Perfect 1 line',
      progress: Math.min(1, daily.perfectLines.length),
      target: 1,
    },
    {
      id: 'top-response',
      label: 'Win 1 top response run',
      progress: Math.min(1, daily.topResponseWins),
      target: 1,
    },
  ];
}

export const useProgressionStore = create<ProgressionState & ProgressionActions>()(
  persist(
    (set) => ({
      xpTotal: 0,
      setupAwards: [],
      discoveredLines: [],
      daily: {},

      awardSetup(openingId) {
        set((state) => {
          if (state.setupAwards.includes(openingId)) return state;
          const today = getTodayKey();
          return {
            xpTotal: state.xpTotal + SETUP_XP,
            setupAwards: [...state.setupAwards, openingId],
            discoveredLines: state.discoveredLines,
            daily: updateDaily(state, today, (daily) => ({
              ...daily,
              xp: daily.xp + SETUP_XP,
            })),
          };
        });
      },

      awardLineCompletion(openingId, lineId, mistakes) {
        const lineKey = `${openingId}:${lineId}`;
        set((state) => {
          const today = getTodayKey();
          const isNewLine = !state.discoveredLines.includes(lineKey);
          const gainedXp = SESSION_XP + (isNewLine ? NEW_LINE_XP : 0) + (mistakes === 0 ? PERFECT_LINE_XP : 0);

          return {
            xpTotal: state.xpTotal + gainedXp,
            setupAwards: state.setupAwards,
            discoveredLines: isNewLine ? [...state.discoveredLines, lineKey] : state.discoveredLines,
            daily: updateDaily(state, today, (daily) => ({
              xp: daily.xp + gainedXp,
              sessions: daily.sessions + 1,
              linesCompleted: daily.linesCompleted.includes(lineKey)
                ? daily.linesCompleted
                : [...daily.linesCompleted, lineKey],
              perfectLines: mistakes === 0 && !daily.perfectLines.includes(lineKey)
                ? [...daily.perfectLines, lineKey]
                : daily.perfectLines,
              topResponseWins: daily.topResponseWins,
            })),
          };
        });
      },

      awardTopResponseResult(result) {
        const gainedXp = result === 'win' ? TOP_RESPONSE_WIN_XP : result === 'draw' ? TOP_RESPONSE_DRAW_XP : 0;
        if (!gainedXp) return;

        set((state) => {
          const today = getTodayKey();
          return {
            xpTotal: state.xpTotal + gainedXp,
            setupAwards: state.setupAwards,
            discoveredLines: state.discoveredLines,
            daily: updateDaily(state, today, (daily) => ({
              ...daily,
              xp: daily.xp + gainedXp,
              topResponseWins: daily.topResponseWins + (result === 'win' ? 1 : 0),
            })),
          };
        });
      },

      reset() {
        set({
          xpTotal: 0,
          setupAwards: [],
          discoveredLines: [],
          daily: {},
        });
      },
    }),
    { name: 'openingslab-progression-v1' },
  ),
);
