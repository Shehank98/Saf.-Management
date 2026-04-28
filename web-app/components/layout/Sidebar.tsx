'use client';

import { LucideIcon, Leaf, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  danger?: boolean;
}

interface SidebarProps {
  items: NavItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ items, activeTab, onTabChange, mobileOpen, onMobileClose }: SidebarProps) {
  const handleClick = (key: string) => {
    onTabChange(key);
    onMobileClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full w-[var(--sidebar-width,240px)] flex-col bg-white border-r border-border transition-transform duration-200 ease-in-out',
          'lg:relative lg:translate-x-0 lg:flex lg:shrink-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Leaf className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">SafariPro</span>
          <button
            className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={onMobileClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleClick(item.key)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : item.danger
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
