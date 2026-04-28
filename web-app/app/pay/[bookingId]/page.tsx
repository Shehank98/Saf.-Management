'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Search, CheckCircle2, Timer, AlertCircle, Lock } from 'lucide-react';

const STRIPE_JS_URL = 'https://js.stripe.com/v3/';

async function loadStripeJs(): Promise<(key: string) => any> {
  const win = window as any;
  if (win.Stripe) return win.Stripe;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = STRIPE_JS_URL;
    s.onload = () => resolve(win.Stripe);
    s.onerror = () => reject(new Error('Failed to load Stripe.js'));
    document.head.appendChild(s);
  });
}

interface BookingData {
  id: string;
  seatNumber: number;
  totalAmount: string;
  basePrice: string;
  mealPrice: string;
  cameraRental: string;
  status: string;
  pickupLocation: string;
  pickupTime: string;
  paymentDeadline: string | null;
  jeep: { safariDate: string; safariType: string; owner: { companyName: string } };
  customer: { user: { name: string; phone: string } };
}

type PayState = 'idle' | 'loading' | 'ready' | 'paying' | 'success' | 'error';

export default function PayPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loadError, setLoadError] = useState('');
  const [payState, setPayState] = useState<PayState>('idle');
  const [payError, setPayError] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  const stripeRef = useRef<any>(null);
  const cardRef = useRef<any>(null);
  const cardDivRef = useRef<HTMLDivElement>(null);
  const clientSecretRef = useRef('');

  // Fetch booking
  useEffect(() => {
    if (!bookingId) return;
    api.get(`/shared-safari/booking/${bookingId}`)
      .then((r) => setBooking(r.data.data))
      .catch(() => setLoadError('Booking not found or link has expired.'));
  }, [bookingId]);

  // Countdown timer
  useEffect(() => {
    if (!booking?.paymentDeadline) return;
    const deadline = new Date(booking.paymentDeadline);
    const tick = () => {
      const ms = deadline.getTime() - Date.now();
      if (ms <= 0) { setTimeLeft('Expired'); return; }
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1_000);
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking]);

  // Init Stripe once booking is loaded and status is PAYMENT_PENDING
  useEffect(() => {
    if (!booking || booking.status !== 'PAYMENT_PENDING') return;
    setPayState('loading');

    (async () => {
      try {
        const intentRes = await api.post(`/payments/public-intent/${bookingId}`);
        clientSecretRef.current = intentRes.data.data.clientSecret;

        const Stripe = await loadStripeJs();
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
        stripeRef.current = Stripe(publishableKey);
        const elements = stripeRef.current.elements();
        cardRef.current = elements.create('card', {
          hidePostalCode: true,
          style: {
            base: {
              fontSize: '16px',
              color: '#111827',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              '::placeholder': { color: '#9CA3AF' },
            },
            invalid: { color: '#EF4444' },
          },
        });
        if (cardDivRef.current) {
          cardRef.current.mount(cardDivRef.current);
          setPayState('ready');
        }
      } catch {
        setPayState('error');
        setPayError('Could not load the payment form. Please refresh and try again.');
      }
    })();

    return () => { try { cardRef.current?.unmount(); } catch { /* ignore */ } };
  }, [booking, bookingId]);

  const handlePay = async () => {
    if (!stripeRef.current || !cardRef.current || !clientSecretRef.current) return;
    setPayState('paying');
    setPayError('');

    const { error } = await stripeRef.current.confirmCardPayment(clientSecretRef.current, {
      payment_method: {
        card: cardRef.current,
        billing_details: { name: booking?.customer?.user?.name },
      },
    });

    if (error) {
      setPayState('ready');
      setPayError(error.message || 'Payment failed. Please check your card details and try again.');
    } else {
      setPayState('success');
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!booking && !loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-800 flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="w-12 h-12 text-emerald-300 animate-spin mx-auto mb-4" />
          <p className="text-emerald-200 text-sm">Loading your booking…</p>
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-500 text-sm">{loadError}</p>
        </div>
      </div>
    );
  }

  // ── Already paid ─────────────────────────────────────────────────────────
  if (booking && (booking.status === 'PAID' || booking.status === 'CONFIRMED')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Already Paid</h2>
          <p className="text-gray-500 text-sm">
            Seat #{booking.seatNumber} on <strong>{booking.jeep.safariType}</strong> is confirmed.
          </p>
          <p className="text-xs text-gray-400 mt-4">You can close this page.</p>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (payState === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Payment Successful!</h2>
          <p className="text-gray-500 text-sm mb-1">
            Seat #{booking?.seatNumber} · {booking?.jeep.safariType}
          </p>
          <p className="text-gray-400 text-xs mb-6">
            {booking ? new Date(booking.jeep.safariDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
          </p>
          <div className="bg-emerald-50 rounded-xl p-4 text-sm text-emerald-800 text-left">
            <p className="font-medium mb-1">What's next?</p>
            <p>You'll get a WhatsApp confirmation once all seats are paid and the safari is confirmed.</p>
          </div>
          <p className="text-xs text-gray-400 mt-4">You can close this page.</p>
        </div>
      </div>
    );
  }

  const deadline = booking?.paymentDeadline ? new Date(booking.paymentDeadline) : null;
  const isExpired = deadline ? deadline.getTime() < Date.now() : false;
  const base = parseFloat(booking?.basePrice ?? '0');
  const meal = parseFloat(booking?.mealPrice ?? '0');
  const cam  = parseFloat(booking?.cameraRental ?? '0');
  const total = parseFloat(booking?.totalAmount ?? '0');

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 text-white px-5 pt-10 pb-16">
        <div className="max-w-lg mx-auto">
          <p className="text-emerald-300 text-xs font-semibold uppercase tracking-wide mb-1">
            {booking?.jeep.owner.companyName}
          </p>
          <h1 className="text-2xl font-bold">Complete Payment</h1>
          <p className="text-emerald-200 text-sm mt-1">
            {booking ? new Date(booking.jeep.safariDate).toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            }) : ''}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 pb-16 space-y-4">

        {/* Deadline banner */}
        {deadline && !isExpired && timeLeft && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between text-amber-800 text-sm">
            <span className="flex items-center gap-1.5"><Timer className="w-4 h-4" />Pay before deadline</span>
            <span className="font-bold tabular-nums">{timeLeft}</span>
          </div>
        )}
        {isExpired && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />Payment window has closed. Your seat may have been released.
          </div>
        )}

        {/* Booking summary */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Booking Summary
          </div>
          <div className="divide-y divide-gray-100 text-sm">
            <Row label="Safari" value={booking?.jeep.safariType ?? ''} />
            <Row label="Seat" value={`#${booking?.seatNumber}`} />
            {booking?.pickupLocation && (
              <Row label="Pickup" value={booking.pickupLocation.split(',')[0]} />
            )}
            {booking?.pickupTime && <Row label="Pickup time" value={booking.pickupTime} />}
          </div>

          <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Amount
          </div>
          <div className="divide-y divide-gray-100 text-sm">
            <Row label="Safari seat" value={formatCurrency(base)} />
            {meal > 0 && <Row label="Meal" value={formatCurrency(meal)} />}
            {cam  > 0 && <Row label="Camera rental" value={formatCurrency(cam)} />}
            <div className="flex justify-between px-4 py-3.5 bg-green-50">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-green-700 text-base">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment form */}
        {!isExpired && booking?.status === 'PAYMENT_PENDING' && (
          <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
            <h2 className="font-bold text-gray-900">Card Payment</h2>

            {payState === 'loading' && (
              <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            )}

            {(payState === 'ready' || payState === 'paying') && (
              <>
                <div
                  ref={cardDivRef}
                  className="border border-gray-200 rounded-xl px-4 py-3.5 bg-white"
                />
                {payError && <p className="text-sm text-red-600">{payError}</p>}
                <button
                  onClick={handlePay}
                  disabled={payState === 'paying'}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
                >
                  {payState === 'paying' ? 'Processing…' : `Pay ${formatCurrency(total)}`}
                </button>
              </>
            )}

            {payState === 'error' && (
              <div className="text-center py-2">
                <p className="text-sm text-red-600 mb-3">{payError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-green-600 underline"
                >
                  Reload page
                </button>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1"><Lock className="w-3 h-3" />Secured by Stripe</p>
          </div>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right max-w-[200px] truncate">{value}</span>
    </div>
  );
}
