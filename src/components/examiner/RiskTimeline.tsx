import React from 'react';
import { RiskTimelinePoint } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface RiskTimelineProps {
  timeline: RiskTimelinePoint[];
  className?: string;
}

export const RiskTimeline: React.FC<RiskTimelineProps> = ({ timeline, className = '' }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="py-8 text-center text-[13px] text-slate-500">
        No timeline intervals recorded yet.
      </div>
    );
  }

  const getBarClass = (score: number) => {
    if (score >= 65) return 'bg-rose-600';
    if (score >= 40) return 'bg-amber-500';
    if (score >= 20) return 'bg-brand-600';
    return 'bg-slate-300';
  };

  const getLevelVariant = (level: string) => {
    switch (level) {
      case 'REVIEW':
      case 'HIGH':
        return 'high' as const;
      case 'MEDIUM':
        return 'elevated' as const;
      case 'LOW':
        return 'info' as const;
      default:
        return 'neutral' as const;
    }
  };

  const peakScore = Math.max(...timeline.map(t => t.score));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Trajectory chart */}
      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="eyebrow">Review priority trajectory · 30s sliding window</span>
          <span className="data text-[11.5px] text-slate-500">
            Peak {peakScore} pts
          </span>
        </div>

        <div className="h-28 flex items-end gap-1 sm:gap-1.5 pt-4 border-b border-slate-200">
          {timeline.map((point, idx) => {
            const heightPercent = Math.max(8, point.score);
            return (
              <div
                key={idx}
                className="group relative flex-1 h-full flex flex-col items-center justify-end gap-1"
              >
                <div className="absolute -top-2 z-20 hidden group-hover:flex flex-col items-center rounded-md bg-slate-900 px-2 py-1 text-slate-100 text-[10.5px] whitespace-nowrap pointer-events-none shadow-md">
                  <span className="data font-semibold">
                    {point.formattedTime} · {point.score} pts
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {point.level} ({point.primarySignal})
                  </span>
                </div>

                <div
                  className={`w-full rounded-t-[2px] transition-[height] duration-300 ${getBarClass(
                    point.score
                  )}`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="data text-[11px] text-slate-400">{timeline[0].formattedTime}</span>
          <span className="data text-[11px] text-slate-400">
            {timeline[timeline.length - 1].formattedTime}
          </span>
        </div>
      </div>

      {/* Chronological step list */}
      <div className="overflow-x-auto">
        <div className="flex items-stretch gap-2 min-w-max pb-1">
          {timeline.map((point, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 rounded-md border border-slate-200 bg-white px-3 py-2.5"
            >
              <span className="data text-[11.5px] font-semibold text-slate-900">
                {point.formattedTime}
              </span>
              <StatusBadge status={point.level} variant={getLevelVariant(point.level)} size="sm" />
              <span className="data text-[12px] font-semibold text-slate-900">{point.score} pts</span>
              {point.primarySignal && (
                <span className="text-[11.5px] text-slate-500 max-w-[120px] truncate">
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
