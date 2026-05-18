import Link from 'next/link';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#FAFAF7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      {/* Safari SVG illustration */}
      <div style={{ marginBottom: 32 }}>
        <svg viewBox="0 0 180 140" width="180" height="140">
          <rect width="180" height="100" fill="#E1F2FA" rx="14" />
          <circle cx="135" cy="35" r="14" fill="#FFE8A6" opacity="0.7" />
          <ellipse cx="40" cy="105" rx="60" ry="22" fill="#94A89A" />
          <ellipse cx="120" cy="110" rx="80" ry="28" fill="#5B7C58" />
          <rect y="100" width="180" height="40" fill="#5B7C58" rx="14" />
          <rect x="40" y="76" width="3" height="22" fill="#3A2818" />
          <circle cx="41.5" cy="74" r="12" fill="#3F5C3D" />
          <line x1="20" y1="20" x2="160" y2="120" stroke="#C0392B" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        </svg>
      </div>

      <div style={{ width: 64, height: 64, borderRadius: 20, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <WifiOff size={28} color="#991B1B" />
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em', color: '#1A1A1A' }}>You&apos;re offline</h1>
      <p style={{ fontSize: 14, color: '#555', margin: '0 0 28px', lineHeight: 1.55, maxWidth: 280 }}>
        We&apos;ve saved your last view. Reconnect to sync new bookings and payments.
      </p>

      <div style={{ padding: '10px 16px', background: '#fff', border: '1px solid #E8E5DE', borderRadius: 10, fontSize: 12, color: '#8A8A8A', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 8 }}>
        <RefreshCw size={13} />
        Last synced a few minutes ago
      </div>

      <Link href="/" className="pwa-btn pwa-btn-primary pwa-btn-lg pwa-btn-block" style={{ maxWidth: 300, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <RefreshCw size={16} /> Retry connection
      </Link>
    </main>
  );
}
