import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'academic';
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
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-neutral-400 disabled:opacity-40 disabled:pointer-events-none rounded-md select-none tracking-tight';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs sm:text-sm px-3.5 py-2 gap-2',
    lg: 'text-sm px-5 py-2.5 gap-2.5 font-semibold',
  };

  const variantClasses = {
    primary:
      'bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-950 dark:border-white shadow-2xs',
    secondary:
      'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-850 border border-neutral-200 dark:border-neutral-800',
    outline:
      'border border-neutral-300 dark:border-neutral-800 bg-transparent text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900',
    danger:
      'bg-neutral-900 text-white dark:bg-white dark:text-black border border-neutral-700 font-semibold',
    ghost:
      'bg-transparent text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900',
    academic:
      'bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100 border border-neutral-800 dark:border-neutral-300 font-semibold shadow-2xs',
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
