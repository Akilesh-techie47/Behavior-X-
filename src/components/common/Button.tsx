import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'academic' | 'onDark';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap select-none rounded-md transition-colors duration-150 disabled:opacity-45 disabled:pointer-events-none';

  const sizeClasses = {
    sm: 'h-8 px-3 text-[13px] gap-1.5',
    md: 'h-9 px-3.5 text-sm',
    lg: 'h-10 px-4 text-sm',
  };

  const variantClasses = {
    primary:
      'bg-brand-800 text-white hover:bg-brand-900 border border-brand-800 shadow-xs',
    academic:
      'bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-xs',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200',
    outline:
      'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-300',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 border border-rose-600 font-medium',
    ghost:
      'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    onDark:
      'bg-transparent text-white border border-white/25 hover:bg-white/10 hover:border-white/40',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
};
