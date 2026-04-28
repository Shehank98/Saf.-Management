'use client';

import { Menu, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TopBarProps {
  title: string;
  userName?: string;
  userRole?: string;
  onMobileMenuToggle: () => void;
  onLogout: () => void;
}

function getInitials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function TopBar({ title, userName, userRole, onMobileMenuToggle, onLogout }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const roleLabelMap: Record<string, string> = {
    SUPER_ADMIN: 'Admin',
    SAFARI_OWNER: 'Owner',
    VENDOR: 'Vendor',
    CUSTOMER: 'Customer',
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-white px-4 lg:px-6">
      {/* Mobile hamburger */}
      <button
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
        onClick={onMobileMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User dropdown */}
      <div className="relative" ref={ref}>
        <button
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition-colors"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {getInitials(userName)}
          </span>
          <span className="hidden sm:block max-w-[120px] truncate font-medium text-foreground">
            {userName || 'User'}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', menuOpen && 'rotate-180')} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-10 z-50 min-w-[180px] rounded-xl border border-border bg-white py-1 shadow-elevated">
            <div className="border-b border-border px-3 py-2">
              <p className="text-xs font-semibold text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{userRole ? (roleLabelMap[userRole] || userRole) : ''}</p>
            </div>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
              onClick={() => { setMenuOpen(false); onLogout(); }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
