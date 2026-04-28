'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Leaf, Check, MapPin } from 'lucide-react';
import { api } from '@/lib/api';

const schema = z.object({
  name: z.string().min(2, 'Min 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Min 10 digits').max(15),
  password: z.string().min(8, 'Minimum 8 characters'),
  role: z.enum(['VENDOR', 'SAFARI_OWNER']),
  vendorType: z.string().optional(),
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
  taxId: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankBranch: z.string().optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const VENDOR_TYPES = [
  { value: 'JEEP_PROVIDER',  label: 'Jeep Provider',   icon: '🚙' },
  { value: 'GUIDE',          label: 'Safari Guide',     icon: '🧭' },
  { value: 'RESTAURANT',     label: 'Restaurant',       icon: '🍽️' },
  { value: 'ACCOMMODATION',  label: 'Accommodation',    icon: '🏨' },
  { value: 'CAMERA_RENTAL',  label: 'Camera Rental',    icon: '📷' },
  { value: 'OTHER',          label: 'Other',            icon: '📦' },
];

const STEP_LABELS = ['Account Type', 'Personal Info', 'Business', 'Locations'];

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, watch, trigger, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'SAFARI_OWNER' },
  });

  const role = watch('role');

  useEffect(() => {
    api.get('/auth/locations').then((r) => setLocations(r.data.data)).catch(() => {});
  }, []);

  const goNext = async () => {
    setError('');
    if (step === 0) {
      setDir(1); setStep(1); return;
    }
    if (step === 1) {
      const ok = await trigger(['name', 'email', 'phone', 'password']);
      if (!ok) return;
      setDir(1); setStep(2); return;
    }
    if (step === 2) {
      if (role === 'VENDOR') {
        if (!watch('vendorType')) { setError('Please select a service type.'); return; }
        if (!watch('businessName')?.trim()) { setError('Business name is required.'); return; }
      } else {
        if (!watch('companyName')?.trim()) { setError('Company name is required.'); return; }
        if (!watch('companyAddress')?.trim()) { setError('Company address is required.'); return; }
      }
      setDir(1); setStep(3); return;
    }
  };

  const goBack = () => {
    setError('');
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const toggleLocation = (id: string) => {
    setSelectedLocationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const onSubmit = async (data: FormData) => {
    setError('');
    if (selectedLocationIds.length === 0) {
      setError('Please select at least one location.');
      return;
    }
    try {
      const body: any = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role,
        locationIds: selectedLocationIds,
      };
      if (data.taxId?.trim()) body.taxId = data.taxId.trim();
      if (data.role === 'VENDOR') {
        body.vendorType = data.vendorType;
        body.businessName = data.businessName;
        if (data.businessAddress?.trim()) body.businessAddress = data.businessAddress.trim();
        if (data.bankName?.trim()) {
          body.bankDetails = {
            bankName: data.bankName.trim(),
            accountNumber: data.bankAccountNumber?.trim(),
            accountName: data.bankAccountName?.trim(),
            branch: data.bankBranch?.trim(),
          };
        }
      } else {
        body.companyName = data.companyName;
        body.companyAddress = data.companyAddress;
      }
      const res = await api.post('/auth/register', body);
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 py-10">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-sm">
          <Leaf className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-gray-900 text-lg">SafariPro</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Step indicator */}
        <div className="px-8 pt-7 pb-6 border-b border-gray-100">
          <div className="flex items-start">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-start flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    i < step
                      ? 'bg-green-600 text-white'
                      : i === step
                      ? 'bg-green-600 text-white ring-4 ring-green-100'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {i < step ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium text-center leading-tight ${
                    i === step ? 'text-green-700' : i < step ? 'text-gray-500' : 'text-gray-300'
                  }`}>
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1.5 mt-4 rounded-full transition-colors duration-300 ${
                    i < step ? 'bg-green-500' : 'bg-gray-100'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Animated content area */}
          <div className="px-8 py-7 min-h-[340px] relative overflow-hidden">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
              >
                {/* ── STEP 0: Account type ── */}
                {step === 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">What brings you here?</h2>
                    <p className="text-sm text-gray-500 mb-6">Choose how you'll use SafariPro</p>
                    <div className="space-y-3">
                      {[
                        {
                          value: 'SAFARI_OWNER',
                          icon: '🏕️',
                          label: 'Safari Owner',
                          desc: 'I run safari tours and want to manage bookings, vendors, and trips.',
                          fee: 'LKR 2,500 / month',
                        },
                        {
                          value: 'VENDOR',
                          icon: '🔧',
                          label: 'Service Provider',
                          desc: 'I provide jeeps, guiding, food, accommodation, or camera rentals.',
                          fee: null,
                        },
                      ].map((opt) => (
                        <label key={opt.value} className="cursor-pointer block">
                          <input type="radio" value={opt.value} {...register('role')} className="sr-only" />
                          <div className={`p-5 border-2 rounded-2xl transition-all ${
                            role === opt.value
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-150 bg-gray-50 hover:border-gray-300'
                          }`}>
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                                role === opt.value ? 'bg-green-100' : 'bg-white border border-gray-200'
                              }`}>
                                {opt.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <p className="font-semibold text-gray-900">{opt.label}</p>
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    role === opt.value ? 'border-green-600 bg-green-600' : 'border-gray-300'
                                  }`}>
                                    {role === opt.value && <div className="w-2 h-2 bg-white rounded-full" />}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-500">{opt.desc}</p>
                                {opt.fee && (
                                  <p className="text-xs text-orange-600 font-medium mt-1.5">
                                    Subscription: {opt.fee}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── STEP 1: Personal info ── */}
                {step === 1 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Personal information</h2>
                    <p className="text-sm text-gray-500 mb-6">Your login credentials for SafariPro</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                        <input
                          className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors"
                          placeholder="John Silva"
                          {...register('name')}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                          <input
                            type="email"
                            className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors"
                            placeholder="you@example.com"
                            {...register('email')}
                          />
                          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                          <input
                            className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors"
                            placeholder="+94771234567"
                            {...register('phone')}
                          />
                          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 pr-12 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors"
                            placeholder="Min. 8 characters"
                            {...register('password')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Business details ── */}
                {step === 2 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {role === 'VENDOR' ? 'Business details' : 'Company details'}
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">Tell us about your business</p>
                    <div className="space-y-4">
                      {role === 'VENDOR' ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Service type</label>
                            <div className="grid grid-cols-3 gap-2">
                              {VENDOR_TYPES.map((t) => (
                                <label key={t.value} className="cursor-pointer">
                                  <input type="radio" value={t.value} {...register('vendorType')} className="sr-only" />
                                  <div className={`p-3 border-2 rounded-xl text-center transition-all ${
                                    watch('vendorType') === t.value
                                      ? 'border-green-500 bg-green-50'
                                      : 'border-gray-150 bg-gray-50 hover:border-gray-300'
                                  }`}>
                                    <div className="text-xl mb-1">{t.icon}</div>
                                    <p className="text-xs font-medium text-gray-700 leading-tight">{t.label}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Business name</label>
                            <input
                              className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors"
                              placeholder="My Safari Services Ltd."
                              {...register('businessName')}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Business address
                              <span className="text-gray-400 font-normal ml-1 text-xs">(optional)</span>
                            </label>
                            <input
                              className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors"
                              placeholder="No. 1, Safari Road, Yala"
                              {...register('businessAddress')}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Company name</label>
                            <input
                              className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors"
                              placeholder="Safari Adventures Ltd."
                              {...register('companyName')}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Company address</label>
                            <input
                              className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors"
                              placeholder="No. 1, Safari Road, Yala"
                              {...register('companyAddress')}
                            />
                          </div>
                        </>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Tax ID / VAT number
                          <span className="text-gray-400 font-normal ml-1 text-xs">(optional)</span>
                        </label>
                        <input
                          className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors"
                          placeholder="VAT123456789"
                          {...register('taxId')}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Locations + extras ── */}
                {step === 3 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {role === 'SAFARI_OWNER' ? 'Operating locations' : 'Service locations'}
                    </h2>
                    <p className="text-sm text-gray-500 mb-5">
                      {role === 'SAFARI_OWNER'
                        ? 'Select all safari parks where you run tours'
                        : 'Select all locations where you provide your services'}
                    </p>

                    {locations.length === 0 ? (
                      <div className="flex items-center gap-2.5 text-gray-400 text-sm py-6">
                        <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                        Loading locations...
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {locations.map((loc) => {
                          const sel = selectedLocationIds.includes(loc.id);
                          return (
                            <button
                              key={loc.id}
                              type="button"
                              onClick={() => toggleLocation(loc.id)}
                              className={`p-3.5 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                                sel
                                  ? 'border-green-500 bg-green-50 text-green-900'
                                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  sel ? 'bg-green-600 border-green-600' : 'border-gray-300'
                                }`}>
                                  {sel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                </div>
                                <MapPin className={`w-3.5 h-3.5 shrink-0 ${sel ? 'text-green-600' : 'text-gray-400'}`} />
                                <span className="truncate">{loc.name}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {selectedLocationIds.length > 0 && (
                      <p className="text-xs text-green-600 font-medium mb-5">
                        {selectedLocationIds.length} location{selectedLocationIds.length !== 1 ? 's' : ''} selected
                      </p>
                    )}

                    {/* Bank details — vendor only */}
                    {role === 'VENDOR' && (
                      <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50 space-y-3 mt-4">
                        <div className="mb-1">
                          <p className="text-sm font-semibold text-gray-800">Bank details</p>
                          <p className="text-xs text-gray-400 mt-0.5">Optional — for receiving payments</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Bank name</label>
                            <input
                              className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="Bank of Ceylon"
                              {...register('bankName')}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Account number</label>
                            <input
                              className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="0123456789"
                              {...register('bankAccountNumber')}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Account name</label>
                            <input
                              className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="John Silva"
                              {...register('bankAccountName')}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
                            <input
                              className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="Colombo 03"
                              {...register('bankBranch')}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mt-5">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer navigation */}
          <div className="px-8 py-5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1.5"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-7 py-2.5 rounded-xl transition-colors"
              >
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold text-sm px-7 py-2.5 rounded-xl transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : 'Create account'}
              </button>
            )}
          </div>
        </form>
      </div>

      <p className="text-center text-sm text-gray-400 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-green-600 hover:text-green-700 font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
