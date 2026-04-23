import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type AppDialogVariant = 'modal' | 'sheet';

interface AppDialogProps {
  isOpen: boolean;
  onClose: () => void;
  canClose?: boolean;
  variant?: AppDialogVariant;
  contentClassName?: string;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  showCloseButton?: boolean;
  closeLabel?: string;
}

const variantClassNames: Record<AppDialogVariant, string> = {
  modal: 'items-end justify-center p-0 sm:items-center sm:p-4',
  sheet: 'items-end justify-end p-0',
};

export function AppDialog({
  isOpen,
  onClose,
  canClose = true,
  variant = 'modal',
  contentClassName = '',
  title,
  description,
  children,
  showCloseButton = false,
  closeLabel = 'Close dialog',
}: AppDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(nextOpen) => {
      if (!nextOpen && canClose) {
        onClose();
      }
    }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <div className={`fixed inset-0 z-50 flex ${variantClassNames[variant]}`}>
          <Dialog.Content
            className={contentClassName}
            onEscapeKeyDown={(event) => {
              if (!canClose) {
                event.preventDefault();
              }
            }}
            onInteractOutside={(event) => {
              if (!canClose) {
                event.preventDefault();
              }
            }}
            onPointerDownOutside={(event) => {
              if (!canClose) {
                event.preventDefault();
              }
            }}
          >
            {(title || description || showCloseButton) ? (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {title ? (
                    <Dialog.Title className="text-2xl font-semibold text-text">
                      {title}
                    </Dialog.Title>
                  ) : null}
                  {description ? (
                    <Dialog.Description className="mt-2 text-sm leading-relaxed text-text-muted">
                      {description}
                    </Dialog.Description>
                  ) : null}
                </div>
                {showCloseButton ? (
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={closeLabel}
                      disabled={!canClose}
                    >
                      <X size={20} className="text-text-muted" />
                    </button>
                  </Dialog.Close>
                ) : null}
              </div>
            ) : null}
            {children}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function AppDialogTitle(props: ComponentPropsWithoutRef<typeof Dialog.Title>) {
  return <Dialog.Title {...props} />;
}

export function AppDialogDescription(props: ComponentPropsWithoutRef<typeof Dialog.Description>) {
  return <Dialog.Description {...props} />;
}

export function AppDialogClose(props: ComponentPropsWithoutRef<typeof Dialog.Close>) {
  return <Dialog.Close {...props} />;
}
