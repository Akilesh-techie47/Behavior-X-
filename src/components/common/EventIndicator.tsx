import React from 'react';
import {
  Users,
  EyeOff,
  Minimize2,
  AlertTriangle,
  UserX,
  HelpCircle,
  Clipboard,
  Keyboard,
  MousePointer,
  Sparkles,
  Timer,
  ShieldAlert,
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
  const meta: Partial<Record<
    EventType,
    { label: string; icon: React.ReactNode }
  >> = {
    FACE_ABSENCE: {
      label: 'Absence from Viewport',
      icon: <UserX className="w-4 h-4 text-black dark:text-white" />,
    },
    FACE_NOT_DETECTED: {
      label: 'Candidate Presence Loss',
      icon: <UserX className="w-4 h-4 text-black dark:text-white" />,
    },
    MULTIPLE_PERSONS: {
      label: 'Secondary Person Presence',
      icon: <Users className="w-4 h-4 text-black dark:text-white" />,
    },
    MULTIPLE_FACES: {
      label: 'Multiple Faces Detected',
      icon: <Users className="w-4 h-4 text-black dark:text-white" />,
    },
    ATTENTION_DEVIATION: {
      label: 'Attention Deviation',
      icon: <EyeOff className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />,
    },
    LOOKING_AWAY: {
      label: 'Off-Screen Gaze',
      icon: <EyeOff className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />,
    },
    PROLONGED_OFF_SCREEN_GAZE: {
      label: 'Sustained Off-Screen Gaze',
      icon: <EyeOff className="w-4 h-4 text-black dark:text-white" />,
    },
    OFF_SCREEN_GAZE: {
      label: 'Off-Screen Gaze Orientation',
      icon: <EyeOff className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />,
    },
    WINDOW_BLUR: {
      label: 'Window Focus Lost',
      icon: <Minimize2 className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />,
    },
    TAB_VISIBILITY_CHANGE: {
      label: 'Tab Hidden / Backgrounded',
      icon: <Minimize2 className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />,
    },
    TAB_SWITCH: {
      label: 'Browser Tab Switching',
      icon: <Minimize2 className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />,
    },
    FULLSCREEN_EXIT: {
      label: 'Fullscreen Mode Exited',
      icon: <Minimize2 className="w-4 h-4 text-black dark:text-white" />,
    },
    CLIPBOARD_PASTE: {
      label: 'External Text Insertion (Paste)',
      icon: <Clipboard className="w-4 h-4 text-black dark:text-white" />,
    },
    CLIPBOARD_COPY: {
      label: 'Clipboard Copy Detected',
      icon: <Clipboard className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />,
    },
    TYPING_SPEED_CHANGE: {
      label: 'Typing Velocity Spike',
      icon: <Keyboard className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />,
    },
    MOUSE_HESITATION: {
      label: 'Cursor Hesitation Pattern',
      icon: <MousePointer className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />,
    },
    QUESTION_RAPID_ANSWER: {
      label: 'Rapid Response Timing Anomaly',
      icon: <Timer className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />,
    },
    AI_ERA_INTERACTION_PATTERN: {
      label: 'AI-Era Multimodal Sequence',
      icon: <Sparkles className="w-4 h-4 text-black dark:text-white" />,
    },
    CAMERA_DISCONNECTED: {
      label: 'Optical Hardware Disconnected',
      icon: <ShieldAlert className="w-4 h-4 text-black dark:text-white" />,
    },
    RAPID_REPEATED_DEVIATION: {
      label: 'Compound Rapid Deviation Cluster',
      icon: <AlertTriangle className="w-4 h-4 text-black dark:text-white" />,
    },
  };

  const item = meta[type] || {
    label: type.replace(/_/g, ' '),
    icon: <HelpCircle className="w-4 h-4 text-neutral-500" />,
  };

  const formatOffset = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isHighSeverity =
    type === 'FACE_ABSENCE' ||
    type === 'MULTIPLE_PERSONS' ||
    type === 'MULTIPLE_FACES' ||
    type === 'AI_ERA_INTERACTION_PATTERN' ||
    type === 'CAMERA_DISCONNECTED' ||
    type === 'RAPID_REPEATED_DEVIATION';

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-xs ${className}`}>
        {item.icon}
        <span className="font-medium text-neutral-900 dark:text-neutral-100">{item.label}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start justify-between gap-3 p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-850 bg-neutral-50/80 dark:bg-neutral-950 transition-all ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-1.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          {item.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-neutral-950 dark:text-white tracking-tight">
              {item.label}
            </span>
            {confidence && (
              <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                ({Math.round(confidence * 100)}% conf)
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed font-normal">
              {description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-400 font-mono">
            {timestampMs !== undefined && <span>T+ {formatOffset(timestampMs)}</span>}
            {durationSeconds !== undefined && <span>Duration: {durationSeconds.toFixed(1)}s</span>}
          </div>
        </div>
      </div>
      <SeverityBadge severity={isHighSeverity ? 'high' : 'medium'} />
    </div>
  );
};
