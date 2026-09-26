import type { ReactNode } from 'react';

/**
 * Panels and toolbars.
 *
 * A panel is a working surface, not a floating card: 1px border, 4px radius, no
 * shadow. Elevation is reserved for things that genuinely sit above the page.
 * Where a section does not need a boundary at all, `RuledSection` in
 * `Page.tsx` is used instead, because not everything belongs in a box.
 */

export function Panel({
  children,
  className = '',
  as: As = 'section',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article' | 'aside';
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <As className={`panel ${className}`} {...rest}>
      {children}
    </As>
  );
}

export function PanelHeader({
  title,
  description,
  actions,
  className = '',
  dense,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-b border-neutral-200 ${
        dense ? 'px-3 py-2' : 'px-4 py-3'
      } ${className}`}
    >
      <div className="min-w-0">
        <h3 className="text-[13.5px] font-semibold leading-tight text-neutral-900">{title}</h3>
        {description && (
          <p className="mt-1 text-[12px] leading-relaxed text-neutral-500 max-w-[64ch]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function PanelBody({
  children,
  className = '',
  dense,
}: {
  children: ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return <div className={dense ? 'p-3' : `p-4 ${className}`}>{children}</div>;
}

export function PanelFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-4 py-2.5 border-t border-neutral-200 bg-neutral-50 ${className}`}>{children}</div>
  );
}

/** Filter/search strip above a table. */
export function Toolbar({
  children,
  className = '',
  label = 'Filters',
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`flex flex-wrap items-center gap-2 px-3 py-2 border-b border-neutral-200 bg-neutral-50/60 ${className}`}
    >
      {children}
    </div>
  );
}

/** A labelled group of toolbar controls. */
export function ToolbarGroup({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="eyebrow mr-0.5">{label}</span>
      {children}
    </div>
  );
}

/** A thin strip of figures separated by vertical rules — never five cards. */
export function StatStrip({
  items,
  className = '',
}: {
  items: { label: string; value: ReactNode; sublabel?: ReactNode; emphasis?: boolean }[];
  className?: string;
}) {
  return (
    <dl className={`flex flex-wrap items-stretch ${className}`}>
      {items.map((item, index) => (
        <div
          key={item.label}
          className={[
            'flex-1 min-w-[132px] px-4 py-3',
            index > 0 ? 'border-l border-neutral-200' : '',
          ].join(' ')}
        >
          <dt className="eyebrow">{item.label}</dt>
          <dd
            className={`data mt-1.5 text-[24px] font-medium leading-none tracking-[-0.02em] ${
              item.emphasis ? 'text-neutral-900' : 'text-neutral-800'
            }`}
          >
            {item.value}
          </dd>
          {item.sublabel && (
            <div className="mt-1.5 text-[11px] leading-tight text-neutral-500">{item.sublabel}</div>
          )}
        </div>
      ))}
    </dl>
  );
}

/** A vertical rule, for separating controls in a dense header. */
export function Divider({ className = '', vertical = true }: { className?: string; vertical?: boolean }) {
  return vertical ? (
    <span className={`w-px self-stretch bg-neutral-200 ${className}`} aria-hidden="true" />
  ) : (
    <span className={`h-px w-full bg-neutral-200 ${className}`} aria-hidden="true" />
  );
}

/** Monospace key for identifiers, times and counts. */
export function Mono({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`data text-[12px] text-neutral-700 ${className}`}>{children}</span>;
}
