import { useState } from 'react';
import {
  Crown,
  LogOut,
  CheckCircle2,
  Circle,
  Download,
  Upload,
  User,
  BarChart2,
  Flame,
  Trophy,
  BookOpen,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { useProfileStore } from '../store/profileStore';
import {
  useProgressionStore,
  getLevelInfo,
  getWeeklyXp,
  getTodayProgress,
  getQuestProgress,
} from '../store/progressionStore';
import { useProgressStore } from '../store/progressStore';
import { OPENINGS } from '../data/openings';

interface ProfilePageProps {
  onBack: () => void;
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { isLoggedIn, displayName, logout, exportData, importData, openAuthModal } =
    useProfileStore();
  const { xpTotal, daily, setupAwards } = useProgressionStore();
  const { openings: progressOpenings } = useProgressStore();

  const levelInfo = getLevelInfo(xpTotal);
  const weeklyXp = getWeeklyXp(daily);
  const today = getTodayProgress(daily);
  const quests = getQuestProgress(today);

  const accountLabel =
    typeof displayName === 'string' && displayName.trim()
      ? displayName.trim()
      : 'Opening Player';

  // All-time stats
  const totalLines = OPENINGS.reduce((sum, op) => sum + op.lines.length, 0);
  const unlockedCount = OPENINGS.reduce(
    (sum, op) =>
      sum +
      op.lines.filter((l) => progressOpenings[op.id]?.lines[l.id]?.unlocked).length,
    0,
  );
  const totalAttempts = Object.values(progressOpenings).reduce(
    (sum, op) =>
      sum +
      Object.values(op.lines ?? {}).reduce((s, l) => s + (l.attempts ?? 0), 0),
    0,
  );
  const perfectAttempts = Object.values(progressOpenings).reduce(
    (sum, op) =>
      sum +
      Object.values(op.lines ?? {}).filter((l) => l.bestMistakes === 0).length,
    0,
  );

  // Weekly chart — last 7 days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en', { weekday: 'short' });
    return { key, label, xp: daily[key]?.xp ?? 0 };
  });
  const maxDayXp = Math.max(...weekDays.map((d) => d.xp), 1);

  // Export / import
  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState('');
  const [showImport, setShowImport] = useState(false);

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
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-3 text-slate-100 backdrop-blur-sm sm:p-5"
      onClick={onBack}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
    >
      <div
        className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-stone-800/70 bg-stone-950 shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2.5rem)]"
        onClick={(event) => event.stopPropagation()}
      >
      {/* ── Top bar ── */}
      <div className="border-b border-stone-800/60 bg-stone-950">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4 sm:px-6">
          <h1 id="profile-title" className="flex-1 text-lg font-bold text-white">My Profile</h1>
          <button
            onClick={onBack}
            className="rounded-xl border border-stone-700/45 bg-stone-800 px-2.5 py-2 text-stone-300 transition-colors hover:bg-stone-700 hover:text-white cursor-pointer"
            aria-label="Close profile"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6">

        {/* ── Hero card ── */}
        <div className="rounded-[22px] border border-stone-800/60 bg-stone-900 p-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/20 ring-2 ring-sky-400/30">
              {isLoggedIn ? (
                <span className="text-2xl font-bold text-sky-300">
                  {accountLabel[0].toUpperCase()}
                </span>
              ) : (
                <User size={28} className="text-stone-400" />
              )}
            </div>

            {/* Name + level */}
            <div className="min-w-0 flex-1">
              {isLoggedIn ? (
                <>
                  <div className="truncate text-xl font-bold text-white">
                    {accountLabel}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Crown size={13} className="text-sky-300" />
                    <span className="text-sm text-sky-300 font-semibold">
                      Level {levelInfo.level}
                    </span>
                    <span className="text-xs text-stone-500">
                      · {xpTotal} XP total
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xl font-bold text-stone-400">Not signed in</div>
                  <div className="mt-0.5 text-sm text-stone-500">
                    Sign in to save your progress
                  </div>
                </>
              )}
            </div>

            {/* Auth button */}
            {isLoggedIn ? (
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-xl border border-stone-700/45 bg-stone-800 px-3.5 py-2.5 text-sm text-stone-300 transition-colors hover:bg-rose-900/40 hover:text-rose-300 hover:border-rose-700/40 cursor-pointer"
              >
                <LogOut size={15} />
                Log out
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('signup')}
                className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 cursor-pointer"
              >
                Sign in
              </button>
            )}
          </div>

          {/* XP progress bar */}
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

        {/* ── Two-column: Today + Quests ── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

          {/* Today's activity */}
          <div className="rounded-[22px] border border-stone-800/60 bg-stone-900 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Flame size={16} className="text-emerald-300" />
              <span className="text-xs font-bold uppercase tracking-widest text-stone-400">
                Today
              </span>
            </div>
            <div className="space-y-3">
              <StatItem label="XP earned" value={`+${today.xp}`} accent="text-sky-300" />
              <StatItem label="Sessions" value={`${today.sessions}`} />
              <StatItem
                label="Lines completed"
                value={`${today.linesCompleted.length}`}
              />
              <StatItem
                label="Perfect lines"
                value={`${today.perfectLines.length}`}
                accent={today.perfectLines.length > 0 ? 'text-emerald-300' : undefined}
              />
            </div>
          </div>

          {/* Daily quests */}
          <div className="rounded-[22px] border border-stone-800/60 bg-stone-900 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-amber-300" />
              <span className="text-xs font-bold uppercase tracking-widest text-stone-400">
                Daily Quests
              </span>
            </div>
            <div className="space-y-3">
              {quests.map((q) => {
                const done = q.progress >= q.target;
                return (
                  <div key={q.id} className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-400" />
                    ) : (
                      <Circle size={16} className="flex-shrink-0 text-stone-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm ${done ? 'text-emerald-300' : 'text-stone-300'}`}>
                        {q.label}
                      </div>
                      <div className="mt-1 h-1 w-full rounded-full bg-stone-700">
                        <div
                          className={`h-1 rounded-full transition-all duration-500 ${done ? 'bg-emerald-400' : 'bg-sky-400'}`}
                          style={{
                            width: `${Math.min(100, Math.round((q.progress / q.target) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-xs text-stone-500">
                      {q.progress}/{q.target}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Weekly XP chart ── */}
        <div className="rounded-[22px] border border-stone-800/60 bg-stone-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-sky-300" />
              <span className="text-xs font-bold uppercase tracking-widest text-stone-400">
                Last 7 Days
              </span>
            </div>
            <span className="text-sm font-semibold text-sky-300">{weeklyXp} XP</span>
          </div>
          <div className="flex h-24 items-end gap-1.5">
            {weekDays.map((day) => {
              const heightPct = Math.round((day.xp / maxDayXp) * 100);
              const isToday =
                day.key === new Date().toISOString().split('T')[0];
              return (
                <div key={day.key} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${
                      isToday ? 'bg-sky-400' : 'bg-stone-700'
                    } ${day.xp > 0 ? 'min-h-[4px]' : ''}`}
                    style={{ height: `${heightPct}%` }}
                    title={`${day.xp} XP`}
                  />
                  <span
                    className={`text-[10px] ${isToday ? 'font-bold text-sky-300' : 'text-stone-600'}`}
                  >
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── All-time stats ── */}
        <div className="rounded-[22px] border border-stone-800/60 bg-stone-900 p-5">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-stone-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">
              All-Time Stats
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BigStat label="Lines unlocked" value={`${unlockedCount}/${totalLines}`} />
            <BigStat label="Perfect lines" value={`${perfectAttempts}`} accent="text-emerald-300" />
            <BigStat label="Total sessions" value={`${totalAttempts}`} />
            <BigStat label="Openings studied" value={`${setupAwards.length}`} />
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs text-stone-500">
              <span>Lines unlocked</span>
              <span>{totalLines > 0 ? Math.round((unlockedCount / totalLines) * 100) : 0}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-stone-800">
              <div
                className="h-2 rounded-full bg-emerald-400 transition-all duration-500"
                style={{
                  width: `${totalLines > 0 ? Math.round((unlockedCount / totalLines) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Lines breakdown ── */}
        {OPENINGS.length > 0 && (
          <div className="rounded-[22px] border border-stone-800/60 bg-stone-900 p-5">
            <div className="mb-4 text-xs font-bold uppercase tracking-widest text-stone-400">
              Progress by Opening
            </div>
            <div className="space-y-4">
              {OPENINGS.map((op) => {
                const total = op.lines.length;
                const unlocked = op.lines.filter(
                  (l) => progressOpenings[op.id]?.lines[l.id]?.unlocked,
                ).length;
                const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;
                return (
                  <div key={op.id}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-stone-300">{op.name}</span>
                      <span className="flex-shrink-0 text-xs text-stone-500">
                        <span className={unlocked > 0 ? 'font-semibold text-emerald-300' : ''}>
                          {unlocked}
                        </span>
                        /{total}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-stone-800">
                      <div
                        className="h-1.5 rounded-full bg-emerald-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Data backup ── */}
        <div className="rounded-[22px] border border-stone-800/60 bg-stone-900 p-5">
          <div className="mb-4 text-xs font-bold uppercase tracking-widest text-stone-400">
            Data Backup
          </div>
          <p className="mb-4 text-sm text-stone-500 leading-relaxed">
            Export your progress as a backup code you can paste later to restore it on any
            browser.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleExport}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-stone-700/45 bg-stone-800 px-4 py-3 text-sm font-semibold text-stone-200 transition-colors hover:bg-stone-700 cursor-pointer"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Download size={15} />}
              {copied ? 'Copied!' : 'Export backup'}
            </button>
            <button
              onClick={() => setShowImport((v) => !v)}
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
                onChange={(e) => { setImportCode(e.target.value); setImportError(''); }}
                placeholder="Paste your backup code here…"
                rows={3}
                className="w-full resize-none rounded-2xl border border-stone-700/45 bg-stone-900 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:border-sky-400/55 focus:outline-none"
              />
              {importError && (
                <p className="text-xs text-rose-400">{importError}</p>
              )}
              <button
                onClick={handleImport}
                disabled={!importCode.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Copy size={15} />
                Restore from backup
              </button>
            </div>
          )}
        </div>

      </div>
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────

function StatItem({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-stone-400">{label}</span>
      <span className={`text-sm font-bold ${accent ?? 'text-white'}`}>{value}</span>
    </div>
  );
}

function BigStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-stone-800/50 px-3 py-3 text-center">
      <div className={`text-xl font-bold ${accent ?? 'text-white'}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-stone-500">{label}</div>
    </div>
  );
}
