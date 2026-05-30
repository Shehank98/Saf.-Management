import * as React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export function FormField({
  label,
  required = false,
  error,
  hint,
  children,
  className,
  htmlFor,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium"
        style={{ color: '#555' }}
      >
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs" style={{ color: '#8A8A8A' }}>
          {hint}
        </p>
      )}
    </div>
  );
}
