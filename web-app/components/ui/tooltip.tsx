'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, position = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const show = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(true), 200);
  };
  const hide = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const positionClasses: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium pointer-events-none',
            'animate-in fade-in zoom-in-95 duration-150',
            positionClasses[position]
          )}
          style={{ background: '#1A1A1A', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
