import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  browseReadingLists,
  getMyReadingLists,
  getMyReadingListSubscriptions,
  starReadingList,
  subscribeToReadingList,
  unstarReadingList,
  unsubscribeFromReadingList,
  type ReadingListSort,
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

const PAGE_SIZE = 20;
const VISIBLE_GENRE_COUNT = 3;

const TABS: Array<{ key: TabKey; label: string; icon: typeof Sparkles }> = [
  { key: 'explore', label: 'Explore', icon: Sparkles },
  { key: 'mine', label: 'My lists', icon: BookMarked },
  { key: 'subscriptions', label: 'Subscribed', icon: UserCheck },
];

const SORT_OPTIONS: Array<{ value: ReadingListSort; label: string }> = [
  { value: 'POPULAR', label: 'Most popular' },
  { value: 'RECENT', label: 'Most recent' },
  { value: 'OLDEST', label: 'Oldest' },
  { value: 'TITLE_ASC', label: 'Title (A-Z)' },
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

function GenreChips({ genres }: { genres: string[] }) {
  if (genres.length === 0) {
    return <span className="text-sm text-text-subtle">No genres</span>;
  }

  const visibleGenres = genres.slice(0, VISIBLE_GENRE_COUNT);
  const hiddenCount = genres.length - visibleGenres.length;

  return (
    <div className="flex flex-wrap gap-2">
      {visibleGenres.map((genre) => (
        <span key={genre} className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-strong">
          {genre}
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-text-muted">
          +{hiddenCount}
        </span>
      ) : null}
    </div>
  );
}

function stopRowNavigation(event: MouseEvent<HTMLElement>) {
  event.stopPropagation();
}

function handleRowKeyDown(event: KeyboardEvent<HTMLElement>, onOpen: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  event.preventDefault();
  onOpen();
}

function ReadingListRow({
  list,
  onOpen,
  onStarToggle,
  onSubscribeToggle,
  busy,
}: {
  list: ReadingListSummaryResponseDTO;
  onOpen: (listId: number) => void;
  onStarToggle: (list: ReadingListSummaryResponseDTO) => void;
  onSubscribeToggle: (list: ReadingListSummaryResponseDTO) => void;
  busy: boolean;
}) {
  const openList = () => onOpen(list.id);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openList}
      onKeyDown={(event) => handleRowKeyDown(event, openList)}
      className="group cursor-pointer border-t border-border px-4 py-4 transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
      aria-label={`Open ${list.title}`}
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.45fr)_minmax(10rem,0.9fr)_6rem_7rem_8rem_8rem] md:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-lg font-semibold text-text">{list.title}</p>
            {list.isSubscribed ? <UserCheck size={14} className="shrink-0 text-accent-strong" /> : null}
          </div>
          <p className="mt-1 truncate text-sm text-text-muted">
            By {getOwnerDisplayName(list.ownerNickname, list.ownerUserId)}
          </p>
          {list.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted md:hidden">
              {truncateDescription(list.description, 120)}
            </p>
          ) : null}
          {list.status !== 'PUBLISHED' || list.callerIsOwner ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {list.status !== 'PUBLISHED' ? (
                <StatusChip label={getReadingListStatusLabel(list.status)} tone="muted" />
              ) : null}
              {list.callerIsOwner ? <StatusChip label="Owner" tone="brand" /> : null}
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2 md:hidden">
            <StatusChip label={`${list.bookCount} book${list.bookCount === 1 ? '' : 's'}`} tone="muted" />
          </div>
        </div>

        <GenreChips genres={list.genres} />

        <div className="hidden text-sm text-text-muted md:block">
          <span className="font-medium text-text">{list.bookCount}</span>
          {' '}
          book{list.bookCount === 1 ? '' : 's'}
        </div>

        <div>
          <button
            type="button"
            onClick={(event) => {
              stopRowNavigation(event);
              onStarToggle(list);
            }}
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
        </div>

        <div className="text-sm text-text-muted">
          <span className="md:hidden">Created </span>
          {formatCircleDate(list.createdAt)}
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {list.callerIsOwner || list.status !== 'PUBLISHED' ? (
            <button
              type="button"
              onClick={(event) => {
                stopRowNavigation(event);
                openList();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-brand-soft hover:text-brand-strong"
            >
              Open
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                stopRowNavigation(event);
                onSubscribeToggle(list);
              }}
              disabled={busy}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                list.isSubscribed
                  ? 'bg-surface-muted text-text'
                  : 'bg-brand text-text-on-brand hover:bg-brand-hover'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {list.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SubscriptionRow({
  subscription,
  onOpen,
}: {
  subscription: ReadingListSubscriptionResponseDTO;
  onOpen: (listId: number) => void;
}) {
  const progressPercent = subscription.slotsTotal > 0
    ? Math.round((subscription.slotsCompleted / subscription.slotsTotal) * 100)
    : 0;
  const isComplete = subscription.completedAt != null;
  const openList = () => onOpen(subscription.listId);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openList}
      onKeyDown={(event) => handleRowKeyDown(event, openList)}
      className="group cursor-pointer border-t border-border px-4 py-4 transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
      aria-label={`Open ${subscription.listTitle}`}
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.45fr)_minmax(11rem,0.9fr)_7rem_8rem_7rem] md:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-lg font-semibold text-text">{subscription.listTitle}</p>
            {isComplete ? <Trophy size={14} className="shrink-0 text-accent-strong" /> : null}
          </div>
          <p className="mt-1 truncate text-sm text-text-muted">
            By {subscription.ownerNickname?.trim() || 'Anonymous'}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>{subscription.slotsCompleted} / {subscription.slotsTotal}</span>
            <span className="font-semibold text-text">{progressPercent}%</span>
          </div>
          <div className="mt-2">
            <ProgressBar current={subscription.slotsCompleted} total={Math.max(1, subscription.slotsTotal)} height="sm" />
          </div>
        </div>

        <div className="text-sm text-text-muted">
          <span className="font-medium text-text">{subscription.slotsTotal}</span>
          {' '}
          books
        </div>

        <div className="text-sm text-text-muted">
          {isComplete
            ? `Completed ${formatCircleDate(subscription.completedAt ?? '')}`
            : `Joined ${formatCircleDate(subscription.subscribedAt)}`}
        </div>

        <div className="md:text-right">
          <button
            type="button"
            onClick={(event) => {
              stopRowNavigation(event);
              openList();
            }}
            className="inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-brand-soft hover:text-brand-strong"
          >
            Open
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ListHeader({ kind }: { kind: 'reading-lists' | 'subscriptions' }) {
  if (kind === 'subscriptions') {
    return (
      <div className="hidden grid-cols-[minmax(0,1.45fr)_minmax(11rem,0.9fr)_7rem_8rem_7rem] gap-4 bg-surface-muted px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-text-subtle md:grid">
        <span>List</span>
        <span>Progress</span>
        <span>Books</span>
        <span>Date</span>
        <span className="text-right">Action</span>
      </div>
    );
  }

  return (
    <div className="hidden grid-cols-[minmax(0,1.45fr)_minmax(10rem,0.9fr)_6rem_7rem_8rem_8rem] gap-4 bg-surface-muted px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-text-subtle md:grid">
      <span>List</span>
      <span>Genres</span>
      <span>Books</span>
      <span>Stars</span>
      <span>Created</span>
      <span className="text-right">Action</span>
    </div>
  );
}

function PaginationFooter({
  page,
  hasNext,
  onPrevious,
  onNext,
  label,
}: {
  page: number;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-text-muted">{label}</span>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <Button type="button" variant="outline" className="rounded-full px-4" disabled={page === 0} onClick={onPrevious}>
          <span className="inline-flex items-center gap-2">
            <ChevronLeft size={14} />
            Previous
          </span>
        </Button>
        <span className="min-w-16 text-center text-sm font-medium text-text">Page {page + 1}</span>
        <Button type="button" variant="outline" className="rounded-full px-4" disabled={!hasNext} onClick={onNext}>
          <span className="inline-flex items-center gap-2">
            Next
            <ChevronRight size={14} />
          </span>
        </Button>
      </div>
    </div>
  );
}

function StatePanel({
  icon: Icon,
  title,
  message,
  action,
  danger = false,
}: {
  icon: typeof Sparkles;
  title: string;
  message: string;
  action?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={`rounded-[22px] border bg-surface px-6 py-14 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)] ${danger ? 'border-danger/30' : 'border-border'}`}>
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] ${danger ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand-strong'}`}>
        <Icon size={24} />
      </div>
      <h2 className={`mt-5 text-xl font-semibold text-text ${danger ? 'text-danger' : ''}`}>{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

const getClientPageItems = <Item,>(items: Item[], page: number) => {
  const start = page * PAGE_SIZE;
  return items.slice(start, start + PAGE_SIZE);
};

const getLastClientPage = (itemCount: number) => {
  return Math.max(0, Math.ceil(itemCount / PAGE_SIZE) - 1);
};

const getRangeLabel = (page: number, total: number) => {
  if (total === 0) {
    return 'No results';
  }

  const start = page * PAGE_SIZE + 1;
  const end = Math.min(total, (page + 1) * PAGE_SIZE);
  return `Showing ${start}-${end} of ${total}`;
};

export default function ReadingLists() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('explore');

  const [exploreLists, setExploreLists] = useState<ReadingListSummaryResponseDTO[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<ReadingListSort>('POPULAR');
  const [page, setPage] = useState(0);
  const [myPage, setMyPage] = useState(0);
  const [subsPage, setSubsPage] = useState(0);
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

  const visibleMyLists = useMemo(() => getClientPageItems(myLists, myPage), [myLists, myPage]);
  const visibleSubscriptions = useMemo(
    () => getClientPageItems(subscriptions, subsPage),
    [subscriptions, subsPage],
  );

  useEffect(() => {
    setMyPage((current) => Math.min(current, getLastClientPage(myLists.length)));
  }, [myLists.length]);

  useEffect(() => {
    setSubsPage((current) => Math.min(current, getLastClientPage(subscriptions.length)));
  }, [subscriptions.length]);

  const loadExplore = useCallback(async () => {
    const requestId = latestExploreRequestRef.current + 1;
    latestExploreRequestRef.current = requestId;

    try {
      setExploreLoading(true);
      setExploreError(null);
      const response = await browseReadingLists({
        q: searchQuery,
        page,
        size: PAGE_SIZE,
        sort,
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
  }, [page, searchQuery, sort]);

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

  const openList = (listId: number) => {
    void navigate(`/reading-lists/${listId}`);
  };

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
        <StatePanel
          icon={BookMarked}
          title="Loading reading lists"
          message="Fetching the next page of curated roadmaps."
        />
      );
    }

    if (exploreError) {
      return (
        <StatePanel
          icon={BookMarked}
          title={exploreError}
          message="Try again in a moment."
          danger
          action={(
            <Button type="button" variant="outline" className="rounded-full px-5" onClick={() => void loadExplore()}>
              Try again
            </Button>
          )}
        />
      );
    }

    if (exploreLists.length === 0) {
      return (
        <StatePanel
          icon={Sparkles}
          title="No reading lists match your filters"
          message="Try a different search, lower the star minimum, or author the first list yourself."
        />
      );
    }

    return (
      <div className="overflow-hidden rounded-[22px] border border-border bg-surface shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
        <ListHeader kind="reading-lists" />
        {exploreLists.map((list) => (
          <ReadingListRow
            key={list.id}
            list={list}
            onOpen={openList}
            onStarToggle={(target) => { void handleStarToggle(target); }}
            onSubscribeToggle={(target) => { void handleSubscribeToggle(target); }}
            busy={busyListId === list.id}
          />
        ))}
        <PaginationFooter
          page={page}
          hasNext={hasNextPage}
          onPrevious={() => setPage((current) => Math.max(0, current - 1))}
          onNext={() => setPage((current) => current + 1)}
          label={`Showing ${exploreLists.length} result${exploreLists.length === 1 ? '' : 's'} on this page`}
        />
      </div>
    );
  };

  const renderMine = () => {
    if (myLoading) {
      return (
        <StatePanel
          icon={BookMarked}
          title="Loading your lists"
          message="Fetching the roadmaps you have authored."
        />
      );
    }

    if (myError) {
      return (
        <StatePanel
          icon={BookMarked}
          title={myError}
          message="Try again in a moment."
          danger
          action={(
            <Button type="button" variant="outline" className="rounded-full px-5" onClick={() => void loadMine()}>
              Try again
            </Button>
          )}
        />
      );
    }

    if (myLists.length === 0) {
      return (
        <StatePanel
          icon={ListPlus}
          title="You haven't authored a list yet"
          message="Curate your favourite books into a roadmap others can subscribe to."
          action={(
            <Button type="button" className="rounded-full px-5" onClick={() => setIsCreateOpen(true)}>
              Create a list
            </Button>
          )}
        />
      );
    }

    return (
      <div className="overflow-hidden rounded-[22px] border border-border bg-surface shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
        <ListHeader kind="reading-lists" />
        {visibleMyLists.map((list) => (
          <ReadingListRow
            key={list.id}
            list={list}
            onOpen={openList}
            onStarToggle={(target) => { void handleStarToggle(target); }}
            onSubscribeToggle={(target) => { void handleSubscribeToggle(target); }}
            busy={busyListId === list.id}
          />
        ))}
        <PaginationFooter
          page={myPage}
          hasNext={(myPage + 1) * PAGE_SIZE < myLists.length}
          onPrevious={() => setMyPage((current) => Math.max(0, current - 1))}
          onNext={() => setMyPage((current) => current + 1)}
          label={getRangeLabel(myPage, myLists.length)}
        />
      </div>
    );
  };

  const renderSubscriptions = () => {
    if (subsLoading) {
      return (
        <StatePanel
          icon={UserCheck}
          title="Loading your subscriptions"
          message="Fetching the roadmaps you are following."
        />
      );
    }

    if (subsError) {
      return (
        <StatePanel
          icon={UserCheck}
          title={subsError}
          message="Try again in a moment."
          danger
          action={(
            <Button type="button" variant="outline" className="rounded-full px-5" onClick={() => void loadSubscriptions()}>
              Try again
            </Button>
          )}
        />
      );
    }

    if (subscriptions.length === 0) {
      return (
        <StatePanel
          icon={UserCheck}
          title="No subscriptions yet"
          message="Browse explore and subscribe to a list to start earning bonus XP while you read through it."
        />
      );
    }

    return (
      <div className="overflow-hidden rounded-[22px] border border-border bg-surface shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
        <ListHeader kind="subscriptions" />
        {visibleSubscriptions.map((subscription) => (
          <SubscriptionRow key={subscription.listId} subscription={subscription} onOpen={openList} />
        ))}
        <PaginationFooter
          page={subsPage}
          hasNext={(subsPage + 1) * PAGE_SIZE < subscriptions.length}
          onPrevious={() => setSubsPage((current) => Math.max(0, current - 1))}
          onNext={() => setSubsPage((current) => current + 1)}
          label={getRangeLabel(subsPage, subscriptions.length)}
        />
      </div>
    );
  };

  return (
    <div className="page-bg min-h-screen pb-28 lg:pl-60 lg:pb-0">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-[24px] border border-border bg-surface px-5 py-4 shadow-[0_14px_32px_rgba(15,23,42,0.06)] sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.32em] text-text-subtle">Curated roadmaps</p>
              <h1 className="mt-1 text-[1.7rem] font-semibold leading-tight text-text sm:text-[2rem]">
                Reading lists
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-muted">
                Search, subscribe, and track curated book roadmaps.
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

        <section className="mt-4 rounded-[22px] border border-border bg-surface p-3 shadow-[0_10px_24px_rgba(31,41,55,0.05)]">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface-muted p-1 sm:w-fit">
              {TABS.map((option) => {
                const Icon = option.icon;
                const isActive = option.key === tab;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setTab(option.key)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
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
              <div className="grid flex-1 gap-3 sm:grid-cols-[minmax(16rem,1fr)_12rem] xl:max-w-3xl">
                <div>
                  <label htmlFor="reading-list-search" className={fieldLabelClassName}>
                    Search lists
                  </label>
                  <div className="relative">
                    <input
                      id="reading-list-search"
                      type="text"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      className={`${inputClassName} pl-10`}
                      placeholder="Search lists, genres, books, or authors"
                      autoComplete="off"
                    />
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
                  </div>
                </div>
                <div>
                  <label htmlFor="reading-list-sort" className={fieldLabelClassName}>
                    Sort by
                  </label>
                  <select
                    id="reading-list-sort"
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value as ReadingListSort);
                      setPage(0);
                    }}
                    className={inputClassName}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="mt-4">
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
