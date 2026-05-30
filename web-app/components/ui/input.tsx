import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  success?: boolean;
  hint?: string;
  leftIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, hint, leftIcon, id, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </span>
          )}
          <input
            id={id}
            type={type}
            className={cn(
              'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
              !error && !success && 'border-input focus-visible:ring-ring',
              error && 'border-red-400 focus-visible:ring-red-400',
              success && 'border-green-400 focus-visible:ring-green-400',
              leftIcon && 'pl-9',
              (error || success) && 'pr-9',
              className
            )}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            {...props}
          />
          {error && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
          )}
          {success && !error && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
          )}
        </div>
        {error && (
          <p id={id ? `${id}-error` : undefined} className="mt-1.5 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={id ? `${id}-hint` : undefined} className="mt-1.5 text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
