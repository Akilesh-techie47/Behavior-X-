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

  // A measured ramp: the bar itself carries the meaning, so the track stays quiet.
  const colorClasses: Record<string, string> = {
    default: 'bg-brand-700',
    monochrome: 'bg-slate-700',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-500',
    rose: 'bg-rose-600',
    indigo: 'bg-brand-800',
  };

  const selectedColor = colorClasses[color] || colorClasses.default;

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-[12px] text-slate-500 mb-1.5 font-medium">
          {label && <span>{label}</span>}
          {showPercent && <span className="data">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div
        className={`w-full bg-slate-200 rounded-full overflow-hidden ${sizeClasses[size]}`}
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${selectedColor} ${sizeClasses[size]} rounded-full transition-[width] duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
