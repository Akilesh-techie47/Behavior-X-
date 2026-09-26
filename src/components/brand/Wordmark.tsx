import { Link } from '../../router';

/**
 * The product mark.
 *
 * Two weights and a drawn line. The mark is deliberately quiet: it has to sit
 * in a dense console header for eight hours a day without competing with the
 * data next to it, and it has to survive being photocopied onto a whiteboard.
 */

export function Wordmark({
  size = 'md',
  showRule = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  showRule?: boolean;
}) {
  const text = size === 'sm' ? 'text-[13px]' : size === 'lg' ? 'text-[19px]' : 'text-[15px]';
  const markSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <span className="inline-flex items-center gap-2 select-none">
      <Mark className={markSize} />
      <span className={`font-semibold tracking-[-0.015em] text-neutral-900 ${text}`}>
        BEHAVIOR<span className="text-neutral-400 font-normal">-</span>X
      </span>
      {showRule && <span className="hidden sm:inline h-4 w-px bg-neutral-300 ml-1" aria-hidden="true" />}
    </span>
  );
}

function Mark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="14" height="14" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 4v4.2c0 2.1 1.6 3.8 3.6 3.8h.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 6.2h3.4M4 8.4h2.2" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <circle cx="11.4" cy="4.6" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function NavBrand({ to, tag }: { to: string; tag?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2.5 rounded-[3px] hover:opacity-80 transition-opacity"
      aria-label="BEHAVIOR-X home"
    >
      <Wordmark size="sm" />
      {tag && (
        <>
          <span className="h-3.5 w-px bg-neutral-300" aria-hidden="true" />
          <span className="eyebrow">{tag}</span>
        </>
      )}
    </Link>
  );
}

/** The methodological line, drawn rather than written. */
export function Pipeline({
  steps,
  activeIndex,
  className = '',
  orientation = 'horizontal',
}: {
  steps: readonly string[];
  activeIndex?: number;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}) {
  if (orientation === 'vertical') {
    return (
      <ol className={`space-y-0 ${className}`}>
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center shrink-0">
              <span
                className={`w-5 h-5 border rounded-[2px] grid place-items-center data text-[10px] ${
                  index === activeIndex
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : index !== undefined && activeIndex !== undefined && index < activeIndex
                      ? 'border-neutral-400 text-neutral-600 bg-neutral-100'
                      : 'border-neutral-200 text-neutral-400'
                }`}
              >
                {index + 1}
              </span>
              {index < steps.length - 1 && (
                <span className="w-px flex-1 min-h-5 bg-neutral-200" aria-hidden="true" />
              )}
            </div>
            <div className="pb-4 min-w-0">
              <div
                className={`text-[12px] font-semibold tracking-[0.05em] uppercase ${
                  index === activeIndex ? 'text-neutral-900' : 'text-neutral-500'
                }`}
              >
                {step}
              </div>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className={`flex flex-wrap items-stretch ${className}`}>
      {steps.map((step, index) => (
        <li key={step} className="flex items-center min-w-0">
          <div
            className={`px-2.5 py-1.5 border rounded-[2px] whitespace-nowrap ${
              index === activeIndex
                ? 'bg-neutral-900 text-white border-neutral-900'
                : activeIndex !== undefined && index < activeIndex
                  ? 'border-neutral-300 bg-neutral-50 text-neutral-600'
                  : 'border-neutral-200 text-neutral-500'
            }`}
          >
            <span className="data text-[10px] mr-1.5 opacity-60">{index + 1}</span>
            <span className="text-[10.5px] font-semibold tracking-[0.09em] uppercase">{step}</span>
          </div>
          {index < steps.length - 1 && (
            <span className="w-4 h-px bg-neutral-300 shrink-0" aria-hidden="true" />
          )}
        </li>
      ))}
    </ol>
  );
}
