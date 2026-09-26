/**
 * Candidate and examiner identity.
 *
 * A monogram in a bordered square rather than a photograph. A real photo would
 * be biometric-adjacent material sitting in every list row, and it would need
 * its own consent and retention story. The monogram carries identification
 * without that cost.
 */
export function Avatar({
  initials,
  size = 'md',
  tone = 'neutral',
  className = '',
  title,
}: {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'neutral' | 'inverted' | 'muted';
  className?: string;
  title?: string;
}) {
  const dimensions = size === 'sm' ? 'w-6 h-6 text-[10px]' : size === 'lg' ? 'w-10 h-10 text-[13px]' : 'w-8 h-8 text-[11.5px]';
  const tones = {
    neutral: 'bg-neutral-100 border-neutral-300 text-neutral-700',
    muted: 'bg-white border-neutral-200 text-neutral-500',
    inverted: 'bg-neutral-900 border-neutral-900 text-white',
  };

  return (
    <span
      title={title}
      aria-hidden="true"
      className={`inline-flex items-center justify-center border rounded-[3px] font-semibold tracking-[0.02em] shrink-0 ${dimensions} ${tones[tone]} ${className}`}
    >
      {initials}
    </span>
  );
}

/** Candidate name plus number, the pairing used in every queue and header. */
export function CandidateIdentity({
  name,
  number,
  size = 'md',
  subtitle,
}: {
  name: string;
  number: string;
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
}) {
  const text = size === 'sm' ? 'text-[12.5px]' : size === 'lg' ? 'text-[15px]' : 'text-[13.5px]';
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <Avatar
        initials={name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
        size={size}
      />
      <div className="min-w-0">
        <div className={`${text} font-medium text-neutral-900 truncate leading-tight`}>{name}</div>
        <div className="data text-[11px] text-neutral-500 truncate">
          {number}
          {subtitle ? ` · ${subtitle}` : ''}
        </div>
      </div>
    </div>
  );
}
