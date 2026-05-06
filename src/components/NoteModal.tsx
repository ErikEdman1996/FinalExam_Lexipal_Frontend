import { useId, useState, type FormEvent } from 'react';
import { FileText, X } from 'lucide-react';
import { ApiValidationError, type ApiNoteTag, type ApiNoteTagSummary, type NoteFieldErrors } from '../api/api';
import { NoteTagMultiSelect } from '../features/noteTags';
import { Button } from './Button';
import { AppDialog, AppDialogClose, AppDialogTitle } from './dialog/AppDialog';
import {
  fieldErrorClassName,
  fieldHintClassName,
  fieldLabelClassName,
  inputClassName,
  textareaClassName,
} from './form/inputStyles';

interface NoteSubmitValues {
  quotedText: string;
  pageNumber: number;
  chapterLabel?: string;
  tagIds?: number[];
}

interface NoteModalProps {
  isOpen: boolean;
  heading: string;
  submitLabel: string;
  bookTotalPages: number;
  initialQuotedText?: string;
  initialPageNumber?: number | null;
  initialChapterLabel?: string | null;
  initialTagIds?: number[];
  availableTags?: ApiNoteTagSummary[];
  isTagsLoading?: boolean;
  tagLoadError?: string | null;
  submitTagIdsWhenEmpty?: boolean;
  onCreateTag?: (payload: { name: string; colorHex: string }) => Promise<ApiNoteTag>;
  onClose: () => void;
  onSubmit: (values: NoteSubmitValues) => Promise<void>;
}

export function NoteModal({
  isOpen,
  heading,
  submitLabel,
  bookTotalPages,
  initialQuotedText = '',
  initialPageNumber = null,
  initialChapterLabel = '',
  initialTagIds = [],
  availableTags = [],
  isTagsLoading = false,
  tagLoadError = null,
  submitTagIdsWhenEmpty = false,
  onCreateTag,
  onClose,
  onSubmit,
}: NoteModalProps) {
  if (!isOpen) {
    return null;
  }

  const contentKey = [
    heading,
    submitLabel,
    initialQuotedText,
    initialPageNumber ?? '',
    initialChapterLabel ?? '',
    initialTagIds.join(','),
  ].join('|');

  return (
    <NoteModalContent
      key={contentKey}
      heading={heading}
      submitLabel={submitLabel}
      bookTotalPages={bookTotalPages}
      initialQuotedText={initialQuotedText}
      initialPageNumber={initialPageNumber}
      initialChapterLabel={initialChapterLabel}
      initialTagIds={initialTagIds}
      availableTags={availableTags}
      isTagsLoading={isTagsLoading}
      tagLoadError={tagLoadError}
      submitTagIdsWhenEmpty={submitTagIdsWhenEmpty}
      onCreateTag={onCreateTag}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function NoteModalContent({
  heading,
  submitLabel,
  bookTotalPages,
  initialQuotedText = '',
  initialPageNumber = null,
  initialChapterLabel = '',
  initialTagIds = [],
  availableTags = [],
  isTagsLoading = false,
  tagLoadError = null,
  submitTagIdsWhenEmpty = false,
  onCreateTag,
  onClose,
  onSubmit,
}: Omit<NoteModalProps, 'isOpen'>) {
  const titleId = useId();
  const [quotedText, setQuotedText] = useState(initialQuotedText);
  const [pageNumber, setPageNumber] = useState(
    initialPageNumber != null && initialPageNumber > 0 ? String(initialPageNumber) : '',
  );
  const [chapterLabel, setChapterLabel] = useState(initialChapterLabel ?? '');
  const [selectedTagIds, setSelectedTagIds] = useState(initialTagIds);
  const [fieldErrors, setFieldErrors] = useState<NoteFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (fieldName: keyof NoteFieldErrors) => {
    setFieldErrors((previousErrors) => {
      if (!previousErrors[fieldName]) {
        return previousErrors;
      }

      return {
        ...previousErrors,
        [fieldName]: undefined,
      };
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const nextFieldErrors: NoteFieldErrors = {};
    const trimmedQuotedText = quotedText.trim();
    const parsedPageNumber = Number(pageNumber);
    const trimmedChapterLabel = chapterLabel.trim();

    if (!trimmedQuotedText) {
      nextFieldErrors.quotedText = 'Quoted text is required.';
    }

    if (!Number.isInteger(parsedPageNumber)) {
      nextFieldErrors.pageNumber = 'Enter a valid whole number for page number.';
    } else if (parsedPageNumber < 1) {
      nextFieldErrors.pageNumber = 'Page number must be at least 1.';
    }

    if (trimmedChapterLabel.length > 100) {
      nextFieldErrors.chapterLabel = 'Chapter label must be 100 characters or fewer.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setSubmitError(null);
      return;
    }

    try {
      setIsSubmitting(true);
      setFieldErrors({});
      setSubmitError(null);

      await onSubmit({
        quotedText: trimmedQuotedText,
        pageNumber: parsedPageNumber,
        chapterLabel: trimmedChapterLabel || undefined,
        ...((selectedTagIds.length > 0 || submitTagIdsWhenEmpty) ? { tagIds: selectedTagIds } : {}),
      });
    } catch (error) {
      if (error instanceof ApiValidationError) {
        const nextValidationErrors = error.fieldErrors as NoteFieldErrors;
        const fieldMessages = Object.values(nextValidationErrors).filter((message): message is string => Boolean(message));

        setFieldErrors(nextValidationErrors);
        setSubmitError(fieldMessages.includes(error.message) ? null : error.message);
      } else if (error instanceof Error && error.message.trim()) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Could not save note right now. Please try again.');
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
      contentClassName="w-full max-w-lg max-h-[94vh] overflow-y-auto rounded-t-[32px] border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom duration-300 sm:rounded-[32px] sm:slide-in-from-bottom-0"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft">
              <FileText size={20} className="text-brand-strong" />
            </div>
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.24em] text-text-subtle">Reading note</p>
              <AppDialogTitle id={titleId} className="mt-1 text-2xl font-semibold text-text">
                {heading}
              </AppDialogTitle>
            </div>
          </div>
          <AppDialogClose asChild>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Close note modal"
            >
              <X size={20} className="text-text-muted" />
            </button>
          </AppDialogClose>
        </div>

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          noValidate
          className="mt-6 space-y-4"
        >
          <div>
            <label htmlFor={`${titleId}-quoted-text`} className={fieldLabelClassName}>
              Quoted text
            </label>
            <textarea
              id={`${titleId}-quoted-text`}
              name="quotedText"
              value={quotedText}
              onChange={(event) => {
                setQuotedText(event.target.value);
                clearFieldError('quotedText');
                setSubmitError(null);
              }}
              placeholder="Paste or type the passage you want to remember..."
              className={`${textareaClassName} min-h-[180px]`}
              required
              aria-invalid={fieldErrors.quotedText ? 'true' : 'false'}
              aria-describedby={fieldErrors.quotedText ? `${titleId}-quoted-text-error` : undefined}
            />
            {fieldErrors.quotedText ? (
              <p id={`${titleId}-quoted-text-error`} className={fieldErrorClassName}>
                {fieldErrors.quotedText}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={`${titleId}-page-number`} className={fieldLabelClassName}>
              Page number
            </label>
            <input
              id={`${titleId}-page-number`}
              name="pageNumber"
              type="number"
              value={pageNumber}
              onChange={(event) => {
                setPageNumber(event.target.value);
                clearFieldError('pageNumber');
                setSubmitError(null);
              }}
              min="1"
              max={String(bookTotalPages)}
              placeholder="Enter page number"
              className={inputClassName}
              inputMode="numeric"
              required
              aria-invalid={fieldErrors.pageNumber ? 'true' : 'false'}
              aria-describedby={`${titleId}-page-number-hint${fieldErrors.pageNumber ? ` ${titleId}-page-number-error` : ''}`}
            />
            <p id={`${titleId}-page-number-hint`} className={fieldHintClassName}>
              Use a page between 1 and {bookTotalPages}.
            </p>
            {fieldErrors.pageNumber ? (
              <p id={`${titleId}-page-number-error`} className={fieldErrorClassName}>
                {fieldErrors.pageNumber}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={`${titleId}-chapter-label`} className={fieldLabelClassName}>
              Chapter label
            </label>
            <input
              id={`${titleId}-chapter-label`}
              name="chapterLabel"
              type="text"
              value={chapterLabel}
              onChange={(event) => {
                setChapterLabel(event.target.value);
                clearFieldError('chapterLabel');
                setSubmitError(null);
              }}
              placeholder="e.g. Chapter 3"
              maxLength={100}
              className={inputClassName}
              autoComplete="off"
              aria-invalid={fieldErrors.chapterLabel ? 'true' : 'false'}
              aria-describedby={fieldErrors.chapterLabel ? `${titleId}-chapter-label-error` : undefined}
            />
            {fieldErrors.chapterLabel ? (
              <p id={`${titleId}-chapter-label-error`} className={fieldErrorClassName}>
                {fieldErrors.chapterLabel}
              </p>
            ) : null}
          </div>

          {onCreateTag ? (
            <NoteTagMultiSelect
              id={`${titleId}-note-tags`}
              tags={availableTags}
              selectedTagIds={selectedTagIds}
              onChange={(nextTagIds) => {
                setSelectedTagIds(nextTagIds);
                clearFieldError('tagIds');
                setSubmitError(null);
              }}
              onCreateTag={onCreateTag}
              disabled={isSubmitting}
              isLoading={isTagsLoading}
              loadError={tagLoadError}
              error={fieldErrors.tagIds}
            />
          ) : null}

          {submitError ? <p className={fieldErrorClassName}>{submitError}</p> : null}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-full"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-full shadow-[0_12px_24px_rgba(76,167,132,0.18)]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </AppDialog>
  );
}
