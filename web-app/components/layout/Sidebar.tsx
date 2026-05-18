'use client';

import { Compass, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  key: string;
  label: string;
  icon: any;
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
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onMobileClose} />
      )}
      <aside className={cn(
        'fixed left-0 top-0 z-40 flex h-full w-60 flex-col border-r transition-transform duration-200',
        'lg:relative lg:translate-x-0 lg:flex lg:shrink-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )} style={{ background: '#fff', borderColor: '#E8E5DE' }}>
        {/* Brand */}
        <div className="pwa-sidebar-brand">
          <div className="mark">
            <Compass size={18} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <div className="name">Safari Adventures</div>
            <div className="sub">Management Platform</div>
          </div>
          <button className="ml-auto lg:hidden p-1 rounded-md" style={{ color: '#8A8A8A' }} onClick={onMobileClose}>
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleClick(item.key)}
                className={cn('pwa-nav-btn', isActive && 'active', item.danger && 'danger')}
              >
                <div className="ico" style={isActive ? {} : { background: '#F1EEE7' }}>
                  <Icon size={15} color={isActive ? '#fff' : item.danger ? '#C0392B' : '#555'} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
