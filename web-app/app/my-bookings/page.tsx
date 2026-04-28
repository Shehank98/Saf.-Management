'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Search } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  RESERVED:        'bg-blue-50 text-blue-700 border-blue-200',
  PAYMENT_PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID:            'bg-green-50 text-green-700 border-green-200',
  CONFIRMED:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  RELEASED:        'bg-gray-50 text-gray-500 border-gray-200',
  REFUNDED:        'bg-purple-50 text-purple-700 border-purple-200',
  AUTO_CANCELLED:  'bg-red-50 text-red-600 border-red-200',
};

const STATUS_LABEL: Record<string, string> = {
  RESERVED:        'Reserved',
  PAYMENT_PENDING: 'Payment Pending',
  PAID:            'Paid',
  CONFIRMED:       'Confirmed',
  RELEASED:        'Seat Released',
  REFUNDED:        'Refunded',
  AUTO_CANCELLED:  'Cancelled',
};

interface Booking {
  id: string;
  seatNumber: number;
  status: string;
  totalAmount: string;
  pickupTime: string;
  paymentDeadline: string | null;
  createdAt: string;
  jeep: {
    safariDate: string;
    safariType: string;
    status: string;
    owner: { companyName: string };
  };
}

export default function MyBookingsPage() {
  const [phone, setPhone] = useState('');
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = phone.trim();
    if (!p) return;
    setLoading(true);
    setError('');
    setBookings(null);
    try {
      const res = await api.get(`/shared-safari/my-bookings?phone=${encodeURIComponent(p)}`);
      setBookings(res.data.data);
    } catch {
      setError('Could not fetch bookings. Please check your number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeBookings  = bookings?.filter((b) => ['RESERVED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED'].includes(b.status)) ?? [];
  const pastBookings    = bookings?.filter((b) => !['RESERVED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED'].includes(b.status)) ?? [];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 text-white px-5 pt-10 pb-16">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-emerald-200 text-sm mt-1">Enter your WhatsApp number to view your safari reservations</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 pb-16 space-y-4">
        {/* Search card */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 77 123 4567"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {loading ? '…' : 'Search'}
              </button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </div>

        {/* Results */}
        {bookings !== null && bookings.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No bookings found for this number.</p>
            <p className="text-gray-400 text-xs mt-1">Make sure you enter the same number used when booking.</p>
          </div>
        )}

        {activeBookings.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Active Bookings</h2>
            {activeBookings.map((b) => <BookingCard key={b.id} booking={b} />)}
          </section>
        )}

        {pastBookings.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Past Bookings</h2>
            {pastBookings.map((b) => <BookingCard key={b.id} booking={b} />)}
          </section>
        )}
      </div>
    </main>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const safariDate = new Date(booking.jeep.safariDate).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
  const deadline = booking.paymentDeadline ? new Date(booking.paymentDeadline) : null;
  const deadlineExpired = deadline ? deadline.getTime() < Date.now() : false;
  const style = STATUS_STYLES[booking.status] ?? 'bg-gray-50 text-gray-600 border-gray-200';
  const label = STATUS_LABEL[booking.status] ?? booking.status;
  const isPendingPayment = booking.status === 'PAYMENT_PENDING' && !deadlineExpired;

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-gray-900">{booking.jeep.safariType}</p>
            <p className="text-xs text-gray-400">{booking.jeep.owner.companyName}</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${style}`}>
            {label}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-gray-500">Date</div>
          <div className="font-medium text-gray-900">{safariDate}</div>
          <div className="text-gray-500">Seat</div>
          <div className="font-medium text-gray-900">#{booking.seatNumber}</div>
          {booking.pickupTime && (
            <>
              <div className="text-gray-500">Pickup</div>
              <div className="font-medium text-gray-900">{booking.pickupTime}</div>
            </>
          )}
          <div className="text-gray-500">Amount</div>
          <div className="font-medium text-gray-900">{formatCurrency(parseFloat(booking.totalAmount))}</div>
        </div>
      </div>
      {isPendingPayment && (
        <div className="border-t border-amber-100 bg-amber-50 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-800">Payment required</p>
            {deadline && (
              <p className="text-xs text-amber-600">
                Deadline: {deadline.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <a
            href={`/pay/${booking.id}`}
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            Pay Now
          </a>
        </div>
      )}
    </div>
  );
}
