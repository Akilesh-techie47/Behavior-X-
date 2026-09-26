import { Check, Info, X } from 'lucide-react';

/**
 * A single-line receipt.
 *
 * A reviewer who saves a decision needs to know it was written, and needs the
 * reference the system assigned — so the confirmation is persistent and
 * dismissible rather than a toast that vanishes before it can be read.
 */

export function SaveReceipt({
  message,
  reference,
  onDismiss,
  className = '',
}: {
  message: string;
  reference?: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 border border-neutral-900 rounded-[3px] bg-white ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="w-4 h-4 border border-neutral-900 rounded-[2px] grid place-items-center shrink-0">
        <Check className="w-2.5 h-2.5 text-neutral-900" aria-hidden="true" />
      </span>
      <span className="text-[12.5px] text-neutral-900 flex-1 min-w-[180px]">{message}</span>
      {reference && <span className="data text-[11.5px] text-neutral-500">{reference}</span>}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-neutral-400 hover:text-neutral-900 transition-colors"
          aria-label="Dismiss confirmation"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** A single fact an interface should state rather than imply. */
export function FactLine({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`flex items-start gap-2 text-[12px] leading-relaxed text-neutral-500 ${className}`}>
      <Info className="w-3.5 h-3.5 mt-px shrink-0 text-neutral-400" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
