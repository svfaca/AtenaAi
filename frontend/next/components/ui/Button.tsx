/**
 * Componente de botão reutilizável com variantes
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        'bg-blue-600 hover:bg-blue-700 text-white font-semibold transition',
      secondary:
        'bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition dark:bg-slate-700 dark:text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white font-semibold transition',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-900 dark:hover:bg-slate-800 dark:text-white transition',
    };

    const sizes = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          'rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? '...' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
