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
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border font-mono text-xs sm:text-sm font-semibold transition-all select-none ${
        isFinalMinute
          ? 'bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white shadow-xs'
          : isWarning
          ? 'bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white border-neutral-400 dark:border-neutral-600'
          : 'bg-neutral-50 border-neutral-300 text-neutral-900 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-100'
      } ${className}`}
      role="timer"
      aria-live="polite"
      title={isFinalMinute ? 'FINAL MINUTE: Assessment will auto-submit at 00:00' : isWarning ? 'Warning: Less than 5 minutes remaining' : 'Remaining Time'}
    >
      {isFinalMinute ? (
        <AlertTriangle className="w-3.5 h-3.5" />
      ) : (
        <Clock className="w-3.5 h-3.5 text-neutral-500" />
      )}
      <span>
        {hours > 0 && `${formatUnit(hours)}:`}
        {formatUnit(minutes)}:{formatUnit(seconds)}
      </span>
      {isFinalMinute && (
        <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 rounded bg-white text-black dark:bg-black dark:text-white">
          FINAL MINUTE
        </span>
      )}
    </div>
  );
};
