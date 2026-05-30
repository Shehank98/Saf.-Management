import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-xs', className)}>
      <ol className="flex items-center gap-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1">
              {item.href || item.onClick ? (
                <a
                  href={item.href}
                  onClick={(e) => {
                    if (item.onClick) {
                      e.preventDefault();
                      item.onClick();
                    }
                  }}
                  className={cn(
                    'font-medium transition-colors hover:text-[#2D6A4F]',
                    isLast ? 'text-[#1A1A1A]' : 'text-[#8A8A8A]'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={cn(
                    'font-medium',
                    isLast ? 'text-[#1A1A1A]' : 'text-[#8A8A8A]'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="h-3 w-3 shrink-0" style={{ color: '#D1D5DB' }} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
