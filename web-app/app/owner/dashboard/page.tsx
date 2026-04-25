'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserFeature { feature: string; enabled: boolean; }
interface MeData {
  name: string; role: string; approvalStatus: string;
  features: UserFeature[];
  safariOwner?: { companyName: string; subscriptionStatus: string; };
}

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'destructive' | 'info'> = {
  CONFIRMED: 'success', OPEN: 'info', PENDING_PAYMENT: 'warning',
  CANCELLED: 'destructive', COMPLETED: 'success',
  INQUIRY: 'info', DEPOSIT_PENDING: 'warning', DEPOSIT_PAID: 'success', FULLY_BOOKED: 'success',
};

const STATUS_COLORS: Record<string, string> = {
  INQUIRY:         'bg-blue-50 text-blue-700 border-blue-200',
  DEPOSIT_PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  DEPOSIT_PAID:    'bg-green-50 text-green-700 border-green-200',
  CONFIRMED:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED:       'bg-gray-50 text-gray-700 border-gray-200',
  CANCELLED:       'bg-red-50 text-red-700 border-red-200',
};

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

export default function OwnerDashboard() {
  const [tab, setTab]             = useState<string>('overview');
  const [mounted, setMounted]     = useState(false);
  const [showNewPrivate, setShowNewPrivate] = useState(false);
  const [newPrivateForm, setNewPrivateForm] = useState({
    safariDate: '', safariType: 'Full Day', numberOfGuests: '', totalAmount: '',
    customerName: '', customerPhone: '',
  });
  const qc = useQueryClient();
  useEffect(() => setMounted(true), []);

  const { data: me } = useQuery<MeData>({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data),
    enabled: mounted,
  });

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['owner-dashboard'],
    queryFn: () => api.get('/owner/dashboard').then((r) => r.data.data),
    enabled: mounted,
  });

  const { data: jeepsData } = useQuery({
    queryKey: ['owner-jeeps'],
    queryFn: () => api.get('/shared-safari/owner/jeeps').then((r) => r.data.data),
    enabled: tab === 'shared',
  });

  const { data: privateSafaris, isLoading: privateLoading } = useQuery({
    queryKey: ['owner-private-safaris'],
    queryFn: () => api.get('/private-safari/owner/list').then((r) => r.data.data),
    enabled: tab === 'private',
  });

  const { data: vendorPaymentsData } = useQuery({
    queryKey: ['owner-vendor-payments'],
    queryFn: () => api.get('/owner/vendor-payments').then((r) => r.data.data),
    enabled: tab === 'vendors',
  });

  const createPrivateMutation = useMutation({
    mutationFn: (body: any) => api.post('/private-safari/inquiry', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-private-safaris'] });
      qc.invalidateQueries({ queryKey: ['owner-dashboard'] });
      setShowNewPrivate(false);
      setNewPrivateForm({ safariDate: '', safariType: 'Full Day', numberOfGuests: '', totalAmount: '', customerName: '', customerPhone: '' });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/private-safari/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-private-safaris'] }),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.post(`/owner/vendor-payments/${id}/mark-paid`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-vendor-payments'] }),
  });

  const features = me?.features?.filter((f) => f.enabled).map((f) => f.feature) || [];
  const has      = (f: string) => features.includes(f);
  const stats    = dashData?.stats;

  const tabs: { key: string; label: string; icon: string }[] = [{ key: 'overview', label: 'Overview', icon: '🏠' }];
  if (has('PRIVATE_SAFARI'))   tabs.push({ key: 'private', label: 'Private Safaris', icon: '👑' });
  if (has('SHARED_TRIPS'))     tabs.push({ key: 'shared',  label: 'Shared Safaris',  icon: '🚙' });
  if (has('VENDOR_LISTINGS'))  tabs.push({ key: 'vendors', label: 'Vendor Payments', icon: '💳' });

  const handleCreatePrivate = () => {
    const { safariDate, numberOfGuests, totalAmount, customerName } = newPrivateForm;
    if (!safariDate || !numberOfGuests || !totalAmount || !customerName) {
      alert('Fill all required fields.');
      return;
    }
    createPrivateMutation.mutate({
      safariDate,
      safariType:     newPrivateForm.safariType,
      numberOfGuests: parseInt(numberOfGuests),
      totalAmount:    parseFloat(totalAmount),
      customerName:   customerName.trim(),
      customerPhone:  newPrivateForm.customerPhone.trim() || undefined,
    });
  };

  const nextStatus: Record<string, string> = {
    INQUIRY:         'DEPOSIT_PENDING',
    DEPOSIT_PENDING: 'DEPOSIT_PAID',
    DEPOSIT_PAID:    'CONFIRMED',
    CONFIRMED:       'COMPLETED',
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {me?.safariOwner?.companyName || dashData?.owner?.companyName || 'Owner Dashboard'}
          </h1>
          <p className="text-sm text-gray-500">Safari Owner Portal</p>
        </div>
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {/* Subscription warning */}
        {me?.safariOwner?.subscriptionStatus && me.safariOwner.subscriptionStatus !== 'ACTIVE' && (
          <motion.div {...fadeIn} className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 text-sm font-medium">
              ⚠️ Subscription {me.safariOwner.subscriptionStatus.toLowerCase()}. Contact Super Admin.
            </p>
          </motion.div>
        )}

        {/* No features */}
        {features.length === 0 && (
          <Card className="mb-6">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-3">🔒</div>
              <p className="font-semibold text-gray-700">No features enabled yet</p>
              <p className="text-gray-400 text-sm mt-1">The Super Admin will assign features to your account.</p>
            </CardContent>
          </Card>
        )}

        <AnimatePresence mode="wait">
          {/* ========== OVERVIEW ========== */}
          {tab === 'overview' && (
            <motion.div key="overview" {...fadeIn} className="space-y-6">
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Upcoming Private', value: stats.upcomingPrivate,  icon: '👑', show: has('PRIVATE_SAFARI'), color: 'bg-amber-50' },
                    { label: 'Upcoming Shared',  value: stats.upcomingShared,   icon: '🚙', show: has('SHARED_TRIPS'),   color: 'bg-green-50' },
                    { label: 'Month Revenue',    value: formatCurrency(parseFloat(stats.monthRevenue || '0')), icon: '💰', show: has('REPORTS_ANALYTICS'), color: 'bg-blue-50' },
                    { label: 'Pending Payments', value: stats.pendingVendorPayments, icon: '⏳', show: has('VENDOR_LISTINGS'), color: 'bg-red-50' },
                  ].filter((s) => s.show).map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                      <Card className={s.color}>
                        <CardContent className="p-4 flex items-center gap-3">
                          <span className="text-3xl">{s.icon}</span>
                          <div>
                            <p className="text-xs text-gray-500">{s.label}</p>
                            <p className="text-xl font-bold">{s.value}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {features.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {has('PRIVATE_SAFARI') && (
                    <motion.button initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                      onClick={() => setTab('private')}
                      className="bg-amber-50 hover:bg-amber-100 border-2 border-amber-100 rounded-2xl p-5 text-left transition-all hover:shadow-md">
                      <div className="text-3xl mb-2">👑</div>
                      <p className="font-semibold text-gray-800">Private Safaris</p>
                      <p className="text-xs text-gray-500 mt-0.5">Manual bookings you control</p>
                    </motion.button>
                  )}
                  {has('SHARED_TRIPS') && (
                    <motion.button initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.16 }}
                      onClick={() => setTab('shared')}
                      className="bg-green-50 hover:bg-green-100 border-2 border-green-100 rounded-2xl p-5 text-left transition-all hover:shadow-md">
                      <div className="text-3xl mb-2">🚙</div>
                      <p className="font-semibold text-gray-800">Shared Safaris</p>
                      <p className="text-xs text-gray-500 mt-0.5">Group bookings via link</p>
                    </motion.button>
                  )}
                  {has('VENDOR_LISTINGS') && (
                    <motion.button initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.22 }}
                      onClick={() => setTab('vendors')}
                      className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-100 rounded-2xl p-5 text-left transition-all hover:shadow-md">
                      <div className="text-3xl mb-2">💳</div>
                      <p className="font-semibold text-gray-800">Vendor Payments</p>
                      <p className="text-xs text-gray-500 mt-0.5">Pay your vendors</p>
                    </motion.button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ========== PRIVATE SAFARIS ========== */}
          {tab === 'private' && has('PRIVATE_SAFARI') && (
            <motion.div key="private" {...fadeIn} className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Private Safaris</h2>
                <button
                  onClick={() => setShowNewPrivate(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  + New Booking
                </button>
              </div>

              {/* New private safari modal */}
              {showNewPrivate && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-bold mb-4">New Private Safari Booking</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Customer Name *', key: 'customerName', type: 'text', placeholder: 'John Silva' },
                        { label: 'Customer Phone', key: 'customerPhone', type: 'tel', placeholder: '+94771234567' },
                        { label: 'Safari Date *', key: 'safariDate', type: 'date', placeholder: '' },
                        { label: 'Guests *', key: 'numberOfGuests', type: 'number', placeholder: '4' },
                        { label: 'Total Price (LKR) *', key: 'totalAmount', type: 'number', placeholder: '50000' },
                      ].map((f) => (
                        <div key={f.key}>
                          <label className="text-sm font-medium text-gray-700">{f.label}</label>
                          <input
                            type={f.type}
                            placeholder={f.placeholder}
                            value={(newPrivateForm as any)[f.key]}
                            onChange={(e) => setNewPrivateForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                          />
                        </div>
                      ))}
                      <div>
                        <label className="text-sm font-medium text-gray-700">Safari Type *</label>
                        <select
                          value={newPrivateForm.safariType}
                          onChange={(e) => setNewPrivateForm((p) => ({ ...p, safariType: e.target.value }))}
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                        >
                          {['Full Day', 'Morning Half', 'Afternoon Half'].map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </div>

                      {newPrivateForm.totalAmount && (
                        <div className="bg-amber-50 rounded-lg p-3 text-sm">
                          <p className="font-medium text-amber-800">30% deposit: {formatCurrency(parseFloat(newPrivateForm.totalAmount) * 0.3)}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => setShowNewPrivate(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                      <button
                        onClick={handleCreatePrivate}
                        disabled={createPrivateMutation.isPending}
                        className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                      >
                        {createPrivateMutation.isPending ? 'Creating...' : 'Create Booking'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {privateLoading && (
                <div className="text-center py-12 text-gray-400">Loading safaris...</div>
              )}

              {!privateLoading && privateSafaris?.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-4xl mb-3">👑</div>
                    <p className="font-semibold text-gray-700">No Private Safaris Yet</p>
                    <p className="text-gray-400 text-sm mt-1">Create your first private safari booking above.</p>
                  </CardContent>
                </Card>
              )}

              {privateSafaris?.map((safari: any, i: number) => {
                const customer = safari.booking?.customer?.user;
                const statusClass = STATUS_COLORS[safari.status] || 'bg-gray-50 text-gray-700 border-gray-200';
                const next = nextStatus[safari.status];
                return (
                  <motion.div key={safari.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">{safari.safariType}</p>
                            <p className="text-sm text-gray-500">{formatShortDate(safari.safariDate)}</p>
                            {customer && <p className="text-sm text-gray-600 mt-1">👤 {customer.name}</p>}
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${statusClass}`}>
                            {safari.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3 bg-gray-50 rounded-xl p-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-400">Guests</p>
                            <p className="font-bold text-gray-900">{safari.numberOfGuests}</p>
                          </div>
                          <div className="text-center border-x border-gray-200">
                            <p className="text-xs text-gray-400">Total</p>
                            <p className="font-bold text-green-700">{formatCurrency(parseFloat(safari.totalAmount))}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-400">Deposit</p>
                            <p className={`font-bold ${safari.depositPaid ? 'text-green-600' : 'text-amber-600'}`}>
                              {safari.depositPaid ? '✓ Paid' : '⏳ Pending'}
                            </p>
                          </div>
                        </div>

                        {next && (
                          <button
                            onClick={() => statusMutation.mutate({ id: safari.id, status: next })}
                            disabled={statusMutation.isPending}
                            className="w-full text-sm font-medium py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-50"
                          >
                            {next === 'DEPOSIT_PENDING' ? 'Request Deposit' :
                             next === 'DEPOSIT_PAID'    ? 'Mark Deposit Paid' :
                             next === 'CONFIRMED'       ? 'Confirm Safari' :
                             'Mark Completed'}
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ========== SHARED SAFARIS ========== */}
          {tab === 'shared' && has('SHARED_TRIPS') && (
            <motion.div key="shared" {...fadeIn} className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Shared Safaris</h2>
                <button
                  onClick={() => {
                    const date  = prompt('Safari date (YYYY-MM-DD):');
                    const type  = prompt('Type (Full Day / Morning Half / Afternoon Half):');
                    const price = prompt('Price per seat (LKR):');
                    if (date && type && price) {
                      api.post('/shared-safari/jeeps', { safariDate: date, safariType: type, pricePerSeat: parseFloat(price) })
                        .then(() => { qc.invalidateQueries({ queryKey: ['owner-jeeps'] }); alert('Safari created!'); })
                        .catch(() => alert('Failed to create safari'));
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  + New Safari
                </button>
              </div>
              {jeepsData?.map((jeep: any, i: number) => (
                <motion.div key={jeep.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{jeep.safariType}</p>
                          <p className="text-sm text-gray-500">{formatShortDate(jeep.safariDate)}</p>
                        </div>
                        <Badge variant={STATUS_BADGE[jeep.status] || 'secondary'}>{jeep.status}</Badge>
                      </div>

                      {/* Seat progress */}
                      <div className="flex gap-1 mb-2">
                        {Array.from({ length: 6 }, (_, idx) => {
                          const b = jeep.bookings?.find((bk: any) => bk.seatNumber === idx + 1);
                          const col = !b ? 'bg-gray-200' : (b.status === 'PAID' || b.status === 'CONFIRMED') ? 'bg-green-500' : 'bg-amber-400';
                          return <div key={idx} className={`h-4 flex-1 rounded ${col}`} title={b ? `Seat ${idx+1}: ${b.status}` : `Seat ${idx+1}: Available`} />;
                        })}
                      </div>
                      <p className="text-xs text-gray-500">{jeep.paidSeats}/{jeep.totalSeats} paid · {jeep.reservedSeats} reserved</p>

                      {jeep.bookings?.length > 0 && (
                        <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2">
                          {jeep.bookings.map((b: any) => (
                            <div key={b.id} className="text-xs bg-gray-50 rounded-lg p-2">
                              <p className="font-medium">Seat {b.seatNumber} — {b.customer?.user?.name || 'Guest'}</p>
                              <p className="text-gray-400">{b.status}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ========== VENDOR PAYMENTS ========== */}
          {tab === 'vendors' && has('VENDOR_LISTINGS') && (
            <motion.div key="vendors" {...fadeIn} className="space-y-4">
              <h2 className="text-lg font-semibold">Vendor Payments</h2>
              {vendorPaymentsData?.length === 0 && (
                <Card><CardContent className="p-8 text-center text-gray-400">No vendor payments found.</CardContent></Card>
              )}
              {vendorPaymentsData?.map((payment: any, i: number) => (
                <motion.div key={payment.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{payment.vendor?.user?.name}</p>
                        <p className="text-xs text-gray-500">{payment.description}</p>
                        <p className="text-sm font-bold mt-1 text-green-700">{formatCurrency(parseFloat(payment.amount))}</p>
                      </div>
                      {payment.status === 'PENDING' ? (
                        <button
                          onClick={() => markPaidMutation.mutate(payment.id)}
                          disabled={markPaidMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <Badge variant="success">PAID</Badge>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
