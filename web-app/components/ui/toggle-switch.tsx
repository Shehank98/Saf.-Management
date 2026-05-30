'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: 'sm' | 'md';
  className?: string;
  id?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
  className,
  id,
}: ToggleSwitchProps) {
  const switchId = id || `toggle-${React.useId()}`;
  const dims = size === 'sm' ? { track: 'h-5 w-9', thumb: 'h-3.5 w-3.5', translate: checked ? 'translate-x-4' : 'translate-x-0.5' }
    : { track: 'h-6 w-11', thumb: 'h-4 w-4', translate: checked ? 'translate-x-5' : 'translate-x-1' };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        id={switchId}
        role="switch"
        type="button"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-none p-0 transition-colors duration-200',
          dims.track,
          checked ? 'bg-[#2D6A4F]' : 'bg-[#D1D5DB]',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'inline-block rounded-full bg-white shadow-sm transition-transform duration-200',
            dims.thumb,
            dims.translate
          )}
        />
      </button>
      {(label || description) && (
        <label htmlFor={switchId} className={cn('cursor-pointer', disabled && 'cursor-not-allowed opacity-50')}>
          {label && <span className="block text-sm font-medium" style={{ color: '#1A1A1A' }}>{label}</span>}
          {description && <span className="block text-xs mt-0.5" style={{ color: '#8A8A8A' }}>{description}</span>}
        </label>
      )}
    </div>
  );
}
