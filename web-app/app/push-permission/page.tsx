'use client';

import { useRouter } from 'next/navigation';
import { Bell, CreditCard, AlertTriangle, Compass } from 'lucide-react';

export default function PushPermissionPage() {
  const router = useRouter();

  const handleEnable = async () => {
    if (!('Notification' in window)) {
      router.push('/login');
      return;
    }
    const result = await Notification.requestPermission();
    router.push('/login');
  };

  const BENEFITS = [
    { icon: Compass, label: 'Booking confirmations', desc: 'Know the moment your safari is confirmed' },
    { icon: CreditCard, label: 'Payment reminders', desc: '48 h window alert when group is complete' },
    { icon: AlertTriangle, label: 'Safari alerts', desc: 'Weather or schedule updates from your operator' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>

      {/* Bell icon */}
      <div style={{ position: 'relative', marginBottom: 32 }}>
        <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, #2D6A4F, #1F4F3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 40px rgba(45,106,79,0.3)' }}>
          <Bell size={52} color="#fff" />
        </div>
        <div style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: '#2E6BB8', border: '3px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>3</span>
        </div>
      </div>

      {/* Heading */}
      <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', margin: '0 0 10px', textAlign: 'center' }}>
        Stay in the loop
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 32px', textAlign: 'center', lineHeight: 1.6, maxWidth: 300 }}>
        Enable notifications so you never miss a payment window or booking update via WhatsApp and push.
      </p>

      {/* Benefits */}
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
        {BENEFITS.map(({ icon: Icon, label, desc }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} color="var(--primary)" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{label}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          className="pwa-btn pwa-btn-primary pwa-btn-block pwa-btn-lg"
          onClick={handleEnable}
        >
          <Bell size={17} /> Enable Notifications
        </button>
        <button
          className="pwa-btn pwa-btn-ghost pwa-btn-block"
          onClick={() => router.push('/login')}
          style={{ color: 'var(--text-3)', fontSize: 13 }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
