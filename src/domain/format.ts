/**
 * Presentation helpers.
 *
 * Time in this product is always expressed relative to the start of an
 * examination. Two representations exist and both are shown deliberately:
 *   - offset  ("23:41")  — where you are in the exam
 *   - wall    ("10:31:42") — when it happened in the room
 * Mixing them up is how review tools lose examiner trust, so the formatters
 * are named for what they produce.
 */

import type { EvidenceChannel, SignalStrength } from './types';

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** "23:41" — minutes:seconds elapsed into the examination. */
export function formatOffset(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${pad2(m)}:${pad2(s % 60)}`;
}

/** "1:23:41" — used on the exam header once an hour is reached. */
export function formatOffsetLong(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s % 60)}`;
  return formatOffset(s);
}

/** "10:31:42" — wall clock. */
export function formatWallClock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--:--';
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

/** "10:31" — wall clock without seconds. */
export function formatWallMinute(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** "26 Sep, 14:05" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** "26 Sep 2026" */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** "just now" / "4 min ago" / "26 Sep" — for last-seen columns. */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const delta = Math.max(0, now - t);
  const mins = Math.floor(delta / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return formatDate(iso);
}

/** "1 h 12 m" — durations written for humans. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h} h` : `${h} h ${rem} m`;
}

/** "4 min 12 s" — short durations where the seconds matter. */
export function formatDurationFine(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return `${m} min ${pad2(s % 60)} s`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function formatBytesLabel(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function percent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

/* ------------------------------------------------------------------ *
 * Evidence vocabulary
 *
 * One place decides what a signal is called, so the examiner never sees
 * "TAB_SWITCH" in a table and "Tab switch" in a panel.
 * ------------------------------------------------------------------ */

export const CHANNEL_LABEL: Record<EvidenceChannel, string> = {
  laptop_camera: 'Laptop camera',
  phone_camera: 'Phone camera',
  browser: 'Browser',
  keyboard: 'Keyboard',
  mouse: 'Mouse',
  code: 'Code',
  clipboard: 'Clipboard',
  system: 'System',
};

export const CHANNEL_SHORT: Record<EvidenceChannel, string> = {
  laptop_camera: 'LAP',
  phone_camera: 'PHN',
  browser: 'BRW',
  keyboard: 'KEY',
  mouse: 'MSE',
  code: 'COD',
  clipboard: 'CLP',
  system: 'SYS',
};

export const CHANNEL_ORDER: EvidenceChannel[] = [
  'laptop_camera',
  'phone_camera',
  'browser',
  'keyboard',
  'mouse',
  'code',
  'clipboard',
  'system',
];

export const STRENGTH_LABEL: Record<SignalStrength, string> = {
  strong: 'Strong',
  moderate: 'Moderate',
  weak: 'Weak',
};

/** Fill weight for a signal strength. 0–1, mapped to a bar width. */
export const STRENGTH_FILL: Record<SignalStrength, number> = {
  strong: 1,
  moderate: 0.62,
  weak: 0.3,
};

/**
 * Weight for a 0–1 confidence. Bands rather than a continuous ramp, so that
 * two signals at 94% and 91% read the same. Continuous ramps invite the reader
 * to believe in precision the detectors do not have.
 */
export function confidenceFill(confidence: number): number {
  if (confidence >= 0.9) return 1;
  if (confidence >= 0.75) return 0.72;
  if (confidence >= 0.6) return 0.48;
  return 0.26;
}

export function confidenceBand(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.65) return 'medium';
  return 'low';
}

/** Grey step for a meter fill, from the ramp. Returns a Tailwind colour class. */
export function meterFill(value: number): string {
  if (value >= 90) return 'bg-neutral-900';
  if (value >= 75) return 'bg-neutral-700';
  if (value >= 60) return 'bg-neutral-500';
  if (value >= 40) return 'bg-neutral-400';
  return 'bg-neutral-300';
}

export function meterFillInverse(value: number): string {
  if (value >= 90) return 'bg-neutral-900';
  if (value >= 80) return 'bg-neutral-700';
  if (value >= 70) return 'bg-neutral-500';
  if (value >= 60) return 'bg-neutral-400';
  return 'bg-neutral-300';
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
