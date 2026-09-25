import React from 'react';
import { Eye, Users, Minimize2, Maximize2, Camera, Layers } from 'lucide-react';
import { BehaviorEvent, EventCategory } from '../../types';
import { ProgressBar } from '../common/ProgressBar';

interface SignalBreakdownProps {
  events: BehaviorEvent[];
  className?: string;
}

export const SignalBreakdown: React.FC<SignalBreakdownProps> = ({ events, className = '' }) => {
  // Count by category
  let attentionCount = 0;
  let presenceCount = 0;
  let visibilityCount = 0;
  let systemCount = 0;
  let aggregatedCount = 0;

  for (const e of events) {
    if (e.category === 'attention') attentionCount++;
    else if (e.category === 'presence') presenceCount++;
    else if (e.category === 'visibility') visibilityCount++;
    else if (e.category === 'system') systemCount++;
    else if (e.category === 'aggregated') aggregatedCount++;
  }

  const total = Math.max(1, events.length);

  return (
    <div className={`space-y-3.5 text-xs ${className}`}>
      {/* Category 1: Attention */}
      <div>
        <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 mb-1 font-medium">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-indigo-500" />
            <span>Attention Deviations</span>
          </span>
          <span className="font-mono text-slate-500">{attentionCount} events ({Math.round((attentionCount / total) * 100)}%)</span>
        </div>
        <ProgressBar value={attentionCount} max={total} color="indigo" />
      </div>

      {/* Category 2: Presence */}
      <div>
        <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 mb-1 font-medium">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-rose-500" />
            <span>Presence Consistency (0 or &gt;1 face)</span>
          </span>
          <span className="font-mono text-slate-500">{presenceCount} events ({Math.round((presenceCount / total) * 100)}%)</span>
        </div>
        <ProgressBar value={presenceCount} max={total} color="rose" />
      </div>

      {/* Category 3: Window Activity */}
      <div>
        <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 mb-1 font-medium">
          <span className="flex items-center gap-1.5">
            <Minimize2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Window Activity &amp; Tab Switches</span>
          </span>
          <span className="font-mono text-slate-500">{visibilityCount} events ({Math.round((visibilityCount / total) * 100)}%)</span>
        </div>
        <ProgressBar value={visibilityCount} max={total} color="default" />
      </div>

      {/* Category 4: Fullscreen / System */}
      <div>
        <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 mb-1 font-medium">
          <span className="flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-purple-500" />
            <span>Camera &amp; Workspace Lifecycle</span>
          </span>
          <span className="font-mono text-slate-500">{systemCount} events ({Math.round((systemCount / total) * 100)}%)</span>
        </div>
        <ProgressBar value={systemCount} max={total} color="amber" />
      </div>

      {/* Category 5: Aggregated Compound Clusters */}
      {aggregatedCount > 0 && (
        <div>
          <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 mb-1 font-medium">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Rapid Repeated Anomaly Clusters</span>
            </span>
            <span className="font-mono text-slate-500">{aggregatedCount} clusters</span>
          </div>
          <ProgressBar value={aggregatedCount} max={total} color="rose" />
        </div>
      )}
    </div>
  );
};
