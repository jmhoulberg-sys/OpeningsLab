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

interface PersistedProgressionState {
  xpTotal?: unknown;
  setupAwards?: unknown;
  discoveredLines?: unknown;
  daily?: unknown;
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

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function sanitiseDaily(value: unknown): DailyProgress {
  if (!value || typeof value !== 'object') return defaultDaily();
  const entry = value as Partial<DailyProgress>;
  return {
    xp: asNumber(entry.xp),
    sessions: asNumber(entry.sessions),
    linesCompleted: asStringArray(entry.linesCompleted),
    perfectLines: asStringArray(entry.perfectLines),
    topResponseWins: asNumber(entry.topResponseWins),
  };
}

function sanitiseDailyRecord(value: unknown): Record<string, DailyProgress> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, daily]) => [key, sanitiseDaily(daily)]),
  );
}

function sanitiseState(state?: PersistedProgressionState): ProgressionState {
  return {
    xpTotal: asNumber(state?.xpTotal),
    setupAwards: asStringArray(state?.setupAwards),
    discoveredLines: asStringArray(state?.discoveredLines),
    daily: sanitiseDailyRecord(state?.daily),
  };
}

function updateDaily(
  state: ProgressionState,
  todayKey: string,
  updater: (daily: DailyProgress) => DailyProgress,
) {
  const current = sanitiseDaily(state.daily[todayKey]);
  return {
    ...sanitiseDailyRecord(state.daily),
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
  const entries = Object.entries(sanitiseDailyRecord(daily));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6);
  const cutoffKey = cutoff.toISOString().split('T')[0];

  return entries.reduce((sum, [date, value]) => (
    date >= cutoffKey ? sum + value.xp : sum
  ), 0);
}

export function getTodayProgress(daily: Record<string, DailyProgress>) {
  return sanitiseDaily(daily?.[getTodayKey()]);
}

function toDateKey(date: Date) {
  return date.toISOString().split('T')[0];
}

function hasDailyTraining(daily?: DailyProgress) {
  return !!daily && (daily.sessions > 0 || daily.linesCompleted.length > 0 || daily.perfectLines.length > 0);
}

export function getCurrentStreak(daily: Record<string, DailyProgress>) {
  const safeDaily = sanitiseDailyRecord(daily);
  const cursor = new Date();
  let streak = 0;

  while (hasDailyTraining(safeDaily[toDateKey(cursor)])) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getRecentStreakDays(daily: Record<string, DailyProgress>, count = 7) {
  const safeDaily = sanitiseDailyRecord(daily);
  const today = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (count - 1 - index));
    const key = toDateKey(date);
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1),
      active: hasDailyTraining(safeDaily[key]),
      today: key === toDateKey(today),
    };
  });
}

export function getQuestProgress(daily: DailyProgress) {
  const safeDaily = sanitiseDaily(daily);
  return [
    {
      id: 'three-lines',
      label: 'Complete 3 lines',
      progress: Math.min(3, safeDaily.linesCompleted.length),
      target: 3,
    },
    {
      id: 'perfect-line',
      label: 'Perfect 1 line',
      progress: Math.min(1, safeDaily.perfectLines.length),
      target: 1,
    },
    {
      id: 'top-response',
      label: 'Win 1 top response run',
      progress: Math.min(1, safeDaily.topResponseWins),
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
    {
      name: 'openingslab-progression-v1',
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitiseState(persistedState as PersistedProgressionState | undefined),
      }),
    },
  ),
);
