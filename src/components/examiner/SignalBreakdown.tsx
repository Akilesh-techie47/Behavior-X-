import React from 'react';
import { Eye, Users, Minimize2, Keyboard, HelpCircle, Sparkles } from 'lucide-react';
import { BehaviorEvent } from '../../types';
import { ProgressBar } from '../common/ProgressBar';

interface SignalBreakdownProps {
  events: BehaviorEvent[];
  className?: string;
}

export const SignalBreakdown: React.FC<SignalBreakdownProps> = ({ events, className = '' }) => {
  let attentionCount = 0;
  let presenceCount = 0;
  let visibilityCount = 0;
  let interactionCount = 0;
  let questionCount = 0;
  let fusionCount = 0;

  for (const e of events) {
    if (e.category === 'attention') attentionCount++;
    else if (e.category === 'presence') presenceCount++;
    else if (e.category === 'visibility') visibilityCount++;
    else if (e.category === 'interaction') interactionCount++;
    else if (e.category === 'question') questionCount++;
    else if (e.category === 'fusion' || e.category === 'aggregated') fusionCount++;
  }

  const total = Math.max(1, events.length);

  const rows = [
    {
      icon: <Eye className="w-3.5 h-3.5" />,
      label: 'Attention deviations',
      hint: 'Gaze / pose',
      count: attentionCount,
      color: 'monochrome' as const,
    },
    {
      icon: <Users className="w-3.5 h-3.5" />,
      label: 'Presence & multiple persons',
      hint: 'Face count',
      count: presenceCount,
      color: 'rose' as const,
    },
    {
      icon: <Minimize2 className="w-3.5 h-3.5" />,
      label: 'Window activity & tab focus',
      hint: 'Visibility',
      count: visibilityCount,
      color: 'default' as const,
    },
    {
      icon: <Keyboard className="w-3.5 h-3.5" />,
      label: 'Keystroke & cursor dynamics',
      hint: 'Interaction',
      count: interactionCount,
      color: 'amber' as const,
    },
    {
      icon: <HelpCircle className="w-3.5 h-3.5" />,
      label: 'Question response anomalies',
      hint: 'Timing',
      count: questionCount,
      color: 'emerald' as const,
    },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {rows.map(row => (
        <div key={row.label}>
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-800 min-w-0">
              <span className="text-slate-400 shrink-0">{row.icon}</span>
              <span className="truncate">{row.label}</span>
              <span className="hidden sm:inline text-[11.5px] text-slate-400 shrink-0">
                {row.hint}
              </span>
            </span>
            <span className="data text-[11.5px] text-slate-500 shrink-0">
              {row.count} · {Math.round((row.count / total) * 100)}%
            </span>
          </div>
          <ProgressBar value={row.count} max={total} color={row.color} size="xs" />
        </div>
      ))}

      {fusionCount > 0 && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-800 min-w-0">
              <span className="text-slate-400 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span className="truncate">Multimodal correlated sequences</span>
            </span>
            <span className="data text-[11.5px] text-slate-500 shrink-0">
              {fusionCount} · {Math.round((fusionCount / total) * 100)}%
            </span>
          </div>
          <ProgressBar value={fusionCount} max={total} color="indigo" size="xs" />
        </div>
      )}
    </div>
  );
};
