import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { BookOpen, Check, Copy, Globe, Lock, Share2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  ApiResponseError,
  ApiValidationError,
  createBookCircle,
  type BookCircleCreateResponseDTO,
  type BookCircleVisibility,
} from '../../api/api';
import { Button } from '../../components/Button';
import { AppDialog, AppDialogClose, AppDialogTitle } from '../../components/dialog/AppDialog';
import {
  fieldErrorClassName,
  fieldHintClassName,
  fieldLabelClassName,
} from '../../components/form/inputStyles';
import { ProgressBar } from '../../components/ProgressBar';
import { useBooks } from '../books/useBooks';
import {
  circleInputClassName,
  copyTextToClipboard,
  getVisibilityDescription,
} from './utils';

type SourceMode = 'existing' | 'new';

type CircleFormField =
  | 'existingBookId'
  | 'bookTitle'
  | 'bookAuthor'
  | 'totalPages'
  | 'memberCap'
  | 'visibility';

interface CreateCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (circle: BookCircleCreateResponseDTO) => void;
}

const DEFAULT_MEMBER_CAP = '5';

const VISIBILITY_OPTIONS: Array<{
  description: string;
  icon: typeof Globe;
  label: string;
  value: BookCircleVisibility;
}> = [
  {
    value: 'ALL_MEMBERS',
    label: 'Everyone sees progress',
    description: getVisibilityDescription('ALL_MEMBERS'),
    icon: Globe,
  },
  {
    value: 'OWNER_ONLY',
    label: 'Only I see progress',
    description: getVisibilityDescription('OWNER_ONLY'),
    icon: Lock,
  },
];

export function CreateCircleModal({
  isOpen,
  onClose,
  onCreated,
}: CreateCircleModalProps) {
  const { books, isLoading: isBooksLoading, refreshBooks } = useBooks();
  const [sourceMode, setSourceMode] = useState<SourceMode>('existing');
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [memberCap, setMemberCap] = useState(DEFAULT_MEMBER_CAP);
  const [visibility, setVisibility] = useState<BookCircleVisibility>('ALL_MEMBERS');
  const [createdCircle, setCreatedCircle] = useState<BookCircleCreateResponseDTO | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<CircleFormField, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedBooks = useMemo(() => {
    return [...books].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }, [books]);

  useEffect(() => {
    if (!isOpen) {
      setSourceMode('existing');
      setSelectedBookId(null);
      setBookTitle('');
      setBookAuthor('');
      setTotalPages('');
      setMemberCap(DEFAULT_MEMBER_CAP);
      setVisibility('ALL_MEMBERS');
      setCreatedCircle(null);
      setFieldErrors({});
      setSubmitError(null);
      setIsSubmitting(false);
      return;
    }

    if (books.length === 0 && !isBooksLoading) {
      void refreshBooks({ silent: true }).catch((error) => {
        console.error('Error refreshing books for circle creation:', error);
      });
    }
  }, [books.length, isBooksLoading, isOpen, refreshBooks]);

  if (!isOpen) {
    return null;
  }

  const handleCopyCode = async () => {
    if (!createdCircle) {
      return;
    }

    try {
      await copyTextToClipboard(createdCircle.inviteCode);
      toast.success('Invite code copied.');
    } catch (error) {
      console.error('Error copying invite code:', error);
      toast.error('Could not copy the invite code.');
    }
  };

  const handleShareCode = async () => {
    if (!createdCircle) {
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Join my BookCircle for ${createdCircle.bookTitle}`,
          text: `Use invite code ${createdCircle.inviteCode} to join my BookCircle in Lexipal.`,
        });
        return;
      }

      await copyTextToClipboard(createdCircle.inviteCode);
      toast.success('Invite code copied.');
    } catch (error) {
      console.error('Error sharing invite code:', error);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors: Partial<Record<CircleFormField, string>> = {};
    const trimmedTitle = bookTitle.trim();
    const trimmedAuthor = bookAuthor.trim();
    const parsedTotalPages = totalPages ? Number(totalPages) : null;
    const parsedMemberCap = Number(memberCap);

    if (!Number.isInteger(parsedMemberCap) || parsedMemberCap < 2 || parsedMemberCap > 50) {
      nextErrors.memberCap = 'Choose a member cap between 2 and 50.';
    }

    if (sourceMode === 'existing') {
      if (selectedBookId == null) {
        nextErrors.existingBookId = 'Pick a book from your library.';
      }
    } else {
      if (!trimmedTitle) {
        nextErrors.bookTitle = 'Enter a book title.';
      } else if (trimmedTitle.length > 100) {
        nextErrors.bookTitle = 'Book title must be 100 characters or fewer.';
      }

      if (!trimmedAuthor) {
        nextErrors.bookAuthor = 'Enter an author.';
      } else if (trimmedAuthor.length > 100) {
        nextErrors.bookAuthor = 'Author must be 100 characters or fewer.';
      }

      if (!Number.isInteger(parsedTotalPages) || (parsedTotalPages ?? 0) < 1) {
        nextErrors.totalPages = 'Enter a total page count of at least 1.';
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setSubmitError(null);
      return;
    }

    try {
      setIsSubmitting(true);
      setFieldErrors({});
      setSubmitError(null);

      const created = await createBookCircle({
        existingBookId: sourceMode === 'existing' ? selectedBookId : null,
        bookTitle: sourceMode === 'new' ? trimmedTitle : null,
        bookAuthor: sourceMode === 'new' ? trimmedAuthor : null,
        totalPages: sourceMode === 'new' ? parsedTotalPages : null,
        memberCap: parsedMemberCap,
        visibility,
      });

      setCreatedCircle(created);
      void refreshBooks({ silent: true }).catch((error) => {
        console.error('Error refreshing books after circle creation:', error);
      });
    } catch (error) {
      if (error instanceof ApiValidationError) {
        setFieldErrors(error.fieldErrors);
        setSubmitError(error.message);
      } else if (error instanceof ApiResponseError) {
        if (error.status === 502) {
          toast.error('Could not create an invite code. Try again.');
        } else {
          setSubmitError(error.message);
        }
      } else {
        setSubmitError('Could not create the circle right now.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      canClose={!isSubmitting}
      contentClassName="w-full max-w-3xl rounded-t-[32px] border border-border bg-surface shadow-[0_20px_56px_rgba(15,23,42,0.18)] animate-in slide-in-from-bottom duration-300 sm:rounded-[32px] sm:slide-in-from-bottom-0"
    >
      <div className="max-h-[92vh] overflow-y-auto p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.28em] text-text-subtle">BookCircle</p>
              <AppDialogTitle className="mt-2 text-2xl font-semibold text-text sm:text-3xl">
                {createdCircle ? 'Your circle is ready' : 'Create a circle'}
              </AppDialogTitle>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
                {createdCircle
                  ? 'Share the invite code with friends, then jump into the circle detail page.'
                  : 'Pick a book, choose how visible progress should be, and generate an invite code for your group.'}
              </p>
            </div>
            <AppDialogClose asChild>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close create circle modal"
              >
                <X size={18} className="text-text-muted" />
              </button>
            </AppDialogClose>
          </div>

          {createdCircle ? (
            <div className="mt-8 space-y-6">
              <div className="rounded-[28px] border border-brand/20 bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-brand-soft)_100%)] p-6 text-center shadow-[0_16px_34px_rgba(31,41,55,0.06)]">
                <p className="text-sm uppercase tracking-[0.28em] text-brand-strong">Invite code</p>
                <div className="mt-4 inline-flex items-center justify-center rounded-[24px] border border-white/60 bg-white/70 px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <span className="text-[2.3rem] font-semibold tracking-[0.36em] text-text sm:text-[2.8rem]">
                    {createdCircle.inviteCode}
                  </span>
                </div>
                <p className="mt-4 text-sm text-text-muted">
                  Friends can join with this code while the circle stays active.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button type="button" className="rounded-full px-5" onClick={() => void handleCopyCode()}>
                    <span className="inline-flex items-center gap-2">
                      <Copy size={16} />
                      Copy code
                    </span>
                  </Button>
                  <Button type="button" variant="outline" className="rounded-full px-5" onClick={() => void handleShareCode()}>
                    <span className="inline-flex items-center gap-2">
                      <Share2 size={16} />
                      Share
                    </span>
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] bg-surface-muted p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">Book</p>
                  <p className="mt-2 text-lg font-semibold text-text">{createdCircle.bookTitle}</p>
                  <p className="mt-1 text-sm text-text-muted">{createdCircle.bookAuthor}</p>
                </div>
                <div className="rounded-[24px] bg-surface-muted p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">Member cap</p>
                  <p className="mt-2 text-lg font-semibold text-text">{createdCircle.memberCap}</p>
                  <p className="mt-1 text-sm text-text-muted">Up to {createdCircle.memberCap} readers</p>
                </div>
                <div className="rounded-[24px] bg-surface-muted p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">Visibility</p>
                  <p className="mt-2 text-lg font-semibold text-text">
                    {visibility === 'OWNER_ONLY' ? 'Owner only' : 'All members'}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">{getVisibilityDescription(createdCircle.visibility)}</p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" className="rounded-full px-5" onClick={onClose}>
                  Later
                </Button>
                <Button type="button" className="rounded-full px-5" onClick={() => onCreated(createdCircle)}>
                  <span className="inline-flex items-center gap-2">
                    <Check size={16} />
                    Open circle
                  </span>
                </Button>
              </div>
            </div>
          ) : (
            <form
              className="mt-8 space-y-6"
              onSubmit={(event) => {
                void handleSubmit(event);
              }}
              noValidate
            >
              <div className="flex w-full gap-1 rounded-full border border-border bg-surface-muted p-1 sm:w-fit">
                {([
                  { key: 'existing', label: 'Use existing book' },
                  { key: 'new', label: 'Add new book' },
                ] as const).map((option) => {
                  const isActive = option.key === sourceMode;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        setSourceMode(option.key);
                        setFieldErrors({});
                        setSubmitError(null);
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-brand text-text-on-brand shadow-[0_8px_18px_rgba(154,74,66,0.24)]'
                          : 'text-text-muted hover:text-text'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {sourceMode === 'existing' ? (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-text">Pick from your library</h3>
                      <p className="mt-1 text-sm text-text-muted">
                        The selected book becomes the owner copy for this circle.
                      </p>
                    </div>
                    <span className="rounded-full bg-surface-muted px-3 py-1 text-sm text-text-muted">
                      {sortedBooks.length}
                    </span>
                  </div>

                  {isBooksLoading ? (
                    <div className="mt-4 rounded-[24px] border border-border bg-surface-alt px-4 py-8 text-center text-sm text-text-muted">
                      Loading your books...
                    </div>
                  ) : sortedBooks.length === 0 ? (
                    <div className="mt-4 rounded-[24px] border border-border bg-surface-alt px-4 py-8 text-center text-sm text-text-muted">
                      No books in your library yet. Switch to "Add new book" to create one for this circle.
                    </div>
                  ) : (
                    <div className="mt-4 grid max-h-[22rem] gap-3 overflow-y-auto pr-1">
                      {sortedBooks.map((book) => {
                        const isSelected = selectedBookId === book.id;
                        const percentage = book.totalPages > 0
                          ? Math.round((book.readPages / book.totalPages) * 100)
                          : 0;

                        return (
                          <button
                            key={book.id}
                            type="button"
                            onClick={() => {
                              setSelectedBookId(book.id);
                              setFieldErrors((current) => ({ ...current, existingBookId: undefined }));
                            }}
                            className={`rounded-[24px] border p-4 text-left transition-all ${
                              isSelected
                                ? 'border-brand bg-brand-soft shadow-[0_10px_24px_rgba(154,74,66,0.14)]'
                                : 'border-border bg-surface hover:bg-surface-alt'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="truncate text-lg font-semibold text-text">{book.title}</p>
                                <p className="mt-1 truncate text-sm text-text-muted">{book.author}</p>
                              </div>
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-surface text-sm font-semibold text-text">
                                {percentage}%
                              </div>
                            </div>
                            <div className="mt-4">
                              <ProgressBar current={book.readPages} total={book.totalPages} height="md" />
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-text-muted">
                              <span>{book.readPages} / {book.totalPages} pages</span>
                              <span className="rounded-full bg-surface-muted px-3 py-1">
                                {book.sessionCount ?? book.sessions.length} sessions
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {fieldErrors.existingBookId ? (
                    <p className={fieldErrorClassName}>{fieldErrors.existingBookId}</p>
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="circle-book-title" className={fieldLabelClassName}>
                      Book title
                    </label>
                    <input
                      id="circle-book-title"
                      name="bookTitle"
                      type="text"
                      value={bookTitle}
                      onChange={(event) => {
                        setBookTitle(event.target.value);
                        setFieldErrors((current) => ({ ...current, bookTitle: undefined }));
                      }}
                      maxLength={100}
                      className={circleInputClassName}
                      placeholder="Dune"
                      autoComplete="off"
                      inputMode="text"
                      spellCheck={false}
                    />
                    {fieldErrors.bookTitle ? (
                      <p className={fieldErrorClassName}>{fieldErrors.bookTitle}</p>
                    ) : null}
                  </div>

                  <div>
                    <label htmlFor="circle-book-author" className={fieldLabelClassName}>
                      Author
                    </label>
                    <input
                      id="circle-book-author"
                      name="bookAuthor"
                      type="text"
                      value={bookAuthor}
                      onChange={(event) => {
                        setBookAuthor(event.target.value);
                        setFieldErrors((current) => ({ ...current, bookAuthor: undefined }));
                      }}
                      maxLength={100}
                      className={circleInputClassName}
                      placeholder="Frank Herbert"
                      autoComplete="off"
                      inputMode="text"
                      spellCheck={false}
                    />
                    {fieldErrors.bookAuthor ? (
                      <p className={fieldErrorClassName}>{fieldErrors.bookAuthor}</p>
                    ) : null}
                  </div>

                  <div>
                    <label htmlFor="circle-total-pages" className={fieldLabelClassName}>
                      Total pages
                    </label>
                    <input
                      id="circle-total-pages"
                      name="totalPages"
                      type="number"
                      min="1"
                      value={totalPages}
                      onChange={(event) => {
                        setTotalPages(event.target.value);
                        setFieldErrors((current) => ({ ...current, totalPages: undefined }));
                      }}
                      className={circleInputClassName}
                      placeholder="688"
                      inputMode="numeric"
                    />
                    {fieldErrors.totalPages ? (
                      <p className={fieldErrorClassName}>{fieldErrors.totalPages}</p>
                    ) : null}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="circle-member-cap" className={fieldLabelClassName}>
                    Member cap
                  </label>
                  <div className="relative">
                    <input
                      id="circle-member-cap"
                      name="memberCap"
                      type="number"
                      min="2"
                      max="50"
                      value={memberCap}
                      onChange={(event) => {
                        setMemberCap(event.target.value);
                        setFieldErrors((current) => ({ ...current, memberCap: undefined }));
                      }}
                      className={circleInputClassName}
                      inputMode="numeric"
                      aria-describedby="circle-member-cap-hint"
                    />
                    <Users size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-subtle" />
                  </div>
                  <p id="circle-member-cap-hint" className={fieldHintClassName}>
                    Choose between 2 and 50 members.
                  </p>
                  {fieldErrors.memberCap ? (
                    <p className={fieldErrorClassName}>{fieldErrors.memberCap}</p>
                  ) : null}
                </div>

                <div className="rounded-[24px] border border-border bg-surface-alt p-4">
                  <p className="text-sm font-medium text-text">Invite code</p>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    We generate a six-letter code when you create the circle.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-text">Visibility</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {VISIBILITY_OPTIONS.map((option) => {
                    const isSelected = option.value === visibility;
                    const Icon = option.icon;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setVisibility(option.value);
                          setFieldErrors((current) => ({ ...current, visibility: undefined }));
                        }}
                        className={`rounded-[24px] border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-brand bg-brand-soft shadow-[0_10px_24px_rgba(154,74,66,0.14)]'
                            : 'border-border bg-surface hover:bg-surface-alt'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-surface text-text">
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-text">{option.label}</p>
                            <p className="mt-1 text-sm leading-relaxed text-text-muted">{option.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.visibility ? (
                  <p className={fieldErrorClassName}>{fieldErrors.visibility}</p>
                ) : null}
              </div>

              {submitError ? (
                <div className="rounded-[20px] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                  {submitError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" className="rounded-full px-5" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" className="rounded-full px-5" disabled={isSubmitting}>
                  <span className="inline-flex items-center gap-2">
                    <BookOpen size={16} />
                    {isSubmitting ? 'Creating...' : 'Create circle'}
                  </span>
                </Button>
              </div>
            </form>
          )}
      </div>
    </AppDialog>
  );
}
