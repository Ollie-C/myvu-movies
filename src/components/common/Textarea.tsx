// Audited: 11/08/2025
import { forwardRef } from 'react';
import { cn } from '@/utils/helpers/cn';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className='w-full'>
        {label && (
          <label className='block text-sm font-medium text-primary mb-1.5'>
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg',
            'bg-surface border border-border',
            'text-primary placeholder:text-tertiary',
            'transition-all duration-200',
            'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20',
            'hover:border-border-strong',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-hover',
            'resize-none',
            error &&
              'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          rows={4}
          {...props}
        />

        {(error || helperText) && (
          <p
            className={cn(
              'mt-1.5 text-sm',
              error ? 'text-red-500' : 'text-secondary'
            )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
