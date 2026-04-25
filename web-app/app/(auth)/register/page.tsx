'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  password: z.string().min(8, 'Minimum 8 characters'),
  role: z.enum(['VENDOR', 'SAFARI_OWNER']),
  vendorType: z.string().optional(),
  businessName: z.string().optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const VENDOR_TYPES = [
  { value: 'JEEP_PROVIDER', label: 'Jeep Provider' },
  { value: 'GUIDE', label: 'Safari Guide' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'ACCOMMODATION', label: 'Accommodation' },
  { value: 'CAMERA_RENTAL', label: 'Camera Rental' },
  { value: 'OTHER', label: 'Other' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'SAFARI_OWNER' },
  });

  const role = watch('role');

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await api.post('/auth/register', data);
      const { user } = res.data.data;
      localStorage.setItem('pendingUser', JSON.stringify({ name: user.name, email: user.email, role: user.role }));
      router.push('/pending');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as any).response?.data?.error
        : 'Registration failed';
      setError(msg || 'Registration failed');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-800 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌿</div>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-sm text-gray-500 mt-1">Join as a Safari Owner or Vendor</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Account type</Label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {[
                { value: 'SAFARI_OWNER', label: 'Safari Owner', icon: '🏢', desc: 'Run safari tours' },
                { value: 'VENDOR', label: 'Vendor', icon: '🔧', desc: 'Provide services' },
              ].map((opt) => (
                <label key={opt.value} className="cursor-pointer">
                  <input type="radio" value={opt.value} {...register('role')} className="sr-only" />
                  <div className={`p-4 border-2 rounded-xl text-center text-sm transition-all ${
                    role === opt.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="text-2xl mb-1">{opt.icon}</div>
                    <div className="font-semibold text-gray-800">{opt.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" className="mt-1" placeholder="John Doe" {...register('name')} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" className="mt-1" placeholder="you@example.com" {...register('email')} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" className="mt-1" placeholder="+94771234567" {...register('phone')} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" className="mt-1" placeholder="Min. 8 characters" {...register('password')} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {role === 'VENDOR' && (
            <>
              <div>
                <Label>Vendor Type</Label>
                <select {...register('vendorType')} className="mt-1 w-full h-10 rounded-md border px-3 text-sm bg-white">
                  <option value="">Select type...</option>
                  {VENDOR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" className="mt-1" placeholder="My Safari Services Ltd." {...register('businessName')} />
              </div>
            </>
          )}

          {role === 'SAFARI_OWNER' && (
            <>
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" className="mt-1" placeholder="Safari Adventures Ltd." {...register('companyName')} />
              </div>
              <div>
                <Label htmlFor="companyAddress">Company Address</Label>
                <Input id="companyAddress" className="mt-1" placeholder="No. 1, Safari Road, Yala" {...register('companyAddress')} />
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">Sign in</Link>
        </p>
      </motion.div>
    </main>
  );
}
