import type { ReactNode } from 'react';
import {
  CHANNEL_SHORT,
  confidenceBand,
  confidenceFill,
  meterFill,
  STRENGTH_FILL,
} from '../../domain/format';
import type { EvidenceChannel, SignalStrength } from '../../domain/types';

/**
 * Status language.
 *
 * There is no colour in this file. A state is communicated by four things at
 * once: the weight of a square dot, the weight of its border, the word next to
 * it, and its position. That combination survives greyscale printing, colour
 * vision deficiency, and a screen read aloud — which a colour-only scheme
 * fails at the first two.
 */

export type DotWeight = 'solid' | 'half' | 'ring' | 'empty';

export function Dot({ weight = 'solid', className = '' }: { weight?: DotWeight; className?: string }) {
  const styles: Record<DotWeight, string> = {
    solid: 'bg-neutral-900 border-neutral-900',
    half: 'bg-neutral-400 border-neutral-400',
    ring: 'bg-white border-neutral-500',
    empty: 'bg-white border-neutral-300',
  };
  return (
    <span
      aria-hidden="true"
      className={`inline-block w-2 h-2 border rounded-[1px] shrink-0 ${styles[weight]} ${className}`}
    />
  );
}

export type StatusTone =
  | 'nominal'
  | 'active'
  | 'degraded'
  | 'lost'
  | 'blocked'
  | 'unknown'
  | 'pending';

const TONE_DOT: Record<StatusTone, DotWeight> = {
  nominal: 'solid',
  active: 'solid',
  degraded: 'half',
  lost: 'ring',
  blocked: 'empty',
  unknown: 'empty',
  pending: 'empty',
};

const TONE_BORDER: Record<StatusTone, string> = {
  nominal: 'border-neutral-400 text-neutral-800',
  active: 'border-neutral-400 text-neutral-800',
  degraded: 'border-neutral-300 text-neutral-700',
  lost: 'border-neutral-900 text-neutral-900',
  blocked: 'border-neutral-300 text-neutral-500',
  unknown: 'border-neutral-200 text-neutral-500',
  pending: 'border-dashed border-neutral-300 text-neutral-500',
};

export function StatusBadge({
  tone,
  children,
  className = '',
}: {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-[20px] px-1.5 border rounded-[2px] text-[10.5px] font-semibold uppercase tracking-[0.07em] whitespace-nowrap ${TONE_BORDER[tone]} ${className}`}
    >
      <Dot weight={TONE_DOT[tone]} className="w-1.5 h-1.5" />
      {children}
    </span>
  );
}

/** A heavier outline used where a decision's outcome must read instantly. */
export function VerdictTag({
  children,
  emphasis = 'normal',
}: {
  children: ReactNode;
  emphasis?: 'normal' | 'strong';
}) {
  return (
    <span
      className={[
        'inline-flex items-center h-[22px] px-2 rounded-[2px] text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap',
        emphasis === 'strong'
          ? 'bg-neutral-900 text-white border border-neutral-900'
          : 'bg-white text-neutral-800 border border-neutral-400',
      ].join(' ')}
    >
      {children}
    </span>
  );
}

export function Tag({
  children,
  className = '',
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center h-[19px] px-1.5 rounded-[2px] border border-neutral-200 bg-neutral-50 text-[10.5px] font-medium uppercase tracking-[0.06em] text-neutral-600 whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

/** The fixed three-letter channel abbreviation used in dense tables. */
export function ChannelTag({ channel, className = '' }: { channel: EvidenceChannel; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-[30px] h-[18px] rounded-[2px] border border-neutral-300 bg-white text-[10px] font-semibold tracking-[0.04em] text-neutral-600 ${className}`}
      title={channel.replace('_', ' ')}
    >
      {CHANNEL_SHORT[channel]}
    </span>
  );
}

/** Horizontal meter. Fill is the only variable; there is no gradient. */
export function Meter({
  value,
  label,
  className = '',
  height = 'h-1.5',
}: {
  value: number;
  label?: string;
  className?: string;
  height?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`meter ${height} ${className}`}
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span className={meterFill(clamped)} style={{ width: `${clamped}%` }} />
    </div>
  );
}

/** Detector confidence, banded. Two signals at 94% and 91% read identically. */
export function ConfidenceMeter({ value, className = '' }: { value: number; className?: string }) {
  const band = confidenceBand(value);
  const fill = confidenceFill(value);
  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      title={`Detector confidence ${Math.round(value * 100)}% — ${band}`}
    >
      <span className="meter w-10 h-[3px] inline-block align-middle">
        <span
          className={band === 'high' ? 'bg-neutral-800' : band === 'medium' ? 'bg-neutral-500' : 'bg-neutral-300'}
          style={{ width: `${fill * 100}%` }}
        />
      </span>
      <span className="data text-[11px] text-neutral-500">{Math.round(value * 100)}%</span>
    </span>
  );
}

export function StrengthBar({
  strength,
  className = '',
}: {
  strength: SignalStrength;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-[3px] ${className}`}
      title={`${strength} detector confidence`}
      aria-label={`${strength} detector confidence`}
    >
      {[1, 0.62, 0.3].map((_fraction, index) => (
        <span
          key={index}
          className={`w-[3px] rounded-[1px] ${
            index < STRENGTH_FILL[strength] * 3 ? 'bg-neutral-700' : 'bg-neutral-200'
          }`}
          style={{ height: `${6 + index * 2}px` }}
        />
      ))}
    </span>
  );
}

/**
 * A label and a readout on one line, for the definition lists that appear on
 * every detail surface. The label is on the left so a column of them scans.
 */
export function ValueRow({
  label,
  value,
  tone,
  hint,
  className = '',
}: {
  label: string;
  value: ReactNode;
  tone?: StatusTone;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-1.5 ${className}`}>
      <span className="text-[12px] text-neutral-500" title={hint}>
        {label}
      </span>
      <span
        className={`data text-[12px] text-right ${
          tone === 'lost'
            ? 'text-neutral-900 font-medium'
            : tone === 'degraded'
              ? 'text-neutral-800'
              : 'text-neutral-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/** Body copy at the standard reading size, used inside panels and dialogs. */
export function Text({
  children,
  className = '',
  size = 'md',
}: {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <p
      className={`${size === 'md' ? 'text-[12.5px]' : 'text-[12px]'} leading-relaxed text-neutral-600 ${className}`}
    >
      {children}
    </p>
  );
}

/** A 0–100 figure with its meter beneath. The workhorse of the console. */
export function ScoreFigure({
  value,
  label,
  sublabel,
  size = 'md',
  className = '',
}: {
  value: number;
  label: string;
  sublabel?: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <div className={className}>
      <div
        className={`data font-medium text-neutral-900 leading-none ${
          size === 'md' ? 'text-[26px]' : 'text-[17px]'
        }`}
      >
        {value}
        <span className="text-[0.5em] text-neutral-400 ml-0.5">%</span>
      </div>
      <Meter value={value} label={label} className="mt-2" height="h-[3px]" />
      <div className="mt-1.5 text-[11px] leading-tight text-neutral-500">{label}</div>
      {sublabel && <div className="mt-0.5 text-[11px] leading-tight text-neutral-400">{sublabel}</div>}
    </div>
  );
}
