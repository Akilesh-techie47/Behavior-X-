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
      className={`bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-lg shadow-2xs overflow-hidden transition-all duration-150 ${className}`}
    >
      {(title || subtitle || action || badge) && (
        <div
          className={`px-4 sm:px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-850 flex items-center justify-between gap-4 ${headerClassName}`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {title && (
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm tracking-tight truncate">
                  {title}
                </h3>
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate font-normal">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-4 sm:p-5 ${bodyClassName}`}>{children}</div>
      {footer && (
        <div className="px-4 sm:px-5 py-3 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-100 dark:border-neutral-850 text-xs text-neutral-600 dark:text-neutral-400">
          {footer}
        </div>
      )}
    </div>
  );
};
