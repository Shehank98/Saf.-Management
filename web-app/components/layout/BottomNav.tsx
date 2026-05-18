'use client';

import { cn } from '@/lib/utils';

interface NavTab {
  key: string;
  label: string;
  icon: any;
}

interface BottomNavProps {
  tabs: NavTab[];
  active: string;
  onChange: (key: string) => void;
}

export function BottomNav({ tabs, active, onChange }: BottomNavProps) {
  return (
    <nav className="pwa-bottom-nav">
      {tabs.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn('tab', active === t.key && 'active')}
          >
            <Icon strokeWidth={active === t.key ? 2.4 : 1.8} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
