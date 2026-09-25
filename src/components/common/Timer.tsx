import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimerProps {
  initialSeconds?: number;
  initialDurationMinutes?: number;
  onExpire?: () => void;
  isPaused?: boolean;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({
  initialSeconds,
  initialDurationMinutes,
  onExpire,
  isPaused = false,
  className = '',
}) => {
  const totalSeconds = initialDurationMinutes !== undefined
    ? initialDurationMinutes * 60
    : (initialSeconds ?? 2700);

  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalSeconds);

  useEffect(() => {
    if (isPaused || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onExpire) {
            onExpire();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, secondsRemaining, onExpire]);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const isFinalMinute = secondsRemaining <= 60 && secondsRemaining > 0;
  const isWarning = secondsRemaining <= 300 && secondsRemaining > 60;

  const formatUnit = (val: number) => val.toString().padStart(2, '0');

  return (
    <div
      className={`inline-flex items-center gap-2.5 pl-3 pr-3.5 py-1.5 rounded-md border transition-colors duration-300 select-none ${
        isFinalMinute
          ? 'bg-rose-50 border-rose-200'
          : isWarning
          ? 'bg-amber-50 border-amber-200'
          : 'bg-white border-slate-200'
      } ${className}`}
      role="timer"
      aria-live="polite"
      title={isFinalMinute ? 'FINAL MINUTE: Assessment will auto-submit at 00:00' : isWarning ? 'Warning: Less than 5 minutes remaining' : 'Remaining Time'}
    >
      {isFinalMinute ? (
        <AlertTriangle className="w-4 h-4 text-rose-600" />
      ) : isWarning ? (
        <AlertTriangle className="w-4 h-4 text-amber-600" />
      ) : (
        <Clock className="w-4 h-4 text-slate-400" />
      )}
      <span className="hidden sm:flex flex-col leading-none">
        <span className="eyebrow">Time remaining</span>
        <span
          className={`data text-[15px] font-semibold mt-1 ${
            isFinalMinute ? 'text-rose-700' : isWarning ? 'text-amber-700' : 'text-slate-900'
          }`}
        >
          {hours > 0 && `${formatUnit(hours)}:`}
          {formatUnit(minutes)}:{formatUnit(seconds)}
        </span>
      </span>
      <span
        className={`sm:hidden data text-sm font-semibold ${
          isFinalMinute ? 'text-rose-700' : isWarning ? 'text-amber-700' : 'text-slate-900'
        }`}
      >
        {hours > 0 && `${formatUnit(hours)}:`}
        {formatUnit(minutes)}:{formatUnit(seconds)}
      </span>
    </div>
  );
};
