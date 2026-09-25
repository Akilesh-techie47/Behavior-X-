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
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 ${className}`}>
      {icon && <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 mb-3 text-slate-400">{icon}</div>}
      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h4>
      {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{description}</p>}
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
      <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">{message}</h4>
      <p className="text-xs text-slate-400 mt-1">Transient client-side initialization</p>
    </div>
  );
};

export const ErrorState: React.FC<StateFeedbackProps> = ({
  title,
  description,
  icon,
  actionText = 'Retry System Operation',
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 ${className}`}>
      {icon && <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-rose-200 dark:border-rose-800 mb-3 text-rose-500">{icon}</div>}
      <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">{title}</h4>
      {description && <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-1 max-w-sm">{description}</p>}
      {onAction && (
        <Button variant="danger" size="sm" className="mt-4" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
