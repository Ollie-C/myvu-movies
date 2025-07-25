import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, helperText, leftIcon, rightIcon, ...props },
    ref
  ) => {
    return (
      <div className='w-full'>
        {label && (
          <label className='block text-sm font-medium text-primary mb-1.5'>
            {label}
          </label>
        )}

        <div className='relative'>
          {leftIcon && (
            <div className='absolute left-3 top-1/2 -translate-y-1/2 text-secondary'>
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-2.5 rounded',
              'bg-transparent border border-border',
              'text-primary placeholder:text-tertiary',
              'transition-all duration-200',
              'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20',
              'hover:border-border-strong',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-hover',
              error &&
                'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className='absolute right-3 top-1/2 -translate-y-1/2 text-secondary'>
              {rightIcon}
            </div>
          )}
        </div>

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

Input.displayName = 'Input';
