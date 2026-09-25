import React from 'react';
import {
  Users,
  EyeOff,
  Minimize2,
  Volume2,
  AlertTriangle,
  UserX,
  HelpCircle,
} from 'lucide-react';
import { EventType } from '../../types';
import { SeverityBadge } from './StatusBadge';

interface EventIndicatorProps {
  type: EventType;
  timestampMs?: number;
  durationSeconds?: number;
  description?: string;
  confidence?: number;
  compact?: boolean;
  className?: string;
}

export const EventIndicator: React.FC<EventIndicatorProps> = ({
  type,
  timestampMs,
  durationSeconds,
  description,
  confidence,
  compact = false,
  className = '',
}) => {
  const meta: Record<
    EventType,
    { label: string; icon: React.ReactNode; colorClass: string; bgClass: string }
  > = {
    FACE_ABSENCE: {
      label: 'Absence from Viewport',
      icon: <UserX className="w-4 h-4 text-rose-500" />,
      colorClass: 'text-rose-700 dark:text-rose-400',
      bgClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
    },
    MULTIPLE_PERSONS: {
      label: 'Multiple-Person Presence',
      icon: <Users className="w-4 h-4 text-amber-500" />,
      colorClass: 'text-amber-700 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
    },
    ATTENTION_DEVIATION: {
      label: 'Attention Deviation',
      icon: <EyeOff className="w-4 h-4 text-indigo-500" />,
      colorClass: 'text-indigo-700 dark:text-indigo-400',
      bgClass: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900',
    },
    OFF_SCREEN_GAZE: {
      label: 'Repeated Off-Screen Gaze',
      icon: <EyeOff className="w-4 h-4 text-indigo-500" />,
      colorClass: 'text-indigo-700 dark:text-indigo-400',
      bgClass: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900',
    },
    WINDOW_BLUR: {
      label: 'Window Focus Lost',
      icon: <Minimize2 className="w-4 h-4 text-blue-500" />,
      colorClass: 'text-blue-700 dark:text-blue-400',
      bgClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
    },
    TAB_SWITCH: {
      label: 'Browser Tab Inactive',
      icon: <Minimize2 className="w-4 h-4 text-blue-500" />,
      colorClass: 'text-blue-700 dark:text-blue-400',
      bgClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
    },
    AUDIO_ANOMALY: {
      label: 'Acoustic Signal Peak',
      icon: <Volume2 className="w-4 h-4 text-purple-500" />,
      colorClass: 'text-purple-700 dark:text-purple-400',
      bgClass: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
    },
    SUSPICIOUS_POSTURE: {
      label: 'Posture Discontinuity',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      colorClass: 'text-amber-700 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
    },
  };

  const item = meta[type] || {
    label: type,
    icon: <HelpCircle className="w-4 h-4 text-slate-500" />,
    colorClass: 'text-slate-700',
    bgClass: 'bg-slate-50 border-slate-200',
  };

  const formatOffset = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs ${item.bgClass} ${className}`}>
        {item.icon}
        <span className={`font-medium ${item.colorClass}`}>{item.label}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border ${item.bgClass} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-1.5 rounded-lg bg-white dark:bg-slate-900 shadow-xs border border-slate-200/50 dark:border-slate-800">
          {item.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${item.colorClass}`}>{item.label}</span>
            {confidence && (
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                ({Math.round(confidence * 100)}% conf)
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-mono">
            {timestampMs !== undefined && <span>T+ {formatOffset(timestampMs)}</span>}
            {durationSeconds !== undefined && <span>Duration: {durationSeconds.toFixed(1)}s</span>}
          </div>
        </div>
      </div>
      <SeverityBadge severity={type === 'FACE_ABSENCE' || type === 'MULTIPLE_PERSONS' ? 'high' : 'medium'} />
    </div>
  );
};
