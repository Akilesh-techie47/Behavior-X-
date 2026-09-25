import React from 'react';
import { RiskLevel } from '../../types';

interface RiskIndicatorProps {
  score: number; // 0 to 100
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  score,
  level,
  size = 'md',
  showDetails = true,
  className = '',
}) => {
  const normalizedLevel = String(level).toUpperCase();

  const getLevelColor = () => {
    switch (normalizedLevel) {
      case 'REVIEW':
        return {
          stroke: '#e11d48', // rose-600
          text: 'text-rose-700 dark:text-rose-400',
          bg: 'bg-rose-50 dark:bg-rose-950/30',
          label: 'Priority Review Required',
        };
      case 'HIGH':
        return {
          stroke: '#f43f5e', // rose-500
          text: 'text-rose-600 dark:text-rose-400',
          bg: 'bg-rose-50 dark:bg-rose-950/30',
          label: 'High Anomaly Priority',
        };
      case 'MEDIUM':
      case 'ELEVATED':
        return {
          stroke: '#f59e0b', // amber-500
          text: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          label: 'Medium Review Priority',
        };
      case 'LOW':
        return {
          stroke: '#3b82f6', // blue-500
          text: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          label: 'Low Deviation',
        };
      case 'NORMAL':
      case 'NOMINAL':
      default:
        return {
          stroke: '#10b981', // emerald-500
          text: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          label: 'Normal Candidate Baseline',
        };
    }
  };

  const config = getLevelColor();

  const radius = size === 'sm' ? 24 : size === 'md' ? 36 : 48;
  const strokeWidth = size === 'sm' ? 4 : size === 'md' ? 6 : 8;
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
        >
          {/* Background circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
            fill="transparent"
          />
          {/* Value circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke={config.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono font-bold">
          <span className={`text-slate-900 dark:text-white ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-base' : 'text-xl'}`}>
            {score}
          </span>
          {size !== 'sm' && <span className="text-[9px] text-slate-400 font-normal">SCORE</span>}
        </div>
      </div>

      {showDetails && (
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Behavioral Anomaly Index
          </div>
          <div className={`text-sm font-bold ${config.text} mt-0.5`}>
            {config.label}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            Probabilistic indicator for human examiner review (not a determination of guilt).
          </p>
        </div>
      )}
    </div>
  );
};
