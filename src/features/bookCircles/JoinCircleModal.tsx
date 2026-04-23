import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Hash, X } from 'lucide-react';
import { toast } from 'sonner';
import { ApiResponseError, joinBookCircle, type BookCircleReadResponseDTO } from '../../api/api';
import { Button } from '../../components/Button';
import { AppDialog, AppDialogClose, AppDialogTitle } from '../../components/dialog/AppDialog';
import {
  fieldHintClassName,
  fieldLabelClassName,
} from '../../components/form/inputStyles';
import { useBooks } from '../books/useBooks';
import { circleInputClassName, normalizeInviteCodeInput } from './utils';

interface JoinCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined: (circle: BookCircleReadResponseDTO) => void;
}

export function JoinCircleModal({
  isOpen,
  onClose,
  onJoined,
}: JoinCircleModalProps) {
  const { refreshBooks } = useBooks();
  const [inviteCode, setInviteCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setInviteCode('');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (inviteCode.length !== 6) {
      setErrorMessage('Enter the full 6-letter invite code.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const joinedCircle = await joinBookCircle({ inviteCode });

      void refreshBooks({ silent: true }).catch((error) => {
        console.error('Error refreshing books after joining circle:', error);
      });

      toast.success('Book added to your library.');
      onJoined(joinedCircle);
    } catch (error) {
      if (error instanceof ApiResponseError) {
        if (error.status === 404) {
          setErrorMessage('No active circle found for that code.');
        } else if (error.status === 400 || error.status === 403) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('Could not join the circle right now.');
        }
      } else {
        setErrorMessage('Could not join the circle right now.');
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
      contentClassName="w-full max-w-lg rounded-t-[32px] border border-border bg-surface shadow-[0_20px_56px_rgba(15,23,42,0.18)] animate-in slide-in-from-bottom duration-300 sm:rounded-[32px] sm:slide-in-from-bottom-0"
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-text-subtle">BookCircle</p>
            <AppDialogTitle className="mt-2 text-2xl font-semibold text-text">
              Join with code
            </AppDialogTitle>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Paste the six-letter invite code from a circle owner and we&apos;ll add the book to your library automatically.
            </p>
          </div>
          <AppDialogClose asChild>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-muted"
              aria-label="Close join circle modal"
            >
              <X size={18} className="text-text-muted" />
            </button>
          </AppDialogClose>
        </div>

        <form
          className="mt-8 space-y-5"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          noValidate
        >
          <div>
            <label htmlFor="circle-invite-code" className={fieldLabelClassName}>
              Invite code
            </label>
            <div className="relative">
              <input
                id="circle-invite-code"
                name="inviteCode"
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                value={inviteCode}
                onChange={(event) => {
                  setInviteCode(normalizeInviteCodeInput(event.target.value));
                  setErrorMessage(null);
                }}
                className={`${circleInputClassName} pr-12 text-center text-xl font-semibold tracking-[0.36em] uppercase`}
                placeholder="ABCDEF"
                maxLength={6}
                aria-invalid={errorMessage ? 'true' : 'false'}
                aria-describedby={`circle-invite-code-hint${errorMessage ? ' circle-invite-code-error' : ''}`}
              />
              <Hash size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-subtle" />
            </div>
            <p id="circle-invite-code-hint" className={fieldHintClassName}>Letters only, 6 characters</p>
          </div>

          {errorMessage ? (
            <div
              id="circle-invite-code-error"
              className="rounded-[20px] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
            >
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-full px-5" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-full px-5" disabled={isSubmitting}>
              <span className="inline-flex items-center gap-2">
                <ArrowRight size={16} />
                {isSubmitting ? 'Joining...' : 'Join circle'}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </AppDialog>
  );
}
