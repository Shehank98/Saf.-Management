'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, MapPin, Briefcase, Download, X, Search } from 'lucide-react';

const TRENDING = [
  {
    id: 1,
    name: 'Yala Full Day Safari',
    location: 'Yala National Park',
    time: '6:00 AM – 6:00 PM',
    price: 4500,
    paid: 3,
    reserved: 1,
    total: 6,
    alt: 0,
  },
  {
    id: 2,
    name: 'Udawalawe Morning Safari',
    location: 'Udawalawe NP',
    time: '6:00 AM – 12:00 PM',
    price: 2800,
    paid: 2,
    reserved: 0,
    total: 6,
    alt: 2,
  },
];

function StaticSafariCard({ s, idx }: { s: typeof TRENDING[0]; idx: number }) {
  const open = s.total - s.paid - s.reserved;
  const paidPct = (s.paid / s.total) * 100;
  const resvPct = (s.reserved / s.total) * 100;
  const minPct = (4 / s.total) * 100;

  return (
    <div className="safari-card" style={{ minWidth: 220, flex: '0 0 220px' }}>
      <div className={`safari-thumb alt-${s.alt}`}>
        <div className="sun" />
        <div className="terrain" />
        <div className="silhouette">
          <div style={{ width: 8, height: 28 }} />
          <div style={{ width: 12, height: 40 }} />
          <div style={{ width: 6, height: 20 }} />
          <div style={{ width: 10, height: 35 }} />
        </div>
      </div>
      <div className="safari-card-body">
        <p className="safari-card-title">{s.name}</p>
        <div className="safari-card-meta">
          <MapPin size={11} />
          {s.location}
          <span>·</span>
          {s.time}
        </div>
        <div className="occ-bar">
          <div className="fill">
            <div className="paid" style={{ width: `${paidPct}%` }} />
            <div className="reserved" style={{ width: `${resvPct}%` }} />
          </div>
          <div className="min-mark" style={{ left: `${minPct}%` }} />
        </div>
        <div className="safari-card-footer">
          <span className="price">
            LKR {s.price.toLocaleString()}<small>/seat</small>
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
            {open} open
          </span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installBanner, setInstallBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setInstallBanner(false);
    setInstallPrompt(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Hero ── */}
      <div className="hero" style={{ height: 'auto', padding: '56px 20px 28px', marginBottom: 0 }}>
        {/* Brand mark */}
        <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, fontWeight: 600, fontSize: 13, color: '#fff' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Compass size={16} color="#fff" />
          </div>
          Safari Adventures
        </div>

        <div className="hero-content">
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1, color: '#fff', margin: '0 0 10px' }}>
            Your next wildlife<br />adventure awaits
          </h1>
          <p className="tag">Book seats, manage vendors, and track revenue across every park in Sri Lanka.</p>

          {/* Search bar */}
          <div className="hero-search">
            <div className="field-grow">
              <small>Where do you want to go?</small>
              <strong>Yala, Udawalawe, Wilpattu…</strong>
            </div>
            <button onClick={() => router.push('/book')}>
              <Search size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: '20px 16px 100px' }}>

        {/* Trending parks */}
        <div className="section-head" style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>Trending parks</h2>
          <a href="/book" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>See all →</a>
        </div>

        <div className="chips" style={{ paddingBottom: 0, gap: 12, marginBottom: 20 }}>
          {TRENDING.map((s, i) => (
            <StaticSafariCard key={s.id} s={s} idx={i} />
          ))}
        </div>

        {/* Operator CTA */}
        <div className="pwa-card pwa-card-pad" style={{ background: 'var(--sand-soft)', border: '1px solid #F4E1C1', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(139,94,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Briefcase size={18} color="var(--brown)" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: 0 }}>Run a safari business?</p>
              <p style={{ fontSize: 12, color: 'var(--brown)', margin: 0 }}>Join as an operator or guide</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/login" className="pwa-btn pwa-btn-brown" style={{ flex: 1, fontSize: 13 }}>
              Owner Login
            </a>
            <a href="/register" className="pwa-btn pwa-btn-secondary" style={{ flex: 1, fontSize: 13 }}>
              Join as Vendor
            </a>
          </div>
        </div>

        {/* How it works */}
        <div className="pwa-card pwa-card-pad" style={{ background: '#F0F7F4', border: '1px solid #C6DDD1', marginBottom: 20 }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', margin: '0 0 6px' }}>How shared safaris work</p>
          <p style={{ fontSize: 12, color: '#2D5C44', margin: 0, lineHeight: 1.6 }}>
            Reserve a seat free. Once 4 seats are filled, everyone gets a WhatsApp payment link with 48 h to confirm. No payment until the group is complete.
          </p>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingTop: 4 }}>
          <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>
            <a href="#" style={{ color: 'var(--text-3)', marginRight: 10 }}>About</a>
            <a href="#" style={{ color: 'var(--text-3)', marginRight: 10 }}>Safety</a>
            <a href="#" style={{ color: 'var(--text-3)', marginRight: 10 }}>Help</a>
            <a href="#" style={{ color: 'var(--text-3)' }}>Privacy</a>
          </p>
        </div>
      </div>

      {/* ── PWA Install Banner ── */}
      {installBanner && !installed && (
        <div className="pwa-install-banner">
          <div className="ico">
            <Compass size={20} color="#A8D5BC" />
          </div>
          <div className="copy">
            <strong>Add to Home Screen</strong>
            <span>Install for faster access, works offline</span>
          </div>
          <button
            onClick={handleInstall}
            style={{ background: 'var(--primary)', border: 'none', borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            <Download size={14} /> Install
          </button>
          <button
            onClick={() => setInstallBanner(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 4, flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
