import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookMarked,
  BookOpenCheck,
  Clock3,
  FileText,
  ListChecks,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ApiResponseError,
  getAdminDashboard,
  type AdminAnalyticsRange,
  type AdminDashboardResponseDTO,
} from '../api/api';
import { BottomNav } from '../components/BottomNav';

const RANGE_OPTIONS: Array<{ key: AdminAnalyticsRange; label: string }> = [
  { key: 'TODAY', label: 'Today' },
  { key: 'LAST_7_DAYS', label: '7 days' },
  { key: 'THIS_MONTH', label: 'This month' },
  { key: 'LAST_30_DAYS', label: '30 days' },
  { key: 'ALL_TIME', label: 'All time' },
];

const numberFormatter = new Intl.NumberFormat(undefined);
const compactFormatter = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatCompact(value: number) {
  return compactFormatter.format(value);
}

function formatDate(value: string) {
  if (!value) {
    return '';
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatRange(data: AdminDashboardResponseDTO | null) {
  if (data == null) {
    return '';
  }

  if (data.range.startDate == null) {
    return `Through ${data.range.endDate}`;
  }

  return `${data.range.startDate} to ${data.range.endDate}`;
}

function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  detail?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone: 'brand' | 'accent' | 'muted';
}) {
  const toneClassName = tone === 'brand'
    ? 'bg-brand-soft text-brand-strong'
    : tone === 'accent'
      ? 'bg-accent-soft text-accent-strong'
      : 'bg-surface-muted text-text-muted';

  return (
    <div className="rounded-[24px] border border-border bg-surface p-5 shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-text-subtle">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-text">
            {formatNumber(value)}
          </p>
          {detail ? (
            <p className="mt-1 text-sm text-text-muted">{detail}</p>
          ) : null}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${toneClassName}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function StatePanel({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-border bg-surface px-6 py-12 text-center shadow-[0_18px_36px_rgba(31,41,55,0.06)]">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted text-text-muted">
        <Icon size={24} />
      </div>
      <h2 className="text-xl font-semibold text-text">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function TableEmpty({ label }: { label: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-border bg-surface-alt px-4 py-8 text-center text-sm text-text-muted">
      {label}
    </div>
  );
}

export default function AdminDashboard() {
  const [range, setRange] = useState<AdminAnalyticsRange>('THIS_MONTH');
  const [dashboard, setDashboard] = useState<AdminDashboardResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        setIsForbidden(false);
        const response = await getAdminDashboard(range);

        if (!isMounted) {
          return;
        }

        setDashboard(response);
      } catch (error) {
        console.error('Failed to load admin dashboard:', error);

        if (!isMounted) {
          return;
        }

        const forbidden = error instanceof ApiResponseError && error.status === 403;
        setIsForbidden(forbidden);
        setErrorMessage(
          forbidden
            ? 'Your account is signed in, but it does not have the admin role for this backend client.'
            : error instanceof Error
              ? error.message
              : 'Could not load admin dashboard.',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [range]);

  const chartData = useMemo(() => {
    return dashboard?.dailySeries.map((point) => ({
      ...point,
      label: formatDate(point.date),
    })) ?? [];
  }, [dashboard]);

  const handleRetry = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsForbidden(false);

    void getAdminDashboard(range)
      .then((response) => {
        setDashboard(response);
        setErrorMessage(null);
        setIsForbidden(false);
      })
      .catch((error) => {
        const forbidden = error instanceof ApiResponseError && error.status === 403;
        setIsForbidden(forbidden);
        setErrorMessage(error instanceof Error ? error.message : 'Could not load admin dashboard.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const summary = dashboard?.summary;
  const lifetime = dashboard?.lifetime;

  return (
    <div className="page-bg min-h-screen pb-28 lg:pl-60 lg:pb-0">
      <BottomNav />

      <main className="mx-auto w-full max-w-[92rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-[32px] border border-border bg-surface p-5 shadow-[0_20px_48px_rgba(15,23,42,0.07)] sm:p-7 lg:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.32em] text-text-subtle">
                Admin
              </p>
              <h1 className="mt-2 text-[1.9rem] font-semibold leading-tight tracking-[-0.05em] text-text sm:text-[2.4rem]">
                Platform Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
                Usage, reading progress, activity, and leaderboards across Lexipal.
              </p>
              {dashboard ? (
                <p className="mt-3 text-sm text-text-subtle">
                  {formatRange(dashboard)} · {dashboard.range.timezone}
                </p>
              ) : null}
            </div>

            <div className="flex w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface-muted p-1 xl:w-fit">
              {RANGE_OPTIONS.map((option) => {
                const isActive = option.key === range;
                return (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setRange(option.key)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-brand text-text-on-brand shadow-[0_8px_18px_rgba(154,74,66,0.22)]'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mt-6">
          {isLoading && dashboard == null ? (
            <StatePanel
              icon={Loader2}
              title="Loading dashboard"
              message="Gathering platform analytics."
            />
          ) : isForbidden ? (
            <StatePanel
              icon={ShieldAlert}
              title="Admin access required"
              message={errorMessage ?? 'This dashboard is available only to users with the admin role.'}
            />
          ) : errorMessage != null && dashboard == null ? (
            <StatePanel
              icon={AlertTriangle}
              title="Dashboard unavailable"
              message={errorMessage}
              action={(
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-text-on-brand transition-colors hover:bg-brand-hover"
                >
                  <RefreshCcw size={15} />
                  Retry
                </button>
              )}
            />
          ) : dashboard != null && summary != null && lifetime != null ? (
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-muted shadow-[0_10px_22px_rgba(31,41,55,0.04)]">
                  <Loader2 size={16} className="animate-spin" />
                  Refreshing dashboard
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard label="Total users" value={summary.totalUsers} detail={`${formatNumber(summary.newUsers)} new`} icon={Users} tone="brand" />
                <KpiCard label="Pages read" value={summary.totalPagesRead} detail={`${formatNumber(summary.activeUsers)} active readers`} icon={FileText} tone="accent" />
                <KpiCard label="Completed books" value={summary.completedBooks} detail={`${formatNumber(summary.completedSessions)} sessions`} icon={BookOpenCheck} tone="brand" />
                <KpiCard label="Minutes read" value={summary.totalMinutesRead} detail={`${formatNumber(summary.capturedWords)} captured words`} icon={Clock3} tone="muted" />
                <KpiCard label="XP awarded" value={summary.xpAwarded} icon={Zap} tone="accent" />
                <KpiCard label="Lists created" value={summary.readingListsCreated} icon={BookMarked} tone="brand" />
                <KpiCard label="Subscriptions" value={summary.readingListSubscriptions} icon={ListChecks} tone="muted" />
                <KpiCard label="List completions" value={summary.readingListCompletions} icon={Trophy} tone="accent" />
              </div>

              <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)]">
                <div className="rounded-[28px] border border-border bg-surface p-5 shadow-[0_18px_36px_rgba(31,41,55,0.06)] sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-text-subtle">
                        Trend
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-text">Daily activity</h2>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-brand-soft text-brand-strong">
                      <BarChart3 size={20} />
                    </div>
                  </div>

                  <div className="mt-5 h-[22rem] min-h-[22rem]">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 12, right: 18, bottom: 4, left: 0 }}>
                          <CartesianGrid stroke="var(--t-border)" strokeDasharray="3 3" />
                          <XAxis dataKey="label" stroke="var(--t-text-subtle)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--t-text-subtle)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={48} />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--t-surface)',
                              border: '1px solid var(--t-border)',
                              borderRadius: 16,
                              color: 'var(--t-text)',
                            }}
                            labelFormatter={(label) => String(label)}
                            formatter={(value, name) => [formatNumber(Number(value)), name]}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="pagesRead" name="Pages read" stroke="var(--t-brand)" strokeWidth={3} dot={false} />
                          <Line type="monotone" dataKey="xpAwarded" name="XP awarded" stroke="var(--t-accent)" strokeWidth={3} dot={false} />
                          <Line type="monotone" dataKey="activeUsers" name="Active users" stroke="var(--t-text-muted)" strokeWidth={3} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <TableEmpty label="No daily activity for this range yet." />
                    )}
                  </div>
                </div>

                <div className="rounded-[28px] border border-border bg-surface p-5 shadow-[0_18px_36px_rgba(31,41,55,0.06)] sm:p-6">
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-text-subtle">
                    Lifetime
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-text">All-time totals</h2>
                  <div className="mt-5 grid gap-3">
                    {[
                      ['Users', lifetime.totalUsers],
                      ['Books', lifetime.totalBooks],
                      ['Completed books', lifetime.completedBooks],
                      ['Pages read', lifetime.totalPagesRead],
                      ['Completed sessions', lifetime.completedSessions],
                      ['XP awarded', lifetime.totalXpAwarded],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-[18px] bg-surface-muted px-4 py-3">
                        <span className="text-sm text-text-muted">{label}</span>
                        <span className="font-semibold text-text">{formatNumber(Number(value))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-[28px] border border-border bg-surface p-5 shadow-[0_18px_36px_rgba(31,41,55,0.06)] sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-text-subtle">
                        Readers
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-text">Top users</h2>
                    </div>
                    <Sparkles size={20} className="text-brand-strong" />
                  </div>

                  <div className="mt-5 overflow-x-auto">
                    {dashboard.topUsers.length > 0 ? (
                      <table className="w-full min-w-[36rem] text-left text-sm">
                        <thead className="text-[0.68rem] uppercase tracking-[0.18em] text-text-subtle">
                          <tr className="border-b border-border">
                            <th className="py-3 font-medium">User</th>
                            <th className="py-3 text-right font-medium">Pages</th>
                            <th className="py-3 text-right font-medium">Books</th>
                            <th className="py-3 text-right font-medium">Sessions</th>
                            <th className="py-3 text-right font-medium">XP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboard.topUsers.map((user) => (
                            <tr key={user.userId} className="border-b border-border last:border-0">
                              <td className="py-3 font-medium text-text">{user.nickname ?? `User ${user.userId}`}</td>
                              <td className="py-3 text-right text-text-muted">{formatNumber(user.totalPagesRead)}</td>
                              <td className="py-3 text-right text-text-muted">{formatNumber(user.completedBooks)}</td>
                              <td className="py-3 text-right text-text-muted">{formatNumber(user.completedSessions)}</td>
                              <td className="py-3 text-right text-text-muted">{formatNumber(user.totalXpEarned)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <TableEmpty label="No readers with completed sessions yet." />
                    )}
                  </div>
                </div>

                <div className="rounded-[28px] border border-border bg-surface p-5 shadow-[0_18px_36px_rgba(31,41,55,0.06)] sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-text-subtle">
                        Books
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-text">Top books</h2>
                    </div>
                    <BookOpenCheck size={20} className="text-accent-strong" />
                  </div>

                  <div className="mt-5 overflow-x-auto">
                    {dashboard.topBooks.length > 0 ? (
                      <table className="w-full min-w-[32rem] text-left text-sm">
                        <thead className="text-[0.68rem] uppercase tracking-[0.18em] text-text-subtle">
                          <tr className="border-b border-border">
                            <th className="py-3 font-medium">Book</th>
                            <th className="py-3 text-right font-medium">Completed</th>
                            <th className="py-3 text-right font-medium">Pages</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboard.topBooks.map((book) => (
                            <tr key={`${book.title}-${book.author}`} className="border-b border-border last:border-0">
                              <td className="py-3">
                                <p className="font-medium text-text">{book.title}</p>
                                <p className="mt-0.5 text-xs text-text-muted">{book.author}</p>
                              </td>
                              <td className="py-3 text-right text-text-muted">{formatNumber(book.completedCount)}</td>
                              <td className="py-3 text-right text-text-muted">{formatNumber(book.pagesRead)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <TableEmpty label="No books have reading activity yet." />
                    )}
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
