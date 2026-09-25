import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercent?: boolean;
  color?: 'default' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'monochrome';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercent = false,
  color = 'default',
  size = 'sm',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2.5',
  };

  const colorClasses: Record<string, string> = {
    default: 'bg-neutral-900 dark:bg-neutral-100',
    emerald: 'bg-neutral-400 dark:bg-neutral-500',
    amber: 'bg-neutral-600 dark:bg-neutral-400',
    rose: 'bg-neutral-800 dark:bg-neutral-200',
    indigo: 'bg-black dark:bg-white',
    monochrome: 'bg-black dark:bg-white',
  };

  const selectedColor = colorClasses[color] || colorClasses.default;

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs text-neutral-600 dark:text-neutral-400 mb-1 font-medium tracking-tight">
          {label && <span>{label}</span>}
          {showPercent && <span className="font-mono">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={`w-full bg-neutral-200 dark:bg-neutral-850 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${selectedColor} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
