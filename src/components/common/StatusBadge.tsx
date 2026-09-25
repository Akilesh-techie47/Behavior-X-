import React from 'react';
import { RiskLevel, EventSeverity } from '../../types';

interface StatusBadgeProps {
  status?: string;
  variant?: 'nominal' | 'low' | 'elevated' | 'high' | 'review' | 'info' | 'neutral' | 'success';
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
    nominal: 'bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-800',
    success: 'bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-800',
    low: 'bg-neutral-150 text-neutral-800 border-neutral-300 dark:bg-neutral-850 dark:text-neutral-200 dark:border-neutral-700',
    info: 'bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-800',
    elevated: 'bg-neutral-200 text-neutral-900 border-neutral-400 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700 font-semibold',
    high: 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-black dark:border-white font-bold',
    review: 'bg-black text-white border-2 border-black dark:bg-white dark:text-black dark:border-white font-extrabold uppercase',
    neutral: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800',
  };

  const dotStyles = {
    nominal: 'bg-neutral-400 dark:bg-neutral-600',
    success: 'bg-neutral-500 dark:bg-neutral-500',
    low: 'bg-neutral-500 dark:bg-neutral-400',
    info: 'bg-neutral-600 dark:bg-neutral-400',
    elevated: 'bg-neutral-700 dark:bg-neutral-300',
    high: 'bg-white dark:bg-black',
    review: 'bg-white dark:bg-black',
    neutral: 'bg-neutral-400',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 font-medium tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
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

  let meta: { label: string; variant: 'nominal' | 'low' | 'elevated' | 'high' | 'review' } = {
    label: 'Normal',
    variant: 'nominal',
  };

  if (normalizedLevel === 'REVIEW') {
    meta = { label: 'Review Priority', variant: 'review' };
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
      status={score !== undefined ? `${meta.label} (${score})` : meta.label}
      pulse={normalizedLevel === 'HIGH' || normalizedLevel === 'REVIEW'}
    />
  );
};

export const SeverityBadge: React.FC<{ severity: EventSeverity }> = ({ severity }) => {
  const map: Record<EventSeverity, { label: string; variant: 'nominal' | 'low' | 'elevated' | 'high' | 'review' }> = {
    low: { label: 'Low', variant: 'low' },
    medium: { label: 'Medium', variant: 'elevated' },
    high: { label: 'High', variant: 'high' },
    critical: { label: 'Critical', variant: 'review' },
  };

  const meta = map[severity] || map.low;
  return <StatusBadge variant={meta.variant} status={meta.label} size="sm" />;
};
