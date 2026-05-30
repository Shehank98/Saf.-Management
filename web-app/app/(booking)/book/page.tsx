'use client';

import { Suspense, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Leaf, MapPin, Clock, Info, ChevronDown } from 'lucide-react';

interface AvailableDate {
  date: string;
  safariTypes: { type: string; availableSeats: number; status: string }[];
}

const TYPE_LABEL: Record<string, string> = {
  'Full Day': 'Full Day',
  'Half Day Morning': 'Morning Half',
  'Half Day Afternoon': 'Afternoon Half',
  'Morning Half': 'Morning Half',
  'Afternoon Half': 'Afternoon Half',
};

const TYPE_TIME: Record<string, string> = {
  'Full Day': '6:00 AM – 6:00 PM',
  'Half Day Morning': '6:00 AM – 12:00 PM',
  'Half Day Afternoon': '12:00 PM – 6:00 PM',
  'Morning Half': '6:00 AM – 12:00 PM',
  'Afternoon Half': '12:00 PM – 6:00 PM',
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function thisWeekEnd() {
  const d = new Date();
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#1A3D2B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: 36, height: 36, color: '#A8D5BC', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ownerUserId = searchParams.get('owner') || undefined;

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'seats'>('seats');

  const { data: datesData, isLoading } = useQuery<{ data: AvailableDate[] }>({
    queryKey: ['available-dates', ownerUserId],
    queryFn: () =>
      api.get('/shared-safari/available-dates', { params: ownerUserId ? { owner: ownerUserId } : {} }).then((r) => r.data),
  });

  const { data: jeepsData, isLoading: jeepsLoading } = useQuery<any[]>({
    queryKey: ['jeeps-for-date', selectedDate, selectedType, ownerUserId],
    queryFn: () =>
      api.get(`/shared-safari/jeeps/${selectedDate}/${encodeURIComponent(selectedType!)}`, {
        params: ownerUserId ? { owner: ownerUserId } : {},
      }).then((r) => r.data.data),
    enabled: !!selectedDate && !!selectedType,
  });

  const { data: ownerProfile } = useQuery<{ companyName: string; userId: string }>({
    queryKey: ['owner-profile', ownerUserId],
    queryFn: () =>
      api.get('/shared-safari/owner-profile', { params: { owner: ownerUserId } }).then((r) => r.data.data),
    enabled: !!ownerUserId,
  });

  const dates: AvailableDate[] = datesData?.data || [];

  // Block access without owner link
  if (!ownerUserId) {
    return (
      <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1A3D2B 0%, #2D6A4F 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '40px 32px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 20px 48px rgba(0,0,0,0.18)' }}>
          <div style={{ width: 56, height: 56, background: '#E3EFE9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Leaf style={{ width: 28, height: 28, color: '#2D6A4F' }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>You need a booking link</h1>
          <p style={{ fontSize: 14, color: '#6B6B6B', margin: '0 0 24px', lineHeight: 1.5 }}>
            Safari bookings are by invitation only. Ask your safari operator to share their booking link with you.
          </p>
          <div style={{ background: '#F5F0E8', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: '#8B5E3C', textAlign: 'left', lineHeight: 1.6 }}>
            <strong>Already have a link?</strong> Open it from the message or WhatsApp your operator sent you.
          </div>
        </div>
      </main>
    );
  }

  // Build filter chips: Today, this-week dates, then types
  const today = todayStr();
  const weekEnd = thisWeekEnd();
  const todayDate = dates.find((d) => d.date === today);
  const thisWeekDates = dates.filter((d) => d.date >= today && d.date <= weekEnd);

  const handleChip = (date: string | null, type: string | null) => {
    setSelectedDate(date);
    setSelectedType(type);
  };

  // All unique types across available dates
  const allTypes = useMemo(() => {
    const types = new Set<string>();
    dates.forEach((d) => d.safariTypes.forEach((t) => types.add(t.type)));
    return Array.from(types);
  }, [dates]);

  // Chips config
  const chips = [
    { label: 'All', active: !selectedDate && !selectedType, onClick: () => handleChip(null, null) },
    ...(todayDate ? [{ label: 'Today', active: selectedDate === today && !selectedType, onClick: () => handleChip(today, null) }] : []),
    ...allTypes.map((t) => ({
      label: TYPE_LABEL[t] || t,
      active: selectedType === t,
      onClick: () => {
        const firstDate = dates.find((d) => d.safariTypes.some((st) => st.type === t));
        handleChip(firstDate?.date || null, t);
      },
    })),
  ];

  // Cards to show
  const cards = useMemo(() => {
    if (selectedDate && selectedType) return jeepsData || [];
    if (selectedDate) {
      // Show all types for this date
      const dateInfo = dates.find((d) => d.date === selectedDate);
      return (dateInfo?.safariTypes || []).map((t) => ({ ...t, _dateHint: selectedDate }));
    }
    // No filter: flatten all dates × types as placeholder cards
    return dates.flatMap((d) => d.safariTypes.map((t) => ({ ...t, date: d.date, _dateHint: d.date })));
  }, [selectedDate, selectedType, jeepsData, dates]);

  const totalAvail = cards.reduce((sum: number, c: any) => sum + (c.availableSeats ?? (c.totalSeats - (c.bookings?.filter((b: any) => ['PAID','CONFIRMED','RESERVED','PAYMENT_PENDING'].includes(b.status)).length || 0))), 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Sticky header ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: '#fff', borderBottom: '1px solid var(--line)', padding: '12px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              {ownerProfile?.companyName || 'Safari Bookings'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>
              Sri Lanka · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Filter chips */}
        {isLoading ? (
          <div style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ width: 72, height: 32, borderRadius: 999, flexShrink: 0 }} />
            ))}
          </div>
        ) : (
          <div className="chips">
            {chips.map((c) => (
              <button key={c.label} className={`chip${c.active ? ' active' : ''}`} onClick={c.onClick}>
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: '16px 16px 100px' }}>

        {/* How it works */}
        <div className="pwa-notice pwa-notice-amber" style={{ marginBottom: 16 }}>
          <Info style={{ width: 16, height: 16, color: 'var(--brown)', flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, lineHeight: 1.5 }}>
            <strong>Reserve a seat free.</strong> Once 4 seats are filled, you and the others get a WhatsApp payment link with 48 h to confirm.
          </span>
        </div>

        {/* Results header */}
        {!isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', margin: 0 }}>
              {selectedDate && selectedType && jeepsLoading ? 'Loading…' : `${selectedDate && selectedType ? (jeepsData?.length || 0) : dates.length} safaris available`}
            </p>
            <button
              onClick={() => setSortBy(sortBy === 'price' ? 'seats' : 'price')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}
            >
              Sort <ChevronDown size={12} />
            </button>
          </div>
        )}

        {/* Date picker when date filter active but no type */}
        {selectedDate && !selectedType && (
          <div style={{ marginBottom: 16 }}>
            <div className="chips" style={{ marginBottom: 10 }}>
              {dates.find((d) => d.date === selectedDate)?.safariTypes.map((t) => (
                <button key={t.type} className="chip" onClick={() => setSelectedType(t.type)}>
                  {TYPE_LABEL[t.type] || t.type} · {t.availableSeats} seats
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {(isLoading || jeepsLoading) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid var(--line)' }}>
                <div className="skeleton" style={{ height: 140 }} />
                <div style={{ padding: '14px 16px' }}>
                  <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 10, width: '40%', marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 7 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Safari cards — jeep detail view */}
        {selectedDate && selectedType && !jeepsLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(!jeepsData || jeepsData.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
                <p style={{ fontSize: 14 }}>No jeeps available for this slot.</p>
              </div>
            ) : (
              jeepsData.map((jeep: any, idx: number) => {
                const taken = jeep.bookings?.filter((b: any) =>
                  ['PAID','CONFIRMED','RESERVED','PAYMENT_PENDING'].includes(b.status)
                ).length || 0;
                const reserved = jeep.bookings?.filter((b: any) => b.status === 'RESERVED').length || 0;
                const paid = jeep.bookings?.filter((b: any) => ['PAID','CONFIRMED','PAYMENT_PENDING'].includes(b.status)).length || 0;
                const total = jeep.totalSeats || 6;
                const open = total - taken;
                const paidPct = (paid / total) * 100;
                const resvPct = (reserved / total) * 100;
                const minPct = (4 / total) * 100;
                const needed = Math.max(0, 4 - paid);

                return (
                  <div
                    key={jeep.id}
                    className="safari-card"
                    onClick={() => router.push(`/book/${jeep.bookingLinkToken}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={`safari-thumb alt-${idx % 4}`}>
                      <div className="sun" />
                      <div className="terrain" />
                      <div className="silhouette">
                        <div style={{ width: 8, height: 28 }} />
                        <div style={{ width: 12, height: 40 }} />
                        <div style={{ width: 6, height: 20 }} />
                      </div>
                      {/* Overlay badges */}
                      <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, zIndex: 2, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, backdropFilter: 'blur(4px)' }}>
                            {TYPE_TIME[selectedType] || selectedType}
                          </span>
                        </div>
                        <span className={`pwa-badge ${jeep.status === 'CONFIRMED' ? 'pwa-badge-green' : jeep.status === 'PENDING_PAYMENT' ? 'pwa-badge-amber' : 'pwa-badge-gray'}`}>
                          {jeep.status === 'CONFIRMED' ? 'Confirmed' : jeep.status === 'PENDING_PAYMENT' ? 'Filling Up' : taken === 0 ? 'Just Opened' : 'Filling Up'}
                        </span>
                      </div>
                    </div>
                    <div className="safari-card-body">
                      <p className="safari-card-title">
                        {selectedType} Safari
                      </p>
                      <div className="safari-card-meta">
                        <MapPin size={11} />
                        Safari Park · {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        <span>·</span>
                        <Clock size={11} />
                        {TYPE_TIME[selectedType]}
                      </div>
                      <div className="occ-bar">
                        <div className="fill">
                          <div className="paid" style={{ width: `${paidPct}%` }} />
                          <div className="reserved" style={{ width: `${resvPct}%` }} />
                        </div>
                        <div className="min-mark" style={{ left: `${minPct}%` }} />
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 0 8px' }}>
                        {paid} paid · {reserved} reserved · {open} open
                        {jeep.status === 'CONFIRMED'
                          ? <> · <strong style={{ color: '#2D6A4F' }}>Guaranteed to go!</strong></>
                          : needed > 0
                          ? <> · <strong style={{ color: 'var(--brown)' }}>{needed} more to confirm</strong></>
                          : null}
                      </p>
                      <div className="safari-card-footer">
                        <span className="price">
                          {formatCurrency(parseFloat(jeep.pricePerSeat))}<small>/seat</small>
                        </span>
                        <button
                          className="pwa-btn pwa-btn-primary pwa-btn-sm"
                          onClick={(e) => { e.stopPropagation(); router.push(`/book/${jeep.bookingLinkToken}`); }}
                          disabled={open === 0}
                        >
                          {open === 0 ? 'Full' : 'Reserve →'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Overview cards — no date/type selected */}
        {!isLoading && !selectedType && !jeepsLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {dates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
                <p style={{ fontSize: 14 }}>No available safaris yet. Check back soon.</p>
              </div>
            ) : (
              dates
                .filter((d) => !selectedDate || d.date === selectedDate)
                .flatMap((d) => d.safariTypes.map((t, idx) => ({ ...t, date: d.date, idx })))
                .map((item, i) => {
                  const totalSeats = 6;
                  const taken = totalSeats - item.availableSeats;
                  const paidPct = ((taken * 0.6) / totalSeats) * 100;
                  const resvPct = ((taken * 0.4) / totalSeats) * 100;
                  const minPct = (4 / totalSeats) * 100;

                  return (
                    <div
                      key={`${item.date}-${item.type}`}
                      className="safari-card"
                      onClick={() => { setSelectedDate(item.date); setSelectedType(item.type); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={`safari-thumb alt-${i % 4}`}>
                        <div className="sun" />
                        <div className="terrain" />
                        <div className="silhouette">
                          <div style={{ width: 8, height: 28 }} />
                          <div style={{ width: 12, height: 40 }} />
                          <div style={{ width: 6, height: 20 }} />
                        </div>
                        <div style={{ position: 'absolute', bottom: 10, left: 12, zIndex: 2 }}>
                          <span style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, backdropFilter: 'blur(4px)' }}>
                            {TYPE_TIME[item.type] || item.type}
                          </span>
                        </div>
                      </div>
                      <div className="safari-card-body">
                        <p className="safari-card-title">{TYPE_LABEL[item.type] || item.type} Safari</p>
                        <div className="safari-card-meta">
                          <Clock size={11} />
                          {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          <span>·</span>
                          {item.availableSeats} seats left
                        </div>
                        <div className="occ-bar">
                          <div className="fill">
                            <div className="paid" style={{ width: `${paidPct}%` }} />
                            <div className="reserved" style={{ width: `${resvPct}%` }} />
                          </div>
                          <div className="min-mark" style={{ left: `${minPct}%` }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                          {item.availableSeats} of {totalSeats} seats open · Tap to see jeeps
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
