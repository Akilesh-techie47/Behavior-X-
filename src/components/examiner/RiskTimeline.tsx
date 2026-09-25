import React from 'react';
import { RiskTimelinePoint } from '../../types';

interface RiskTimelineProps {
  timeline: RiskTimelinePoint[];
  className?: string;
}

export const RiskTimeline: React.FC<RiskTimelineProps> = ({ timeline, className = '' }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-xs text-slate-400 py-4 text-center">
        No timeline intervals recorded yet.
      </div>
    );
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'REVIEW':
      case 'HIGH':
        return 'bg-rose-500 border-rose-600 text-rose-50';
      case 'MEDIUM':
        return 'bg-amber-500 border-amber-600 text-amber-50';
      case 'LOW':
        return 'bg-blue-500 border-blue-600 text-blue-50';
      case 'NORMAL':
      default:
        return 'bg-emerald-500 border-emerald-600 text-emerald-50';
    }
  };

  const getBarColor = (score: number) => {
    if (score >= 65) return 'bg-rose-500';
    if (score >= 35) return 'bg-amber-500';
    if (score >= 15) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Visual Density Bar Chart */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
          <span>RISK SCORE OVER TIME (SLIDING 30S WINDOW)</span>
          <span>PEAK: {Math.max(...timeline.map(t => t.score))}%</span>
        </div>

        <div className="h-28 flex items-end gap-1.5 sm:gap-2 pt-4 pb-1 border-b border-slate-200 dark:border-slate-700">
          {timeline.map((point, idx) => {
            const heightPercent = Math.max(8, point.score);
            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap pointer-events-none">
                  <span className="font-bold">{point.formattedTime} • Score {point.score}%</span>
                  <span className="text-slate-300 font-mono text-[9px]">{point.level} ({point.primarySignal})</span>
                </div>

                <div
                  className={`w-full rounded-t-md transition-all duration-300 group-hover:opacity-80 ${getBarColor(
                    point.score
                  )}`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[10px] font-mono text-slate-400 truncate max-w-full">
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
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs text-xs"
            >
              <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {point.formattedTime}
              </div>
              <span
                className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${getLevelColor(
                  point.level
                )}`}
              >
                {point.level}
              </span>
              <span className="font-mono text-slate-500 font-semibold">{point.score}%</span>
              {point.primarySignal && (
                <span className="text-slate-400 text-[11px] max-w-[130px] truncate">
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
