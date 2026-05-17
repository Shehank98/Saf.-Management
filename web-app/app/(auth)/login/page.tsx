'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Compass, BarChart2, Users, MapPin, Clock, AlertCircle } from 'lucide-react';
import { loginUser } from '@/lib/auth';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

const ROLE_REDIRECTS: Record<string, string> = {
  SUPER_ADMIN: '/admin/dashboard',
  SAFARI_OWNER: '/owner/dashboard',
  VENDOR: '/vendor/dashboard',
  CUSTOMER: '/book',
};

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#FAFAF7' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[20px] p-10 max-w-md w-full text-center"
          style={{ border: '1px solid #E8E5DE', boxShadow: '0 6px 18px rgba(28,38,32,0.06), 0 1px 2px rgba(20,20,20,0.04)' }}
        >
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Pending Approval</h2>
          <p className="leading-relaxed mb-8 text-sm" style={{ color: '#555555' }}>
            Your account is under review by the Super Admin. You'll be able to sign in once approved.
          </p>
          <button
            onClick={() => setIsPending(false)}
            className="text-sm font-semibold transition-colors"
            style={{ color: '#2D6A4F' }}
          >
            ← Back to sign in
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-14 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1F4F3A 0%, #2D6A4F 60%, #3D7A5F 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(45,106,79,0.4)' }} />
        <div className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(61,122,95,0.25)' }} />
        <div className="absolute top-1/2 -right-12 w-52 h-52 rounded-full blur-2xl" style={{ background: 'rgba(31,79,58,0.2)' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: '#2D6A4F', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Compass className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">SafariPro</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your safari<br />business smarter.
          </h2>
          <p className="text-base leading-relaxed max-w-xs" style={{ color: '#A8D5BC' }}>
            The complete platform for safari operators, service vendors, and guides across Sri Lanka.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-4">
          {[
            { Icon: MapPin,    title: 'Shared & Private Safaris', desc: 'Manage all your trips in one place' },
            { Icon: Users,     title: 'Vendor Network',           desc: 'Jeeps, guides, food & accommodation' },
            { Icon: BarChart2, title: 'Analytics & Reports',      desc: 'Track revenue and performance' },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4">
              <div className="w-10 h-10 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Icon className="w-5 h-5" style={{ color: '#A8D5BC' }} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-xs" style={{ color: '#A8D5BC' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6" style={{ background: '#FAFAF7' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo + card wrapper */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md" style={{ background: '#2D6A4F' }}>
              <Compass className="w-7 h-7 text-white" strokeWidth={2} />
            </div>
            <p className="font-bold text-xl" style={{ color: '#1A1A1A' }}>SafariPro</p>
          </div>

          {/* Mobile card shell */}
          <div className="lg:p-0 p-6 rounded-[20px] bg-white lg:bg-transparent lg:border-0 lg:shadow-none" style={{ border: '1px solid #E8E5DE', boxShadow: '0 6px 18px rgba(28,38,32,0.06), 0 1px 2px rgba(20,20,20,0.04)' }}>
            <div className="mb-8">
              <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Welcome back</h1>
              <p className="text-sm mt-1" style={{ color: '#555555' }}>Sign in to continue to your dashboard</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: '#555555' }}>
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full h-11 rounded-[10px] px-4 text-sm outline-none transition-colors"
                  style={{ border: '1.5px solid #E8E5DE', background: '#FAFAF7', color: '#1A1A1A' }}
                  placeholder="you@example.com"
                  onFocus={e => { e.target.style.borderColor = '#2D6A4F'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = '#E8E5DE'; e.target.style.background = '#FAFAF7'; }}
                  {...register('email')}
                />
                {errors.email && <p className="text-xs mt-1.5" style={{ color: '#C0392B' }}>{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: '#555555' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full h-11 rounded-[10px] px-4 pr-12 text-sm outline-none transition-colors"
                    style={{ border: '1.5px solid #E8E5DE', background: '#FAFAF7', color: '#1A1A1A' }}
                    placeholder="••••••••"
                    onFocus={e => { e.target.style.borderColor = '#2D6A4F'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#E8E5DE'; e.target.style.background = '#FAFAF7'; }}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#8A8A8A' }}
                  >
                    {showPassword
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs mt-1.5" style={{ color: '#C0392B' }}>{errors.password.message}</p>}
              </div>

              {error && (
                <div className="flex items-start gap-3 text-sm rounded-[10px] px-4 py-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#C0392B' }}>
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 text-white font-semibold rounded-[14px] transition-colors text-sm flex items-center justify-center gap-2"
                style={{ background: isSubmitting ? '#2D6A4F' : '#2D6A4F', opacity: isSubmitting ? 0.7 : 1 }}
                onMouseEnter={e => { if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.background = '#1F4F3A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2D6A4F'; }}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
            </form>

            <p className="text-center text-sm mt-7" style={{ color: '#555555' }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold" style={{ color: '#2D6A4F' }}>
                Create account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
