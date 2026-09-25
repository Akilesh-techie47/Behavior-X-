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

  const getMonochromeConfig = () => {
    switch (normalizedLevel) {
      case 'REVIEW':
        return {
          stroke: '#000000',
          darkStroke: '#FFFFFF',
          text: 'text-black dark:text-white font-extrabold',
          density: '████████████',
          label: 'Priority Review Required',
          badgeText: 'REVIEW',
        };
      case 'HIGH':
        return {
          stroke: '#1F1F1F',
          darkStroke: '#E5E5E5',
          text: 'text-neutral-900 dark:text-neutral-100 font-bold',
          density: '████████',
          label: 'High Priority',
          badgeText: 'HIGH',
        };
      case 'MEDIUM':
      case 'ELEVATED':
        return {
          stroke: '#525252',
          darkStroke: '#A3A3A3',
          text: 'text-neutral-800 dark:text-neutral-200 font-semibold',
          density: '█████',
          label: 'Medium Anomaly',
          badgeText: 'MEDIUM',
        };
      case 'LOW':
        return {
          stroke: '#737373',
          darkStroke: '#737373',
          text: 'text-neutral-700 dark:text-neutral-300 font-medium',
          density: '███',
          label: 'Low Deviation',
          badgeText: 'LOW',
        };
      case 'NORMAL':
      case 'NOMINAL':
      default:
        return {
          stroke: '#A3A3A3',
          darkStroke: '#525252',
          text: 'text-neutral-600 dark:text-neutral-400 font-medium',
          density: '█',
          label: 'Normal Baseline',
          badgeText: 'NORMAL',
        };
    }
  };

  const config = getMonochromeConfig();

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
        >
          {/* Background circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-neutral-200 dark:text-neutral-800"
            fill="transparent"
          />
          {/* Value circle in monochrome stroke */}
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
            className="text-neutral-900 dark:text-neutral-100 transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono font-bold">
          <span className={`text-neutral-900 dark:text-white ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-base' : 'text-2xl'}`}>
            {score}
          </span>
          {size !== 'sm' && <span className="text-[9px] text-neutral-400 font-normal tracking-widest">PTS</span>}
        </div>
      </div>

      {showDetails && (
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            {labelOverride || 'Review Priority Index'}
          </div>
          <div className={`text-sm tracking-tight ${config.text} mt-0.5 flex items-center gap-2`}>
            <span>{config.label}</span>
            <span className="font-mono text-[10px] text-neutral-400 select-none">{config.density}</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
            Evidence priority metric for examiner inspection (not an automated accusation).
          </p>
        </div>
      )}
    </div>
  );
};
