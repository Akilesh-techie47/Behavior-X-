import React from 'react';
import { Button } from './Button';

interface StateFeedbackProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<StateFeedbackProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {icon && <div className="mb-3 text-slate-400">{icon}</div>}
      <h4 className="text-sm font-medium text-slate-800">{title}</h4>
      {description && <p className="text-[13px] text-slate-500 mt-1.5 max-w-sm leading-relaxed">{description}</p>}
      {actionText && onAction && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export const LoadingState: React.FC<{ message?: string; className?: string }> = ({
  message = 'Initializing edge behavioral model...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="w-6 h-6 border-2 border-slate-300 border-t-brand-700 rounded-full animate-spin mb-4" />
      <h4 className="text-sm font-medium text-slate-800">{message}</h4>
      <p className="text-[12px] text-slate-500 mt-1">Transient client-side initialization</p>
    </div>
  );
};

export const ErrorState: React.FC<StateFeedbackProps> = ({
  title,
  description,
  icon,
  actionText = 'Retry Operation',
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {icon && <div className="mb-3 text-rose-500">{icon}</div>}
      <h4 className="text-sm font-medium text-slate-900">{title}</h4>
      {description && <p className="text-[13px] text-slate-600 mt-1.5 max-w-sm leading-relaxed">{description}</p>}
      {onAction && (
        <Button variant="primary" size="sm" className="mt-4" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
