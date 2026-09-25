import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  badge?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  footer,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  badge,
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden transition-all ${className}`}
    >
      {(title || subtitle || action || badge) && (
        <div
          className={`px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4 ${headerClassName}`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              {title && (
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm md:text-base truncate">
                  {title}
                </h3>
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
      {footer && (
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
};
