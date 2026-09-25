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
    <div className={`flex flex-col items-center justify-center p-8 text-center border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 font-mono ${className}`}>
      {icon && <div className="p-3 bg-white dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 mb-3 text-neutral-500">{icon}</div>}
      <h4 className="text-xs uppercase font-bold text-neutral-900 dark:text-neutral-100">{title}</h4>
      {description && <p className="text-[11px] text-neutral-500 mt-1 max-w-sm">{description}</p>}
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
    <div className={`flex flex-col items-center justify-center p-12 text-center font-mono ${className}`}>
      <div className="w-8 h-8 border-2 border-neutral-950 dark:border-neutral-100 border-t-transparent animate-spin mb-4" />
      <h4 className="text-xs uppercase font-bold text-neutral-900 dark:text-neutral-100">{message}</h4>
      <p className="text-[10px] text-neutral-500 mt-1">Transient client-side initialization</p>
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
    <div className={`flex flex-col items-center justify-center p-8 text-center border border-neutral-950 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-900 font-mono ${className}`}>
      {icon && <div className="p-3 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 mb-3 text-neutral-900 dark:text-neutral-100">{icon}</div>}
      <h4 className="text-xs uppercase font-bold text-neutral-950 dark:text-neutral-50">{title}</h4>
      {description && <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 max-w-sm">{description}</p>}
      {onAction && (
        <Button variant="primary" size="sm" className="mt-4" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
