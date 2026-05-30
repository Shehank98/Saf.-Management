import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('rounded-xl object-cover shrink-0', SIZES[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl flex items-center justify-center font-bold shrink-0',
        SIZES[size],
        className
      )}
      style={{
        background: 'linear-gradient(135deg, #2D6A4F, #1F4F3A)',
        color: '#fff',
      }}
      aria-label={name || 'User avatar'}
    >
      {getInitials(name)}
    </div>
  );
}
