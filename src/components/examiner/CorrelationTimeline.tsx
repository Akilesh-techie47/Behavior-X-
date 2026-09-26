import { useMemo, useRef } from 'react';
import { CHANNEL_LABEL, CHANNEL_ORDER, formatOffset } from '../../domain/format';
import type { EvidenceSignal, SessionTimelineSegment } from '../../domain/types';
import { ChannelTag, Meter } from '../primitives/Status';
import { Button } from '../primitives/Button';
import { SimulatedMark } from '../feedback/StateBlock';

/**
 * Correlate: independent channels on one time axis.
 *
 * The entire argument for having more than one observation source is that a
 * single ambiguous signal should be tested against what else was happening at
 * the same moment. That argument is only legible if the channels are stacked
 * against a shared axis, so this is the one place in the product where a
 * timeline earns its space.
 *
 * Lapsed periods are drawn as hatched, not coloured. A channel that was down
 * must not look like a channel that was quiet.
 */

const TRACK_HEIGHT = 26;
const LABEL_WIDTH = 132;

export function CorrelationTimeline({
  segments,
  signals,
  totalSeconds,
  windowSeconds,
  playhead,
  onSeek,
  onSelectSignal,
  selectedSignalId,
  escalatedIds,
  replaying,
}: {
  segments: SessionTimelineSegment[];
  signals: EvidenceSignal[];
  totalSeconds: number;
  /** Zoomed window, or null for the whole session. */
  windowSeconds: [number, number] | null;
  playhead: number | null;
  onSeek: (offsetSeconds: number) => void;
  onSelectSignal: (signal: EvidenceSignal) => void;
  selectedSignalId: string | null;
  escalatedIds: Set<string>;
  replaying: boolean;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [from, to] = windowSeconds ?? [0, Math.max(1, totalSeconds)];
  const span = Math.max(1, to - from);

  const tracks = useMemo(
    () =>
      CHANNEL_ORDER.map(channel => {
        const channelSignals = signals
          .filter(s => s.channel === channel)
          .sort((a, b) => a.offsetSeconds - b.offsetSeconds);
        const channelSegments = segments.filter(s => s.channel === channel);
        return { channel, channelSignals, channelSegments };
      }).filter(track => track.channelSegments.length > 0 || track.channelSignals.length > 0),
    [signals, segments],
  );

  const percent = (offset: number) => ((offset - from) / span) * 100;

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || replaying) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    onSeek(from + ratio * span);
  };

  const ticks = useMemo(() => {
    const step = span > 3600 ? 600 : span > 1200 ? 300 : span > 400 ? 60 : 30;
    const out: number[] = [];
    for (let t = Math.ceil(from / step) * step; t <= to; t += step) out.push(t);
    return out;
  }, [from, to, span]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-neutral-200">
        <p className="text-[12px] text-neutral-500 max-w-[64ch]">
          Channels are stacked against a shared axis. A claim supported by one channel
          is one channel's claim.
        </p>
        <div className="flex items-center gap-3">
          <SimulatedMark label={replaying ? 'Simulated replay' : undefined} />
          <div className="flex items-center gap-2">
            <span className="eyebrow">Span</span>
            <Button
              size="xs"
              variant={windowSeconds === null ? 'primary' : 'outline'}
              onClick={() => onSeek(0)}
            >
              Whole session
            </Button>
            <Button
              size="xs"
              variant={windowSeconds !== null ? 'primary' : 'outline'}
              onClick={() => onSeek(Math.max(0, firstAnomalyOffset() - 90))}
            >
              Around activity
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px] px-4 py-3">
          {/* Axis */}
          <div className="flex" style={{ paddingLeft: LABEL_WIDTH }}>
            <div className="relative flex-1 h-4">
              {ticks.map(tick => (
                <span
                  key={tick}
                  className="absolute data text-[10px] text-neutral-400 -translate-x-1/2"
                  style={{ left: `${percent(tick)}%` }}
                >
                  {formatOffset(tick)}
                </span>
              ))}
            </div>
          </div>

          <div
            ref={trackRef}
            onClick={handleClick}
            className="mt-1 cursor-crosshair select-none"
            role="group"
            aria-label="Correlated channel timeline. Click to seek."
          >
            {tracks.map(track => (
              <div key={track.channel} className="flex items-stretch" style={{ height: TRACK_HEIGHT }}>
                <div
                  className="flex items-center gap-1.5 pr-3 shrink-0 border-r border-neutral-200"
                  style={{ width: LABEL_WIDTH }}
                >
                  <ChannelTag channel={track.channel} />
                  <span className="text-[11.5px] text-neutral-600 truncate">
                    {CHANNEL_LABEL[track.channel]}
                  </span>
                </div>

                <div className="relative flex-1">
                  {/* Gridlines */}
                  {ticks.map(tick => (
                    <span
                      key={tick}
                      className="absolute top-0 bottom-0 w-px bg-neutral-100"
                      style={{ left: `${percent(tick)}%` }}
                      aria-hidden="true"
                    />
                  ))}

                  {/* Lapsed / degraded periods */}
                  {track.channelSegments
                    .filter(seg => seg.state !== 'recording')
                    .map(seg => {
                      const left = Math.max(0, percent(seg.startSeconds));
                      const right = Math.min(100, percent(seg.endSeconds));
                      return (
                        <span
                          key={seg.id}
                          className="absolute top-1 bottom-1 hatch border border-neutral-300"
                          style={{ left: `${left}%`, width: `${Math.max(0.4, right - left)}%` }}
                          title={`${seg.label} — ${seg.state}`}
                        />
                      );
                    })}

                  {/* Signals */}
                  {track.channelSignals.map(signal => {
                    const left = percent(signal.offsetSeconds);
                    if (left < -2 || left > 102) return null;
                    const width = signal.durationSeconds
                      ? Math.max(0.6, (signal.durationSeconds / span) * 100)
                      : 0.9;
                    const isSelected = signal.id === selectedSignalId;
                    const isEscalated = escalatedIds.has(signal.id);
                    return (
                      <button
                        key={signal.id}
                        type="button"
                        onClick={event => {
                          event.stopPropagation();
                          onSelectSignal(signal);
                        }}
                        title={`${formatOffset(signal.offsetSeconds)} — ${signal.label} (${Math.round(
                          signal.confidence * 100,
                        )}% confidence)`}
                        className={[
                          'absolute top-1/2 -translate-y-1/2 rounded-[1px] transition-all',
                          isSelected
                            ? 'bg-neutral-900 ring-2 ring-neutral-900 ring-offset-1 h-4'
                            : isEscalated
                              ? 'bg-neutral-800 h-3.5'
                              : signal.strength === 'weak'
                                ? 'bg-neutral-400 h-2'
                                : 'bg-neutral-600 h-2.5',
                        ].join(' ')}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        aria-label={`${signal.label} at ${formatOffset(signal.offsetSeconds)}`}
                      />
                    );
                  })}

                  {/* Playhead */}
                  {playhead !== null && playhead >= from && playhead <= to && (
                    <span
                      className="absolute top-0 bottom-0 w-px bg-neutral-900 z-10 pointer-events-none"
                      style={{ left: `${percent(playhead)}%` }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>
            ))}

            {tracks.length === 0 && (
              <p className="py-8 text-center text-[12.5px] text-neutral-500">
                No channel activity to correlate for this window.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-2.5 border-t border-neutral-200 bg-neutral-50">
        <LegendKey label="Escalated" className="bg-neutral-800 h-2.5 w-4" />
        <LegendKey label="Corroborated" className="bg-neutral-600 h-2 w-4" />
        <LegendKey label="Single channel" className="bg-neutral-400 h-1.5 w-4" />
        <LegendKey label="Lapsed — no observation" className="hatch border border-neutral-300 w-4" />
        <span className="ml-auto text-[11px] text-neutral-400">
          Bar height is detector strength, not severity.
        </span>
      </div>
    </div>
  );

  function firstAnomalyOffset(): number {
    return signals[0]?.offsetSeconds ?? 0;
  }
}

function LegendKey({ label, className }: { label: string; className: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500">
      <span className={`inline-block rounded-[1px] ${className}`} aria-hidden="true" />
      {label}
    </span>
  );
}

/** A small coverage bar shown above the timeline header. */
export function SessionProgress({
  elapsedSeconds,
  totalSeconds,
}: {
  elapsedSeconds: number;
  totalSeconds: number;
}) {
  const pct = totalSeconds > 0 ? Math.min(100, (elapsedSeconds / totalSeconds) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <Meter value={pct} label="Session elapsed" className="w-24" />
      <span className="data text-[11px] text-neutral-500">
        {formatOffset(elapsedSeconds)} / {formatOffset(totalSeconds)}
      </span>
    </div>
  );
}
