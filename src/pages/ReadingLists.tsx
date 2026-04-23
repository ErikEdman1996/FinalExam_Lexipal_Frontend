import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  ListPlus,
  Search,
  Sparkles,
  Star,
  Trophy,
  UserCheck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  browseReadingLists,
  getMyReadingLists,
  getMyReadingListSubscriptions,
  starReadingList,
  subscribeToReadingList,
  unstarReadingList,
  unsubscribeFromReadingList,
  type ReadingListSubscriptionResponseDTO,
  type ReadingListSummaryResponseDTO,
} from '../api/api';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { CreateReadingListModal } from '../features/readingLists/CreateReadingListModal';
import { formatCircleDate } from '../features/bookCircles/utils';
import {
  getOwnerDisplayName,
  getReadingListStatusLabel,
  truncateDescription,
} from '../features/readingLists/utils';
import { fieldLabelClassName, inputClassName } from '../components/form/inputStyles';

type TabKey = 'explore' | 'mine' | 'subscriptions';

const PAGE_SIZE = 12;

const TABS: Array<{ key: TabKey; label: string; icon: typeof Sparkles }> = [
  { key: 'explore', label: 'Explore', icon: Sparkles },
  { key: 'mine', label: 'My lists', icon: BookMarked },
  { key: 'subscriptions', label: 'Subscribed', icon: UserCheck },
];

function StatusChip({ label, tone }: { label: string; tone: 'brand' | 'accent' | 'muted' }) {
  const toneClassName = tone === 'brand'
    ? 'bg-brand-soft text-brand-strong'
    : tone === 'accent'
      ? 'bg-accent-soft text-accent-strong'
      : 'bg-surface-muted text-text-muted';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${toneClassName}`}>
      {label}
    </span>
  );
}

function SummaryCard({
  list,
  onStarToggle,
  onSubscribeToggle,
  busy,
}: {
  list: ReadingListSummaryResponseDTO;
  onStarToggle: (list: ReadingListSummaryResponseDTO) => void;
  onSubscribeToggle: (list: ReadingListSummaryResponseDTO) => void;
  busy: boolean;
}) {
  return (
    <article className="rounded-[28px] border border-border bg-surface p-6 text-left shadow-[0_14px_28px_rgba(31,41,55,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-alt">
      <Link
        to={`/reading-lists/${list.id}`}
        className="block rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-2xl font-semibold tracking-[-0.03em] text-text">{list.title}</p>
            <p className="mt-1 truncate text-sm text-text-muted">
              By {getOwnerDisplayName(list.ownerNickname, list.ownerUserId)}
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-brand-soft">
            <BookMarked size={20} className="text-brand-strong" />
          </div>
        </div>

        {list.description ? (
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            {truncateDescription(list.description)}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {list.status !== 'PUBLISHED' ? (
            <StatusChip label={getReadingListStatusLabel(list.status)} tone="muted" />
          ) : null}
          {list.callerIsOwner ? <StatusChip label="Owner" tone="brand" /> : null}
          {list.isSubscribed ? <StatusChip label="Subscribed" tone="accent" /> : null}
          <StatusChip label={`${list.bookCount} book${list.bookCount === 1 ? '' : 's'}`} tone="muted" />
        </div>

        <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-strong">
          <span>Open list</span>
          <ArrowRight size={14} />
        </div>
      </Link>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => onStarToggle(list)}
          disabled={busy}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            list.hasStarred
              ? 'bg-accent-soft text-accent-strong'
              : 'bg-surface-muted text-text-muted hover:text-text'
          } disabled:cursor-not-allowed disabled:opacity-60`}
          aria-label={list.hasStarred ? 'Remove star' : 'Star list'}
        >
          <Star size={14} className={list.hasStarred ? 'fill-current' : ''} />
          {list.starCount}
        </button>

        {list.callerIsOwner ? (
          <span className="text-xs text-text-subtle">Created {formatCircleDate(list.createdAt)}</span>
        ) : list.status === 'PUBLISHED' ? (
          <button
            type="button"
            onClick={() => onSubscribeToggle(list)}
            disabled={busy}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              list.isSubscribed
                ? 'bg-surface-muted text-text'
                : 'bg-brand text-text-on-brand hover:bg-brand-hover'
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {list.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function SubscriptionCard({ subscription }: { subscription: ReadingListSubscriptionResponseDTO }) {
  const progressPercent = subscription.slotsTotal > 0
    ? Math.round((subscription.slotsCompleted / subscription.slotsTotal) * 100)
    : 0;
  const isComplete = subscription.completedAt != null;

  return (
    <Link
      to={`/reading-lists/${subscription.listId}`}
      className="block rounded-[28px] border border-border bg-surface p-6 text-left shadow-[0_14px_28px_rgba(31,41,55,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold text-text">{subscription.listTitle}</p>
          <p className="mt-1 truncate text-sm text-text-muted">
            By {subscription.ownerNickname?.trim() || 'Anonymous'}
          </p>
        </div>
        {isComplete ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-accent-soft text-accent-strong">
            <Trophy size={20} />
          </div>
        ) : null}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>{subscription.slotsCompleted} / {subscription.slotsTotal} books</span>
          <span className="font-semibold text-text">{progressPercent}%</span>
        </div>
        <div className="mt-2">
          <ProgressBar current={subscription.slotsCompleted} total={Math.max(1, subscription.slotsTotal)} height="md" />
        </div>
      </div>

      <p className="mt-4 text-xs text-text-subtle">
        {isComplete
          ? `Completed ${formatCircleDate(subscription.completedAt ?? '')}`
          : `Subscribed ${formatCircleDate(subscription.subscribedAt)}`}
      </p>
    </Link>
  );
}

export default function ReadingLists() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('explore');

  const [exploreLists, setExploreLists] = useState<ReadingListSummaryResponseDTO[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [minStars, setMinStars] = useState('0');
  const [page, setPage] = useState(0);
  const [exploreLoading, setExploreLoading] = useState(true);
  const [exploreError, setExploreError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [myLists, setMyLists] = useState<ReadingListSummaryResponseDTO[]>([]);
  const [myLoading, setMyLoading] = useState(true);
  const [myError, setMyError] = useState<string | null>(null);

  const [subscriptions, setSubscriptions] = useState<ReadingListSubscriptionResponseDTO[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsError, setSubsError] = useState<string | null>(null);

  const [busyListId, setBusyListId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const latestExploreRequestRef = useRef(0);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(0);
    }, 300);

    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const parsedMinStars = useMemo(() => {
    const parsed = Number(minStars);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  }, [minStars]);

  const loadExplore = useCallback(async () => {
    const requestId = latestExploreRequestRef.current + 1;
    latestExploreRequestRef.current = requestId;

    try {
      setExploreLoading(true);
      setExploreError(null);
      const response = await browseReadingLists({
        q: searchQuery,
        minStars: parsedMinStars,
        page,
        size: PAGE_SIZE,
      });

      if (latestExploreRequestRef.current !== requestId) return;
      setExploreLists(response);
      setHasNextPage(response.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading reading lists:', error);
      if (latestExploreRequestRef.current !== requestId) return;
      setExploreError('Could not load reading lists right now.');
    } finally {
      if (latestExploreRequestRef.current === requestId) {
        setExploreLoading(false);
      }
    }
  }, [page, parsedMinStars, searchQuery]);

  const loadMine = useCallback(async () => {
    try {
      setMyLoading(true);
      setMyError(null);
      const response = await getMyReadingLists();
      setMyLists(response);
    } catch (error) {
      console.error('Error loading my reading lists:', error);
      setMyError('Could not load your lists right now.');
    } finally {
      setMyLoading(false);
    }
  }, []);

  const loadSubscriptions = useCallback(async () => {
    try {
      setSubsLoading(true);
      setSubsError(null);
      const response = await getMyReadingListSubscriptions();
      setSubscriptions(response);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setSubsError('Could not load your subscriptions right now.');
    } finally {
      setSubsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'explore') void loadExplore();
  }, [tab, loadExplore]);

  useEffect(() => {
    if (tab === 'mine') void loadMine();
  }, [tab, loadMine]);

  useEffect(() => {
    if (tab === 'subscriptions') void loadSubscriptions();
  }, [tab, loadSubscriptions]);

  const applySummaryChange = (listId: number, patch: Partial<ReadingListSummaryResponseDTO>) => {
    const update = (current: ReadingListSummaryResponseDTO[]) =>
      current.map((list) => (list.id === listId ? { ...list, ...patch } : list));
    setExploreLists(update);
    setMyLists(update);
  };

  const handleStarToggle = async (list: ReadingListSummaryResponseDTO) => {
    if (busyListId != null) return;
    setBusyListId(list.id);
    const wasStarred = list.hasStarred;

    applySummaryChange(list.id, {
      hasStarred: !wasStarred,
      starCount: Math.max(0, list.starCount + (wasStarred ? -1 : 1)),
    });

    try {
      if (wasStarred) {
        await unstarReadingList(list.id);
      } else {
        await starReadingList(list.id);
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      applySummaryChange(list.id, {
        hasStarred: wasStarred,
        starCount: list.starCount,
      });
      toast.error('Could not update star.');
    } finally {
      setBusyListId(null);
    }
  };

  const handleSubscribeToggle = async (list: ReadingListSummaryResponseDTO) => {
    if (busyListId != null) return;
    setBusyListId(list.id);
    const wasSubscribed = list.isSubscribed;

    applySummaryChange(list.id, { isSubscribed: !wasSubscribed });

    try {
      if (wasSubscribed) {
        await unsubscribeFromReadingList(list.id);
        toast.success('Unsubscribed.');
      } else {
        await subscribeToReadingList(list.id);
        toast.success('Subscribed.');
      }

      if (tab === 'subscriptions') void loadSubscriptions();
    } catch (error) {
      console.error('Error toggling subscription:', error);
      applySummaryChange(list.id, { isSubscribed: wasSubscribed });
      toast.error('Could not update subscription.');
    } finally {
      setBusyListId(null);
    }
  };

  const renderExplore = () => {
    if (exploreLoading) {
      return (
        <div className="rounded-[28px] border border-border bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
          <p className="text-sm text-text-muted">Loading reading lists...</p>
        </div>
      );
    }

    if (exploreError) {
      return (
        <div className="rounded-[28px] border border-danger/30 bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
          <p className="text-lg font-semibold text-danger">{exploreError}</p>
          <Button type="button" variant="outline" className="mt-4 rounded-full px-5" onClick={() => void loadExplore()}>
            Try again
          </Button>
        </div>
      );
    }

    if (exploreLists.length === 0) {
      return (
        <div className="rounded-[32px] border border-border bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft">
            <Sparkles size={30} className="text-brand-strong" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-text">No reading lists match your filters</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-muted">
            Try a different search, lower the star minimum, or author the first list yourself.
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {exploreLists.map((list) => (
            <SummaryCard
              key={list.id}
              list={list}
              onStarToggle={(target) => { void handleStarToggle(target); }}
              onSubscribeToggle={(target) => { void handleSubscribeToggle(target); }}
              busy={busyListId === list.id}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            className="rounded-full px-4"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            <span className="inline-flex items-center gap-2">
              <ChevronLeft size={14} />
              Previous
            </span>
          </Button>
          <span className="text-sm text-text-muted">Page {page + 1}</span>
          <Button
            type="button"
            variant="outline"
            className="rounded-full px-4"
            disabled={!hasNextPage}
            onClick={() => setPage((current) => current + 1)}
          >
            <span className="inline-flex items-center gap-2">
              Next
              <ChevronRight size={14} />
            </span>
          </Button>
        </div>
      </>
    );
  };

  const renderMine = () => {
    if (myLoading) {
      return (
        <div className="rounded-[28px] border border-border bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
          <p className="text-sm text-text-muted">Loading your lists...</p>
        </div>
      );
    }

    if (myError) {
      return (
        <div className="rounded-[28px] border border-danger/30 bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
          <p className="text-lg font-semibold text-danger">{myError}</p>
          <Button type="button" variant="outline" className="mt-4 rounded-full px-5" onClick={() => void loadMine()}>
            Try again
          </Button>
        </div>
      );
    }

    if (myLists.length === 0) {
      return (
        <div className="rounded-[32px] border border-border bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft">
            <ListPlus size={30} className="text-brand-strong" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-text">You haven&apos;t authored a list yet</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-muted">
            Curate your favourite books into a roadmap others can subscribe to.
          </p>
          <Button type="button" className="mt-6 rounded-full px-5" onClick={() => setIsCreateOpen(true)}>
            Create a list
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {myLists.map((list) => (
          <SummaryCard
            key={list.id}
            list={list}
            onStarToggle={(target) => { void handleStarToggle(target); }}
            onSubscribeToggle={(target) => { void handleSubscribeToggle(target); }}
            busy={busyListId === list.id}
          />
        ))}
      </div>
    );
  };

  const renderSubscriptions = () => {
    if (subsLoading) {
      return (
        <div className="rounded-[28px] border border-border bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
          <p className="text-sm text-text-muted">Loading your subscriptions...</p>
        </div>
      );
    }

    if (subsError) {
      return (
        <div className="rounded-[28px] border border-danger/30 bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
          <p className="text-lg font-semibold text-danger">{subsError}</p>
          <Button type="button" variant="outline" className="mt-4 rounded-full px-5" onClick={() => void loadSubscriptions()}>
            Try again
          </Button>
        </div>
      );
    }

    if (subscriptions.length === 0) {
      return (
        <div className="rounded-[32px] border border-border bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft">
            <UserCheck size={30} className="text-brand-strong" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-text">No subscriptions yet</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-muted">
            Browse explore and subscribe to a list to start earning bonus XP while you read through it.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {subscriptions.map((subscription) => (
          <SubscriptionCard key={subscription.listId} subscription={subscription} />
        ))}
      </div>
    );
  };

  return (
    <div className="page-bg min-h-screen pb-28 lg:pl-60 lg:pb-0">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-[32px] border border-border bg-surface p-6 shadow-[0_20px_48px_rgba(15,23,42,0.07)] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.32em] text-text-subtle">Curated roadmaps</p>
              <h1 className="mt-2 text-[1.9rem] font-semibold leading-tight tracking-[-0.05em] text-text sm:text-[2.4rem]">
                Reading lists
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
                Follow curated roadmaps, track your progress through each book, and earn bonus XP as you finish.
              </p>
            </div>

            <Button type="button" className="rounded-full px-5" onClick={() => setIsCreateOpen(true)}>
              <span className="inline-flex items-center gap-2">
                <ListPlus size={16} />
                Create list
              </span>
            </Button>
          </div>
        </section>

        <div className="mt-6 flex w-full gap-1 rounded-full border border-border bg-surface-muted p-1 sm:w-fit">
          {TABS.map((option) => {
            const Icon = option.icon;
            const isActive = option.key === tab;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setTab(option.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand text-text-on-brand shadow-[0_8px_18px_rgba(154,74,66,0.24)]'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <Icon size={14} />
                {option.label}
              </button>
            );
          })}
        </div>

        {tab === 'explore' ? (
          <div className="mt-6 rounded-[28px] border border-border bg-surface p-4 shadow-[0_14px_28px_rgba(31,41,55,0.05)] sm:p-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div>
                <label htmlFor="reading-list-search" className={fieldLabelClassName}>
                  Search by title
                </label>
                <div className="relative">
                  <input
                    id="reading-list-search"
                    type="text"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    className={`${inputClassName} pl-10`}
                    placeholder="Sci-fi, fantasy, programming..."
                    autoComplete="off"
                  />
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
                </div>
              </div>
              <div>
                <label htmlFor="reading-list-min-stars" className={fieldLabelClassName}>
                  Min stars
                </label>
                <div className="relative">
                  <input
                    id="reading-list-min-stars"
                    type="number"
                    min="0"
                    value={minStars}
                    onChange={(event) => {
                      setMinStars(event.target.value);
                      setPage(0);
                    }}
                    className={`${inputClassName} w-28 pr-10`}
                    inputMode="numeric"
                  />
                  <Star size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle" />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          {tab === 'explore' ? renderExplore() : null}
          {tab === 'mine' ? renderMine() : null}
          {tab === 'subscriptions' ? renderSubscriptions() : null}
        </div>
      </div>

      <BottomNav />

      <CreateReadingListModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(list) => {
          setIsCreateOpen(false);
          void navigate(`/reading-lists/${list.id}`);
        }}
      />
    </div>
  );
}
