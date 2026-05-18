'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Loader2, Search, Timer, Zap, ArrowLeft, Heart, Star, MapPin } from 'lucide-react';
import { MealPreferences } from '@/components/booking/MealPreferences';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { PickupResult } from '@/components/booking/PickupSelector';

const PickupSelector = dynamic(
  () => import('@/components/booking/PickupSelector').then((m) => ({ default: m.PickupSelector })),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center text-gray-400 text-sm">
        Loading map…
      </div>
    ),
  },
);

interface JeepData {
  id: string;
  safariDate: string;
  safariType: string;
  pricePerSeat: number;
  status: string;
  bookings: { seatNumber: number; status: string }[];
  owner: { companyName: string };
}

const STEPS = ['Select Seats', 'Your Details', 'Pickup Details', 'Extras', 'Confirm'];

const TAKEN_STATUSES = ['PAID', 'CONFIRMED', 'RESERVED', 'PAYMENT_PENDING'];

export default function BookingSeatPage() {
  const params = useParams();
  const token = params.linkId as string;

  const [step, setStep] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [holdDeadline, setHoldDeadline] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [pickupResult, setPickupResult] = useState<PickupResult | null>(null);
  const [mealData, setMealData] = useState({
    mealIncluded: false, mealTypes: [] as string[], dietaryReqs: [] as string[], allergies: '',
  });
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [cameraNeeded, setCameraNeeded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);

  const { data, isLoading } = useQuery<{ data: JeepData }>({
    queryKey: ['jeep-by-token', token],
    queryFn: () => api.get(`/shared-safari/link/${token}`).then((r) => r.data),
    enabled: !!token,
  });

  const jeep = data?.data;

  const takenSeats = jeep
    ? jeep.bookings.filter((b) => TAKEN_STATUSES.includes(b.status)).map((b) => b.seatNumber)
    : [];

  // Countdown timer
  useEffect(() => {
    if (!holdDeadline) return;
    const interval = setInterval(() => {
      const diff = holdDeadline.getTime() - Date.now();
      if (diff <= 0) {
        setSelectedSeats([]);
        setHoldDeadline(null);
        setTimeLeft('');
        clearInterval(interval);
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [holdDeadline]);

  const toggleSeat = (num: number) => {
    if (takenSeats.includes(num)) return;
    setSelectedSeats((prev) => {
      const next = prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num];
      if (next.length > 0 && !holdDeadline) {
        setHoldDeadline(new Date(Date.now() + 15 * 60 * 1000));
      }
      if (next.length === 0) {
        setHoldDeadline(null);
        setTimeLeft('');
      }
      return next;
    });
  };

  const basePrice = jeep ? parseFloat(String(jeep.pricePerSeat)) : 0;
  const seatCount = selectedSeats.length;
  const mealPrice = mealData.mealIncluded ? 500 * seatCount : 0;
  const cameraPrice = cameraNeeded ? 1500 : 0;
  const total = basePrice * seatCount + mealPrice + cameraPrice;

  const handleConfirm = async () => {
    if (!jeep || selectedSeats.length === 0 || !pickupResult?.isValid) return;
    setIsSubmitting(true);
    try {
      await api.post('/shared-safari/reserve-guest', {
        jeepId: jeep.id,
        seatNumbers: selectedSeats,
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        pickupLocation: pickupResult.address || 'Map pin',
        pickupLat: pickupResult.lat,
        pickupLng: pickupResult.lng,
        pickupTime: pickupResult.time || '5:45 AM',
        ...mealData,
        cameraNeeded,
      });
      setBookingDone(true);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as any).response?.data?.error
        : 'Reservation failed. Please try again.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-800 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 text-emerald-300 animate-spin mx-auto mb-4" />
          <p className="text-emerald-200">Loading safari...</p>
        </div>
      </div>
    );
  }

  if (!jeep) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">Booking link not found or expired.</p>
        </div>
      </div>
    );
  }

  if (bookingDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-800 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">You're all set!</h2>
          <p className="text-gray-500 text-sm mb-4">
            {seatCount} seat{seatCount !== 1 ? 's' : ''} reserved on <strong>{jeep.safariType}</strong>.
          </p>
          <div className="bg-emerald-50 rounded-xl p-4 text-sm text-emerald-800 text-left mb-6">
            <p className="font-medium mb-1">What happens next?</p>
            <p>You'll receive a WhatsApp message with your payment link shortly. The safari confirms once 4+ seats are paid.</p>
          </div>
          <p className="text-xs text-gray-400">You can close this page.</p>
        </motion.div>
      </div>
    );
  }

  const paidCount = jeep.bookings.filter((b) => b.status === 'PAID' || b.status === 'CONFIRMED').length;
  const needed = Math.max(0, 4 - paidCount);
  const safariDate = new Date(jeep.safariDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const paidSeats = jeep.bookings.filter((b) => ['PAID','CONFIRMED','PAYMENT_PENDING'].includes(b.status)).length;
  const reservedOnlySeats = jeep.bookings.filter((b) => b.status === 'RESERVED').length;
  const totalSeats = 6;
  const openSeats = totalSeats - paidSeats - reservedOnlySeats;
  const paidPct = (paidSeats / totalSeats) * 100;
  const resvPct = (reservedOnlySeats / totalSeats) * 100;
  const minPct = (4 / totalSeats) * 100;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: step === 0 ? 80 : 0 }}>
      {/* ── Animated hero ── */}
      <div className={`safari-thumb alt-${(jeep.id.charCodeAt(0) % 4)}`} style={{ height: 240, borderRadius: 0 }}>
        <div className="sun" />
        <div className="terrain" />
        <div className="silhouette">
          <div style={{ width: 8, height: 32 }} />
          <div style={{ width: 14, height: 48 }} />
          <div style={{ width: 6, height: 22 }} />
          <div style={{ width: 10, height: 38 }} />
          <div style={{ width: 5, height: 18 }} />
        </div>
        {/* Top buttons */}
        <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 3, display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={() => history.back()}
            style={{ width: 36, height: 36, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
          >
            <ArrowLeft size={16} color="#fff" />
          </button>
          <button
            style={{ width: 36, height: 36, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
          >
            <Heart size={15} color="#fff" />
          </button>
        </div>
        {/* Bottom badges */}
        <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, zIndex: 3, display: 'flex', gap: 6 }}>
          <span style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, backdropFilter: 'blur(4px)' }}>
            ⭐ 4.8
          </span>
          <span style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, backdropFilter: 'blur(4px)' }}>
            {jeep.safariType}
          </span>
          <span style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, backdropFilter: 'blur(4px)', fontFamily: 'monospace' }}>
            {new Date(jeep.safariDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px 24px' }}>
        {/* ── Occupancy panel ── */}
        <div className="pwa-card pwa-card-pad" style={{ marginTop: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>
              {jeep.owner.companyName}
            </p>
            <span className={`pwa-badge ${jeep.status === 'CONFIRMED' ? 'pwa-badge-green' : jeep.status === 'PENDING_PAYMENT' ? 'pwa-badge-amber' : 'pwa-badge-gray'}`}>
              {jeep.status}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 12px' }}>{safariDate}</p>
          <div className="occ-bar">
            <div className="fill">
              <div className="paid" style={{ width: `${paidPct}%` }} />
              <div className="reserved" style={{ width: `${resvPct}%` }} />
            </div>
            <div className="min-mark" style={{ left: `${minPct}%` }} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '4px 0 0' }}>
            {paidSeats} paid · {reservedOnlySeats} reserved · {openSeats} open
            {needed > 0 && <> · <strong style={{ color: 'var(--brown)' }}>{needed} more to trigger payment</strong></>}
          </p>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 mb-4">
          <div className="flex gap-1.5 mb-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  i < step ? 'bg-green-500' : i === step ? 'bg-green-400' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500">{STEPS[step]} <span className="text-gray-300">· Step {step + 1} of {STEPS.length}</span></p>
        </div>

        <AnimatePresence mode="wait">
          {/* ======== STEP 0: SEAT SELECTION ======== */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl shadow-sm border p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900">Select Your Seats</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Tap any green seat to add it to your booking</p>
                </div>
                {selectedSeats.length > 0 && (
                  <div className="text-right">
                    <span className="text-sm font-bold text-green-700">{selectedSeats.length} selected</span>
                    {timeLeft && (
                      <p className="text-xs text-amber-600 font-medium mt-0.5 flex items-center gap-1 justify-end">
                        <Timer className="w-3 h-3" />{timeLeft}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Hold timer banner */}
              {selectedSeats.length > 0 && timeLeft && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5"
                >
                  <span className="text-amber-700 text-sm">
                    {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} held for
                  </span>
                  <span className="text-amber-700 font-bold text-base tabular-nums">{timeLeft}</span>
                </motion.div>
              )}

              {needed > 0 && (
                <div className="mb-4 px-3 py-2 bg-orange-50 border border-orange-100 rounded-lg">
                  <p className="text-xs text-orange-600 flex items-center gap-1.5"><Zap className="w-3 h-3" />{needed} more booking{needed !== 1 ? 's' : ''} needed to confirm this safari</p>
                </div>
              )}

              {/* Seat map */}
              <div className="seat-map" style={{ marginBottom: 16 }}>
                <div className="seat-jeep">
                  {/* Driver row */}
                  <div className="seat driver" style={{ gridColumn: '1 / 3' }}>🚗 DRV</div>
                  <div className="seat-spacer" />
                  <div style={{ gridColumn: '4 / 6' }} />

                  {/* Passenger rows A, B, C */}
                  {([['A1','A2',1,2],['B1','B2',3,4],['C1','C2',5,6]] as [string,string,number,number][]).map(([lLabel,rLabel,lNum,rNum]) => {
                    const lTaken = takenSeats.includes(lNum);
                    const rTaken = takenSeats.includes(rNum);
                    const lSel = selectedSeats.includes(lNum);
                    const rSel = selectedSeats.includes(rNum);
                    return [
                      <button
                        key={lLabel}
                        className={`seat${lTaken ? ' taken' : lSel ? ' selected' : ''}`}
                        onClick={() => toggleSeat(lNum)}
                        disabled={lTaken}
                      >{lLabel}</button>,
                      <div key={`sp-l-${lLabel}`} className="seat-spacer" />,
                      <div key={`aisle-${lLabel}`} className="seat-spacer" />,
                      <button
                        key={rLabel}
                        className={`seat${rTaken ? ' taken' : rSel ? ' selected' : ''}`}
                        onClick={() => toggleSeat(rNum)}
                        disabled={rTaken}
                      >{rLabel}</button>,
                      <div key={`sp-r-${rLabel}`} className="seat-spacer" />,
                    ];
                  })}
                </div>
                <div className="seat-legend">
                  <span><span className="sw" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }} />Available</span>
                  <span><span className="sw" style={{ background: 'var(--primary)' }} />Your pick</span>
                  <span><span className="sw" style={{ background: '#E5E0D5' }} />Taken</span>
                </div>
              </div>

              {/* Selected seats summary */}
              {selectedSeats.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl"
                >
                  <p className="text-sm text-green-800">
                    <span className="font-semibold">Seats {selectedSeats.sort((a, b) => a - b).join(', ')}</span>
                    {' · '}
                    {formatCurrency(basePrice * seatCount)} total
                  </p>
                </motion.div>
              )}

              <div style={{ height: 8 }} />
            </motion.div>
          )}

          {/* ======== STEP 1: YOUR DETAILS ======== */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl shadow-sm border p-5 space-y-4"
            >
              <div>
                <h2 className="font-bold text-gray-900">Your Details</h2>
                <p className="text-xs text-gray-400 mt-0.5">So the safari operator can confirm your booking via WhatsApp</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Kamal Perera"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp Number <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +94 77 123 4567"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Payment link will be sent to this number</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. kamal@example.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  disabled={!customerName.trim() || !customerPhone.trim()}
                  onClick={() => setStep(2)}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {/* ======== STEP 2: PICKUP LOCATION ======== */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl shadow-sm border p-5 space-y-4"
            >
              <div>
                <h2 className="font-bold text-gray-900">Pickup Location</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Search for your hotel or tap the map — must be within 7 km of base
                </p>
              </div>

              <PickupSelector onSelect={setPickupResult} initialTime="5:45 AM" />

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  disabled={!pickupResult?.isValid}
                  onClick={() => setStep(3)}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  {pickupResult && !pickupResult.isValid
                    ? 'Location out of range'
                    : !pickupResult
                    ? 'Pin a location first'
                    : 'Next →'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ======== STEP 3: EXTRAS ======== */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl shadow-sm border p-5 space-y-5"
            >
              <div>
                <h2 className="font-bold text-gray-900">Add-ons</h2>
                <p className="text-xs text-gray-400 mt-0.5">Optional extras for your safari</p>
              </div>

              <MealPreferences onUpdate={setMealData} />

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Camera Rental</p>
                  <p className="text-xs text-gray-400">Professional DSLR · +LKR 1,500</p>
                </div>
                <button
                  onClick={() => setCameraNeeded(!cameraNeeded)}
                  className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 relative ${cameraNeeded ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${cameraNeeded ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  ← Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  Review →
                </button>
              </div>
            </motion.div>
          )}

          {/* ======== STEP 4: CONFIRM ======== */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl shadow-sm border p-5 space-y-4"
            >
              <div>
                <h2 className="font-bold text-gray-900">Confirm Booking</h2>
                <p className="text-xs text-gray-400 mt-0.5">Review your details before reserving</p>
              </div>

              {/* Summary */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Details</div>
                <div className="divide-y divide-gray-100 text-sm">
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-gray-600">Name</span>
                    <span className="font-medium text-gray-900">{customerName}</span>
                  </div>
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-gray-600">WhatsApp</span>
                    <span className="font-medium text-gray-900">{customerPhone}</span>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Safari</div>
                <div className="divide-y divide-gray-100 text-sm">
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-gray-600">Date</span>
                    <span className="font-medium text-gray-900">{new Date(jeep.safariDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium text-gray-900">{jeep.safariType}</span>
                  </div>
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-gray-600">Seats</span>
                    <span className="font-medium text-gray-900">
                      #{selectedSeats.sort((a, b) => a - b).join(', #')}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-gray-600">Pickup</span>
                    <span className="font-medium text-gray-900 text-right max-w-48 truncate">
                      {pickupResult?.address
                        ? pickupResult.address.split(',')[0]
                        : `${pickupResult?.lat?.toFixed(5)}, ${pickupResult?.lng?.toFixed(5)}`}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-gray-600">Pickup time</span>
                    <span className="font-medium text-gray-900">{pickupResult?.time}</span>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pricing</div>
                <div className="divide-y divide-gray-100 text-sm">
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-gray-600">{seatCount} × Seat</span>
                    <span className="font-medium">{formatCurrency(basePrice * seatCount)}</span>
                  </div>
                  {mealData.mealIncluded && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-gray-600">{seatCount} × Meal</span>
                      <span className="font-medium">{formatCurrency(mealPrice)}</span>
                    </div>
                  )}
                  {cameraNeeded && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-gray-600">Camera Rental</span>
                      <span className="font-medium">{formatCurrency(cameraPrice)}</span>
                    </div>
                  )}
                  <div className="flex justify-between px-4 py-3.5 bg-green-50">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-green-700 text-base">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
                <p className="font-semibold mb-1">Important Notice</p>
                <p>Reserving is free — no payment now. Once 4+ seats are reserved, you'll receive a WhatsApp payment link. Safari is confirmed only after payment.</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(3)} className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  ← Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="flex-[2] bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  {isSubmitting
                    ? 'Reserving...'
                    : `Reserve ${seatCount} Seat${seatCount > 1 ? 's' : ''} — FREE`}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Fixed reserve footer (seat step only) ── */}
      {step === 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
          background: '#fff', borderTop: '1px solid var(--line)',
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>Pay later</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
              {formatCurrency(basePrice * Math.max(1, seatCount))}
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)' }}> / seat</span>
            </p>
          </div>
          <button
            disabled={selectedSeats.length === 0}
            onClick={() => setStep(1)}
            className="pwa-btn pwa-btn-primary pwa-btn-lg"
            style={{ flexShrink: 0 }}
          >
            {selectedSeats.length === 0
              ? 'Select a seat'
              : `Reserve ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} →`}
          </button>
        </div>
      )}
    </main>
  );
}
