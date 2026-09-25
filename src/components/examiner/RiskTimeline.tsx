import React from 'react';
import { RiskTimelinePoint } from '../../types';

interface RiskTimelineProps {
  timeline: RiskTimelinePoint[];
  className?: string;
}

export const RiskTimeline: React.FC<RiskTimelineProps> = ({ timeline, className = '' }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-xs text-neutral-400 py-4 text-center font-mono">
        No timeline intervals recorded yet.
      </div>
    );
  }

  const getMonochromeBarClass = (score: number) => {
    if (score >= 65) return 'bg-black dark:bg-white border-t-2 border-black dark:border-white';
    if (score >= 40) return 'bg-neutral-700 dark:bg-neutral-300';
    if (score >= 20) return 'bg-neutral-500 dark:bg-neutral-500';
    return 'bg-neutral-300 dark:bg-neutral-700';
  };

  const getBadgeClass = (level: string) => {
    switch (level) {
      case 'REVIEW':
      case 'HIGH':
        return 'bg-black text-white dark:bg-white dark:text-black font-extrabold border border-black dark:border-white';
      case 'MEDIUM':
        return 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black font-bold';
      case 'LOW':
        return 'bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 font-medium';
      case 'NORMAL':
      default:
        return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 font-normal';
    }
  };

  const peakScore = Math.max(...timeline.map(t => t.score));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Visual Density Bar Chart */}
      <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850">
        <div className="flex items-center justify-between text-xs font-mono text-neutral-500 mb-2">
          <span>REVIEW PRIORITY TRAJECTORY (SLIDING 30S WINDOW)</span>
          <span>PEAK: {peakScore} PTS</span>
        </div>

        <div className="h-28 flex items-end gap-1.5 sm:gap-2 pt-4 pb-1 border-b border-neutral-200 dark:border-neutral-800">
          {timeline.map((point, idx) => {
            const heightPercent = Math.max(8, point.score);
            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-black dark:bg-white text-white dark:text-black text-[10px] font-mono px-2 py-1 rounded shadow-md whitespace-nowrap pointer-events-none border border-neutral-700">
                  <span className="font-bold">{point.formattedTime} • Score {point.score} pts</span>
                  <span className="opacity-80 text-[9px]">{point.level} ({point.primarySignal})</span>
                </div>

                <div
                  className={`w-full rounded-t transition-all duration-300 ${getMonochromeBarClass(
                    point.score
                  )}`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[10px] font-mono text-neutral-400 truncate max-w-full">
                  {point.formattedTime}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chronological Step List */}
      <div className="overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max pb-2">
          {timeline.map((point, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-mono shadow-2xs"
            >
              <div className="font-bold text-neutral-800 dark:text-neutral-200">
                {point.formattedTime}
              </div>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] ${getBadgeClass(
                  point.level
                )}`}
              >
                {point.level}
              </span>
              <span className="font-bold text-black dark:text-white">{point.score} pts</span>
              {point.primarySignal && (
                <span className="text-neutral-500 text-[11px] max-w-[120px] truncate">
                  {point.primarySignal}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
