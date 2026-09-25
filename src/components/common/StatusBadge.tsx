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
  // Semantic, low-saturation treatments: a soft tinted field, a single hairline
  // ring and one solid dot. Colour is reserved for meaning only.
  const variantStyles = {
    nominal:
      'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20',
    success:
      'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20',
    low: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-300',
    info: 'bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-600/20',
    elevated:
      'bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-600/25',
    high: 'bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-600/25',
    review: 'bg-brand-900 text-white ring-1 ring-inset ring-brand-900',
    neutral: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
  };

  const dotStyles = {
    nominal: 'bg-emerald-600',
    success: 'bg-emerald-600',
    low: 'bg-slate-400',
    info: 'bg-sky-600',
    elevated: 'bg-amber-600',
    high: 'bg-rose-600',
    review: 'bg-white',
    neutral: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-[3px] gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[variant]} ${
          pulse ? 'animate-pulse' : ''
        }`}
      />
      <span className="whitespace-nowrap">{status}</span>
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
