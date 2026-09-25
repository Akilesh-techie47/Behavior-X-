import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  onDismiss,
  className = '',
}) => {
  const styles = {
    info: {
      container: 'bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100',
      icon: <Info className="w-4 h-4 text-neutral-900 dark:text-neutral-100 mt-0.5 flex-shrink-0" />,
    },
    success: {
      container: 'bg-neutral-100 dark:bg-neutral-850 border-neutral-400 dark:border-neutral-600 text-neutral-950 dark:text-neutral-50 font-medium',
      icon: <CheckCircle2 className="w-4 h-4 text-neutral-950 dark:text-neutral-50 mt-0.5 flex-shrink-0" />,
    },
    warning: {
      container: 'bg-neutral-150 dark:bg-neutral-900 border-neutral-950 dark:border-neutral-200 text-neutral-950 dark:text-neutral-50 border-l-4',
      icon: <AlertTriangle className="w-4 h-4 text-neutral-950 dark:text-neutral-50 mt-0.5 flex-shrink-0" />,
    },
    error: {
      container: 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 border-neutral-950 dark:border-white font-bold',
      icon: <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />,
    },
  };

  const current = styles[type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-none border text-xs font-mono transition-all ${current.container} ${className}`}
      role="alert"
    >
      {current.icon}
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-bold text-[11px] uppercase tracking-wider mb-1">{title}</h4>}
        <div className="text-xs leading-relaxed">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-100 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
