'use client';

import { useState } from 'react';
import { Sidebar, NavItem } from './Sidebar';
import { TopBar } from './TopBar';

interface DashboardShellProps {
  title: string;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  userName?: string;
  userRole?: string;
  onLogout: () => void;
  children: React.ReactNode;
}

export function DashboardShell({
  title,
  navItems,
  activeTab,
  onTabChange,
  userName,
  userRole,
  onLogout,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar
        items={navItems}
        activeTab={activeTab}
        onTabChange={onTabChange}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          title={title}
          userName={userName}
          userRole={userRole}
          onMobileMenuToggle={() => setMobileOpen((o) => !o)}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
