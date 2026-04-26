'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Leaf, BarChart2, Users, MapPin } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl"
        >
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pending Approval</h2>
          <p className="text-gray-500 leading-relaxed mb-8 text-sm">
            Your account is under review by the Super Admin. You'll be able to sign in once approved.
          </p>
          <button
            onClick={() => setIsPending(false)}
            className="text-green-600 font-semibold hover:text-green-700 text-sm"
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
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-green-950 via-green-900 to-emerald-700 flex-col justify-between p-14 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full bg-green-800/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute top-1/2 -right-12 w-52 h-52 rounded-full bg-green-700/20 blur-2xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-400 rounded-xl flex items-center justify-center shadow-lg">
            <Leaf className="w-5 h-5 text-green-900" strokeWidth={2.5} />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">SafariPro</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your safari<br />business smarter.
          </h2>
          <p className="text-green-200 text-base leading-relaxed max-w-xs">
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
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-green-200" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-green-300 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 lg:bg-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
              <Leaf className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <p className="font-bold text-gray-900 text-xl">SafariPro</p>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to continue to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 pr-12 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors"
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-7">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-green-600 hover:text-green-700 font-semibold">
              Create account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
