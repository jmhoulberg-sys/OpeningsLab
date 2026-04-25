import { useSyncExternalStore } from 'react';
import { OPENINGS } from '../data/openings';

type QuestKind = 'daily' | 'weekly';
type ToastType = 'xp' | 'levelup' | 'achievement' | 'streak';
type ProfileTab = 'overview' | 'quests' | 'achievements' | 'stats';

type DailyQuestId =
  | 'daily_sessions'
  | 'daily_perfect'
  | 'daily_line'
  | 'daily_moves'
  | 'daily_comeback'
  | 'daily_streak';

type WeeklyQuestId =
  | 'week_lines'
  | 'week_perfect_week'
  | 'week_accuracy'
  | 'week_no_hints'
  | 'week_sessions'
  | 'week_streak';

type AchievementId =
  | 'first_line'
  | 'perfect_10'
  | 'streak_7'
  | 'streak_30'
  | 'streak_100'
  | 'level_10'
  | 'level_20'
  | 'scholar'
  | 'no_hints_week'
  | 'comeback';

interface BaseQuest {
  id: DailyQuestId | WeeklyQuestId;
  name: string;
  description: string;
  target: number;
  xpReward: number;
  progress: number;
  completedAt: number | null;
}

interface DailyQuest extends BaseQuest {
  id: DailyQuestId;
}

interface WeeklyQuest extends BaseQuest {
  id: WeeklyQuestId;
}

interface AchievementUnlock {
  unlockedAt: number;
}

interface SessionSnapshot {
  date: string;
  lineId: string;
  openingId?: string;
  moves: number;
  errors: number;
  accuracy: number;
  perfect: boolean;
  noHints: boolean;
}

interface WeeklyCounters {
  uniqueLines: string[];
  correctMoves: number;
  errors: number;
  sessions: number;
  noHintLines: number;
  activeDates: string[];
}

interface ChessTrainerProfile {
  username: string;
  joinedAt: number;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  streakHistory: string[];
  totalSessions: number;
  totalMoves: number;
  totalErrors: number;
  totalPerfectLines: number;
  dailyQuestDate: string | null;
  dailyQuests: DailyQuest[];
  weeklyQuestDate: string | null;
  weeklyQuests: WeeklyQuest[];
  achievements: Record<string, AchievementUnlock>;
  title: string | null;
  streakFreezes: number;
  dailyLoginBonusDate: string | null;
  streakMilestonesAwarded: string[];
  weeklyCounters: WeeklyCounters;
  sessionHistory: SessionSnapshot[];
}

interface ProfileSummary {
  username: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  dailyComplete: number;
  dailyTotal: number;
  weeklyComplete: number;
  weeklyTotal: number;
  title: string | null;
}

interface ProfileSnapshot {
  summary: ProfileSummary;
  isOpen: boolean;
}

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  body: string;
  duration: number;
}

interface QuestDefinition<T extends DailyQuestId | WeeklyQuestId> {
  id: T;
  name: string;
  description: string;
  target: number;
  xpReward: number;
}

interface SessionCompleteDetail {
  errors: number;
  moves: number;
  lineId: string;
  openingId?: string;
}

interface MoveCorrectDetail {
  san: string;
  lineId: string;
  openingId?: string;
}

interface HintUsedDetail {
  type?: 'hint' | 'answer';
  lineId?: string;
  openingId?: string;
}

interface MoveWrongDetail {
  lineId?: string;
  openingId?: string;
}

const STORAGE_KEY = 'chess_trainer_profile';
const DEFAULT_PROFILE: ChessTrainerProfile = {
  username: 'Player',
  joinedAt: Date.now(),
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  streakHistory: [],
  totalSessions: 0,
  totalMoves: 0,
  totalErrors: 0,
  totalPerfectLines: 0,
  dailyQuestDate: null,
  dailyQuests: [],
  weeklyQuestDate: null,
  weeklyQuests: [],
  achievements: {},
  title: null,
  streakFreezes: 0,
  dailyLoginBonusDate: null,
  streakMilestonesAwarded: [],
  weeklyCounters: {
    uniqueLines: [],
    correctMoves: 0,
    errors: 0,
    sessions: 0,
    noHintLines: 0,
    activeDates: [],
  },
  sessionHistory: [],
};

const DAILY_QUEST_POOL: QuestDefinition<DailyQuestId>[] = [
  { id: 'daily_sessions', name: 'Morning drill', description: 'Complete 3 training sessions today', target: 3, xpReward: 75 },
  { id: 'daily_perfect', name: 'Precision play', description: 'Complete a full line with 0 errors', target: 1, xpReward: 100 },
  { id: 'daily_line', name: 'Line explorer', description: 'Practice 2 different lines today', target: 2, xpReward: 60 },
  { id: 'daily_moves', name: 'Move machine', description: 'Make 50 correct moves in training', target: 50, xpReward: 80 },
  { id: 'daily_comeback', name: 'Comeback kid', description: 'Complete a line after making a mistake', target: 1, xpReward: 60 },
  { id: 'daily_streak', name: 'Keep it going', description: 'Train today to maintain your streak', target: 1, xpReward: 50 },
];

const WEEKLY_QUEST_POOL: QuestDefinition<WeeklyQuestId>[] = [
  { id: 'week_lines', name: 'Opening scholar', description: 'Practice 5 different lines this week', target: 5, xpReward: 500 },
  { id: 'week_perfect_week', name: 'Perfect week', description: 'Train every day this week', target: 7, xpReward: 400 },
  { id: 'week_accuracy', name: 'Accuracy run', description: 'Achieve 80%+ accuracy across 20+ moves', target: 20, xpReward: 350 },
  { id: 'week_no_hints', name: 'No peeking', description: 'Complete 10 lines without using Show Answer', target: 10, xpReward: 450 },
  { id: 'week_sessions', name: 'Grinder', description: 'Complete 20 training sessions this week', target: 20, xpReward: 400 },
  { id: 'week_streak', name: 'Unbroken', description: "Don't break your streak this week", target: 7, xpReward: 300 },
];

const ACHIEVEMENTS: Array<{
  id: AchievementId;
  name: string;
  description: string;
}> = [
  { id: 'first_line', name: 'First blood', description: 'Complete your first line' },
  { id: 'perfect_10', name: 'Sniper', description: 'Complete 10 perfect lines' },
  { id: 'streak_7', name: 'One week', description: 'Reach a 7-day streak' },
  { id: 'streak_30', name: 'On fire', description: 'Reach a 30-day streak' },
  { id: 'streak_100', name: 'Centurion', description: 'Reach a 100-day streak' },
  { id: 'level_10', name: 'Apprentice', description: 'Reach level 10' },
  { id: 'level_20', name: 'Expert', description: 'Reach level 20' },
  { id: 'scholar', name: 'Scholar', description: 'Master all lines in one opening' },
  { id: 'no_hints_week', name: 'Clean hands', description: 'Complete a full week without using hints' },
  { id: 'comeback', name: 'The comeback', description: 'Finish a line after 3 mistakes in a row' },
];

const MOCK_LEADERBOARD = [
  { username: 'KnightVale', xp: 1420 },
  { username: 'BishopRun', xp: 1880 },
  { username: 'RookTheory', xp: 2360 },
  { username: 'QueenSide', xp: 2810 },
  { username: 'TempoTom', xp: 3320 },
  { username: 'PrepPanda', xp: 4015 },
  { username: 'MateMaker', xp: 4680 },
  { username: 'EndgameEli', xp: 5290 },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function daysBetween(from: string, to: string) {
  const fromDate = startOfLocalDay(new Date(from));
  const toDate = startOfLocalDay(new Date(to));
  const diff = toDate.getTime() - fromDate.getTime();
  return Math.round(diff / 86400000);
}

function getYesterdayKey() {
  return localDateKey(addDays(new Date(), -1));
}

function getMonday(date = new Date()) {
  const monday = startOfLocalDay(date);
  const day = monday.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + offset);
  return monday;
}

function isoWeekKey(date = new Date()) {
  const monday = getMonday(date);
  const yearStart = new Date(monday.getFullYear(), 0, 1);
  const dayOffset = yearStart.getDay() || 7;
  const firstThursday = new Date(yearStart);
  firstThursday.setDate(yearStart.getDate() + (4 - dayOffset));
  const diff = monday.getTime() - startOfLocalDay(firstThursday).getTime();
  const week = Math.floor(diff / 604800000) + 1;
  return `${monday.getFullYear()}-W${`${week}`.padStart(2, '0')}`;
}

function xpRequiredForLevel(level: number) {
  return 500 + (level - 1) * 300;
}

function computeLevelInfo(xp: number) {
  let level = 1;
  let currentLevelXp = xpRequiredForLevel(level);
  let remainingXp = xp;
  let levelStartXp = 0;

  while (remainingXp >= currentLevelXp) {
    remainingXp -= currentLevelXp;
    levelStartXp += currentLevelXp;
    level += 1;
    currentLevelXp = xpRequiredForLevel(level);
  }

  return {
    level,
    levelStartXp,
    currentLevelXp,
    currentLevelProgress: remainingXp,
    nextLevelXp: currentLevelXp,
    totalXpToNext: currentLevelXp - remainingXp,
  };
}

function levelTier(level: number) {
  if (level <= 10) return { name: 'Bronze', color: '#cd7f32' };
  if (level <= 20) return { name: 'Silver', color: '#aaa9ad' };
  if (level <= 35) return { name: 'Gold', color: 'var(--gold)' };
  return { name: 'Platinum', color: '#5dcaa5' };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const chars = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '');
  return chars.join('') || 'P';
}

function pickRandomUnique<T>(items: T[], count: number) {
  const pool = [...items];
  const selected: T[] = [];
  while (pool.length > 0 && selected.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(index, 1)[0]);
  }
  return selected;
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asQuestArray<T extends DailyQuest | WeeklyQuest>(value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is T => !!item && typeof item === 'object' && typeof (item as BaseQuest).id === 'string')
    .map((item) => ({
      ...item,
      progress: asNumber(item.progress),
      completedAt: typeof item.completedAt === 'number' ? item.completedAt : null,
    }));
}

function sanitiseProfile(value: unknown): ChessTrainerProfile {
  if (!value || typeof value !== 'object') return { ...DEFAULT_PROFILE };
  const raw = value as Partial<ChessTrainerProfile>;
  const xp = asNumber(raw.xp);
  const level = computeLevelInfo(xp).level;

  return {
    username: asString(raw.username, DEFAULT_PROFILE.username),
    joinedAt: asNumber(raw.joinedAt, DEFAULT_PROFILE.joinedAt),
    xp,
    level,
    currentStreak: asNumber(raw.currentStreak),
    longestStreak: asNumber(raw.longestStreak),
    lastActiveDate: asNullableString(raw.lastActiveDate),
    streakHistory: asStringArray(raw.streakHistory).slice(-365),
    totalSessions: asNumber(raw.totalSessions),
    totalMoves: asNumber(raw.totalMoves),
    totalErrors: asNumber(raw.totalErrors),
    totalPerfectLines: asNumber(raw.totalPerfectLines),
    dailyQuestDate: asNullableString(raw.dailyQuestDate),
    dailyQuests: asQuestArray<DailyQuest>(raw.dailyQuests),
    weeklyQuestDate: asNullableString(raw.weeklyQuestDate),
    weeklyQuests: asQuestArray<WeeklyQuest>(raw.weeklyQuests),
    achievements: raw.achievements && typeof raw.achievements === 'object' ? raw.achievements as Record<string, AchievementUnlock> : {},
    title: asNullableString(raw.title),
    streakFreezes: asNumber((raw as ChessTrainerProfile).streakFreezes),
    dailyLoginBonusDate: asNullableString((raw as ChessTrainerProfile).dailyLoginBonusDate),
    streakMilestonesAwarded: asStringArray((raw as ChessTrainerProfile).streakMilestonesAwarded),
    weeklyCounters: raw.weeklyCounters && typeof raw.weeklyCounters === 'object'
      ? {
          uniqueLines: asStringArray(raw.weeklyCounters.uniqueLines),
          correctMoves: asNumber(raw.weeklyCounters.correctMoves),
          errors: asNumber(raw.weeklyCounters.errors),
          sessions: asNumber(raw.weeklyCounters.sessions),
          noHintLines: asNumber(raw.weeklyCounters.noHintLines),
          activeDates: asStringArray(raw.weeklyCounters.activeDates),
        }
      : { ...DEFAULT_PROFILE.weeklyCounters },
    sessionHistory: Array.isArray((raw as ChessTrainerProfile).sessionHistory)
      ? (raw as ChessTrainerProfile).sessionHistory
          .filter((item): item is SessionSnapshot => !!item && typeof item === 'object' && typeof item.date === 'string')
          .slice(-120)
      : [],
  };
}

function getProgressSnapshot() {
  try {
    const raw = localStorage.getItem('openingslab-progress-v1');
    if (!raw) return {};
    return JSON.parse(raw) as { openings?: Record<string, { lines?: Record<string, { unlocked?: boolean; attempts?: number }> }> };
  } catch {
    return {};
  }
}

function isOpeningMastered(openingId: string) {
  const progress = getProgressSnapshot();
  const opening = OPENINGS.find((item) => item.id === openingId);
  if (!opening) return false;
  const lines = progress.openings?.[openingId]?.lines ?? {};
  return opening.lines.length > 0 && opening.lines.every((line) => !!lines[line.id]?.unlocked);
}

function getLineBreakdown() {
  const progress = getProgressSnapshot();
  return OPENINGS.flatMap((opening) => opening.lines.map((line) => {
    const lineProgress = progress.openings?.[opening.id]?.lines?.[line.id];
    return {
      openingName: opening.name,
      lineName: line.name,
      unlocked: !!lineProgress?.unlocked,
      attempts: asNumber(lineProgress?.attempts),
    };
  }));
}

function createQuest<T extends DailyQuestId | WeeklyQuestId>(definition: QuestDefinition<T>) {
  return {
    ...definition,
    progress: 0,
    completedAt: null,
  };
}

function countdownToMidnight() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diff = next.getTime() - now.getTime();
  return formatCountdown(diff);
}

function countdownToMonday() {
  const now = new Date();
  const monday = getMonday(now);
  const nextMonday = addDays(monday, 7);
  return formatCountdown(nextMonday.getTime() - now.getTime());
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${`${minutes}`.padStart(2, '0')}m`;
}

function formatDateLabel(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
}

class ChessTrainerProfileModule {
  private profile: ChessTrainerProfile = { ...DEFAULT_PROFILE };
  private initialized = false;
  private activeTab: ProfileTab = 'overview';
  private isOpen = false;
  private overlayEl: HTMLDivElement | null = null;
  private panelEl: HTMLElement | null = null;
  private toastRoot: HTMLDivElement | null = null;
  private styleEl: HTMLStyleElement | null = null;
  private subscribers = new Set<() => void>();
  private toastQueue: ToastItem[] = [];
  private visibleToasts: ToastItem[] = [];
  private toastId = 0;
  private sessionHintUsed = false;
  private sessionWrongStreak = 0;
  private sessionMaxWrongStreak = 0;

  init() {
    if (typeof window === 'undefined' || this.initialized) return;
    this.initialized = true;
    this.profile = this.loadProfile();
    this.syncDerivedState();
    this.ensureStyle();
    this.ensureMounts();
    this.attachListeners();
    this.render();
    window.setInterval(() => {
      if (this.isOpen) this.render();
    }, 60000);
  }

  open() {
    this.init();
    this.isOpen = true;
    this.render();
  }

  close() {
    if (!this.initialized) return;
    this.isOpen = false;
    this.render();
  }

  awardXP(amount: number, reason: string) {
    if (amount <= 0) return;

    const before = computeLevelInfo(this.profile.xp);
    this.profile.xp += amount;
    const after = computeLevelInfo(this.profile.xp);
    this.profile.level = after.level;
    this.saveProfile();

    window.dispatchEvent(new CustomEvent('chess:xp', {
      detail: {
        amount,
        reason,
        total: this.profile.xp,
      },
    }));

    this.enqueueToast({
      type: 'xp',
      title: `+${amount} XP`,
      body: reason,
      duration: 2500,
    });

    if (after.level > before.level) {
      const tier = levelTier(after.level);
      this.enqueueToast({
        type: 'levelup',
        title: `Level ${after.level} — ${tier.name} tier!`,
        body: 'You leveled up.',
        duration: 4000,
      });
      this.flashBoards();
    }

    this.notify();
    this.render();
  }

  syncIdentity(username: string | null | undefined) {
    this.init();
    const next = (username ?? '').trim();
    if (!next || next === this.profile.username) return;
    this.profile.username = next;
    this.saveProfile();
    this.notify();
    this.render();
  }

  subscribe(listener: () => void) {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  getSnapshot(): ProfileSnapshot {
    const dailyComplete = this.profile.dailyQuests.filter((quest) => !!quest.completedAt).length;
    const weeklyComplete = this.profile.weeklyQuests.filter((quest) => !!quest.completedAt).length;
    return {
      summary: {
        username: this.profile.username,
        xp: this.profile.xp,
        level: this.profile.level,
        currentStreak: this.profile.currentStreak,
        longestStreak: this.profile.longestStreak,
        streakFreezes: this.profile.streakFreezes,
        dailyComplete,
        dailyTotal: this.profile.dailyQuests.length,
        weeklyComplete,
        weeklyTotal: this.profile.weeklyQuests.length,
        title: this.profile.title,
      },
      isOpen: this.isOpen,
    };
  }

  private attachListeners() {
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen) this.close();
    });

    window.addEventListener('chess:session_complete', ((event: Event) => {
      const detail = (event as CustomEvent<SessionCompleteDetail>).detail;
      this.handleSessionComplete(detail);
    }) as EventListener);

    window.addEventListener('chess:move_correct', ((event: Event) => {
      const detail = (event as CustomEvent<MoveCorrectDetail>).detail;
      this.handleMoveCorrect(detail);
    }) as EventListener);

    window.addEventListener('chess:hint_used', ((event: Event) => {
      const detail = (event as CustomEvent<HintUsedDetail>).detail;
      this.handleHintUsed(detail);
    }) as EventListener);

    window.addEventListener('chess:move_wrong', ((event: Event) => {
      const detail = (event as CustomEvent<MoveWrongDetail>).detail;
      this.handleMoveWrong(detail);
    }) as EventListener);
  }

  private loadProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? sanitiseProfile(JSON.parse(raw)) : { ...DEFAULT_PROFILE };
    } catch {
      return { ...DEFAULT_PROFILE };
    }
  }

  private saveProfile() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    } catch {
      // Ignore storage failures and keep the app usable.
    }
  }

  private notify() {
    this.subscribers.forEach((listener) => listener());
  }

  private syncDerivedState() {
    this.profile.level = computeLevelInfo(this.profile.xp).level;
    this.handleStreakAtLoad();
    this.ensureDailyQuests();
    this.ensureWeeklyQuests();
    this.checkAchievements();
    this.saveProfile();
  }

  private handleStreakAtLoad() {
    const today = localDateKey();
    if (!this.profile.lastActiveDate) return;
    const gap = daysBetween(this.profile.lastActiveDate, today);
    if (gap <= 1) return;

    if (gap === 2 && this.profile.streakFreezes > 0) {
      this.profile.streakFreezes -= 1;
      this.profile.lastActiveDate = getYesterdayKey();
      this.enqueueToast({
        type: 'streak',
        title: 'Streak freeze saved you',
        body: 'One freeze was used automatically.',
        duration: 4000,
      });
      return;
    }

    this.profile.currentStreak = 0;
  }

  private ensureDailyQuests() {
    const today = localDateKey();
    if (this.profile.dailyQuestDate === today && this.profile.dailyQuests.length === 3) return;
    this.profile.dailyQuestDate = today;
    this.profile.dailyQuests = pickRandomUnique(DAILY_QUEST_POOL, 3).map(createQuest);
  }

  private ensureWeeklyQuests() {
    const weekKey = isoWeekKey();
    if (this.profile.weeklyQuestDate === weekKey && this.profile.weeklyQuests.length === 2) return;
    this.profile.weeklyQuestDate = weekKey;
    this.profile.weeklyQuests = pickRandomUnique(WEEKLY_QUEST_POOL, 2).map(createQuest);
    this.profile.weeklyCounters = {
      uniqueLines: [],
      correctMoves: 0,
      errors: 0,
      sessions: 0,
      noHintLines: 0,
      activeDates: [],
    };
  }

  private registerTrainingDay() {
    const today = localDateKey();
    this.ensureDailyQuests();
    this.ensureWeeklyQuests();

    if (this.profile.dailyLoginBonusDate !== today) {
      this.profile.dailyLoginBonusDate = today;
      this.awardXP(20, 'Daily login bonus');
    }

    if (this.profile.lastActiveDate === today) return;

    if (!this.profile.lastActiveDate) {
      this.profile.currentStreak = 1;
    } else {
      const gap = daysBetween(this.profile.lastActiveDate, today);
      if (gap <= 1) {
        this.profile.currentStreak += 1;
      } else {
        this.profile.currentStreak = 1;
      }
    }

    this.profile.lastActiveDate = today;
    if (!this.profile.streakHistory.includes(today)) {
      this.profile.streakHistory = [...this.profile.streakHistory, today].slice(-365);
    }
    this.profile.longestStreak = Math.max(this.profile.longestStreak, this.profile.currentStreak);

    if (!this.profile.weeklyCounters.activeDates.includes(today)) {
      this.profile.weeklyCounters.activeDates.push(today);
    }

    if (this.profile.currentStreak % 7 === 0) {
      this.profile.streakFreezes += 1;
    }

    for (const milestone of [7, 30, 100]) {
      const milestoneKey = `${milestone}`;
      if (
        this.profile.currentStreak >= milestone &&
        !this.profile.streakMilestonesAwarded.includes(milestoneKey)
      ) {
        this.profile.streakMilestonesAwarded.push(milestoneKey);
        this.awardXP(500, `${milestone}-day streak milestone`);
      }
    }
  }

  private handleMoveCorrect(_detail: MoveCorrectDetail) {
    this.init();
    this.ensureDailyQuests();
    this.ensureWeeklyQuests();
    this.profile.weeklyCounters.correctMoves += 1;
    this.incrementQuest('daily', 'daily_moves', 1);
    this.updateWeeklyAccuracyQuest();
    this.sessionWrongStreak = 0;
    this.saveProfile();
    this.checkAchievements();
    this.notify();
    this.render();
  }

  private handleMoveWrong(_detail: MoveWrongDetail) {
    this.init();
    this.sessionWrongStreak += 1;
    this.sessionMaxWrongStreak = Math.max(this.sessionMaxWrongStreak, this.sessionWrongStreak);
  }

  private handleHintUsed(_detail: HintUsedDetail) {
    this.init();
    this.sessionHintUsed = true;
  }

  private handleSessionComplete(detail: SessionCompleteDetail) {
    this.init();
    this.registerTrainingDay();

    const uniqueLineKey = detail.openingId ? `${detail.openingId}:${detail.lineId}` : detail.lineId;
    const accuracy = detail.moves + detail.errors > 0
      ? detail.moves / (detail.moves + detail.errors)
      : detail.moves > 0 ? 1 : 0;
    const perfect = detail.errors === 0;

    this.profile.totalSessions += 1;
    this.profile.totalMoves += detail.moves;
    this.profile.totalErrors += detail.errors;
    if (perfect) this.profile.totalPerfectLines += 1;

    this.profile.sessionHistory = [
      ...this.profile.sessionHistory,
      {
        date: localDateKey(),
        lineId: detail.lineId,
        openingId: detail.openingId,
        moves: detail.moves,
        errors: detail.errors,
        accuracy,
        perfect,
        noHints: !this.sessionHintUsed,
      },
    ].slice(-120);

    this.profile.weeklyCounters.sessions += 1;
    this.profile.weeklyCounters.errors += detail.errors;
    if (!this.profile.weeklyCounters.uniqueLines.includes(uniqueLineKey)) {
      this.profile.weeklyCounters.uniqueLines.push(uniqueLineKey);
    }
    if (!this.sessionHintUsed) {
      this.profile.weeklyCounters.noHintLines += 1;
    }

    this.incrementQuest('daily', 'daily_sessions', 1);
    this.incrementQuest('daily', 'daily_perfect', perfect ? 1 : 0);
    this.incrementQuest('daily', 'daily_comeback', detail.errors > 0 ? 1 : 0);
    this.incrementQuest('daily', 'daily_streak', 1);

    this.incrementQuest('weekly', 'week_sessions', 1);
    this.incrementQuest('weekly', 'week_no_hints', !this.sessionHintUsed ? 1 : 0);
    this.incrementQuest('weekly', 'week_perfect_week', 0);
    this.incrementQuest('weekly', 'week_streak', 0);
    this.syncDistinctLineQuests();
    this.updateWeeklyAccuracyQuest();

    this.awardXP(perfect ? 75 : 30, perfect ? 'Perfect line complete' : 'Line complete');
    this.checkQuestCompletions();
    this.checkAchievements();

    this.sessionHintUsed = false;
    this.sessionWrongStreak = 0;
    this.sessionMaxWrongStreak = 0;

    this.saveProfile();
    this.notify();
    this.render();
  }

  private incrementQuest(
    kind: QuestKind,
    questId: DailyQuestId | WeeklyQuestId,
    amount: number,
  ) {
    const collection = kind === 'daily' ? this.profile.dailyQuests : this.profile.weeklyQuests;
    const quest = collection.find((item) => item.id === questId);
    if (!quest || quest.completedAt || amount <= 0) return;

    quest.progress = clamp(quest.progress + amount, 0, quest.target);
  }

  private syncDistinctLineQuests() {
    const today = localDateKey();
    const todayLineCount = new Set(
      this.profile.sessionHistory
        .filter((session) => session.date === today)
        .map((session) => session.openingId ? `${session.openingId}:${session.lineId}` : session.lineId),
    ).size;

    const dailyLineQuest = this.profile.dailyQuests.find((quest) => quest.id === 'daily_line');
    if (dailyLineQuest && !dailyLineQuest.completedAt) {
      dailyLineQuest.progress = clamp(todayLineCount, 0, dailyLineQuest.target);
    }

    const weeklyLineQuest = this.profile.weeklyQuests.find((quest) => quest.id === 'week_lines');
    if (weeklyLineQuest && !weeklyLineQuest.completedAt) {
      weeklyLineQuest.progress = clamp(this.profile.weeklyCounters.uniqueLines.length, 0, weeklyLineQuest.target);
    }
  }

  private updateWeeklyAccuracyQuest() {
    const quest = this.profile.weeklyQuests.find((item) => item.id === 'week_accuracy');
    if (!quest || quest.completedAt) return;
    const attempted = this.profile.weeklyCounters.correctMoves + this.profile.weeklyCounters.errors;
    const accuracy = attempted > 0 ? this.profile.weeklyCounters.correctMoves / attempted : 0;
    if (attempted >= quest.target && accuracy >= 0.8) {
      quest.progress = quest.target;
      return;
    }
    if (accuracy >= 0.8) {
      quest.progress = Math.min(attempted, quest.target);
      return;
    }
    quest.progress = Math.min(Math.floor(attempted * (accuracy / 0.8)), quest.target);
  }

  private checkQuestCompletions() {
    this.profile.weeklyQuests.forEach((quest) => {
      if (quest.id === 'week_perfect_week') {
        quest.progress = Math.min(this.profile.weeklyCounters.activeDates.length, quest.target);
      }
      if (quest.id === 'week_streak') {
        quest.progress = Math.min(this.profile.weeklyCounters.activeDates.length, quest.target);
      }
    });

    for (const quest of [...this.profile.dailyQuests, ...this.profile.weeklyQuests]) {
      if (quest.completedAt || quest.progress < quest.target) continue;
      quest.completedAt = Date.now();
      this.awardXP(quest.xpReward, `${quest.name} complete`);
      this.enqueueToast({
        type: 'streak',
        title: quest.name,
        body: `${quest.xpReward} XP earned`,
        duration: 3500,
      });
    }
  }

  private unlockAchievement(id: AchievementId) {
    if (this.profile.achievements[id]) return;
    this.profile.achievements[id] = { unlockedAt: Date.now() };
    const achievement = ACHIEVEMENTS.find((item) => item.id === id);
    this.awardXP(200, achievement ? `${achievement.name} unlocked` : 'Achievement unlocked');
    this.enqueueToast({
      type: 'achievement',
      title: achievement?.name ?? 'Achievement unlocked',
      body: achievement?.description ?? '',
      duration: 4000,
    });
  }

  private checkAchievements() {
    if (this.profile.totalSessions >= 1) this.unlockAchievement('first_line');
    if (this.profile.totalPerfectLines >= 10) this.unlockAchievement('perfect_10');
    if (this.profile.currentStreak >= 7) this.unlockAchievement('streak_7');
    if (this.profile.currentStreak >= 30) this.unlockAchievement('streak_30');
    if (this.profile.currentStreak >= 100) this.unlockAchievement('streak_100');
    if (this.profile.level >= 10) this.unlockAchievement('level_10');
    if (this.profile.level >= 20) this.unlockAchievement('level_20');
    if (OPENINGS.some((opening) => isOpeningMastered(opening.id))) this.unlockAchievement('scholar');
    if (
      this.profile.weeklyCounters.activeDates.length >= 7 &&
      this.profile.weeklyCounters.noHintLines >= 7
    ) {
      this.unlockAchievement('no_hints_week');
    }
    if (this.sessionMaxWrongStreak >= 3) {
      const latestSession = this.profile.sessionHistory[this.profile.sessionHistory.length - 1];
      if (latestSession && latestSession.errors > 0) {
        this.unlockAchievement('comeback');
      }
    }
  }

  private enqueueToast(toast: Omit<ToastItem, 'id'>) {
    const item: ToastItem = { ...toast, id: ++this.toastId };
    this.toastQueue.push(item);
    this.flushToasts();
  }

  private flushToasts() {
    while (this.visibleToasts.length < 3 && this.toastQueue.length > 0) {
      const next = this.toastQueue.shift()!;
      this.visibleToasts.push(next);
      window.setTimeout(() => {
        this.visibleToasts = this.visibleToasts.filter((toast) => toast.id !== next.id);
        this.renderToasts();
        this.flushToasts();
      }, next.duration);
    }
    this.renderToasts();
  }

  private ensureStyle() {
    if (this.styleEl) return;
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --bg: #24211e;
        --bg2: #2b2724;
        --bg3: #332e2a;
        --border: rgba(68, 64, 60, 0.78);
        --text: #f5f2ec;
        --text2: #d6d0c7;
        --text3: #9f968a;
        --gold: #c9a84c;
        --green: #4a8c5c;
        --red: #d45d5d;
        --blue: #46a4df;
      }
      .ctp-overlay {
        position: fixed;
        inset: 0;
        z-index: 120;
        background: rgba(6, 4, 3, 0.48);
        opacity: 0;
        pointer-events: none;
        transition: opacity 220ms ease;
      }
      .ctp-overlay.open {
        opacity: 1;
        pointer-events: auto;
      }
      .ctp-panel {
        position: absolute;
        top: 0;
        right: 0;
        width: 400px;
        height: 100%;
        background: linear-gradient(180deg, rgba(33,30,27,0.98) 0%, rgba(25,23,21,0.98) 100%);
        border-left: 1px solid var(--border);
        box-shadow: -18px 0 40px rgba(0,0,0,0.35);
        color: var(--text);
        transform: translateX(100%);
        transition: transform 240ms ease;
        font-family: 'Instrument Sans', 'Inter', system-ui, sans-serif;
        display: flex;
        flex-direction: column;
      }
      .ctp-overlay.open .ctp-panel { transform: translateX(0); }
      .ctp-header, .ctp-body { padding: 18px 18px 16px; }
      .ctp-header { border-bottom: 1px solid var(--border); }
      .ctp-title-row { display:flex; align-items:center; justify-content:space-between; gap:12px; }
      .ctp-title { font-size: 1.05rem; font-weight: 800; letter-spacing: 0.01em; }
      .ctp-close {
        border: 1px solid var(--border);
        background: var(--bg2);
        color: var(--text2);
        border-radius: 10px;
        width: 36px;
        height: 36px;
        cursor: pointer;
      }
      .ctp-tabs { display:flex; gap:8px; margin-top:14px; }
      .ctp-tab {
        border: 1px solid var(--border);
        background: transparent;
        color: var(--text3);
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
      }
      .ctp-tab.active { background: rgba(70,164,223,0.14); color: var(--text); border-color: rgba(70,164,223,0.42); }
      .ctp-body { overflow-y: auto; display:flex; flex-direction:column; gap:16px; }
      .ctp-card {
        background: var(--bg2);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 16px;
      }
      .ctp-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
      .ctp-overview-top { display:grid; grid-template-columns: auto 1fr; gap:14px; align-items:center; }
      .ctp-avatar {
        width: 58px;
        height: 58px;
        border-radius: 50%;
        display:flex;
        align-items:center;
        justify-content:center;
        background: radial-gradient(circle at top, rgba(70,164,223,0.32), rgba(70,164,223,0.08));
        border: 1px solid rgba(70,164,223,0.36);
        color: white;
        font-weight: 800;
        font-size: 1.05rem;
      }
      .ctp-name { font-size: 1.12rem; font-weight: 800; }
      .ctp-subline { color: var(--text3); font-size: 0.88rem; margin-top: 4px; }
      .ctp-badge-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
      .ctp-badge {
        display:inline-flex;
        align-items:center;
        border-radius:999px;
        padding: 5px 10px;
        font-size:12px;
        font-weight:700;
        border:1px solid var(--border);
      }
      .ctp-progress { height: 6px; border-radius: 3px; background: var(--bg3); overflow:hidden; }
      .ctp-progress > span { display:block; height:100%; border-radius:3px; }
      .ctp-section-title {
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--text3);
        margin-bottom: 10px;
      }
      .ctp-streak-line { display:flex; align-items:center; justify-content:space-between; gap:10px; }
      .ctp-streak-main { display:flex; align-items:center; gap:12px; }
      .ctp-flame { width:20px; height:20px; color: var(--gold); }
      .ctp-heatmap { display:grid; grid-template-columns: repeat(7, 1fr); gap:6px; }
      .ctp-day {
        aspect-ratio: 1;
        border-radius: 8px;
        background: rgba(255,255,255,0.04);
        border: 1px solid transparent;
      }
      .ctp-day.active { background: rgba(74,140,92,0.92); }
      .ctp-day.today { border-color: rgba(255,255,255,0.65); }
      .ctp-pill-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; }
      .ctp-pill {
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 12px;
      }
      .ctp-pill-label { color: var(--text3); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.14em; }
      .ctp-pill-value { margin-top: 6px; font-size: 1rem; font-weight: 800; }
      .ctp-leaderboard-row {
        display:grid;
        grid-template-columns: 28px 34px 1fr auto;
        gap: 10px;
        align-items:center;
        padding: 10px 0;
        border-top: 1px solid rgba(255,255,255,0.05);
      }
      .ctp-leaderboard-row:first-child { border-top: 0; }
      .ctp-leaderboard-row.self {
        background: rgba(70,164,223,0.08);
        border-radius: 8px;
        padding-inline: 10px;
        margin-inline: -10px;
      }
      .ctp-avatar-sm {
        width: 32px; height: 32px; border-radius: 50%; background: var(--bg3);
        display:flex; align-items:center; justify-content:center; font-size: 12px; font-weight:800;
      }
      .ctp-quest-card { display:flex; flex-direction:column; gap:10px; margin-bottom:12px; }
      .ctp-quest-top { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
      .ctp-quest-name { font-weight: 800; }
      .ctp-quest-desc { color: var(--text3); font-size: 0.88rem; margin-top: 4px; }
      .ctp-xp-pill {
        flex-shrink:0;
        border-radius:999px;
        padding: 5px 10px;
        background: rgba(201,168,76,0.14);
        color: var(--gold);
        border: 1px solid rgba(201,168,76,0.34);
        font-size: 12px;
        font-weight: 800;
      }
      .ctp-quest-done {
        border-color: rgba(74,140,92,0.48);
        background: rgba(74,140,92,0.08);
      }
      .ctp-check {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: rgba(74,140,92,0.2);
        color: var(--green);
        display:inline-flex;
        align-items:center;
        justify-content:center;
        font-size: 12px;
        font-weight: 900;
      }
      .ctp-grid-two { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .ctp-achievement.locked { filter: grayscale(1); opacity: 0.66; }
      .ctp-achievement-name { font-weight: 800; }
      .ctp-achievement-desc { font-size: 0.86rem; color: var(--text3); margin-top: 6px; }
      .ctp-achievement-date { margin-top: 8px; color: var(--green); font-size: 0.78rem; }
      .ctp-stat-grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .ctp-chart-wrap { padding: 10px 0 0; }
      .ctp-chart { width: 100%; height: 160px; display:block; background: rgba(255,255,255,0.02); border-radius: 8px; }
      .ctp-line-row { display:grid; grid-template-columns: 1fr auto; gap: 12px; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05); }
      .ctp-line-row:first-child { border-top: 0; }
      .ctp-line-meta { color: var(--text3); font-size: 0.8rem; margin-top: 2px; }
      .ctp-line-status { color: var(--green); font-size: 0.8rem; font-weight: 700; }
      .ctp-note { color: var(--text3); font-size: 0.82rem; }
      .ctp-toast-root {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 140;
        display:flex;
        flex-direction:column;
        gap: 10px;
        pointer-events:none;
      }
      .ctp-toast {
        width: 300px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: rgba(26,23,21,0.96);
        box-shadow: 0 18px 36px rgba(0,0,0,0.28);
        padding: 12px 14px;
        color: var(--text);
      }
      .ctp-toast-title { font-weight: 800; }
      .ctp-toast-body { margin-top: 4px; color: var(--text2); font-size: 0.88rem; }
      .ctp-toast.xp { border-color: rgba(201,168,76,0.34); }
      .ctp-toast.levelup { border-color: rgba(127,119,221,0.42); }
      .ctp-toast.achievement { border-color: rgba(201,168,76,0.42); }
      .ctp-toast.streak { border-color: rgba(74,140,92,0.42); }
      .ctp-tight { margin-top: 8px; }
    `;
    document.head.appendChild(style);
    this.styleEl = style;
  }

  private ensureMounts() {
    if (!this.overlayEl) {
      const overlay = document.createElement('div');
      overlay.className = 'ctp-overlay';
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) this.close();
      });
      document.body.appendChild(overlay);
      this.overlayEl = overlay;
    }

    if (!this.panelEl) {
      const panel = document.createElement('aside');
      panel.className = 'ctp-panel';
      this.overlayEl?.appendChild(panel);
      this.panelEl = panel;
    }

    if (!this.toastRoot) {
      const toastRoot = document.createElement('div');
      toastRoot.className = 'ctp-toast-root';
      document.body.appendChild(toastRoot);
      this.toastRoot = toastRoot;
    }
  }

  private render() {
    if (!this.overlayEl || !this.panelEl) return;
    this.overlayEl.classList.toggle('open', this.isOpen);
    this.panelEl.innerHTML = this.renderPanel();
    this.bindPanelEvents();
    this.drawStatsChart();
    this.renderToasts();
  }

  private renderPanel() {
    const level = computeLevelInfo(this.profile.xp);
    const tier = levelTier(level.level);
    const unlockedCount = Object.keys(this.profile.achievements).length;
    const lineBreakdown = getLineBreakdown();

    return `
      <div class="ctp-header">
        <div class="ctp-title-row">
          <div>
            <div class="ctp-title">My Profile</div>
            <div class="ctp-note">Built to keep you coming back tomorrow.</div>
          </div>
          <button class="ctp-close" data-profile-close aria-label="Close profile">✕</button>
        </div>
        <div class="ctp-tabs">
          ${this.renderTab('overview', 'Overview')}
          ${this.renderTab('quests', 'Quests')}
          ${this.renderTab('achievements', 'Achievements')}
          ${this.renderTab('stats', 'Stats')}
        </div>
      </div>
      <div class="ctp-body">
        ${this.activeTab === 'overview' ? this.renderOverview(level, tier) : ''}
        ${this.activeTab === 'quests' ? this.renderQuests() : ''}
        ${this.activeTab === 'achievements' ? this.renderAchievements(unlockedCount) : ''}
        ${this.activeTab === 'stats' ? this.renderStats(lineBreakdown) : ''}
      </div>
    `;
  }

  private renderTab(tab: ProfileTab, label: string) {
    return `<button class="ctp-tab ${this.activeTab === tab ? 'active' : ''}" data-profile-tab="${tab}">${label}</button>`;
  }

  private renderOverview(level: ReturnType<typeof computeLevelInfo>, tier: ReturnType<typeof levelTier>) {
    const todayHeatmap = this.getHeatmapDays();
    const leaderboard = this.getLeaderboard();
    const xpPct = (level.currentLevelProgress / level.nextLevelXp) * 100;

    return `
      <div class="ctp-card">
        <div class="ctp-overview-top">
          <div class="ctp-avatar">${escapeHtml(initials(this.profile.username))}</div>
          <div>
            <div class="ctp-name">${escapeHtml(this.profile.username)}</div>
            <div class="ctp-subline">${escapeHtml(this.profile.title ?? 'Opening grinder')}</div>
            <div class="ctp-badge-row">
              <span class="ctp-badge">Level ${level.level}</span>
              <span class="ctp-badge" style="border-color:${tier.color}; color:${tier.color};">${tier.name}</span>
            </div>
          </div>
        </div>
        <div class="ctp-tight">
          <div class="ctp-progress"><span style="width:${xpPct}%; background: var(--gold);"></span></div>
          <div class="ctp-note ctp-tight"><span class="ctp-mono">${level.currentLevelProgress} / ${level.nextLevelXp}</span> XP to level ${level.level + 1}</div>
        </div>
      </div>

      <div class="ctp-card">
        <div class="ctp-section-title">Streak</div>
        <div class="ctp-streak-line">
          <div class="ctp-streak-main">
            <svg class="ctp-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2c2 3 4 4.8 4 8.1 0 2.1-1.1 3.6-2.7 4.8.2-1.5-.2-3.1-1.6-4.5-1.2 1-2.6 2.7-2.6 5 0 2.9 2 4.6 4.9 4.6 3.7 0 6-2.9 6-6.6C20 7.8 16.4 4.2 12 2Z"/>
              <path d="M9.8 14.7c-.6 1.1-.8 2-.8 2.8 0 1.8 1.3 3.5 3.4 3.5 2 0 3.6-1.3 3.6-3.6 0-1.5-.8-2.8-2.3-3.9"/>
            </svg>
            <div>
              <div style="font-size:1.35rem;font-weight:800;">${this.profile.currentStreak} day streak</div>
              <div class="ctp-note">Best streak: ${this.profile.longestStreak} days</div>
            </div>
          </div>
          <div class="ctp-badge">Freeze ${this.profile.streakFreezes}</div>
        </div>
        <div class="ctp-tight">
          <div class="ctp-note">Break it and the streak resets. Keep the chain alive.</div>
        </div>
        <div class="ctp-tight ctp-heatmap">
          ${todayHeatmap.map((day) => `<div class="ctp-day ${day.active ? 'active' : ''} ${day.today ? 'today' : ''}" title="${day.label}"></div>`).join('')}
        </div>
      </div>

      <div class="ctp-pill-grid">
        <div class="ctp-pill">
          <div class="ctp-pill-label">Sessions</div>
          <div class="ctp-pill-value ctp-mono">${this.profile.totalSessions}</div>
        </div>
        <div class="ctp-pill">
          <div class="ctp-pill-label">Perfect lines</div>
          <div class="ctp-pill-value ctp-mono">${this.profile.totalPerfectLines}</div>
        </div>
        <div class="ctp-pill">
          <div class="ctp-pill-label">Best streak</div>
          <div class="ctp-pill-value ctp-mono">${this.profile.longestStreak}</div>
        </div>
      </div>

      <div class="ctp-card">
        <div class="ctp-section-title">Leaderboard</div>
        ${leaderboard.map((entry) => `
          <div class="ctp-leaderboard-row ${entry.self ? 'self' : ''}">
            <div class="ctp-mono">${entry.rank}</div>
            <div class="ctp-avatar-sm">${escapeHtml(initials(entry.username))}</div>
            <div>${escapeHtml(entry.username)}</div>
            <div class="ctp-mono">${entry.xp} XP</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderQuests() {
    return `
      <div class="ctp-card">
        <div class="ctp-section-title">Daily quests</div>
        <div class="ctp-note">Resets in ${countdownToMidnight()}</div>
        <div class="ctp-tight">
          ${this.profile.dailyQuests.map((quest) => this.renderQuestCard(quest)).join('')}
        </div>
      </div>
      <div class="ctp-card">
        <div class="ctp-section-title">Weekly challenges</div>
        <div class="ctp-note">Resets in ${countdownToMonday()}</div>
        <div class="ctp-tight">
          ${this.profile.weeklyQuests.map((quest) => this.renderQuestCard(quest)).join('')}
        </div>
      </div>
    `;
  }

  private renderQuestCard(quest: DailyQuest | WeeklyQuest) {
    const progressPct = quest.target > 0 ? Math.min(100, (quest.progress / quest.target) * 100) : 0;
    return `
      <div class="ctp-card ctp-quest-card ${quest.completedAt ? 'ctp-quest-done' : ''}">
        <div class="ctp-quest-top">
          <div>
            <div class="ctp-quest-name">${escapeHtml(quest.name)}</div>
            <div class="ctp-quest-desc">${escapeHtml(quest.description)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            ${quest.completedAt ? '<span class="ctp-check">✓</span>' : ''}
            <span class="ctp-xp-pill">${quest.xpReward} XP</span>
          </div>
        </div>
        <div class="ctp-progress"><span style="width:${progressPct}%; background:${quest.completedAt ? 'var(--green)' : 'var(--blue)'};"></span></div>
        <div class="ctp-note ctp-mono">${quest.progress} / ${quest.target}</div>
      </div>
    `;
  }

  private renderAchievements(unlockedCount: number) {
    return `
      <div class="ctp-card">
        <div class="ctp-section-title">Achievements</div>
        <div class="ctp-note">${unlockedCount} / ${ACHIEVEMENTS.length} unlocked</div>
      </div>
      <div class="ctp-grid-two">
        ${ACHIEVEMENTS.map((achievement) => {
          const unlocked = this.profile.achievements[achievement.id];
          const progress = this.getAchievementProgress(achievement.id);
          return `
            <div class="ctp-card ctp-achievement ${unlocked ? '' : 'locked'}">
              <div class="ctp-achievement-name">${escapeHtml(achievement.name)}</div>
              <div class="ctp-achievement-desc">${escapeHtml(achievement.description)}</div>
              ${unlocked
                ? `<div class="ctp-achievement-date">Unlocked ${formatDateLabel(unlocked.unlockedAt)}</div>`
                : `<div class="ctp-note ctp-tight">${escapeHtml(progress)}</div>`
              }
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  private renderStats(lineBreakdown: ReturnType<typeof getLineBreakdown>) {
    const totalAccuracy = this.profile.totalMoves + this.profile.totalErrors > 0
      ? Math.round((this.profile.totalMoves / (this.profile.totalMoves + this.profile.totalErrors)) * 100)
      : 0;
    const thisWeekKey = isoWeekKey();
    const thisWeekSessions = this.profile.sessionHistory.filter((session) => isoWeekKey(new Date(session.date)) === thisWeekKey).length;
    const thisMonthPrefix = localDateKey().slice(0, 7);
    const thisMonthSessions = this.profile.sessionHistory.filter((session) => session.date.startsWith(thisMonthPrefix)).length;

    return `
      <div class="ctp-card">
        <div class="ctp-section-title">Accuracy over time</div>
        <div class="ctp-chart-wrap"><canvas class="ctp-chart" width="340" height="160" data-profile-chart></canvas></div>
      </div>
      <div class="ctp-stat-grid">
        <div class="ctp-card"><div class="ctp-pill-label">Total moves</div><div class="ctp-pill-value ctp-mono">${this.profile.totalMoves}</div></div>
        <div class="ctp-card"><div class="ctp-pill-label">Total errors</div><div class="ctp-pill-value ctp-mono">${this.profile.totalErrors}</div></div>
        <div class="ctp-card"><div class="ctp-pill-label">Accuracy</div><div class="ctp-pill-value ctp-mono">${totalAccuracy}%</div></div>
        <div class="ctp-card"><div class="ctp-pill-label">Total XP</div><div class="ctp-pill-value ctp-mono">${this.profile.xp}</div></div>
        <div class="ctp-card"><div class="ctp-pill-label">Sessions this week</div><div class="ctp-pill-value ctp-mono">${thisWeekSessions}</div></div>
        <div class="ctp-card"><div class="ctp-pill-label">Sessions this month</div><div class="ctp-pill-value ctp-mono">${thisMonthSessions}</div></div>
      </div>
      <div class="ctp-card">
        <div class="ctp-section-title">Line completion breakdown</div>
        ${lineBreakdown.map((line) => `
          <div class="ctp-line-row">
            <div>
              <div>${escapeHtml(line.lineName)}</div>
              <div class="ctp-line-meta">${escapeHtml(line.openingName)}</div>
            </div>
            <div class="ctp-line-status">${line.unlocked ? 'Done' : `${line.attempts} tries`}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private getAchievementProgress(id: AchievementId) {
    switch (id) {
      case 'first_line':
        return `${Math.min(this.profile.totalSessions, 1)} / 1 lines`;
      case 'perfect_10':
        return `${Math.min(this.profile.totalPerfectLines, 10)} / 10 perfect lines`;
      case 'streak_7':
        return `${Math.min(this.profile.currentStreak, 7)} / 7 days`;
      case 'streak_30':
        return `${Math.min(this.profile.currentStreak, 30)} / 30 days`;
      case 'streak_100':
        return `${Math.min(this.profile.currentStreak, 100)} / 100 days`;
      case 'level_10':
        return `Level ${Math.min(this.profile.level, 10)} / 10`;
      case 'level_20':
        return `Level ${Math.min(this.profile.level, 20)} / 20`;
      case 'scholar': {
        const mastered = OPENINGS.filter((opening) => isOpeningMastered(opening.id)).length;
        return `${mastered} openings mastered`;
      }
      case 'no_hints_week':
        return `${Math.min(this.profile.weeklyCounters.noHintLines, 7)} / 7 clean days`;
      case 'comeback':
        return 'Finish a line after 3 mistakes in a row';
      default:
        return '';
    }
  }

  private getHeatmapDays() {
    const today = localDateKey();
    return Array.from({ length: 28 }, (_, index) => {
      const date = localDateKey(addDays(new Date(), -(27 - index)));
      return {
        label: date,
        active: this.profile.streakHistory.includes(date),
        today: date === today,
      };
    });
  }

  private getLeaderboard() {
    const players = [...MOCK_LEADERBOARD, { username: this.profile.username, xp: this.profile.xp, self: true }]
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 12)
      .map((entry, index) => ({
        rank: index + 1,
        username: entry.username,
        xp: entry.xp,
        self: entry.username === this.profile.username && entry.xp === this.profile.xp,
      }));
    return players;
  }

  private bindPanelEvents() {
    if (!this.panelEl) return;
    this.panelEl.querySelector('[data-profile-close]')?.addEventListener('click', () => this.close());
    this.panelEl.querySelectorAll<HTMLElement>('[data-profile-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const tab = button.dataset.profileTab as ProfileTab | undefined;
        if (!tab) return;
        this.activeTab = tab;
        this.render();
      });
    });
  }

  private renderToasts() {
    if (!this.toastRoot) return;
    this.toastRoot.innerHTML = this.visibleToasts.map((toast) => `
      <div class="ctp-toast ${toast.type}">
        <div class="ctp-toast-title">${escapeHtml(toast.title)}</div>
        <div class="ctp-toast-body">${escapeHtml(toast.body)}</div>
      </div>
    `).join('');
  }

  private drawStatsChart() {
    const canvas = this.panelEl?.querySelector<HTMLCanvasElement>('[data-profile-chart]');
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const sessions = this.profile.sessionHistory.slice(-7);
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = 'rgba(255,255,255,0.04)';
    context.fillRect(0, 0, width, height);

    if (!sessions.length) {
      context.fillStyle = '#9f968a';
      context.font = '12px Instrument Sans, sans-serif';
      context.fillText('Complete sessions to see your last 7 runs.', 18, 84);
      return;
    }

    const chartHeight = 118;
    const barWidth = 24;
    const gap = 18;
    const startX = 24;

    sessions.forEach((session, index) => {
      const barHeight = Math.max(8, Math.round(session.accuracy * chartHeight));
      const x = startX + index * (barWidth + gap);
      const y = height - 28 - barHeight;
      context.fillStyle = '#46a4df';
      context.fillRect(x, y, barWidth, barHeight);
      context.fillStyle = '#e7e2d9';
      context.font = '11px JetBrains Mono, monospace';
      context.fillText(`${Math.round(session.accuracy * 100)}%`, x - 4, y - 8);
      context.fillStyle = '#9f968a';
      context.fillText(session.date.slice(5), x - 6, height - 10);
    });
  }

  private flashBoards() {
    document.querySelectorAll<HTMLElement>('.board-frame').forEach((frame) => {
      frame.classList.add('board-flash-green');
      window.setTimeout(() => frame.classList.remove('board-flash-green'), 900);
    });
  }
}

export const ProfileModule = new ChessTrainerProfileModule();

export function useProfileModuleState() {
  return useSyncExternalStore(
    (listener) => ProfileModule.subscribe(listener),
    () => ProfileModule.getSnapshot(),
  );
}
