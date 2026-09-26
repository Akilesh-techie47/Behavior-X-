import type { ReactNode } from 'react';

/**
 * Page structure.
 *
 * The three interfaces do not share a shell — a candidate, an examiner and a
 * phone should not be able to mistake one for another — but they do share a
 * type scale. A page title is 30px, a section title 17px, a card title 14px.
 * Nothing is 56px except the one hero on the landing page.
 */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  className = '',
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Rendered under the title as a row of small facts. */
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`flex flex-wrap items-start justify-between gap-x-8 gap-y-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-[30px] leading-[1.15] font-semibold tracking-[-0.02em]">{title}</h1>
        {description && (
          <p className="mt-2 text-[14px] leading-relaxed text-neutral-600 max-w-[68ch]">{description}</p>
        )}
        {meta && <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
  className = '',
  bodyClassName = '',
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={className}>
      {title && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 mb-3">
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold leading-tight tracking-[-0.01em]">{title}</h2>
            {description && (
              <p className="mt-1 text-[12.5px] leading-relaxed text-neutral-500 max-w-[72ch]">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** Uppercase micro-heading used inside panels. */
export function MicroHeading({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`eyebrow ${className}`}>{children}</div>;
}

/** A label/value pair with a dotted leader, for spec-sheet style panels. */
export function SpecList({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <dl className={`divide-y divide-neutral-100 ${className}`}>{children}</dl>;
}

export function SpecRow({
  label,
  children,
  className = '',
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-[7px] ${className}`}>
      <dt className="text-[12px] text-neutral-500 shrink-0">{label}</dt>
      <dd className="text-[12.5px] text-neutral-900 text-right min-w-0">{children}</dd>
    </div>
  );
}

/** Horizontal rule with an optional inline label, used to break long pages. */
export function RuledSection({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="flex items-center gap-3 mb-3">
        <span className="eyebrow whitespace-nowrap">{label}</span>
        <span className="h-px flex-1 bg-neutral-200" aria-hidden="true" />
      </div>
      {children}
    </section>
  );
}
