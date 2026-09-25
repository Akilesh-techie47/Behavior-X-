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
      container: 'bg-slate-50 border-slate-200 text-slate-700',
      icon: <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />,
    },
    success: {
      container: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />,
    },
    warning: {
      container: 'bg-amber-50/70 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />,
    },
    error: {
      container: 'bg-rose-50/70 border-rose-200 text-rose-900',
      icon: <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />,
    },
  };

  const current = styles[type];

  return (
    <div
      className={`flex items-start gap-3 p-3.5 border rounded-md text-[13px] ${current.container} ${className}`}
      role="alert"
    >
      {current.icon}
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold text-[13px] mb-0.5">{title}</h4>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
