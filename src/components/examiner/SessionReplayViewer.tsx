import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, StepForward, StepBack, Clock, FastForward, CheckCircle2 } from 'lucide-react';
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
      title="Behavioral Session Replay"
      subtitle="Replay structured exam telemetry, chronological risk changes, and question transitions without raw video"
      className={className}
    >
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="p-3.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Button
              variant={isPlaying ? 'outline' : 'primary'}
              size="sm"
              onClick={handlePlayPause}
              icon={isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            >
              {isPlaying ? 'Pause Replay' : 'Play Timeline'}
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

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <span className="text-neutral-500">SPEED:</span>
              {([1, 2, 4] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${
                    speed === s
                      ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                      : 'text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <div className="font-mono text-[11px] text-neutral-500">
              EVENT <strong>{events.length > 0 ? currentEventIndex + 1 : 0}</strong> OF <strong>{events.length}</strong>
            </div>
          </div>
        </div>

        {/* Scrub / Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-neutral-500">
            <span>SESSION REPLAY CHRONOLOGY</span>
            <span>{progressPct}% COMPLETED</span>
          </div>
          <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-black dark:bg-white rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Live Replay Frame */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
          {/* Active Risk at this timestamp */}
          <div className="md:col-span-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3 font-mono">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
              Synchronized State at Timestamp
            </span>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-black dark:text-white">
                  {activeRisk.currentScore}
                </span>
                <span className="text-xs text-neutral-500 ml-1">/ 100 PTS</span>
              </div>
              <RiskBadge level={activeRisk.level} />
            </div>

            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1 text-[11px] text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between">
                <span>Active Window:</span>
                <strong className="text-black dark:text-white">30 seconds</strong>
              </div>
              <div className="flex justify-between">
                <span>Observed Cues:</span>
                <strong className="text-black dark:text-white">{visibleEvents.length} total</strong>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <strong className="text-black dark:text-white">{isPlaying ? 'Playing' : 'Paused'}</strong>
              </div>
            </div>
          </div>

          {/* Current Event Callout */}
          <div className="md:col-span-8">
            {currentEvent ? (
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                  Active Event In Replay
                </span>
                <EventIndicator
                  type={currentEvent.type}
                  timestampMs={currentEvent.timestamp}
                  durationSeconds={currentEvent.durationSeconds || currentEvent.duration / 1000}
                  confidence={currentEvent.confidence}
                  description={currentEvent.description}
                />
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-neutral-400 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-800">
                No events recorded in this session.
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
