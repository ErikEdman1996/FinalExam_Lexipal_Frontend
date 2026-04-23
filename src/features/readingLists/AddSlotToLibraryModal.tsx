import { useEffect, useState, type FormEvent } from 'react';
import { BookPlus, X } from 'lucide-react';
import { Button } from '../../components/Button';
import { AppDialog, AppDialogClose, AppDialogTitle } from '../../components/dialog/AppDialog';
import {
  fieldErrorClassName,
  fieldLabelClassName,
} from '../../components/form/inputStyles';
import { readingListInputClassName } from './utils';

interface AddSlotToLibraryModalProps {
  isOpen: boolean;
  slotTitle: string;
  slotAuthor: string;
  onClose: () => void;
  onSubmit: (totalPages: number) => Promise<void>;
}

export function AddSlotToLibraryModal({
  isOpen,
  slotTitle,
  slotAuthor,
  onClose,
  onSubmit,
}: AddSlotToLibraryModalProps) {
  const [totalPages, setTotalPages] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTotalPages('');
      setIsSubmitting(false);
      setSubmitError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const parsed = Number(totalPages);
    if (!Number.isInteger(parsed) || parsed < 1) {
      setSubmitError('Enter a total page count of at least 1.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await onSubmit(parsed);
    } catch (error) {
      console.error('Error adding slot to library:', error);
      setSubmitError('Could not add the book. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      canClose={!isSubmitting}
      contentClassName="w-full max-w-md rounded-[28px] border border-border bg-surface p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in duration-200"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.24em] text-text-subtle">Add to library</p>
          <AppDialogTitle className="mt-1 text-xl font-semibold text-text">
            {slotTitle}
          </AppDialogTitle>
          <p className="mt-1 text-sm text-text-muted">{slotAuthor}</p>
        </div>
        <AppDialogClose asChild>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close"
            disabled={isSubmitting}
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
          <label htmlFor="slot-total-pages" className={fieldLabelClassName}>
            Total pages in your edition
          </label>
          <input
            id="slot-total-pages"
            type="number"
            min="1"
            value={totalPages}
            onChange={(event) => setTotalPages(event.target.value)}
            className={readingListInputClassName}
            placeholder="e.g. 412"
            inputMode="numeric"
          />
          {submitError ? <p className={fieldErrorClassName}>{submitError}</p> : null}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1 rounded-full" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1 rounded-full" disabled={isSubmitting}>
            <span className="inline-flex items-center gap-2">
              <BookPlus size={16} />
              {isSubmitting ? 'Adding...' : 'Add book'}
            </span>
          </Button>
        </div>
      </form>
    </AppDialog>
  );
}
