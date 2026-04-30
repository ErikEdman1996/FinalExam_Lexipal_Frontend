import { useState, type FormEvent } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  ApiResponseError,
  ApiValidationError,
  updateReadingList,
  type ReadingListDetailResponseDTO,
  type ReadingListStatus,
} from '../../api/api';
import { Button } from '../../components/Button';
import { AppDialog, AppDialogClose, AppDialogTitle } from '../../components/dialog/AppDialog';
import {
  fieldErrorClassName,
  fieldLabelClassName,
  textareaClassName,
} from '../../components/form/inputStyles';
import { GenreEditor } from './GenreEditor';
import { readingListInputClassName, validateGenreList } from './utils';

interface EditReadingListModalProps {
  isOpen: boolean;
  list: ReadingListDetailResponseDTO | null;
  onClose: () => void;
  onUpdated: (list: ReadingListDetailResponseDTO) => void;
}

type EditField = 'title' | 'description' | 'status' | 'genres';

const STATUS_OPTIONS: ReadingListStatus[] = ['PUBLISHED', 'DRAFT', 'ARCHIVED'];

export function EditReadingListModal({
  isOpen,
  list,
  onClose,
  onUpdated,
}: EditReadingListModalProps) {
  if (!isOpen || !list) {
    return null;
  }

  return (
    <EditReadingListModalContent
      key={list.id}
      list={list}
      onClose={onClose}
      onUpdated={onUpdated}
    />
  );
}

function EditReadingListModalContent({
  list,
  onClose,
  onUpdated,
}: Omit<EditReadingListModalProps, 'isOpen'> & { list: ReadingListDetailResponseDTO }) {
  const [title, setTitle] = useState(list.title);
  const [description, setDescription] = useState(list.description ?? '');
  const [status, setStatus] = useState<ReadingListStatus>(list.status);
  const [genres, setGenres] = useState<string[]>(() => [...list.genres]);
  const [genresEdited, setGenresEdited] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<EditField, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const nextErrors: Partial<Record<EditField, string>> = {};

    if (!trimmedTitle) {
      nextErrors.title = 'Title is required.';
    } else if (trimmedTitle.length > 120) {
      nextErrors.title = 'Title must be 120 characters or fewer.';
    }

    if (trimmedDescription.length > 2000) {
      nextErrors.description = 'Description must be 2000 characters or fewer.';
    }

    const genreError = validateGenreList(genres);
    if (genreError) {
      nextErrors.genres = genreError;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setFieldErrors({});
      setSubmitError(null);

      const updated = await updateReadingList(list.id, {
        title: trimmedTitle !== list.title ? trimmedTitle : undefined,
        description: trimmedDescription !== (list.description ?? '')
          ? (trimmedDescription ? trimmedDescription : null)
          : undefined,
        status: status !== list.status ? status : undefined,
        genres: genresEdited ? genres : undefined,
      });

      toast.success('Reading list updated.');
      onUpdated(updated);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        setFieldErrors(error.fieldErrors as Partial<Record<EditField, string>>);
        setSubmitError(error.message);
      } else if (error instanceof ApiResponseError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Could not update the reading list.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppDialog
      isOpen
      onClose={onClose}
      canClose={!isSubmitting}
      contentClassName="w-full max-w-xl rounded-t-[32px] border border-border bg-surface shadow-[0_20px_56px_rgba(15,23,42,0.18)] animate-in slide-in-from-bottom duration-300 sm:rounded-[32px] sm:slide-in-from-bottom-0"
    >
      <div className="max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-text-subtle">Reading list</p>
            <AppDialogTitle className="mt-2 text-2xl font-semibold text-text">
              Edit metadata
            </AppDialogTitle>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              The book lineup is fixed once a list is created. Delete and recreate to change the slots.
            </p>
          </div>
          <AppDialogClose asChild>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Close edit modal"
            >
              <X size={18} className="text-text-muted" />
            </button>
          </AppDialogClose>
        </div>

        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          noValidate
        >
          <div>
            <label htmlFor="edit-list-title" className={fieldLabelClassName}>
              Title
            </label>
            <input
              id="edit-list-title"
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setFieldErrors((current) => ({ ...current, title: undefined }));
              }}
              maxLength={120}
              className={readingListInputClassName}
              autoComplete="off"
            />
            {fieldErrors.title ? <p className={fieldErrorClassName}>{fieldErrors.title}</p> : null}
          </div>

          <div>
            <label htmlFor="edit-list-description" className={fieldLabelClassName}>
              Description
            </label>
            <textarea
              id="edit-list-description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setFieldErrors((current) => ({ ...current, description: undefined }));
              }}
              maxLength={2000}
              rows={4}
              className={textareaClassName}
            />
            {fieldErrors.description ? <p className={fieldErrorClassName}>{fieldErrors.description}</p> : null}
          </div>

          <GenreEditor
            id="edit-list-genres"
            genres={genres}
            onGenresChange={(nextGenres) => {
              setGenres(nextGenres);
              setGenresEdited(true);
              setFieldErrors((current) => ({ ...current, genres: undefined }));
            }}
            error={fieldErrors.genres}
            onErrorClear={() => setFieldErrors((current) => ({ ...current, genres: undefined }))}
            disabled={isSubmitting}
          />

          <div>
            <p className={fieldLabelClassName}>Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => {
                const isSelected = option === status;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatus(option)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-brand text-text-on-brand shadow-[0_8px_18px_rgba(154,74,66,0.24)]'
                        : 'bg-surface-muted text-text-muted hover:text-text'
                    }`}
                  >
                    {option.charAt(0) + option.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
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
                <Check size={16} />
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </AppDialog>
  );
}
