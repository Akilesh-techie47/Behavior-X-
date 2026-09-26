import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Buttons.
 *
 * Four weights, no gradients, no shadow, no transform on hover. A press is
 * signalled by a background step and a 1px border change, which is enough at
 * this density and does not make a table of controls look like a toy.
 */

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'inverse';
type Size = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconAfter?: ReactNode;
  loading?: boolean;
  block?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-700 hover:border-neutral-700 active:bg-neutral-800',
  secondary:
    'bg-neutral-100 text-neutral-800 border-neutral-200 hover:bg-neutral-200 hover:border-neutral-300 active:bg-neutral-200',
  outline:
    'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-400',
  ghost:
    'bg-transparent text-neutral-600 border-transparent hover:bg-neutral-100 hover:text-neutral-900',
  inverse:
    'bg-white text-neutral-900 border-white hover:bg-neutral-200 hover:border-neutral-200',
};

const SIZES: Record<Size, string> = {
  xs: 'h-6 px-2 text-[11.5px] gap-1',
  sm: 'h-7.5 px-2.5 text-[12.5px] gap-1.5',
  md: 'h-9 px-3.5 text-[13px] gap-2',
  lg: 'h-10 px-4 text-[14px] gap-2',
};

export function Button({
  variant = 'outline',
  size = 'md',
  icon,
  iconAfter,
  loading,
  block,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center rounded-[3px] border font-medium whitespace-nowrap',
        'transition-colors duration-100 select-none',
        'disabled:opacity-40 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        block ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Spinner />
      ) : (
        icon && <span className="shrink-0 -ml-0.5" aria-hidden="true">{icon}</span>
      )}
      {children}
      {iconAfter && <span className="shrink-0 -mr-0.5" aria-hidden="true">{iconAfter}</span>}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M8 2a6 6 0 0 1 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

/** A square, text-only action used inside tables and panel headers. */
export function QuietButton({
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors duration-100 disabled:opacity-40 disabled:pointer-events-none ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
