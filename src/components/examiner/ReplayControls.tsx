import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { formatOffset } from '../../domain/format';
import { Button } from '../primitives/Button';
import { usePrefersReducedMotion } from '../../hooks';

/**
 * Replay.
 *
 * Playback is at wall-clock speed, or ten times that, and it is always marked
 * as simulated — the frames are reconstructed from a signal list, so a reviewer
 * must never be able to forget that what they are watching is a reconstruction
 * rather than the original feed.
 *
 * Reduced motion is respected by making stepping the default and disabling the
 * auto-advance, because an auto-playing playhead is exactly the kind of thing
 * that setting exists for.
 */

const SPEEDS = [1, 4, 10] as const;

export interface ReplayState {
  playing: boolean;
  offset: number;
  speed: number;
}

export function useReplay(totalSeconds: number, seekTo: number | null) {
  const reducedMotion = usePrefersReducedMotion();
  const [state, setState] = useState<ReplayState>({
    playing: false,
    offset: 0,
    speed: 1,
  });
  const frameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // An external seek (a signal was clicked, the timeline was clicked).
  useEffect(() => {
    if (seekTo === null) return;
    setState(prev => ({ ...prev, offset: Math.max(0, Math.min(totalSeconds, seekTo)) }));
  }, [seekTo, totalSeconds]);

  useEffect(() => {
    if (!state.playing || reducedMotion) return;

    const tick = (now: number) => {
      const deltaSeconds = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setState(prev => {
        const next = prev.offset + deltaSeconds * prev.speed;
        if (next >= totalSeconds) {
          return { ...prev, offset: totalSeconds, playing: false };
        }
        return { ...prev, offset: next };
      });
      frameRef.current = requestAnimationFrame(tick);
    };

    lastTickRef.current = performance.now();
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [state.playing, state.speed, totalSeconds, reducedMotion]);

  const control = useCallback(
    (action: 'play' | 'pause' | 'toggle' | 'forward' | 'back' | 'restart') => {
      setState(prev => {
        switch (action) {
          case 'play':
            return prev.offset >= totalSeconds ? { ...prev, offset: 0, playing: true } : { ...prev, playing: true };
          case 'pause':
            return { ...prev, playing: false };
          case 'toggle':
            return prev.playing ? { ...prev, playing: false } : { ...prev, playing: true };
          case 'forward':
            return { ...prev, offset: Math.min(totalSeconds, prev.offset + 30) };
          case 'back':
            return { ...prev, offset: Math.max(0, prev.offset - 30) };
          case 'restart':
            return { ...prev, offset: 0, playing: false };
        }
      });
    },
    [totalSeconds],
  );

  const setSpeed = useCallback((speed: number) => setState(prev => ({ ...prev, speed })), []);
  const setOffset = useCallback(
    (offset: number) => setState(prev => ({ ...prev, offset: Math.max(0, Math.min(totalSeconds, offset)) })),
    [totalSeconds],
  );

  return { state, control, setSpeed, setOffset, reducedMotion };
}

export function ReplayControls({
  state,
  control,
  setSpeed,
  totalSeconds,
  seek,
  disabled,
  signalCountAtPlayhead,
}: {
  state: ReplayState;
  control: ReturnType<typeof useReplay>['control'];
  setSpeed: (speed: number) => void;
  totalSeconds: number;
  seek: (offset: number) => void;
  disabled?: boolean;
  signalCountAtPlayhead: number;
}) {
  const pct = totalSeconds > 0 ? (state.offset / totalSeconds) * 100 : 0;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 px-3.5 py-2.5 border-t border-neutral-200 bg-neutral-50">
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={() => control('back')}
          disabled={disabled}
          aria-label="Back 30 seconds"
          icon={<SkipBack className="w-3.5 h-3.5" />}
        />
        <Button
          size="sm"
          variant="primary"
          onClick={() => control('toggle')}
          disabled={disabled}
          icon={
            state.playing ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )
          }
        >
          {state.playing ? 'Pause' : 'Play'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => control('forward')}
          disabled={disabled}
          aria-label="Forward 30 seconds"
          icon={<SkipForward className="w-3.5 h-3.5" />}
        />
      </div>

      <div className="flex items-center gap-1" role="group" aria-label="Replay speed">
        {SPEEDS.map(speed => (
          <button
            key={speed}
            type="button"
            onClick={() => setSpeed(speed)}
            disabled={disabled}
            aria-pressed={state.speed === speed}
            className={`data text-[11px] h-6 px-1.5 border rounded-[2px] transition-colors disabled:opacity-40 ${
              state.speed === speed
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-600 border-neutral-300 hover:border-neutral-500'
            }`}
          >
            {speed}×
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-[160px] flex items-center gap-2.5">
        <input
          type="range"
          min={0}
          max={totalSeconds}
          value={Math.round(state.offset)}
          onChange={e => seek(Number(e.target.value))}
          disabled={disabled}
          aria-label="Replay position"
          className="flex-1 accent-neutral-900 h-1"
        />
        <span className="data text-[11.5px] text-neutral-600 w-[92px] text-right shrink-0">
          {formatOffset(state.offset)} / {formatOffset(totalSeconds)}
        </span>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <span className="eyebrow">At playhead</span>
        <span className="data text-[11.5px] text-neutral-700">
          {signalCountAtPlayhead} {signalCountAtPlayhead === 1 ? 'signal' : 'signals'}
        </span>
        <div className="w-16 h-1 meter" aria-hidden="true">
          <span className={pct > 99 ? 'bg-neutral-900' : 'bg-neutral-400'} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
