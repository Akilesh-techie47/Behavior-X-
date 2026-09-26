import type { ReactNode } from 'react';
import { Button } from '../primitives/Button';

/**
 * Non-happy states.
 *
 * Every data-backed screen in this product can be loading, empty, failed,
 * stale, or blocked by a permission. Those are the states a reviewer actually
 * looks for, so they are built once here and used everywhere rather than being
 * re-invented per screen with a spinner and an apology.
 */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-neutral-200/70 rounded-[2px] ${className}`} aria-hidden="true" />;
}

export function LoadingBlock({
  label = 'Loading',
  rows = 4,
  className = '',
}: {
  label?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`p-4 ${className}`} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="space-y-2.5" aria-hidden="true">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A table-shaped skeleton, so layout does not jump when data lands. */
export function TableSkeleton({ rows = 6, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="p-3" role="status" aria-live="polite">
      <span className="sr-only">Loading rows</span>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4">
            {Array.from({ length: columns }).map((__, c) => (
              <Skeleton key={c} className={`h-3 ${c === 0 ? 'w-20' : c === columns - 1 ? 'w-12' : 'flex-1'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyBlock({
  title,
  description,
  action,
  className = '',
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-6 py-10 text-center ${className}`}>
      <div className="mx-auto w-9 h-9 border border-neutral-200 rounded-[3px] grid place-items-center mb-3 dot-lattice" aria-hidden="true" />
      <p className="text-[13.5px] font-medium text-neutral-800">{title}</p>
      {description && (
        <p className="mt-1.5 text-[12.5px] text-neutral-500 leading-relaxed max-w-[52ch] mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/**
 * Error, with the distinction that matters: unreachable is not the same as
 * failed, and stale data beats no data.
 */
export function ErrorBlock({
  title = 'Could not load',
  message,
  kind = 'other',
  onRetry,
  className = '',
  children,
}: {
  title?: string;
  message: string;
  kind?: 'unavailable' | 'timeout' | 'other';
  onRetry?: () => void;
  className?: string;
  children?: ReactNode;
}) {
  const heading =
    kind === 'unavailable' ? 'Data service unreachable' : kind === 'timeout' ? 'Request timed out' : title;

  return (
    <div className={`p-4 ${className}`} role="alert">
      <div className="border-l-2 border-neutral-900 pl-3.5">
        <p className="text-[13px] font-semibold text-neutral-900">{heading}</p>
        <p className="mt-1 text-[12.5px] text-neutral-600 leading-relaxed max-w-[64ch]">{message}</p>
        {children}
        {onRetry && (
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={onRetry}>
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Persistent strip shown above data that is known to be out of date. */
export function StaleNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 border-b border-neutral-200 bg-neutral-50">
      <span className="eyebrow">Stale</span>
      <span className="text-[12px] text-neutral-600 flex-1 min-w-[200px]">{message}</span>
      {onRetry && (
        <Button size="xs" variant="outline" onClick={onRetry}>
          Reconnect
        </Button>
      )}
    </div>
  );
}

/** Permission blocked, with the remedy rather than a refusal. */
export function PermissionBlocked({
  what,
  reason,
  remedy,
  action,
  className = '',
}: {
  what: string;
  reason: string;
  remedy?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-4 ${className}`}>
      <div className="border border-neutral-300 rounded-[3px] bg-neutral-50 p-3.5">
        <div className="flex items-center gap-2">
          <LockMark />
          <p className="text-[13px] font-semibold text-neutral-900">{what} is not available</p>
        </div>
        <p className="mt-2 text-[12.5px] text-neutral-600 leading-relaxed">{reason}</p>
        {remedy && <p className="mt-1.5 text-[12.5px] text-neutral-600 leading-relaxed">{remedy}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

function LockMark() {
  return (
    <svg className="w-3.5 h-3.5 text-neutral-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <rect x="3.25" y="7" width="9.5" height="6.5" rx="1" />
      <path d="M5.5 7V5.25a2.5 2.5 0 0 1 5 0V7" />
    </svg>
  );
}

/**
 * The mandatory provenance marker.
 *
 * Anything generated rather than recorded carries one of these. The rule is
 * absolute: a reader must never be able to mistake a demonstration for a
 * genuine observation record.
 */
export function SimulatedMark({
  label = 'Simulated',
  className = '',
  title,
}: {
  label?: string;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title ?? 'Generated for demonstration. Not a recorded observation.'}
      className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded-[2px] border border-dashed border-neutral-400 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500 whitespace-nowrap ${className}`}
    >
      {label}
    </span>
  );
}

/** A quieter inline version for dense tables. */
export function SimulatedDot({ title }: { title?: string }) {
  return (
    <span
      title={title ?? 'Generated for demonstration. Not a recorded observation.'}
      className="inline-block w-[9px] h-[9px] rounded-[1px] border border-dashed border-neutral-400 align-middle"
      aria-label="simulated"
      role="img"
    />
  );
}
