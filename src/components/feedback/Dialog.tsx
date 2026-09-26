import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks';
import { Button } from '../primitives/Button';

/**
 * Modal dialog.
 *
 * Used only where a decision must be confirmed or a short form must be entered
 * without losing the surrounding context. Full-page work — configuring a
 * device, reviewing a session — happens on a route, not in a dialog, because a
 * console that hides its work in overlays cannot be navigated by keyboard.
 */

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'md',
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg';
  labelledBy?: string;
}) {
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxWidth = width === 'sm' ? 'max-w-[380px]' : width === 'lg' ? 'max-w-[760px]' : 'max-w-[540px]';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div
        className="fixed inset-0 bg-neutral-900/25"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        className={`relative w-full ${maxWidth} bg-white border border-neutral-300 rounded-[4px] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.28)] my-auto`}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold tracking-[-0.01em]">{title}</h2>
            {description && (
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-600 max-w-[60ch]">
                {description}
              </p>
            )}
          </div>
          <Button size="xs" variant="ghost" onClick={onClose} aria-label="Close dialog" icon={<X className="w-3.5 h-3.5" />} />
        </div>
        {children && <div className="px-5 pb-4">{children}</div>}
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-3 border-t border-neutral-200 bg-neutral-50 rounded-b-[4px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Confirmation for a decision that is recorded against a candidate. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  pending,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  pending?: boolean;
  children?: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      width="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm} loading={pending}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
