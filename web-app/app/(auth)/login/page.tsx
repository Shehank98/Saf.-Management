'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Compass, AlertCircle, Clock, Download, X } from 'lucide-react';
import { loginUser } from '@/lib/auth';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

const ROLE_REDIRECTS: Record<string, string> = {
  SUPER_ADMIN:  '/admin/dashboard',
  SAFARI_OWNER: '/owner/dashboard',
  VENDOR:       '/vendor/dashboard',
  CUSTOMER:     '/book',
};

export default function LoginPage() {
  const router = useRouter();
  const [error, setError]               = useState('');
  const [isPending, setIsPending]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installBanner, setInstallBanner] = useState(false);
  const [installed, setInstalled]         = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Capture the browser install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // If already installed (standalone mode), hide banner
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

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

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const { user } = await loginUser(data.email, data.password);
      router.push(ROLE_REDIRECTS[user.role] || '/');
    } catch (err: unknown) {
      const status = err && typeof err === 'object' && 'response' in err
        ? (err as any).response?.status : null;
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as any).response?.data?.error : 'Login failed';
      if (status === 403 && msg?.toLowerCase().includes('pending')) {
        setIsPending(true);
      } else {
        setError(msg || 'Login failed');
      }
    }
  };

  if (isPending) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAF7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '40px 32px', maxWidth: 380, width: '100%', textAlign: 'center', border: '1px solid #E8E5DE', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
          <div style={{ width: 64, height: 64, background: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Clock style={{ width: 32, height: 32, color: '#D97706' }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 10px' }}>Pending Approval</h2>
          <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.6, margin: '0 0 28px' }}>
            Your account is under review. You&apos;ll be able to sign in once the Super Admin approves it.
          </p>
          <button onClick={() => setIsPending(false)} style={{ fontSize: 14, fontWeight: 600, color: '#2D6A4F', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAF7' }}>

      {/* ── Hero header ── */}
      <div style={{
        background: 'linear-gradient(160deg, #1A3D2B 0%, #2D6A4F 55%, #3D8A60 100%)',
        padding: '48px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -40, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

        <div style={{ position: 'relative', maxWidth: 400, margin: '0 auto' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.15)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Compass style={{ width: 22, height: 22, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Safari Adventures</span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
            Sign in to manage your safaris
          </p>
        </div>
      </div>

      {/* ── Form card (floats up over the hero) ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px 32px', marginTop: -40 }}>
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E8E5DE', boxShadow: '0 8px 32px rgba(0,0,0,0.10)', padding: '28px 24px', width: '100%', maxWidth: 400 }}>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 7 }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="pwa-input"
                style={{ width: '100%' }}
                {...register('email')}
              />
              {errors.email && (
                <p style={{ fontSize: 12, color: '#DC2626', marginTop: 5 }}>{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 7 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pwa-input"
                  style={{ width: '100%', paddingRight: 44 }}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8A8A8A', display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ fontSize: 12, color: '#DC2626', marginTop: 5 }}>{errors.password.message}</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }}>
                <AlertCircle style={{ width: 15, height: 15, color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#DC2626' }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="pwa-btn pwa-btn-primary pwa-btn-block pwa-btn-lg"
              style={{ marginTop: 4 }}
            >
              {isSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Divider + register */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #F0EDE6', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#6B6B6B', margin: 0 }}>
              Don&apos;t have an account?{' '}
              <a href="/register" style={{ color: '#2D6A4F', fontWeight: 700, textDecoration: 'none' }}>
                Create account
              </a>
            </p>
          </div>
        </div>

        {/* Install app button (only if prompt is available and not yet installed) */}
        {installBanner && !installed && (
          <div style={{
            marginTop: 16, width: '100%', maxWidth: 400,
            background: '#1A3D2B', borderRadius: 16,
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 4px 16px rgba(26,61,43,0.3)',
          }}>
            <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.12)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Compass style={{ width: 20, height: 20, color: '#A8D5BC' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>Add to Home Screen</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Install for faster access, works offline</p>
            </div>
            <button
              onClick={handleInstall}
              style={{ background: '#2D6A4F', border: 'none', borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
            >
              <Download style={{ width: 14, height: 14 }} /> Install
            </button>
            <button
              onClick={() => setInstallBanner(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', flexShrink: 0, padding: 4 }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        )}

        {/* iOS instructions (Safari doesn't fire beforeinstallprompt) */}
        {!installPrompt && !installed && (
          <div style={{ marginTop: 16, width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#9A9A9A', margin: 0 }}>
              On iPhone? Tap <strong style={{ color: '#555' }}>Share ↑</strong> → <strong style={{ color: '#555' }}>Add to Home Screen</strong>
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
