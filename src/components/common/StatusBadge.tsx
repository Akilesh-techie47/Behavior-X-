import React from 'react';
import { RiskLevel, EventSeverity } from '../../types';

interface StatusBadgeProps {
  status?: string;
  variant?: 'nominal' | 'low' | 'elevated' | 'high' | 'info' | 'neutral' | 'success';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'neutral',
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const variantStyles = {
    nominal: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    low: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    info: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
    elevated: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    high: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  const dotStyles = {
    nominal: 'bg-emerald-500',
    success: 'bg-emerald-500',
    low: 'bg-blue-500',
    info: 'bg-indigo-500',
    elevated: 'bg-amber-500',
    high: 'bg-rose-500',
    neutral: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 font-medium tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]} ${
          pulse ? 'animate-pulse' : ''
        }`}
      />
      <span>{status}</span>
    </span>
  );
};

export const RiskBadge: React.FC<{ level: RiskLevel; score?: number }> = ({ level, score }) => {
  const normalizedLevel = String(level).toUpperCase();

  let meta: { label: string; variant: 'nominal' | 'low' | 'elevated' | 'high' } = {
    label: 'Normal',
    variant: 'nominal',
  };

  if (normalizedLevel === 'REVIEW') {
    meta = { label: 'Review Priority', variant: 'high' };
  } else if (normalizedLevel === 'HIGH') {
    meta = { label: 'High Priority', variant: 'high' };
  } else if (normalizedLevel === 'MEDIUM' || normalizedLevel === 'ELEVATED') {
    meta = { label: 'Medium Anomaly', variant: 'elevated' };
  } else if (normalizedLevel === 'LOW') {
    meta = { label: 'Low Deviation', variant: 'low' };
  } else {
    meta = { label: 'Normal Baseline', variant: 'nominal' };
  }

  return (
    <StatusBadge
      variant={meta.variant}
      status={score !== undefined ? `${meta.label} (${score}%)` : meta.label}
      pulse={normalizedLevel === 'HIGH' || normalizedLevel === 'REVIEW'}
    />
  );
};

export const SeverityBadge: React.FC<{ severity: EventSeverity }> = ({ severity }) => {
  const map: Record<EventSeverity, { label: string; variant: 'nominal' | 'low' | 'elevated' | 'high' }> = {
    low: { label: 'Low', variant: 'low' },
    medium: { label: 'Medium', variant: 'elevated' },
    high: { label: 'High', variant: 'high' },
    critical: { label: 'Critical', variant: 'high' },
  };

  const meta = map[severity] || map.low;
  return <StatusBadge variant={meta.variant} status={meta.label} size="sm" />;
};
