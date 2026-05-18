'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Compass, Search, Clock, Users, Ticket, Phone, Share2, XCircle, AlertCircle } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  RESERVED:        'pwa-badge pwa-badge-blue',
  PAYMENT_PENDING: 'pwa-badge pwa-badge-amber',
  PAID:            'pwa-badge pwa-badge-green',
  CONFIRMED:       'pwa-badge pwa-badge-green',
  RELEASED:        'pwa-badge pwa-badge-gray',
  REFUNDED:        'pwa-badge pwa-badge-gray',
  AUTO_CANCELLED:  'pwa-badge pwa-badge-red',
  CANCELLED:       'pwa-badge pwa-badge-red',
};

const STATUS_LABEL: Record<string, string> = {
  RESERVED:        'Reserved',
  PAYMENT_PENDING: 'Pay Now',
  PAID:            'Paid',
  CONFIRMED:       'Confirmed',
  RELEASED:        'Seat Released',
  REFUNDED:        'Refunded',
  AUTO_CANCELLED:  'Cancelled',
  CANCELLED:       'Cancelled',
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
    totalSeats: number;
    paidSeats: number;
    reservedSeats: number;
    owner: { companyName: string };
  };
}

type TabKey = 'upcoming' | 'past' | 'cancelled';

function isUpcoming(b: Booking) {
  return ['RESERVED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED'].includes(b.status);
}
function isCancelled(b: Booking) {
  return ['AUTO_CANCELLED', 'CANCELLED', 'RELEASED', 'REFUNDED'].includes(b.status);
}

export default function MyBookingsPage() {
  const [phone, setPhone]       = useState('');
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');

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

  const upcoming   = bookings?.filter(isUpcoming) ?? [];
  const past       = bookings?.filter((b: Booking) => !isUpcoming(b) && !isCancelled(b)) ?? [];
  const cancelled  = bookings?.filter(isCancelled) ?? [];

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: 'upcoming',  label: 'Upcoming',  count: upcoming.length },
    { key: 'past',      label: 'Past',      count: past.length },
    { key: 'cancelled', label: 'Cancelled', count: cancelled.length },
  ];

  const tabBookings: Record<string, Booking[]> = { upcoming, past, cancelled };
  const shown: Booking[] = bookings !== null ? (tabBookings[activeTab] ?? []) : [];

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

        {/* Tabs */}
        {bookings !== null && (
          <>
            <div style={{ display: 'flex', gap: 0, background: '#fff', borderRadius: 12, border: '1px solid #E8E5DE', overflow: 'hidden', marginBottom: 14 }}>
              {TABS.map(({ key, label, count }, i) => {
                const active = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    style={{
                      flex: 1, padding: '10px 4px', fontSize: 13, fontWeight: active ? 700 : 500,
                      background: active ? '#1A3D2B' : 'transparent',
                      color: active ? '#fff' : '#6B6B6B',
                      border: 'none', cursor: 'pointer',
                      borderLeft: i > 0 ? '1px solid #E8E5DE' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                    {count > 0 && (
                      <span style={{ marginLeft: 5, fontSize: 11, fontWeight: 700, background: active ? 'rgba(255,255,255,0.2)' : '#E3EFE9', color: active ? '#fff' : '#2D6A4F', borderRadius: 8, padding: '1px 6px' }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* No results for this tab */}
            {shown.length === 0 && (
              <div className="pwa-card" style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, background: '#E8E5DE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Search size={24} color="#8A8A8A" />
                </div>
                <p style={{ fontWeight: 600, color: '#1A1A1A', margin: '0 0 4px' }}>
                  {bookings.length === 0 ? 'No bookings found' : `No ${activeTab} bookings`}
                </p>
                <p style={{ fontSize: 12, color: '#8A8A8A', margin: 0 }}>
                  {bookings.length === 0 ? 'Make sure you enter the same number used when booking.' : `You have no ${activeTab} safari bookings.`}
                </p>
              </div>
            )}

            {/* Booking cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {shown.map((b) => <BookingCard key={b.id} booking={b} />)}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const [expanded, setExpanded] = useState(false);
  const safariDate = new Date(booking.jeep.safariDate).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
  const deadline = booking.paymentDeadline ? new Date(booking.paymentDeadline) : null;
  const deadlineExpired = deadline ? deadline.getTime() < Date.now() : false;
  const badgeClass = STATUS_BADGE[booking.status] ?? 'pwa-badge pwa-badge-gray';
  const label = STATUS_LABEL[booking.status] ?? booking.status;

  const seatsNeeded = Math.max(0, 4 - (booking.jeep.reservedSeats + booking.jeep.paidSeats));

  return (
    <div className="pwa-card" style={{ overflow: 'hidden' }}>
      {/* Main content */}
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <p style={{ fontWeight: 700, color: '#1A1A1A', margin: '0 0 2px' }}>{booking.jeep.safariType}</p>
            <p style={{ fontSize: 12, color: '#8A8A8A', margin: 0 }}>{booking.jeep.owner.companyName}</p>
          </div>
          <span className={badgeClass}>{label}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 13 }}>
          <span style={{ color: '#6B6B6B', display: 'flex', alignItems: 'center', gap: 4 }}>Date</span>
          <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{safariDate}</span>
          <span style={{ color: '#6B6B6B' }}>Seat</span>
          <span style={{ fontWeight: 600, color: '#1A1A1A' }}>#{booking.seatNumber}</span>
          {booking.pickupTime && (
            <>
              <span style={{ color: '#6B6B6B', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} color="#8A8A8A" /> Pickup
              </span>
              <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{booking.pickupTime}</span>
            </>
          )}
          <span style={{ color: '#6B6B6B' }}>Amount</span>
          <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{formatCurrency(parseFloat(booking.totalAmount))}</span>
        </div>

        {/* Expand toggle */}
        {(booking.status === 'PAID' || booking.status === 'CONFIRMED') && (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{ marginTop: 10, fontSize: 12, color: '#2D6A4F', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {expanded ? 'Show less ↑' : 'Actions & details ↓'}
          </button>
        )}
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div style={{ borderTop: '1px solid #F0EDE6', padding: '12px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="pwa-btn pwa-btn-sm" style={{ background: '#E3EFE9', color: '#2D6A4F', border: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Ticket size={13} /> View Ticket
          </button>
          <button className="pwa-btn pwa-btn-sm" style={{ background: '#DBEAFE', color: '#1E40AF', border: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Share2 size={13} /> Invite Friends
          </button>
          <button className="pwa-btn pwa-btn-sm" style={{ background: '#F5F0E8', color: '#8B5E3C', border: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Phone size={13} /> Contact Owner
          </button>
        </div>
      )}

      {/* Status-specific footer */}
      {booking.status === 'RESERVED' && seatsNeeded > 0 && (
        <div style={{ borderTop: '1px solid #BFDBFE', background: '#EFF6FF', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={14} color="#1D4ED8" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#1D4ED8', margin: 0 }}>
            <strong>{seatsNeeded} more seat{seatsNeeded !== 1 ? 's' : ''} needed</strong> before payment links are sent
          </p>
        </div>
      )}

      {booking.status === 'PAYMENT_PENDING' && !deadlineExpired && (
        <div style={{ borderTop: '1px solid #F6D860', background: '#FFFBEB', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#92400E', margin: '0 0 2px' }}>Payment required</p>
            {deadline && (
              <p style={{ fontSize: 11, color: '#B45309', margin: 0 }}>
                Deadline: {deadline.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <a href={`/pay/${booking.id}`} className="pwa-btn pwa-btn-primary pwa-btn-sm">
            Pay Now
          </a>
        </div>
      )}

      {booking.status === 'PAYMENT_PENDING' && deadlineExpired && (
        <div style={{ borderTop: '1px solid #FECACA', background: '#FFF5F5', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>Payment deadline passed — seat may be released soon</p>
        </div>
      )}

      {booking.status === 'RELEASED' && (
        <div style={{ borderTop: '1px solid #E5E7EB', background: '#F9FAFB', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <XCircle size={14} color="#6B7280" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Seat released — you can book again if seats are available</p>
        </div>
      )}

      {booking.status === 'AUTO_CANCELLED' && (
        <div style={{ borderTop: '1px solid #FECACA', background: '#FFF5F5', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <XCircle size={14} color="#DC2626" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>Booking cancelled automatically — contact support if you paid</p>
        </div>
      )}
    </div>
  );
}
