'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, Banknote, Briefcase, AlertTriangle, Clock, XCircle, Bell,
} from 'lucide-react';

const NOTIFICATIONS = [
  {
    id: 1, type: 'booking', title: 'Booking Confirmed', unread: true, channel: null,
    body: 'Seat #3 on Yala Full Day (May 21) is confirmed. Payment received.',
    time: '2 min ago',
  },
  {
    id: 2, type: 'payment', title: 'Payment Received', unread: true, channel: 'whatsapp',
    body: 'LKR 3,500 received for Seat #2 — Udawalawe Morning (May 22).',
    time: '14 min ago',
  },
  {
    id: 3, type: 'job', title: 'New Job Assigned', unread: true, channel: null,
    body: 'You have a new jeep assignment for Wilpattu Full Day on May 23.',
    time: '1 hr ago',
  },
  {
    id: 4, type: 'warning', title: 'Payment Window Open', unread: false, channel: 'whatsapp',
    body: 'Yala Full Day (May 21) hit 4 seats. WhatsApp pay links sent to all customers.',
    time: 'Yesterday',
  },
  {
    id: 5, type: 'subscription', title: 'Subscription Expiring', unread: false, channel: null,
    body: 'Your Vendor Pro plan expires in 4 days. Contact admin to renew.',
    time: 'Yesterday',
  },
  {
    id: 6, type: 'cancel', title: 'Booking Cancelled', unread: false, channel: null,
    body: 'Seat #1 on Udawalawe Morning (May 19) was released — payment window expired.',
    time: '2 days ago',
  },
];

const ICON_MAP: Record<string, { Icon: any; color: string; bg: string }> = {
  booking:      { Icon: CheckCircle2,  color: '#2D6A4F', bg: '#E3EFE9' },
  payment:      { Icon: Banknote,      color: '#2D6A4F', bg: '#E3EFE9' },
  job:          { Icon: Briefcase,     color: '#1E5A87', bg: '#DBEAFE' },
  warning:      { Icon: AlertTriangle, color: '#92400E', bg: '#FEF3C7' },
  subscription: { Icon: Clock,         color: '#991B1B', bg: '#FEE2E2' },
  cancel:       { Icon: XCircle,       color: '#991B1B', bg: '#FEE2E2' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const markAllRead = () => setNotifications((n) => n.map((x) => ({ ...x, unread: false })));
  const unreadCount = notifications.filter((n) => n.unread).length;

  const groups = [
    { label: 'Today', items: notifications.slice(0, 3) },
    { label: 'Earlier', items: notifications.slice(3) },
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#FAFAF7' }}>
      {/* Header */}
      <header className="pwa-top-bar" style={{ position: 'sticky', top: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" className="pwa-bell">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ fontSize: 11, color: '#8A8A8A' }}>{unreadCount} unread</div>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Notifications</h1>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ fontSize: 12, fontWeight: 600, color: '#2D6A4F', background: 'none', border: 'none', cursor: 'pointer' }}>
            Mark all read
          </button>
        )}
      </header>

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '8px 16px 80px' }}>
        {groups.map((g) => (
          <div key={g.label} style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: '#8A8A8A', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '8px 4px' }}>
              {g.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {g.items.map((n) => {
                const m = ICON_MAP[n.type] || ICON_MAP.booking;
                const IconComp = m.Icon;
                return (
                  <div
                    key={n.id}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      gap: 12,
                      padding: '14px 16px',
                      background: '#fff',
                      borderRadius: 14,
                      border: '1px solid #E8E5DE',
                      boxShadow: n.unread ? '0 0 0 2px rgba(45,106,79,0.1)' : 'none',
                    }}
                  >
                    {n.unread && (
                      <div style={{ position: 'absolute', top: 16, left: -3, width: 6, height: 6, borderRadius: '50%', background: '#2D6A4F' }} />
                    )}
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconComp size={17} color={m.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                        <strong style={{ fontSize: 13.5, fontWeight: 700, color: '#1A1A1A' }}>{n.title}</strong>
                        {n.channel === 'whatsapp' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', background: 'rgba(37,211,102,0.12)', color: '#128C7E', borderRadius: 999, fontSize: 9, fontWeight: 700 }}>
                            WA
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12.5, color: '#555', margin: '0 0 4px', lineHeight: 1.45 }}>{n.body}</p>
                      <div style={{ fontSize: 11, color: '#8A8A8A' }}>{n.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Push permission prompt */}
        <div className="pwa-card" style={{ padding: 16, marginTop: 24, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#E3EFE9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell size={20} color="#2D6A4F" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>Enable push notifications</div>
            <div style={{ fontSize: 12, color: '#8A8A8A' }}>Get instant alerts for bookings & payments</div>
          </div>
          <button className="pwa-btn pwa-btn-primary pwa-btn-sm" onClick={() => {
            if ('Notification' in window) {
              Notification.requestPermission().then((p) => {
                if (p === 'granted') alert('Notifications enabled!');
              });
            }
          }}>
            Enable
          </button>
        </div>
      </div>
    </main>
  );
}
