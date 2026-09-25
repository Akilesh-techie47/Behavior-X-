import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimerProps {
  initialSeconds?: number;
  onExpire?: () => void;
  isPaused?: boolean;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({
  initialSeconds = 2700, // 45 mins
  onExpire,
  isPaused = false,
  className = '',
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSeconds);

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

  // Warning thresholds:
  // Under 5 minutes = warning state
  // Under 1 minute = final-minute critical alert state
  const isFinalMinute = secondsRemaining <= 60 && secondsRemaining > 0;
  const isWarning = secondsRemaining <= 300 && secondsRemaining > 60;

  const formatUnit = (val: number) => val.toString().padStart(2, '0');

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-semibold transition-all ${
        isFinalMinute
          ? 'bg-rose-100 border-rose-400 text-rose-800 animate-bounce dark:bg-rose-950/80 dark:border-rose-600 dark:text-rose-200'
          : isWarning
          ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/50 dark:border-amber-700 dark:text-amber-200'
          : 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-200'
      } ${className}`}
      role="timer"
      aria-live="polite"
      title={isFinalMinute ? 'FINAL MINUTE: Assessment will auto-submit at 00:00' : isWarning ? 'Warning: Less than 5 minutes remaining' : 'Remaining Time'}
    >
      {isFinalMinute ? (
        <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
      ) : (
        <Clock className={`w-4 h-4 ${isWarning ? 'text-amber-600' : 'text-slate-400'}`} />
      )}
      <span>
        {hours > 0 && `${formatUnit(hours)}:`}
        {formatUnit(minutes)}:{formatUnit(seconds)}
      </span>
      {isFinalMinute && (
        <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-300 tracking-wider">
          FINAL MINUTE
        </span>
      )}
    </div>
  );
};
