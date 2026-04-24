import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  BookPlus,
  Check,
  CircleDashed,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  createBook,
  deleteReadingList,
  getReadingList,
  starReadingList,
  subscribeToReadingList,
  unstarReadingList,
  unsubscribeFromReadingList,
  type ReadingListDetailResponseDTO,
  type ReadingListSlotResponseDTO,
} from '../api/api';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { AddSlotToLibraryModal } from '../features/readingLists/AddSlotToLibraryModal';
import { EditReadingListModal } from '../features/readingLists/EditReadingListModal';
import {
  getOwnerDisplayName,
  getReadingListStatusLabel,
  normalizeTitleAuthorKey,
} from '../features/readingLists/utils';
import { useBooks } from '../features/books/useBooks';
import { formatCircleDate } from '../features/bookCircles/utils';

function StatusChip({ label, tone }: { label: string; tone: 'brand' | 'accent' | 'muted' | 'danger' }) {
  const toneClassName = tone === 'brand'
    ? 'bg-brand-soft text-brand-strong'
    : tone === 'accent'
      ? 'bg-accent-soft text-accent-strong'
      : tone === 'danger'
        ? 'bg-danger-soft text-danger'
        : 'bg-surface-muted text-text-muted';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${toneClassName}`}>
      {label}
    </span>
  );
}

function GenreChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-strong">
      {label}
    </span>
  );
}

function SlotRow({
  slot,
  index,
  isSubscribed,
  bookIdForSlot,
  onAddToLibrary,
  isBusy,
}: {
  slot: ReadingListSlotResponseDTO;
  index: number;
  isSubscribed: boolean;
  bookIdForSlot: number | null;
  onAddToLibrary: (slot: ReadingListSlotResponseDTO) => void;
  isBusy: boolean;
}) {
  const isComplete = slot.completedByMe === true;
  const isInLibrary = slot.inMyLibrary === true;

  return (
    <div className="relative rounded-[24px] border border-border bg-surface p-5 shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-sm font-semibold ${
            isComplete
              ? 'bg-accent-soft text-accent-strong'
              : isInLibrary
                ? 'bg-brand-soft text-brand-strong'
                : 'bg-surface-muted text-text-muted'
          }`}
        >
          {isComplete ? <Check size={18} /> : index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-text">{slot.title}</p>
          <p className="mt-1 truncate text-sm text-text-muted">{slot.author}</p>

          {slot.note ? (
            <p className="mt-3 rounded-[14px] border border-border bg-surface-alt px-3 py-2 text-sm italic text-text-muted">
              {slot.note}
            </p>
          ) : null}

          {isSubscribed ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {isComplete ? (
                <StatusChip label="Completed" tone="accent" />
              ) : isInLibrary ? (
                <>
                  <StatusChip label="In progress" tone="brand" />
                  {bookIdForSlot != null ? (
                    <Link
                      to={`/book/${bookIdForSlot}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-brand-strong hover:underline"
                    >
                      <BookOpen size={14} />
                      Open book
                    </Link>
                  ) : null}
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full px-4"
                  onClick={() => onAddToLibrary(slot)}
                  disabled={isBusy}
                >
                  <span className="inline-flex items-center gap-2">
                    <BookPlus size={14} />
                    Add to my library
                  </span>
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ReadingListDetails() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const { books, refreshBooks, upsertBook } = useBooks();

  const [list, setList] = useState<ReadingListDetailResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const [pendingSlot, setPendingSlot] = useState<ReadingListSlotResponseDTO | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadList = useCallback(async () => {
    if (!listId) {
      setErrorMessage('Missing list id.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const response = await getReadingList(listId);
      setList(response);
    } catch (error) {
      console.error('Error loading reading list:', error);
      setErrorMessage('Could not load this reading list.');
    } finally {
      setIsLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const findLibraryBookForSlot = useCallback(
    (slot: ReadingListSlotResponseDTO) => {
      const slotKey = normalizeTitleAuthorKey(slot.title, slot.author);
      return books.find((book) => normalizeTitleAuthorKey(book.title, book.author) === slotKey) ?? null;
    },
    [books],
  );

  const handleStarToggle = async () => {
    if (!list || actionBusy) return;
    setActionBusy(true);
    const previous = list;
    setList({
      ...list,
      hasStarred: !list.hasStarred,
      starCount: Math.max(0, list.starCount + (list.hasStarred ? -1 : 1)),
    });

    try {
      if (previous.hasStarred) {
        await unstarReadingList(previous.id);
      } else {
        await starReadingList(previous.id);
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      setList(previous);
      toast.error('Could not update star.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleSubscribeToggle = async () => {
    if (!list || actionBusy) return;

    if (list.status !== 'PUBLISHED' && !list.isSubscribed) {
      toast.error('This list is not published — you cannot subscribe right now.');
      return;
    }

    setActionBusy(true);
    try {
      if (list.isSubscribed) {
        await unsubscribeFromReadingList(list.id);
        toast.success('Unsubscribed.');
      } else {
        await subscribeToReadingList(list.id);
        toast.success('Subscribed. Bonus XP waits at the finish line.');
      }

      await loadList();
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast.error('Could not update subscription.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleAddToLibrary = async (totalPages: number) => {
    if (!pendingSlot) return;

    try {
      const createdBook = await createBook({
        title: pendingSlot.title,
        author: pendingSlot.author,
        totalPages,
      });
      upsertBook(createdBook);
      void refreshBooks({ silent: true });
      setPendingSlot(null);
      toast.success(`Added "${createdBook.title}" to your library.`);
      await loadList();
    } catch (error) {
      console.error('Error adding slot to library:', error);
      toast.error('Could not add the book. Try again.');
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!list) return;

    try {
      setIsDeleting(true);
      await deleteReadingList(list.id);
      toast.success('Reading list deleted.');
      void navigate('/reading-lists');
    } catch (error) {
      console.error('Error deleting reading list:', error);
      toast.error('Could not delete the list.');
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-bg min-h-screen pb-28 lg:pl-60 lg:pb-0">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="rounded-[28px] border border-border bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
            <p className="text-sm text-text-muted">Loading reading list...</p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (errorMessage || !list) {
    return (
      <div className="page-bg min-h-screen pb-28 lg:pl-60 lg:pb-0">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="rounded-[28px] border border-danger/30 bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
            <p className="text-lg font-semibold text-danger">{errorMessage ?? 'Reading list not found.'}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-6 rounded-full px-5"
              onClick={() => void navigate('/reading-lists')}
            >
              Back to reading lists
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const completedCount = list.slots.filter((slot) => slot.completedByMe === true).length;

  return (
    <div className="page-bg min-h-screen pb-28 lg:pl-60 lg:pb-0">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <button
          type="button"
          onClick={() => { void navigate(-1); }}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <section className="rounded-[32px] border border-border bg-surface p-6 shadow-[0_20px_48px_rgba(15,23,42,0.07)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.32em] text-text-subtle">Reading list</p>
              <h1 className="mt-2 text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-text sm:text-[2.5rem]">
                {list.title}
              </h1>
              <p className="mt-2 text-sm text-text-muted">
                By <span className="font-medium text-text">{getOwnerDisplayName(list.ownerNickname, list.ownerUserId)}</span>
                {' · '}
                {formatCircleDate(list.createdAt)}
              </p>
              {list.genres.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {list.genres.map((genre) => (
                    <GenreChip key={genre} label={genre} />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleStarToggle()}
                disabled={actionBusy}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  list.hasStarred
                    ? 'bg-accent-soft text-accent-strong'
                    : 'bg-surface-muted text-text-muted hover:text-text'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <Star size={14} className={list.hasStarred ? 'fill-current' : ''} />
                {list.starCount}
              </button>
            </div>
          </div>

          {list.description ? (
            <p className="mt-4 text-sm leading-relaxed text-text-muted sm:text-base">
              {list.description}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {list.status !== 'PUBLISHED' ? (
              <StatusChip label={getReadingListStatusLabel(list.status)} tone="muted" />
            ) : null}
            {list.callerIsOwner ? <StatusChip label="Owner" tone="brand" /> : null}
            {list.isSubscribed ? <StatusChip label="Subscribed" tone="accent" /> : null}
            <StatusChip label={`${list.slots.length} book${list.slots.length === 1 ? '' : 's'}`} tone="muted" />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {!list.callerIsOwner ? (
              list.status === 'PUBLISHED' || list.isSubscribed ? (
                <Button
                  type="button"
                  variant={list.isSubscribed ? 'outline' : 'primary'}
                  className="rounded-full px-5"
                  onClick={() => void handleSubscribeToggle()}
                  disabled={actionBusy}
                >
                  {list.isSubscribed ? 'Unsubscribe' : 'Subscribe to this list'}
                </Button>
              ) : null
            ) : null}

            {list.callerIsOwner ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full px-5"
                  onClick={() => setIsEditOpen(true)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Pencil size={14} />
                    Edit
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-danger/40 px-5 text-danger hover:bg-danger-soft"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Trash2 size={14} />
                    Delete
                  </span>
                </Button>
              </>
            ) : null}
          </div>

          {list.isSubscribed ? (
            <div className="mt-6 rounded-[20px] border border-border bg-surface-alt p-4">
              <div className="flex items-center justify-between text-sm text-text-muted">
                <span>Your progress</span>
                <span className="font-semibold text-text">
                  {completedCount} / {list.slots.length}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full bg-brand transition-all"
                  style={{
                    width: list.slots.length > 0
                      ? `${Math.round((completedCount / list.slots.length) * 100)}%`
                      : '0%',
                  }}
                />
              </div>
            </div>
          ) : list.callerIsOwner ? null : (
            <div className="mt-6 rounded-[20px] border border-dashed border-border bg-surface-alt p-4 text-sm text-text-muted">
              <p className="flex items-center gap-2">
                <CircleDashed size={14} />
                Subscribe to track progress and unlock +50 XP per finished book and +200 XP on completion.
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-[32px] border border-border bg-surface p-6 shadow-[0_14px_28px_rgba(31,41,55,0.06)] sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-text">Roadmap</h2>
              <p className="mt-1 text-sm text-text-muted">
                Work through the slots in order — each completion counts toward the subscription reward.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {list.slots.map((slot, index) => {
              const libraryBook = findLibraryBookForSlot(slot);
              return (
                <SlotRow
                  key={`${slot.position}-${slot.catalogBookId}`}
                  slot={slot}
                  index={index}
                  isSubscribed={list.isSubscribed}
                  bookIdForSlot={libraryBook?.id ?? null}
                  onAddToLibrary={(target) => setPendingSlot(target)}
                  isBusy={actionBusy}
                />
              );
            })}
          </div>
        </section>
      </div>

      <BottomNav />

      <AddSlotToLibraryModal
        isOpen={pendingSlot != null}
        slotTitle={pendingSlot?.title ?? ''}
        slotAuthor={pendingSlot?.author ?? ''}
        onClose={() => setPendingSlot(null)}
        onSubmit={handleAddToLibrary}
      />

      <EditReadingListModal
        isOpen={isEditOpen}
        list={list}
        onClose={() => setIsEditOpen(false)}
        onUpdated={(updated) => {
          setIsEditOpen(false);
          setList((current) => (current ? { ...current, ...updated, slots: current.slots } : updated));
        }}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Delete this reading list?"
        description="This removes the list for everyone. Subscribers will lose their progress tracking, but any XP they already earned stays."
        confirmLabel="Delete list"
        confirmingLabel="Deleting..."
        isConfirming={isDeleting}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
