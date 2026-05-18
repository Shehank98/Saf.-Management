'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Sidebar, NavItem } from './Sidebar';

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  userName?: string;
  userRole?: string;
  onLogout: () => void;
  children: React.ReactNode;
  avatar?: string;
}

export function DashboardShell({
  title, subtitle, navItems, activeTab, onTabChange,
  userName, userRole, onLogout, children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = userName
    ? userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SA';

  // Bottom nav: only non-danger items, max 5
  const bottomNavItems = navItems.filter((n) => !n.danger).slice(0, 5);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FAFAF7' }}>

      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar
          items={navItems}
          activeTab={activeTab}
          onTabChange={onTabChange}
          mobileOpen={false}
          onMobileClose={() => {}}
        />
      </div>

      {/* Mobile overlay sidebar (accessible via hamburger, secondary nav) */}
      <div className="lg:hidden">
        <Sidebar
          items={navItems}
          activeTab={activeTab}
          onTabChange={(key) => { onTabChange(key); setMobileOpen(false); }}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="pwa-top-bar">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only, opens overlay for Sign Out + overflow items */}
            <button
              className="lg:hidden pwa-bell"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              {subtitle && <div className="pwa-top-bar sub">{subtitle}</div>}
              <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>{title}</h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Sign-out shortcut visible on mobile */}
            <button
              className="lg:hidden pwa-bell"
              onClick={onLogout}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} color="#555" />
            </button>
            <div className="pwa-avatar">{initials}</div>
          </div>
        </header>

        {/* Main content — padded for bottom nav on mobile */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: 'max(80px, calc(64px + env(safe-area-inset-bottom, 0px)))' }}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      {bottomNavItems.length > 0 && (
        <nav className="pwa-bottom-nav lg:hidden">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                className={`tab${isActive ? ' active' : ''}`}
                onClick={() => onTabChange(item.key)}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
