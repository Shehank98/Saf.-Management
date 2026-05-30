'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X } from 'lucide-react';
import { Pagination } from './pagination';
import { Spinner } from './spinner';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (row: T) => React.ReactNode;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyMessage?: string;
  emptyIcon?: React.ElementType;
  onRowClick?: (row: T) => void;
  className?: string;
}

type SortDir = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  loading = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  pageSize = 25,
  emptyMessage = 'No data found',
  emptyIcon: EmptyIcon,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, searchQuery, columns]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className={cn('pwa-card overflow-hidden', className)}>
      {searchable && (
        <div className="px-4 pt-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#8A8A8A' }} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder={searchPlaceholder}
              className="pwa-input pl-9 pr-8"
              aria-label={searchPlaceholder}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" style={{ color: '#8A8A8A' }} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs mt-2" style={{ color: '#8A8A8A' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="py-16">
          <Spinner label="Loading data..." />
        </div>
      ) : paginated.length === 0 ? (
        <div className="py-16 text-center">
          {EmptyIcon && (
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: '#F1EEE7' }}>
              <EmptyIcon className="h-6 w-6" style={{ color: '#8A8A8A' }} />
            </div>
          )}
          <p className="text-sm font-medium" style={{ color: '#6B6B6B' }}>{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E8E5DE' }}>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        'px-4 py-3 font-semibold text-xs whitespace-nowrap',
                        col.hideOnMobile && 'hidden md:table-cell',
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      )}
                      style={{ color: '#6B6B6B', width: col.width }}
                    >
                      {col.sortable ? (
                        <button
                          onClick={() => handleSort(col.key)}
                          className="inline-flex items-center gap-1 hover:text-[#1A1A1A] transition-colors"
                        >
                          {col.label}
                          {sortKey === col.key && sortDir === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : sortKey === col.key && sortDir === 'desc' ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((row) => (
                  <tr
                    key={row[keyField]}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-[#FAFAF7]'
                    )}
                    style={{ borderBottom: '1px solid #F1EEE7' }}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3',
                          col.hideOnMobile && 'hidden md:table-cell',
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        )}
                        style={{ color: '#1A1A1A' }}
                      >
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: '#E8E5DE' }}>
              <p className="text-xs" style={{ color: '#8A8A8A' }}>
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
