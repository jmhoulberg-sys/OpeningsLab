import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart2,
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Crown,
  Download,
  Flame,
  LogOut,
  Medal,
  Trophy,
  Upload,
  User,
  Users,
} from 'lucide-react';
import { useProfileStore } from '../store/profileStore';
import {
  useProgressionStore,
  getLevelInfo,
  getTodayProgress,
  getQuestProgress,
} from '../store/progressionStore';
import { useProgressStore } from '../store/progressStore';
import { OPENINGS } from '../data/openings';

interface ProfilePageProps {
  onBack: () => void;
}

type ProfileTab = 'stats' | 'progress' | 'friends' | 'leaderboard';
type ChartRange = 'week' | 'month' | 'year' | 'all';
type LeaderboardScope = 'all' | 'friends';

const TABS: Array<{ id: ProfileTab; label: string; icon: typeof BarChart2 }> = [
  { id: 'stats', label: 'Stats', icon: BarChart2 },
  { id: 'progress', label: 'Progress', icon: BookOpen },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
];

const RANGE_LABELS: Record<ChartRange, string> = {
  week: 'Last week',
  month: 'Last month',
  year: 'Last year',
  all: 'All time',
};

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { isLoggedIn, displayName, logout, exportData, importData, openAuthModal } =
    useProfileStore();
  const { xpTotal, daily, setupAwards } = useProgressionStore();
  const { openings: progressOpenings } = useProgressStore();

  const [activeTab, setActiveTab] = useState<ProfileTab>('stats');
  const [chartRange, setChartRange] = useState<ChartRange>('week');
  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [leaderboardScope, setLeaderboardScope] = useState<LeaderboardScope>('all');

  const levelInfo = getLevelInfo(xpTotal);
  const today = getTodayProgress(daily);
  const quests = getQuestProgress(today);
  const accountLabel =
    typeof displayName === 'string' && displayName.trim()
      ? displayName.trim()
      : 'Opening Player';

  const totalLines = OPENINGS.reduce((sum, op) => sum + op.lines.length, 0);
  const unlockedCount = OPENINGS.reduce(
    (sum, op) =>
      sum +
      op.lines.filter((line) => progressOpenings[op.id]?.lines[line.id]?.unlocked).length,
    0,
  );
  const totalAttempts = Object.values(progressOpenings).reduce(
    (sum, op) =>
      sum +
      Object.values(op.lines ?? {}).reduce((lineSum, line) => lineSum + (line.attempts ?? 0), 0),
    0,
  );
  const perfectAttempts = Object.values(progressOpenings).reduce(
    (sum, op) =>
      sum +
      Object.values(op.lines ?? {}).filter((line) => line.bestMistakes === 0).length,
    0,
  );

  const chart = useMemo(() => buildChart(daily, chartRange), [daily, chartRange]);
  const openingRows = useMemo(() => {
    return OPENINGS.map((op) => {
      const total = op.lines.length;
      const unlocked = op.lines.filter(
        (line) => progressOpenings[op.id]?.lines[line.id]?.unlocked,
      ).length;
      const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;
      const complete = total > 0 && unlocked === total;
      const empty = total === 0;
      return { op, total, unlocked, pct, complete, empty };
    }).sort((a, b) => {
      if (a.complete !== b.complete) return a.complete ? 1 : -1;
      if (a.empty !== b.empty) return a.empty ? 1 : -1;
      return b.pct - a.pct || b.unlocked - a.unlocked || a.op.name.localeCompare(b.op.name);
    });
  }, [progressOpenings]);

  function handleExport() {
    const code = exportData();
    if (!code) return;
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleImport() {
    const ok = importData(importCode.trim());
    if (!ok) setImportError('Invalid or incompatible backup code.');
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-brand-bg text-slate-100">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-stone-950">
        <div className="border-b border-stone-800/60 bg-stone-950">
          <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4 sm:px-6">
            <button
              onClick={onBack}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-stone-700/45 bg-stone-900 px-3 text-sm font-semibold text-stone-300 transition-colors hover:bg-stone-800 hover:text-white cursor-pointer"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <h1 id="profile-title" className="flex-1 text-lg font-bold text-white">My Profile</h1>
          </div>
          <div className="mx-auto flex max-w-4xl gap-2 overflow-x-auto px-4 pb-4 sm:px-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-2xl border px-3.5 text-sm font-semibold transition-colors cursor-pointer ${
                    selected
                      ? 'border-sky-400/35 bg-sky-500/16 text-sky-200'
                      : 'border-stone-800/70 bg-stone-900/70 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6">
          <ProfileHero
            isLoggedIn={isLoggedIn}
            accountLabel={accountLabel}
            xpTotal={xpTotal}
            levelInfo={levelInfo}
            onLogin={() => openAuthModal('signup')}
            onLogout={logout}
          />

          {activeTab === 'stats' && (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TodayPanel today={today} />
                <QuestPanel quests={quests} />
              </div>
              <ActivityChart
                chart={chart}
                chartRange={chartRange}
                onRangeChange={setChartRange}
              />
              <AllTimeStats
                unlockedCount={unlockedCount}
                totalLines={totalLines}
                perfectAttempts={perfectAttempts}
                totalAttempts={totalAttempts}
                openingsStudied={setupAwards.length}
              />
              <BackupPanel
                copied={copied}
                importCode={importCode}
                importError={importError}
                showImport={showImport}
                onExport={handleExport}
                onImport={handleImport}
                onToggleImport={() => setShowImport((value) => !value)}
                onImportCodeChange={(value) => {
                  setImportCode(value);
                  setImportError('');
                }}
              />
            </>
          )}

          {activeTab === 'progress' && (
            <ProgressPanel rows={openingRows} totalLines={totalLines} unlockedCount={unlockedCount} />
          )}

          {activeTab === 'friends' && (
            <FriendsPanel accountLabel={accountLabel} totalAttempts={totalAttempts} />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardPanel
              accountLabel={accountLabel}
              xpTotal={xpTotal}
              weeklyXp={chart.weeklyXp}
              level={levelInfo.level}
              scope={leaderboardScope}
              onScopeChange={setLeaderboardScope}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileHero({
  isLoggedIn,
  accountLabel,
  xpTotal,
  levelInfo,
  onLogin,
  onLogout,
}: {
  isLoggedIn: boolean;
  accountLabel: string;
  xpTotal: number;
  levelInfo: ReturnType<typeof getLevelInfo>;
  onLogin: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="rounded-[22px] border border-stone-800/60 bg-stone-900 p-6">
      <div className="flex items-center gap-5">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/20 ring-2 ring-sky-400/30">
          {isLoggedIn ? (
            <span className="text-2xl font-bold text-sky-300">{accountLabel[0].toUpperCase()}</span>
          ) : (
            <User size={28} className="text-stone-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {isLoggedIn ? (
            <>
              <div className="truncate text-xl font-bold text-white">{accountLabel}</div>
              <div className="mt-0.5 flex items-center gap-2">
                <Crown size={13} className="text-sky-300" />
                <span className="text-sm font-semibold text-sky-300">Level {levelInfo.level}</span>
                <span className="text-xs text-stone-500">· {xpTotal} XP total</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-xl font-bold text-stone-400">Not signed in</div>
              <div className="mt-0.5 text-sm text-stone-500">Sign in to save your progress</div>
            </>
          )}
        </div>

        {isLoggedIn ? (
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-xl border border-stone-700/45 bg-stone-800 px-3.5 py-2.5 text-sm text-stone-300 transition-colors hover:border-rose-700/40 hover:bg-rose-900/40 hover:text-rose-300 cursor-pointer"
          >
            <LogOut size={15} />
            Log out
          </button>
        ) : (
          <button
            onClick={onLogin}
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 cursor-pointer"
          >
            Sign in
          </button>
        )}
      </div>

      {isLoggedIn && (
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-xs text-stone-500">
            <span>Level {levelInfo.level}</span>
            <span>
              {xpTotal - levelInfo.levelStartXp} / {levelInfo.nextLevelXp - levelInfo.levelStartXp} XP
            </span>
            <span>Level {levelInfo.level + 1}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-stone-800">
            <div
              className="h-2.5 rounded-full bg-sky-400 transition-all duration-500"
              style={{ width: `${levelInfo.progressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TodayPanel({ today }: { today: ReturnType<typeof getTodayProgress> }) {
  return (
    <div className="rounded-[22px] border border-stone-800/60 bg-stone-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Flame size={16} className="text-emerald-300" />
        <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Today</span>
      </div>
      <div className="space-y-3">
        <StatItem label="XP earned" value={`+${today.xp}`} accent="text-sky-300" />
        <StatItem label="Sessions" value={`${today.sessions}`} />
        <StatItem label="Lines completed" value={`${today.linesCompleted.length}`} />
        <StatItem
          label="Perfect lines"
          value={`${today.perfectLines.length}`}
          accent={today.perfectLines.length > 0 ? 'text-emerald-300' : undefined}
        />
      </div>
    </div>
  );
}

function QuestPanel({ quests }: { quests: ReturnType<typeof getQuestProgress> }) {
  return (
    <div className="rounded-[22px] border border-stone-800/60 bg-stone-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Trophy size={16} className="text-amber-300" />
        <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Daily Quests</span>
      </div>
      <div className="space-y-3">
        {quests.map((quest) => {
          const done = quest.progress >= quest.target;
          return (
            <div key={quest.id} className="flex items-center gap-3">
              {done ? (
                <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-400" />
              ) : (
                <Circle size={16} className="flex-shrink-0 text-stone-600" />
              )}
              <div className="min-w-0 flex-1">
                <div className={`text-sm ${done ? 'text-emerald-300' : 'text-stone-300'}`}>
                  {quest.label}
                </div>
                <div className="mt-1 h-1 w-full rounded-full bg-stone-700">
                  <div
                    className={`h-1 rounded-full transition-all duration-500 ${done ? 'bg-emerald-400' : 'bg-sky-400'}`}
                    style={{ width: `${Math.min(100, Math.round((quest.progress / quest.target) * 100))}%` }}
                  />
                </div>
              </div>
              <span className="flex-shrink-0 text-xs text-stone-500">
                {quest.progress}/{quest.target}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityChart({
  chart,
  chartRange,
  onRangeChange,
}: {
  chart: ReturnType<typeof buildChart>;
  chartRange: ChartRange;
  onRangeChange: (range: ChartRange) => void;
}) {
  const axisMarks = [chart.maxXp, Math.round(chart.maxXp / 2), 0];

  return (
    <div className="overflow-hidden rounded-[22px] border border-stone-800/60 bg-stone-900">
      <div className="border-b border-stone-800/65 bg-stone-950/50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-sky-300" />
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">
            {RANGE_LABELS[chartRange]}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(RANGE_LABELS) as ChartRange[]).map((range) => (
            <button
              key={range}
              onClick={() => onRangeChange(range)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                range === chartRange
                  ? 'border-sky-400/35 bg-sky-500/16 text-sky-200'
                  : 'border-stone-800 bg-stone-950/60 text-stone-500 hover:text-stone-300'
              }`}
            >
              {RANGE_LABELS[range]}
            </button>
          ))}
        </div>
      </div>
      </div>

      <div className="p-5">
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <div className="text-3xl font-black text-sky-300">{chart.totalXp} XP</div>
            <div className="mt-1 text-xs font-semibold text-stone-500">
              Peak day {chart.peakXp} XP · chart max {chart.maxXp} XP
            </div>
          </div>
          <div className="rounded-2xl border border-stone-800/70 bg-stone-950/55 px-3 py-2 text-xs font-semibold text-stone-400">
            {chart.activeDays}/{chart.buckets.length} active
          </div>
        </div>

        <div className="grid grid-cols-[42px_1fr] gap-3">
          <div className="relative h-40 text-right text-[10px] font-semibold text-stone-600">
            {axisMarks.map((mark, index) => (
              <div
                key={mark}
                className="absolute right-0"
                style={{ top: `${index * 50}%`, transform: 'translateY(-50%)' }}
              >
                {mark}
              </div>
            ))}
          </div>
          <div className="relative h-40">
            <div className="absolute inset-0 flex flex-col justify-between">
              {axisMarks.map((mark) => (
                <div key={mark} className="border-t border-stone-800/70" />
              ))}
            </div>
            <div className="absolute inset-0 flex items-end gap-1.5">
              {chart.buckets.map((bucket, index) => {
                const heightPct = Math.round((bucket.xp / chart.maxXp) * 100);
                const showLabel =
                  chartRange === 'week' ||
                  chartRange === 'year' ||
                  chart.buckets.length <= 12 ||
                  index === 0 ||
                  index === chart.buckets.length - 1 ||
                  index % 5 === 0;
                return (
                  <div key={bucket.key} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1">
                    <div className="relative flex flex-1 items-end">
                      {bucket.xp > 0 && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-black text-sky-200">
                          {bucket.xp}
                        </div>
                      )}
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          bucket.isCurrent ? 'bg-sky-400' : bucket.xp > 0 ? 'bg-sky-600/80' : 'bg-stone-800/75'
                        } ${bucket.xp > 0 ? 'min-h-[5px]' : ''}`}
                        style={{ height: `${heightPct}%` }}
                        title={`${bucket.label}: ${bucket.xp} XP`}
                      />
                    </div>
                    <span className={`h-4 truncate text-center text-[10px] ${bucket.isCurrent ? 'font-bold text-sky-300' : 'text-stone-600'}`}>
                      {showLabel ? bucket.label : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AllTimeStats({
  unlockedCount,
  totalLines,
  perfectAttempts,
  totalAttempts,
  openingsStudied,
}: {
  unlockedCount: number;
  totalLines: number;
  perfectAttempts: number;
  totalAttempts: number;
  openingsStudied: number;
}) {
  const percent = totalLines > 0 ? Math.round((unlockedCount / totalLines) * 100) : 0;

  return (
    <div className="rounded-[22px] border border-stone-800/60 bg-stone-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen size={16} className="text-stone-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-stone-400">All-Time Stats</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BigStat label="Lines unlocked" value={`${unlockedCount}/${totalLines}`} />
        <BigStat label="Perfect lines" value={`${perfectAttempts}`} accent="text-emerald-300" />
        <BigStat label="Total sessions" value={`${totalAttempts}`} />
        <BigStat label="Openings studied" value={`${openingsStudied}`} />
      </div>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs text-stone-500">
          <span>Lines unlocked</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-stone-800">
          <div className="h-2 rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
}

function ProgressPanel({
  rows,
  unlockedCount,
  totalLines,
}: {
  rows: Array<{
    op: (typeof OPENINGS)[number];
    total: number;
    unlocked: number;
    pct: number;
    complete: boolean;
    empty: boolean;
  }>;
  unlockedCount: number;
  totalLines: number;
}) {
  return (
    <div className="rounded-[22px] border border-stone-800/60 bg-stone-900 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-stone-400">
            Progress by Opening
          </div>
          <div className="mt-1 text-sm text-stone-500">
            Completed courses move to the bottom as trophies.
          </div>
        </div>
        <div className="rounded-2xl bg-stone-950/70 px-3 py-2 text-sm font-semibold text-sky-300">
          {unlockedCount}/{totalLines}
        </div>
      </div>
      <div className="space-y-4">
        {rows.map(({ op, total, unlocked, pct, complete, empty }) => (
          <div key={op.id} className={complete ? 'opacity-95' : empty ? 'opacity-60' : undefined}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                {complete && <Crown size={15} className="flex-shrink-0 text-sky-300" fill="currentColor" />}
                <span className={`truncate text-sm ${complete ? 'font-semibold text-sky-200' : 'text-stone-300'}`}>
                  {op.name}
                </span>
              </div>
              <span className="flex-shrink-0 text-xs text-stone-500">
                <span className={complete ? 'font-semibold text-sky-300' : unlocked > 0 ? 'font-semibold text-emerald-300' : ''}>
                  {unlocked}
                </span>
                /{total}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-stone-800">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  complete ? 'bg-sky-400' : empty ? 'bg-stone-700' : 'bg-emerald-400'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FriendsPanel({
  accountLabel,
  totalAttempts,
}: {
  accountLabel: string;
  totalAttempts: number;
}) {
  const { friends, friendRequests, addFriendRequest, acceptFriendRequest, declineFriendRequest } = useProfileStore();
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  function handleAddFriend() {
    const result = addFriendRequest(username);
    setMessage(result.ok ? `Request sent to ${username.trim()}.` : result.message ?? 'Could not send request.');
    if (result.ok) setUsername('');
  }

  return (
    <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[22px] border border-stone-800/60 bg-stone-900 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Users size={16} className="text-sky-300" />
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Friends</span>
        </div>
        <div className="space-y-3">
          <FriendRow name={accountLabel} detail={`${totalAttempts} practice sessions`} active />
          {friends.map((friend) => (
            <FriendRow key={friend} name={friend} detail="Friend" />
          ))}
          {friends.length === 0 && <FriendRow name="No friends yet" detail="Add someone by username" />}
        </div>
      </div>
      <div className="rounded-[22px] border border-stone-800/60 bg-stone-900 p-5">
        <div className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">
          Add friend
        </div>
        <div className="flex gap-2">
          <input
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setMessage('');
            }}
            placeholder="Username"
            className="min-w-0 flex-1 rounded-xl border border-stone-700/45 bg-stone-950 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:border-sky-400/55 focus:outline-none"
          />
          <button
            onClick={handleAddFriend}
            disabled={!username.trim()}
            className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
          >
            Add
          </button>
        </div>
        {message && <p className="mt-2 text-xs font-semibold text-stone-400">{message}</p>}

        <div className="mt-5 text-xs font-bold uppercase tracking-widest text-stone-400">
          Requests
        </div>
        <div className="mt-3 space-y-2">
          {friendRequests.length === 0 ? (
            <div className="rounded-2xl border border-stone-800/70 bg-stone-950/60 p-3 text-sm text-stone-500">
              No pending requests.
            </div>
          ) : friendRequests.map((request) => (
            <div key={request} className="flex items-center gap-2 rounded-2xl border border-stone-800/70 bg-stone-950/60 p-3">
              <div className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{request}</div>
              <button
                onClick={() => acceptFriendRequest(request)}
                className="rounded-xl bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950 cursor-pointer"
              >
                Accept
              </button>
              <button
                onClick={() => declineFriendRequest(request)}
                className="rounded-xl border border-stone-700/55 bg-stone-900 px-3 py-1.5 text-xs font-bold text-stone-300 cursor-pointer"
              >
                Decline
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeaderboardPanel({
  accountLabel,
  xpTotal,
  weeklyXp,
  level,
  scope,
  onScopeChange,
}: {
  accountLabel: string;
  xpTotal: number;
  weeklyXp: number;
  level: number;
  scope: LeaderboardScope;
  onScopeChange: (scope: LeaderboardScope) => void;
}) {
  const { friends } = useProfileStore();
  const allRows: Array<{ rank: number; name: string; score: string; detail: string; current?: boolean }> = [
    { rank: 1, name: accountLabel, score: `${weeklyXp} weekly XP`, detail: `Level ${level}`, current: true },
    { rank: 2, name: 'Local benchmark', score: `${Math.max(0, weeklyXp - 120)} weekly XP`, detail: 'Practice rival' },
    { rank: 3, name: 'All-time progress', score: `${xpTotal} total XP`, detail: 'Your lifetime score' },
  ];
  const friendRows: Array<{ rank: number; name: string; score: string; detail: string; current?: boolean }> = [
    allRows[0],
    ...friends.map((friend, index) => ({
      rank: index + 2,
      name: friend,
      score: `${Math.max(0, weeklyXp - (index + 1) * 80)} weekly XP`,
      detail: 'Friend',
    })),
  ];
  const rows = scope === 'friends' ? friendRows : allRows;

  return (
    <div className="rounded-[22px] border border-stone-800/60 bg-stone-900 p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Medal size={16} className="text-amber-300" />
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Leaderboard</span>
        </div>
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-stone-700/55">
          {(['all', 'friends'] as LeaderboardScope[]).map((item) => (
            <button
              key={item}
              onClick={() => onScopeChange(item)}
              className={`px-4 py-2 text-xs font-bold capitalize transition-colors cursor-pointer ${
                scope === item ? 'bg-sky-500 text-slate-950' : 'bg-stone-950 text-stone-400 hover:text-stone-200'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div
            key={row.rank}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
              row.current
                ? 'border-sky-400/25 bg-sky-500/10'
                : 'border-stone-800/70 bg-stone-950/60'
            }`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
              row.current ? 'bg-sky-400 text-slate-950' : 'bg-stone-800 text-stone-400'
            }`}>
              {row.rank}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{row.name}</div>
              <div className="text-xs text-stone-500">{row.detail}</div>
            </div>
            <div className="text-sm font-semibold text-sky-300">{row.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BackupPanel({
  copied,
  importCode,
  importError,
  showImport,
  onExport,
  onImport,
  onToggleImport,
  onImportCodeChange,
}: {
  copied: boolean;
  importCode: string;
  importError: string;
  showImport: boolean;
  onExport: () => void;
  onImport: () => void;
  onToggleImport: () => void;
  onImportCodeChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[22px] border border-stone-800/60 bg-stone-900 p-5">
      <div className="mb-4 text-xs font-bold uppercase tracking-widest text-stone-400">
        Data Backup
      </div>
      <p className="mb-4 text-sm leading-relaxed text-stone-500">
        Export your progress as a backup code you can paste later to restore it on any browser.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onExport}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-stone-700/45 bg-stone-800 px-4 py-3 text-sm font-semibold text-stone-200 transition-colors hover:bg-stone-700 cursor-pointer"
        >
          {copied ? <Check size={15} className="text-emerald-400" /> : <Download size={15} />}
          {copied ? 'Copied!' : 'Export backup'}
        </button>
        <button
          onClick={onToggleImport}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-stone-700/45 bg-stone-800 px-4 py-3 text-sm font-semibold text-stone-200 transition-colors hover:bg-stone-700 cursor-pointer"
        >
          <Upload size={15} />
          Import backup
        </button>
      </div>

      {showImport && (
        <div className="mt-3 space-y-2">
          <textarea
            value={importCode}
            onChange={(event) => onImportCodeChange(event.target.value)}
            placeholder="Paste your backup code here..."
            rows={3}
            className="w-full resize-none rounded-2xl border border-stone-700/45 bg-stone-900 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:border-sky-400/55 focus:outline-none"
          />
          {importError && <p className="text-xs text-rose-400">{importError}</p>}
          <button
            onClick={onImport}
            disabled={!importCode.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            <Copy size={15} />
            Restore from backup
          </button>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-stone-400">{label}</span>
      <span className={`text-sm font-bold ${accent ?? 'text-white'}`}>{value}</span>
    </div>
  );
}

function BigStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl bg-stone-800/50 px-3 py-3 text-center">
      <div className={`text-xl font-bold ${accent ?? 'text-white'}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-stone-500">{label}</div>
    </div>
  );
}

function FriendRow({ name, detail, active }: { name: string; detail: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
      active ? 'border-sky-400/25 bg-sky-500/10' : 'border-stone-800/70 bg-stone-950/60'
    }`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
        active ? 'bg-sky-400/20 text-sky-300' : 'bg-stone-800 text-stone-500'
      }`}>
        <User size={17} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-white">{name}</div>
        <div className="text-xs text-stone-500">{detail}</div>
      </div>
    </div>
  );
}

function buildChart(daily: Record<string, { xp: number }>, range: ChartRange) {
  const today = startOfDay(new Date());
  const buckets =
    range === 'week'
      ? buildDailyBuckets(daily, today, 7, 'weekday')
      : range === 'month'
        ? buildDailyBuckets(daily, today, 30, 'day')
        : range === 'year'
          ? buildMonthlyBuckets(daily, today, 12)
          : buildAllTimeBuckets(daily, today);
  const totalXp = buckets.reduce((sum, bucket) => sum + bucket.xp, 0);
  const peakXp = Math.max(...buckets.map((bucket) => bucket.xp), 1);
  const maxXp = niceMax(peakXp);
  const weeklyXp = buildDailyBuckets(daily, today, 7, 'weekday').reduce((sum, bucket) => sum + bucket.xp, 0);
  const activeDays = buckets.filter((bucket) => bucket.xp > 0).length;

  return { buckets, totalXp, maxXp, weeklyXp, peakXp, activeDays };
}

function buildDailyBuckets(
  daily: Record<string, { xp: number }>,
  today: Date,
  count: number,
  labelMode: 'weekday' | 'day',
) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (count - 1 - index));
    const key = toDateKey(date);
    return {
      key,
      label: labelMode === 'weekday'
        ? date.toLocaleDateString('en', { weekday: 'short' })
        : `${date.getDate()}`,
      xp: daily[key]?.xp ?? 0,
      isCurrent: key === toDateKey(today),
    };
  });
}

function buildMonthlyBuckets(daily: Record<string, { xp: number }>, today: Date, count: number) {
  const currentMonthKey = toMonthKey(today);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (count - 1 - index), 1);
    const monthKey = toMonthKey(date);
    return {
      key: monthKey,
      label: date.toLocaleDateString('en', { month: 'short' }),
      xp: Object.entries(daily).reduce((sum, [key, value]) => (
        key.startsWith(monthKey) ? sum + (value.xp ?? 0) : sum
      ), 0),
      isCurrent: monthKey === currentMonthKey,
    };
  });
}

function buildAllTimeBuckets(daily: Record<string, { xp: number }>, today: Date) {
  const keys = Object.keys(daily).sort();
  if (keys.length === 0) return buildMonthlyBuckets(daily, today, 1);

  const first = parseDateKey(keys[0]) ?? today;
  const monthCount = Math.max(
    1,
    (today.getFullYear() - first.getFullYear()) * 12 + today.getMonth() - first.getMonth() + 1,
  );
  return buildMonthlyBuckets(daily, today, monthCount);
}

function niceMax(value: number) {
  if (value <= 10) return 10;
  if (value <= 100) return Math.ceil(value / 10) * 10;
  if (value <= 1000) return Math.ceil(value / 100) * 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalised = value / magnitude;
  const nice = normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return nice * magnitude;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateKey(date: Date) {
  return date.toISOString().split('T')[0];
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}
