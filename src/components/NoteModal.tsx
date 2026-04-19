import { useEffect, useId, useState, type FormEvent } from 'react';
import { FileText, X } from 'lucide-react';
import { ApiValidationError, type NoteFieldErrors } from '../api/api';
import { Button } from './Button';

interface NoteSubmitValues {
  quotedText: string;
  pageNumber: number;
  chapterLabel?: string;
}

interface NoteModalProps {
  isOpen: boolean;
  heading: string;
  submitLabel: string;
  bookTotalPages: number;
  initialQuotedText?: string;
  initialPageNumber?: number | null;
  initialChapterLabel?: string | null;
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
  onClose,
  onSubmit,
}: NoteModalProps) {
  const titleId = useId();
  const [quotedText, setQuotedText] = useState('');
  const [pageNumber, setPageNumber] = useState('');
  const [chapterLabel, setChapterLabel] = useState('');
  const [fieldErrors, setFieldErrors] = useState<NoteFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuotedText('');
      setPageNumber('');
      setChapterLabel('');
      setFieldErrors({});
      setSubmitError(null);
      setIsSubmitting(false);
      return;
    }

    setQuotedText(initialQuotedText);
    setPageNumber(initialPageNumber != null && initialPageNumber > 0 ? String(initialPageNumber) : '');
    setChapterLabel(initialChapterLabel ?? '');
    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(false);
  }, [initialChapterLabel, initialPageNumber, initialQuotedText, isOpen]);

  if (!isOpen) {
    return null;
  }

  const inputClassName = 'w-full rounded-[16px] border border-border bg-surface-muted px-4 py-3 text-text outline-none transition-all focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand';
  const errorClassName = 'mt-2 text-sm text-danger';

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg max-h-[94vh] overflow-y-auto rounded-t-[32px] border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom duration-300 sm:rounded-[32px] sm:slide-in-from-bottom-0"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft">
                <FileText size={20} className="text-brand-strong" />
              </div>
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.24em] text-text-subtle">Reading note</p>
                <h2 id={titleId} className="mt-1 text-2xl font-semibold text-text">
                  {heading}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Close note modal"
            >
              <X size={20} className="text-text-muted" />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label htmlFor={`${titleId}-quoted-text`} className="mb-2 block text-sm font-medium text-text">
                Quoted text
              </label>
              <textarea
                id={`${titleId}-quoted-text`}
                value={quotedText}
                onChange={(event) => {
                  setQuotedText(event.target.value);
                  clearFieldError('quotedText');
                  setSubmitError(null);
                }}
                placeholder="Paste or type the passage you want to remember..."
                className={`${inputClassName} min-h-[180px] resize-none rounded-[18px]`}
                autoFocus
                required
              />
              {fieldErrors.quotedText ? <p className={errorClassName}>{fieldErrors.quotedText}</p> : null}
            </div>

            <div>
              <label htmlFor={`${titleId}-page-number`} className="mb-2 block text-sm font-medium text-text">
                Page number
              </label>
              <input
                id={`${titleId}-page-number`}
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
                required
              />
              <p className="mt-2 text-xs text-text-muted">Use a page between 1 and {bookTotalPages}.</p>
              {fieldErrors.pageNumber ? <p className={errorClassName}>{fieldErrors.pageNumber}</p> : null}
            </div>

            <div>
              <label htmlFor={`${titleId}-chapter-label`} className="mb-2 block text-sm font-medium text-text">
                Chapter label
              </label>
              <input
                id={`${titleId}-chapter-label`}
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
              />
              {fieldErrors.chapterLabel ? <p className={errorClassName}>{fieldErrors.chapterLabel}</p> : null}
            </div>

            {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

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
      </div>
    </div>
  );
}
