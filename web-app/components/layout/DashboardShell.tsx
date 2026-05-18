'use client';

import { useState } from 'react';
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
  userName, userRole, onLogout, children, avatar,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = userName
    ? userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SA';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FAFAF7' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar
          items={navItems}
          activeTab={activeTab}
          onTabChange={onTabChange}
          mobileOpen={false}
          onMobileClose={() => {}}
        />
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <Sidebar
          items={navItems}
          activeTab={activeTab}
          onTabChange={onTabChange}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="pwa-top-bar lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden pwa-bell"
              onClick={() => setMobileOpen(true)}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              {subtitle && <div className="pwa-top-bar sub">{subtitle}</div>}
              <h1 className="pwa-top-bar" style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>{title}</h1>
            </div>
          </div>
          <div className="pwa-avatar">{initials}</div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 80 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
