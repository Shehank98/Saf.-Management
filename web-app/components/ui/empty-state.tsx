import * as React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  iconBg = '#F1EEE7',
  iconColor = '#8A8A8A',
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('pwa-card', className)} style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: iconBg }}
      >
        <Icon className="h-8 w-8" style={{ color: iconColor }} />
      </div>
      <p className="font-bold text-base mb-2" style={{ color: '#1A1A1A' }}>
        {title}
      </p>
      {description && (
        <p className="text-sm max-w-[280px] mx-auto mb-5" style={{ color: '#8A8A8A' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
