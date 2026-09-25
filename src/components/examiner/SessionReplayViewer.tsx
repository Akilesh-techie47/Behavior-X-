import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, StepForward, StepBack } from 'lucide-react';
import { ExamSession, BehaviorEvent, RiskState } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { RiskBadge } from '../common/StatusBadge';
import { EventIndicator } from '../common/EventIndicator';
import { RiskEngine } from '../../engine/risk/RiskEngine';

interface SessionReplayViewerProps {
  session: ExamSession;
  className?: string;
}

export const SessionReplayViewer: React.FC<SessionReplayViewerProps> = ({ session, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  const timerRef = useRef<number | null>(null);
  const riskEngineRef = useRef<RiskEngine>(new RiskEngine());

  const events = session.events || [];
  const currentEvent: BehaviorEvent | undefined = events[currentEventIndex];

  // Sliced events up to current index
  const visibleEvents = events.slice(0, currentEventIndex + 1);
  const activeRisk: RiskState = riskEngineRef.current.evaluateRisk(visibleEvents);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentEventIndex(prev => {
          if (prev >= events.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000 / speed);
    } else {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, events.length]);

  const handlePlayPause = () => {
    if (currentEventIndex >= events.length - 1) {
      setCurrentEventIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentEventIndex(0);
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    if (currentEventIndex < events.length - 1) {
      setCurrentEventIndex(prev => prev + 1);
    }
  };

  const handleStepBackward = () => {
    setIsPlaying(false);
    if (currentEventIndex > 0) {
      setCurrentEventIndex(prev => prev - 1);
    }
  };

  const progressPct = events.length > 0 ? Math.round(((currentEventIndex + 1) / events.length) * 100) : 100;

  return (
    <Card
      title="Behavioral session replay"
      subtitle="Replay structured exam telemetry and chronological risk changes without raw video"
      className={className}
    >
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3.5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={isPlaying ? 'outline' : 'primary'}
              size="sm"
              onClick={handlePlayPause}
              icon={isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            >
              {isPlaying ? 'Pause' : 'Play timeline'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStepBackward}
              disabled={currentEventIndex <= 0}
              icon={<StepBack className="w-3.5 h-3.5" />}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStepForward}
              disabled={currentEventIndex >= events.length - 1}
              icon={<StepForward className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-slate-500">Speed</span>
              {([1, 2, 4] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  aria-pressed={speed === s}
                  className={`h-7 w-9 rounded-md data text-[12px] font-medium transition-colors ${
                    speed === s ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
            <span className="data text-[11.5px] text-slate-500">
              Event {events.length > 0 ? currentEventIndex + 1 : 0} of {events.length}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11.5px] text-slate-500">
            <span>Session replay chronology</span>
            <span className="data">{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-700 transition-[width] duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Replay frame */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 panel-inset bg-white space-y-3">
            <span className="eyebrow">State at this timestamp</span>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-1.5">
                <span className="data text-[24px] font-semibold leading-none text-slate-900">
                  {activeRisk.currentScore}
                </span>
                <span className="data text-[11.5px] text-slate-400">/ 100</span>
              </div>
              <RiskBadge level={activeRisk.level} />
            </div>
            <dl className="pt-3 border-t border-slate-200 space-y-2">
              {[
                { label: 'Active window', value: '30 seconds' },
                { label: 'Observed cues', value: `${visibleEvents.length} total` },
                { label: 'Status', value: isPlaying ? 'Playing' : 'Paused' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <dt className="text-[12px] text-slate-500">{row.label}</dt>
                  <dd className="text-[12.5px] font-medium text-slate-900">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="md:col-span-8">
            {currentEvent ? (
              <div className="space-y-2">
                <span className="eyebrow">Active event in replay</span>
                <EventIndicator
                  type={currentEvent.type}
                  timestampMs={currentEvent.timestamp}
                  durationSeconds={currentEvent.durationSeconds || currentEvent.duration / 1000}
                  confidence={currentEvent.confidence}
                  description={currentEvent.description}
                />
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 px-6 py-10 text-center text-[13px] text-slate-500">
                No events recorded in this session.
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
