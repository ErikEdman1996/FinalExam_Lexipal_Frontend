import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, BookPlus, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  ApiResponseError,
  ApiValidationError,
  createReadingList,
  type ReadingListDetailResponseDTO,
  type ReadingListStatus,
} from '../../api/api';
import { Button } from '../../components/Button';
import { AppDialog, AppDialogClose, AppDialogTitle } from '../../components/dialog/AppDialog';
import {
  fieldErrorClassName,
  fieldHintClassName,
  fieldLabelClassName,
  textareaClassName,
} from '../../components/form/inputStyles';
import { normalizeTitleAuthorKey, readingListInputClassName } from './utils';

interface CreateReadingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (list: ReadingListDetailResponseDTO) => void;
}

interface SlotDraft {
  key: string;
  title: string;
  author: string;
  note: string;
}

interface SlotError {
  title?: string;
  author?: string;
  note?: string;
}

type FormField = 'title' | 'description' | 'status' | 'books';

const STATUS_OPTIONS: Array<{ value: ReadingListStatus; label: string; description: string }> = [
  { value: 'PUBLISHED', label: 'Published', description: 'Anyone can browse, star, and subscribe.' },
  { value: 'DRAFT', label: 'Draft', description: 'Saved privately — nobody else sees it yet.' },
];

let slotKeyCounter = 0;
const makeSlotKey = () => {
  slotKeyCounter += 1;
  return `slot-${slotKeyCounter}`;
};

const makeEmptySlot = (): SlotDraft => ({
  key: makeSlotKey(),
  title: '',
  author: '',
  note: '',
});

export function CreateReadingListModal({
  isOpen,
  onClose,
  onCreated,
}: CreateReadingListModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ReadingListStatus>('PUBLISHED');
  const [slots, setSlots] = useState<SlotDraft[]>(() => [makeEmptySlot()]);
  const [slotErrors, setSlotErrors] = useState<Record<string, SlotError>>({});
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setTitle('');
    setDescription('');
    setStatus('PUBLISHED');
    setSlots([makeEmptySlot()]);
    setSlotErrors({});
    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(false);
  }, [isOpen]);

  const duplicateKeys = useMemo(() => {
    const counts = new Map<string, number>();

    for (const slot of slots) {
      const title = slot.title.trim();
      const author = slot.author.trim();
      if (!title || !author) continue;
      const key = normalizeTitleAuthorKey(title, author);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return new Set(
      [...counts.entries()]
        .filter(([, count]) => count > 1)
        .map(([key]) => key),
    );
  }, [slots]);

  if (!isOpen) {
    return null;
  }

  const updateSlot = (key: string, patch: Partial<SlotDraft>) => {
    setSlots((current) => current.map((slot) => (slot.key === key ? { ...slot, ...patch } : slot)));
    setSlotErrors((current) => {
      if (!current[key]) return current;
      const { [key]: _removed, ...rest } = current;
      void _removed;
      return rest;
    });
  };

  const handleAddSlot = () => {
    setSlots((current) => [...current, makeEmptySlot()]);
  };

  const handleRemoveSlot = (key: string) => {
    setSlots((current) => (current.length > 1 ? current.filter((slot) => slot.key !== key) : current));
  };

  const moveSlot = (key: string, direction: -1 | 1) => {
    setSlots((current) => {
      const index = current.findIndex((slot) => slot.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) {
        return current;
      }
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const validate = (): boolean => {
    const nextFieldErrors: Partial<Record<FormField, string>> = {};
    const nextSlotErrors: Record<string, SlotError> = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      nextFieldErrors.title = 'Title is required.';
    } else if (trimmedTitle.length > 120) {
      nextFieldErrors.title = 'Title must be 120 characters or fewer.';
    }

    if (description.trim().length > 2000) {
      nextFieldErrors.description = 'Description must be 2000 characters or fewer.';
    }

    if (slots.length === 0) {
      nextFieldErrors.books = 'A reading list must contain at least one book.';
    }

    slots.forEach((slot) => {
      const slotError: SlotError = {};
      const slotTitle = slot.title.trim();
      const slotAuthor = slot.author.trim();

      if (!slotTitle) {
        slotError.title = 'Required';
      } else if (slotTitle.length > 200) {
        slotError.title = 'Max 200 chars';
      }

      if (!slotAuthor) {
        slotError.author = 'Required';
      } else if (slotAuthor.length > 200) {
        slotError.author = 'Max 200 chars';
      }

      if (slot.note.trim().length > 500) {
        slotError.note = 'Max 500 chars';
      }

      if (slotTitle && slotAuthor && duplicateKeys.has(normalizeTitleAuthorKey(slotTitle, slotAuthor))) {
        slotError.title = 'Duplicate book in this list';
      }

      if (Object.keys(slotError).length > 0) {
        nextSlotErrors[slot.key] = slotError;
      }
    });

    setFieldErrors(nextFieldErrors);
    setSlotErrors(nextSlotErrors);

    return Object.keys(nextFieldErrors).length === 0 && Object.keys(nextSlotErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting || !validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const created = await createReadingList({
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        status,
        books: slots.map((slot, index) => ({
          title: slot.title.trim(),
          author: slot.author.trim(),
          note: slot.note.trim() ? slot.note.trim() : null,
          position: index + 1,
        })),
      });

      toast.success('Reading list created.');
      onCreated(created);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        setFieldErrors(error.fieldErrors as Partial<Record<FormField, string>>);
        setSubmitError(error.message);
      } else if (error instanceof ApiResponseError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Could not create the reading list right now.');
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
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-text-subtle">Reading list</p>
            <AppDialogTitle className="mt-2 text-2xl font-semibold text-text sm:text-3xl">
              Create a reading list
            </AppDialogTitle>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
              Pick a title, add the books in order, and publish it so others can subscribe and work through it with you.
            </p>
          </div>
          <AppDialogClose asChild>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Close create reading list modal"
            >
              <X size={18} className="text-text-muted" />
            </button>
          </AppDialogClose>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          noValidate
        >
          <div>
            <label htmlFor="reading-list-title" className={fieldLabelClassName}>
              List title
            </label>
            <input
              id="reading-list-title"
              name="title"
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setFieldErrors((current) => ({ ...current, title: undefined }));
              }}
              maxLength={120}
              className={readingListInputClassName}
              placeholder="Sci-Fi Foundations"
              autoComplete="off"
              spellCheck={false}
            />
            {fieldErrors.title ? <p className={fieldErrorClassName}>{fieldErrors.title}</p> : null}
          </div>

          <div>
            <label htmlFor="reading-list-description" className={fieldLabelClassName}>
              Description
            </label>
            <textarea
              id="reading-list-description"
              name="description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setFieldErrors((current) => ({ ...current, description: undefined }));
              }}
              maxLength={2000}
              rows={3}
              className={textareaClassName}
              placeholder="A curated journey through the genre's backbone."
            />
            <p className={fieldHintClassName}>Optional, up to 2000 characters.</p>
            {fieldErrors.description ? <p className={fieldErrorClassName}>{fieldErrors.description}</p> : null}
          </div>

          <div>
            <p className={fieldLabelClassName}>Visibility</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {STATUS_OPTIONS.map((option) => {
                const isSelected = option.value === status;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={`rounded-[24px] border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-brand bg-brand-soft shadow-[0_10px_24px_rgba(154,74,66,0.14)]'
                        : 'border-border bg-surface hover:bg-surface-alt'
                    }`}
                  >
                    <p className="font-medium text-text">{option.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-text-muted">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-text">Books</h3>
                <p className="mt-1 text-sm text-text-muted">
                  Ordered list. Subscribers work through slots top-to-bottom.
                </p>
              </div>
              <Button type="button" variant="outline" className="rounded-full px-4" onClick={handleAddSlot}>
                <span className="inline-flex items-center gap-2">
                  <Plus size={14} />
                  Add book
                </span>
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {slots.map((slot, index) => {
                const slotError = slotErrors[slot.key] ?? {};

                return (
                  <div
                    key={slot.key}
                    className="rounded-[22px] border border-border bg-surface-alt p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft text-sm font-semibold text-brand-strong">
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveSlot(slot.key, -1)}
                          disabled={index === 0}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Move up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSlot(slot.key, 1)}
                          disabled={index === slots.length - 1}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Move down"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(slot.key)}
                          disabled={slots.length === 1}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-danger transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Remove book"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <input
                          type="text"
                          value={slot.title}
                          onChange={(event) => updateSlot(slot.key, { title: event.target.value })}
                          className={readingListInputClassName}
                          placeholder="Book title"
                          maxLength={200}
                          autoComplete="off"
                        />
                        {slotError.title ? <p className={fieldErrorClassName}>{slotError.title}</p> : null}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={slot.author}
                          onChange={(event) => updateSlot(slot.key, { author: event.target.value })}
                          className={readingListInputClassName}
                          placeholder="Author"
                          maxLength={200}
                          autoComplete="off"
                        />
                        {slotError.author ? <p className={fieldErrorClassName}>{slotError.author}</p> : null}
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={slot.note}
                          onChange={(event) => updateSlot(slot.key, { note: event.target.value })}
                          className={readingListInputClassName}
                          placeholder="Note (optional)"
                          maxLength={500}
                        />
                        {slotError.note ? <p className={fieldErrorClassName}>{slotError.note}</p> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {fieldErrors.books ? <p className={fieldErrorClassName}>{fieldErrors.books}</p> : null}
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
                <BookPlus size={16} />
                {isSubmitting ? 'Creating...' : 'Create list'}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </AppDialog>
  );
}
