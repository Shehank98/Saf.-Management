'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Compass, Search } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  RESERVED:        'pwa-badge pwa-badge-blue',
  PAYMENT_PENDING: 'pwa-badge pwa-badge-amber',
  PAID:            'pwa-badge pwa-badge-green',
  CONFIRMED:       'pwa-badge pwa-badge-green',
  RELEASED:        'pwa-badge pwa-badge-gray',
  REFUNDED:        'pwa-badge pwa-badge-gray',
  AUTO_CANCELLED:  'pwa-badge pwa-badge-red',
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

  const activeBookings = bookings?.filter((b) => ['RESERVED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED'].includes(b.status)) ?? [];
  const pastBookings   = bookings?.filter((b) => !['RESERVED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED'].includes(b.status)) ?? [];

  return (
    <main style={{ minHeight: '100vh', background: '#FAFAF7' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1A3D2B 0%, #2D6A4F 100%)', color: '#fff', padding: '40px 20px 64px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Compass size={18} color="#fff" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.8 }}>Safari Adventures</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>My Bookings</h1>
          <p style={{ fontSize: 13, opacity: 0.75, margin: 0 }}>Enter your WhatsApp number to view your safari reservations</p>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 80px', marginTop: -24 }}>
        {/* Search card */}
        <div className="pwa-card" style={{ padding: 20, marginBottom: 16 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>WhatsApp Number</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 77 123 4567"
                className="pwa-input"
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="pwa-btn pwa-btn-primary"
                style={{ whiteSpace: 'nowrap' }}
              >
                {loading ? '…' : 'Search'}
              </button>
            </div>
            {error && (
              <div className="pwa-notice pwa-notice-red" style={{ margin: 0 }}>
                {error}
              </div>
            )}
          </form>
        </div>

        {/* No results */}
        {bookings !== null && bookings.length === 0 && (
          <div className="pwa-card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: '#E8E5DE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Search size={24} color="#8A8A8A" />
            </div>
            <p style={{ fontWeight: 600, color: '#1A1A1A', margin: '0 0 4px' }}>No bookings found</p>
            <p style={{ fontSize: 12, color: '#8A8A8A', margin: 0 }}>Make sure you enter the same number used when booking.</p>
          </div>
        )}

        {/* Active bookings */}
        {activeBookings.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <div className="pwa-section-head" style={{ margin: '0 0 8px' }}>Active Bookings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeBookings.map((b) => <BookingCard key={b.id} booking={b} />)}
            </div>
          </section>
        )}

        {/* Past bookings */}
        {pastBookings.length > 0 && (
          <section>
            <div className="pwa-section-head" style={{ margin: '0 0 8px' }}>Past Bookings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pastBookings.map((b) => <BookingCard key={b.id} booking={b} />)}
            </div>
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
  const badgeClass = STATUS_BADGE[booking.status] ?? 'pwa-badge pwa-badge-gray';
  const label = STATUS_LABEL[booking.status] ?? booking.status;
  const isPendingPayment = booking.status === 'PAYMENT_PENDING' && !deadlineExpired;

  return (
    <div className="pwa-card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <p style={{ fontWeight: 700, color: '#1A1A1A', margin: '0 0 2px' }}>{booking.jeep.safariType}</p>
            <p style={{ fontSize: 12, color: '#8A8A8A', margin: 0 }}>{booking.jeep.owner.companyName}</p>
          </div>
          <span className={badgeClass}>{label}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 13 }}>
          <span style={{ color: '#6B6B6B' }}>Date</span>
          <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{safariDate}</span>
          <span style={{ color: '#6B6B6B' }}>Seat</span>
          <span style={{ fontWeight: 600, color: '#1A1A1A' }}>#{booking.seatNumber}</span>
          {booking.pickupTime && (
            <>
              <span style={{ color: '#6B6B6B' }}>Pickup</span>
              <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{booking.pickupTime}</span>
            </>
          )}
          <span style={{ color: '#6B6B6B' }}>Amount</span>
          <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{formatCurrency(parseFloat(booking.totalAmount))}</span>
        </div>
      </div>
      {isPendingPayment && (
        <div style={{ borderTop: '1px solid #F6D860', background: '#FFFBEB', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#92400E', margin: '0 0 2px' }}>Payment required</p>
            {deadline && (
              <p style={{ fontSize: 11, color: '#B45309', margin: 0 }}>
                Deadline: {deadline.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <a
            href={`/pay/${booking.id}`}
            className="pwa-btn pwa-btn-primary pwa-btn-sm"
          >
            Pay Now
          </a>
        </div>
      )}
    </div>
  );
}
