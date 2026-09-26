import type { ReactNode } from 'react';
import { Button } from '../primitives/Button';

/**
 * Inline notices.
 *
 * Weight carries the meaning: a 2px left border for anything that changes what
 * a reviewer can conclude, a 1px border for context. There is no amber and no
 * red, because in a monochrome interface a hue is the only thing left to
 * over-use, and a console full of coloured alarms stops being read.
 */

export type NoticeTone = 'context' | 'material' | 'blocking';

const TONE: Record<NoticeTone, { border: string; label: string }> = {
  context: { border: 'border border-neutral-200 bg-neutral-50', label: 'text-neutral-500' },
  material: { border: 'border-l-2 border-l-neutral-900 border-y border-r border-neutral-200 bg-white', label: 'text-neutral-900' },
  blocking: { border: 'border-2 border-neutral-900 bg-white', label: 'text-neutral-900' },
};

export function Banner({
  tone = 'context',
  label,
  title,
  children,
  actions,
  onDismiss,
  className = '',
}: {
  tone?: NoticeTone;
  label?: string;
  title?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const style = TONE[tone];
  return (
    <div
      className={`flex flex-wrap items-start gap-x-4 gap-y-2 px-3.5 py-3 rounded-[3px] ${style.border} ${className}`}
      role={tone === 'blocking' ? 'alert' : 'note'}
    >
      <div className="min-w-0 flex-1">
        {(label || title) && (
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            {label && <span className={`eyebrow ${style.label}`}>{label}</span>}
            {title && <p className="text-[13px] font-semibold text-neutral-900">{title}</p>}
          </div>
        )}
        {children && (
          <div className={`text-[12.5px] leading-relaxed text-neutral-600 ${title || label ? 'mt-1.5' : ''} max-w-[78ch]`}>
            {children}
          </div>
        )}
      </div>
      {(actions || onDismiss) && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {onDismiss && (
            <Button size="xs" variant="ghost" onClick={onDismiss} aria-label="Dismiss">
              Dismiss
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The line that must appear on any screen showing a demonstration. Placed by
 * the shell rather than by each screen, so it cannot be forgotten.
 */
export function DemoBanner({ scope, className = '' }: { scope: string; className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-dashed border-neutral-300 bg-neutral-50 px-4 py-1.5 ${className}`}
    >
      <span className="eyebrow">Demonstration</span>
      <span className="text-[11.5px] text-neutral-500 flex-1 min-w-[240px]">
        {scope} Every record on this screen is generated for demonstration and is not a real
        examination observation.
      </span>
    </div>
  );
}
