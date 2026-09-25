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
  bodyClassName = 'p-5',
  badge,
}) => {
  return (
    <section
      className={`bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden ${className}`}
    >
      {(title || subtitle || action || badge) && (
        <header
          className={`flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 rounded-t-lg ${headerClassName}`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              {title && (
                <h3 className="text-sm font-semibold text-slate-900 tracking-[-0.01em] truncate">
                  {title}
                </h3>
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="text-[13px] text-slate-500 mt-0.5 truncate font-normal">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-[13px] text-slate-600">
          {footer}
        </div>
      )}
    </section>
  );
};
