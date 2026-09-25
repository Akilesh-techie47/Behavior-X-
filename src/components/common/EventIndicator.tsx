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
      icon: <UserX className="w-4 h-4 text-slate-500" />,
    },
    FACE_NOT_DETECTED: {
      label: 'Candidate Presence Loss',
      icon: <UserX className="w-4 h-4 text-slate-500" />,
    },
    MULTIPLE_PERSONS: {
      label: 'Secondary Person Presence',
      icon: <Users className="w-4 h-4 text-slate-500" />,
    },
    MULTIPLE_FACES: {
      label: 'Multiple Faces Detected',
      icon: <Users className="w-4 h-4 text-slate-500" />,
    },
    ATTENTION_DEVIATION: {
      label: 'Attention Deviation',
      icon: <EyeOff className="w-4 h-4 text-slate-500" />,
    },
    LOOKING_AWAY: {
      label: 'Off-Screen Gaze',
      icon: <EyeOff className="w-4 h-4 text-slate-500" />,
    },
    PROLONGED_OFF_SCREEN_GAZE: {
      label: 'Sustained Off-Screen Gaze',
      icon: <EyeOff className="w-4 h-4 text-slate-500" />,
    },
    OFF_SCREEN_GAZE: {
      label: 'Off-Screen Gaze Orientation',
      icon: <EyeOff className="w-4 h-4 text-slate-500" />,
    },
    WINDOW_BLUR: {
      label: 'Window Focus Lost',
      icon: <Minimize2 className="w-4 h-4 text-slate-500" />,
    },
    TAB_VISIBILITY_CHANGE: {
      label: 'Tab Hidden / Backgrounded',
      icon: <Minimize2 className="w-4 h-4 text-slate-500" />,
    },
    TAB_SWITCH: {
      label: 'Browser Tab Switching',
      icon: <Minimize2 className="w-4 h-4 text-slate-500" />,
    },
    FULLSCREEN_EXIT: {
      label: 'Fullscreen Mode Exited',
      icon: <Minimize2 className="w-4 h-4 text-slate-500" />,
    },
    CLIPBOARD_PASTE: {
      label: 'External Text Insertion (Paste)',
      icon: <Clipboard className="w-4 h-4 text-slate-500" />,
    },
    CLIPBOARD_COPY: {
      label: 'Clipboard Copy Detected',
      icon: <Clipboard className="w-4 h-4 text-slate-500" />,
    },
    TYPING_SPEED_CHANGE: {
      label: 'Typing Velocity Spike',
      icon: <Keyboard className="w-4 h-4 text-slate-500" />,
    },
    MOUSE_HESITATION: {
      label: 'Cursor Hesitation Pattern',
      icon: <MousePointer className="w-4 h-4 text-slate-500" />,
    },
    QUESTION_RAPID_ANSWER: {
      label: 'Rapid Response Timing Anomaly',
      icon: <Timer className="w-4 h-4 text-slate-500" />,
    },
    AI_ERA_INTERACTION_PATTERN: {
      label: 'AI-Era Multimodal Sequence',
      icon: <Sparkles className="w-4 h-4 text-slate-500" />,
    },
    CAMERA_DISCONNECTED: {
      label: 'Optical Hardware Disconnected',
      icon: <ShieldAlert className="w-4 h-4 text-slate-500" />,
    },
    RAPID_REPEATED_DEVIATION: {
      label: 'Compound Rapid Deviation Cluster',
      icon: <AlertTriangle className="w-4 h-4 text-slate-500" />,
    },
  };

  const item = meta[type] || {
    label: type.replace(/_/g, ' '),
    icon: <HelpCircle className="w-4 h-4 text-slate-400" />,
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
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-xs ${className}`}>
        {item.icon}
        <span className="font-medium text-slate-800">{item.label}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start justify-between gap-4 p-3.5 border border-slate-200 rounded-md bg-white ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 shrink-0 text-slate-400">{item.icon}</div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-slate-900 tracking-[-0.01em]">
              {item.label}
            </span>
            {confidence && (
              <span className="data text-[11px] text-slate-500">
                {Math.round(confidence * 100)}% confidence
              </span>
            )}
          </div>
          {description && (
            <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">
              {description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 data text-[11px] text-slate-400">
            {timestampMs !== undefined && <span>T+ {formatOffset(timestampMs)}</span>}
            {durationSeconds !== undefined && <span>Duration {durationSeconds.toFixed(1)}s</span>}
          </div>
        </div>
      </div>
      <SeverityBadge severity={isHighSeverity ? 'high' : 'medium'} />
    </div>
  );
};
