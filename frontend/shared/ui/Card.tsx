/**
 * Componente de card reutilizável
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ title, description, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6',
          className
        )}
        {...props}
      >
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        {description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {description}
          </p>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
