'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  key: string;
  label: string;
  count?: number;
  icon?: React.ElementType;
}

interface TabsProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
  variant?: 'pills' | 'underline' | 'segmented';
  className?: string;
}

export function Tabs({ tabs, activeKey, onChange, variant = 'pills', className }: TabsProps) {
  if (variant === 'underline') {
    return (
      <div className={cn('flex border-b overflow-x-auto', className)} style={{ borderColor: '#E8E5DE' }} role="tablist">
        {tabs.map((tab) => {
          const active = activeKey === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.key)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                active
                  ? 'border-[#2D6A4F] text-[#2D6A4F] font-semibold'
                  : 'border-transparent text-[#8A8A8A] hover:text-[#555]'
              )}
            >
              <span className="flex items-center gap-1.5">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'ml-1 text-[10px] font-bold rounded-md px-1.5 py-0.5',
                      active ? 'bg-[#E3EFE9] text-[#2D6A4F]' : 'bg-[#F1EEE7] text-[#8A8A8A]'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'segmented') {
    return (
      <div className={cn('flex gap-0 rounded-xl overflow-hidden border', className)} style={{ borderColor: '#E8E5DE', background: '#fff' }} role="tablist">
        {tabs.map((tab, i) => {
          const active = activeKey === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.key)}
              className="flex-1 py-2.5 px-3 text-sm font-medium transition-all"
              style={{
                background: active ? '#1A3D2B' : 'transparent',
                color: active ? '#fff' : '#6B6B6B',
                fontWeight: active ? 700 : 500,
                borderLeft: i > 0 ? '1px solid #E8E5DE' : 'none',
              }}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className="ml-1.5 text-[10px] font-bold rounded-md px-1.5 py-0.5"
                  style={{
                    background: active ? 'rgba(255,255,255,0.2)' : '#E3EFE9',
                    color: active ? '#fff' : '#2D6A4F',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('pwa-tabs', className)} role="tablist">
      {tabs.map((tab) => {
        const active = activeKey === tab.key;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={cn(active && 'active')}
          >
            <span className="flex items-center justify-center gap-1.5">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
