import React from 'react';
import { Eye, Users, Minimize2, Camera, Layers, Keyboard, HelpCircle, Sparkles } from 'lucide-react';
import { BehaviorEvent, EventCategory } from '../../types';
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
  let systemCount = 0;

  for (const e of events) {
    if (e.category === 'attention') attentionCount++;
    else if (e.category === 'presence') presenceCount++;
    else if (e.category === 'visibility') visibilityCount++;
    else if (e.category === 'interaction') interactionCount++;
    else if (e.category === 'question') questionCount++;
    else if (e.category === 'fusion' || e.category === 'aggregated') fusionCount++;
    else if (e.category === 'system') systemCount++;
  }

  const total = Math.max(1, events.length);

  return (
    <div className={`space-y-3.5 text-xs ${className}`}>
      {/* 1. Attention */}
      <div>
        <div className="flex justify-between items-center text-neutral-800 dark:text-neutral-200 mb-1 font-medium">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-black dark:text-white" />
            <span>Attention Deviations (Gaze / Pose)</span>
          </span>
          <span className="font-mono text-neutral-500">{attentionCount} ({Math.round((attentionCount / total) * 100)}%)</span>
        </div>
        <ProgressBar value={attentionCount} max={total} color="monochrome" />
      </div>

      {/* 2. Presence */}
      <div>
        <div className="flex justify-between items-center text-neutral-800 dark:text-neutral-200 mb-1 font-medium">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-black dark:text-white" />
            <span>Presence & Multiple Persons</span>
          </span>
          <span className="font-mono text-neutral-500">{presenceCount} ({Math.round((presenceCount / total) * 100)}%)</span>
        </div>
        <ProgressBar value={presenceCount} max={total} color="rose" />
      </div>

      {/* 3. Window & Tab Activity */}
      <div>
        <div className="flex justify-between items-center text-neutral-800 dark:text-neutral-200 mb-1 font-medium">
          <span className="flex items-center gap-1.5">
            <Minimize2 className="w-3.5 h-3.5 text-black dark:text-white" />
            <span>Window Activity & Tab Focus</span>
          </span>
          <span className="font-mono text-neutral-500">{visibilityCount} ({Math.round((visibilityCount / total) * 100)}%)</span>
        </div>
        <ProgressBar value={visibilityCount} max={total} color="default" />
      </div>

      {/* 4. Keyboard & Interaction Dynamics */}
      <div>
        <div className="flex justify-between items-center text-neutral-800 dark:text-neutral-200 mb-1 font-medium">
          <span className="flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-black dark:text-white" />
            <span>Keystroke & Cursor Dynamics</span>
          </span>
          <span className="font-mono text-neutral-500">{interactionCount} ({Math.round((interactionCount / total) * 100)}%)</span>
        </div>
        <ProgressBar value={interactionCount} max={total} color="amber" />
      </div>

      {/* 5. Question-Level Timing */}
      <div>
        <div className="flex justify-between items-center text-neutral-800 dark:text-neutral-200 mb-1 font-medium">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-black dark:text-white" />
            <span>Question Response Anomalies</span>
          </span>
          <span className="font-mono text-neutral-500">{questionCount} ({Math.round((questionCount / total) * 100)}%)</span>
        </div>
        <ProgressBar value={questionCount} max={total} color="emerald" />
      </div>

      {/* 6. Multimodal Sequence Fusion */}
      {fusionCount > 0 && (
        <div>
          <div className="flex justify-between items-center text-neutral-800 dark:text-neutral-200 mb-1 font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-black dark:text-white" />
              <span>Multimodal Correlated Sequences</span>
            </span>
            <span className="font-mono text-neutral-500">{fusionCount} ({Math.round((fusionCount / total) * 100)}%)</span>
          </div>
          <ProgressBar value={fusionCount} max={total} color="monochrome" />
        </div>
      )}
    </div>
  );
};
