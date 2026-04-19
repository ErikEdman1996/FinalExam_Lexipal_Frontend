import { useId } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  isConfirming = false,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const titleId = useId();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-t-[32px] border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom duration-300 sm:rounded-[32px] sm:slide-in-from-bottom-0"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-danger-soft">
                <AlertTriangle size={20} className="text-danger" />
              </div>
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.24em] text-text-subtle">Confirm action</p>
                <h2 id={titleId} className="mt-1 text-2xl font-semibold text-text">
                  {title}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isConfirming}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Close confirmation modal"
            >
              <X size={20} className="text-text-muted" />
            </button>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-text-muted">
            {description}
          </p>

          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-full"
              onClick={onClose}
              disabled={isConfirming}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-full border-danger/10 bg-danger text-white shadow-[0_12px_24px_rgba(218,87,87,0.2)] hover:bg-danger/90"
              onClick={() => void onConfirm()}
              disabled={isConfirming}
            >
              {isConfirming ? 'Deleting...' : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
