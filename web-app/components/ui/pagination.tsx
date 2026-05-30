'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)} aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F1EEE7]"
        style={{ borderColor: '#E8E5DE' }}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" style={{ color: '#555' }} />
      </button>
      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-xs" style={{ color: '#8A8A8A' }}>
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors',
              currentPage === page
                ? 'bg-[#2D6A4F] text-white'
                : 'hover:bg-[#F1EEE7] text-[#555]'
            )}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F1EEE7]"
        style={{ borderColor: '#E8E5DE' }}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" style={{ color: '#555' }} />
      </button>
    </nav>
  );
}
