import React from 'react';
import { RiskLevel } from '../../types';

interface RiskIndicatorProps {
  score: number; // 0 to 100
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
  labelOverride?: string;
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  score,
  level,
  size = 'md',
  showDetails = true,
  className = '',
  labelOverride,
}) => {
  const normalizedLevel = String(level).toUpperCase();

  const getConfig = () => {
    switch (normalizedLevel) {
      case 'REVIEW':
        return {
          ring: 'text-brand-700',
          track: 'text-slate-200',
          label: 'Priority review required',
          text: 'text-brand-800 font-semibold',
        };
      case 'HIGH':
        return {
          ring: 'text-rose-600',
          track: 'text-slate-200',
          label: 'High priority',
          text: 'text-rose-700 font-semibold',
        };
      case 'MEDIUM':
      case 'ELEVATED':
        return {
          ring: 'text-amber-500',
          track: 'text-slate-200',
          label: 'Medium anomaly',
          text: 'text-amber-700 font-semibold',
        };
      case 'LOW':
        return {
          ring: 'text-slate-500',
          track: 'text-slate-200',
          label: 'Low deviation',
          text: 'text-slate-700 font-medium',
        };
      case 'NORMAL':
      case 'NOMINAL':
      default:
        return {
          ring: 'text-emerald-600',
          track: 'text-slate-200',
          label: 'Normal baseline',
          text: 'text-emerald-700 font-medium',
        };
    }
  };

  const config = getConfig();

  const radius = size === 'sm' ? 22 : size === 'md' ? 34 : 46;
  const strokeWidth = size === 'sm' ? 3.5 : size === 'md' ? 5 : 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const svgSize = (radius + strokeWidth) * 2;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="relative flex items-center justify-center flex-shrink-0">
        <svg
          width={svgSize}
          height={svgSize}
          className="transform -rotate-90 origin-center"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className={config.track}
            fill="transparent"
          />
          {/* Value */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className={`${config.ring} transition-[stroke-dashoffset] duration-500 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`data font-semibold text-slate-900 ${
              size === 'sm' ? 'text-xs' : size === 'md' ? 'text-base' : 'text-2xl'
            }`}
          >
            {score}
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="min-w-0">
          <div className="eyebrow">{labelOverride || 'Review Priority Index'}</div>
          <div className={`text-sm tracking-[-0.01em] mt-1 ${config.text}`}>
            {config.label}
          </div>
          <p className="text-[12px] text-slate-500 mt-1 leading-snug">
            Evidence priority metric for examiner inspection (not an automated accusation).
          </p>
        </div>
      )}
    </div>
  );
};
