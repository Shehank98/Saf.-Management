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
  safariOwner?: {
    companyName: string;
    subscriptionStatus: string;
    locations: { location: { id: string; name: string; } }[];
  };
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
    customerName: '', customerPhone: '', customerEmail: '', specialRequests: '', locationId: '',
  });
  const [showNewShared, setShowNewShared] = useState(false);
  const [newSharedForm, setNewSharedForm] = useState({ safariDate: '', safariType: 'Full Day', pricePerSeat: '', locationId: '' });
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

  const { data: ownerLocations = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['owner-locations'],
    queryFn: () => api.get('/owner/locations').then((r) => r.data.data),
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
      setNewPrivateForm({ safariDate: '', safariType: 'Full Day', numberOfGuests: '', totalAmount: '', customerName: '', customerPhone: '', customerEmail: '', specialRequests: '', locationId: '' });
    },
  });

  const createSharedMutation = useMutation({
    mutationFn: (body: any) => api.post('/shared-safari/jeeps', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-jeeps'] });
      setShowNewShared(false);
      setNewSharedForm({ safariDate: '', safariType: 'Full Day', pricePerSeat: '', locationId: '' });
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
    const { safariDate, numberOfGuests, totalAmount, customerName, locationId } = newPrivateForm;
    if (!safariDate || !numberOfGuests || !totalAmount || !customerName || !locationId) {
      alert('Fill all required fields.');
      return;
    }
    createPrivateMutation.mutate({
      safariDate,
      safariType:      newPrivateForm.safariType,
      numberOfGuests:  parseInt(numberOfGuests),
      totalAmount:     parseFloat(totalAmount),
      customerName:    customerName.trim(),
      customerPhone:   newPrivateForm.customerPhone.trim() || undefined,
      customerEmail:   newPrivateForm.customerEmail.trim() || undefined,
      specialRequests: newPrivateForm.specialRequests.trim() || undefined,
      locationId,
    });
  };

  const handleCreateShared = () => {
    const { safariDate, safariType, pricePerSeat, locationId } = newSharedForm;
    if (!safariDate || !pricePerSeat || !locationId) {
      alert('Fill all required fields.');
      return;
    }
    createSharedMutation.mutate({
      safariDate,
      safariType,
      pricePerSeat: parseFloat(pricePerSeat),
      locationId,
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
            <motion.div key="private" {...fadeIn} className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Private Safaris</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Manage your manual customer bookings</p>
                </div>
                <button
                  onClick={() => setShowNewPrivate(true)}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all hover:shadow-md"
                >
                  <span className="text-base leading-none">+</span> New Booking
                </button>
              </div>

              {/* New booking modal */}
              {showNewPrivate && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={(e) => e.target === e.currentTarget && setShowNewPrivate(false)}
                >
                  <motion.div
                    initial={{ scale: 0.94, opacity: 0, y: 16 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.94, opacity: 0, y: 16 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
                  >
                    {/* Modal header */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">New Private Safari Booking</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Fill in the customer and safari details</p>
                      </div>
                      <button
                        onClick={() => setShowNewPrivate(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg"
                      >
                        ×
                      </button>
                    </div>

                    <div className="px-6 py-5 space-y-5">
                      {/* Customer Info section */}
                      <div>
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-3">Customer Information</p>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Customer Name <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              placeholder="e.g. John Silva"
                              value={newPrivateForm.customerName}
                              onChange={(e) => setNewPrivateForm((p) => ({ ...p, customerName: e.target.value }))}
                              className="mt-1.5 block w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:bg-white outline-none transition-all"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Phone Number</label>
                              <input
                                type="tel"
                                placeholder="+94771234567"
                                value={newPrivateForm.customerPhone}
                                onChange={(e) => setNewPrivateForm((p) => ({ ...p, customerPhone: e.target.value }))}
                                className="mt-1.5 block w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:bg-white outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Email Address</label>
                              <input
                                type="email"
                                placeholder="john@example.com"
                                value={newPrivateForm.customerEmail}
                                onChange={(e) => setNewPrivateForm((p) => ({ ...p, customerEmail: e.target.value }))}
                                className="mt-1.5 block w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:bg-white outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Safari Details section */}
                      <div>
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-3">Safari Details</p>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Safari Date <span className="text-red-500">*</span></label>
                              <input
                                type="date"
                                value={newPrivateForm.safariDate}
                                onChange={(e) => setNewPrivateForm((p) => ({ ...p, safariDate: e.target.value }))}
                                className="mt-1.5 block w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:bg-white outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">No. of Guests <span className="text-red-500">*</span></label>
                              <input
                                type="number"
                                min="1"
                                placeholder="e.g. 4"
                                value={newPrivateForm.numberOfGuests}
                                onChange={(e) => setNewPrivateForm((p) => ({ ...p, numberOfGuests: e.target.value }))}
                                className="mt-1.5 block w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:bg-white outline-none transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700">Safari Location <span className="text-red-500">*</span></label>
                            <select
                              value={newPrivateForm.locationId}
                              onChange={(e) => setNewPrivateForm((p) => ({ ...p, locationId: e.target.value }))}
                              className="mt-1.5 block w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:bg-white outline-none transition-all"
                            >
                              <option value="">Select a location...</option>
                              {ownerLocations.map((l) => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Safari Type <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { value: 'Full Day', label: 'Full Day', icon: '🌅' },
                                { value: 'Half Day Morning', label: 'Half Day Morning', icon: '🌄' },
                                { value: 'Half Day Afternoon', label: 'Half Day Afternoon', icon: '🌇' },
                              ].map((t) => (
                                <button
                                  key={t.value}
                                  type="button"
                                  onClick={() => setNewPrivateForm((p) => ({ ...p, safariType: t.value }))}
                                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                                    newPrivateForm.safariType === t.value
                                      ? 'border-amber-500 bg-amber-50 text-amber-800'
                                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-amber-300 hover:bg-amber-50/50'
                                  }`}
                                >
                                  <span className="text-xl">{t.icon}</span>
                                  <span className="text-center leading-tight">{t.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pricing section */}
                      <div>
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-3">Pricing</p>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Total Package Price (LKR) <span className="text-red-500">*</span></label>
                          <div className="relative mt-1.5">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">LKR</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="50,000"
                              value={newPrivateForm.totalAmount}
                              onChange={(e) => setNewPrivateForm((p) => ({ ...p, totalAmount: e.target.value }))}
                              className="block w-full border border-gray-200 bg-gray-50 rounded-xl pl-14 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:bg-white outline-none transition-all"
                            />
                          </div>
                          {newPrivateForm.totalAmount && parseFloat(newPrivateForm.totalAmount) > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-2.5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
                            >
                              <span className="text-xl">💰</span>
                              <div>
                                <p className="text-xs text-amber-600 font-medium">30% Deposit Required</p>
                                <p className="text-base font-bold text-amber-800">{formatCurrency(parseFloat(newPrivateForm.totalAmount) * 0.3)}</p>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Special Requests */}
                      <div>
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-3">Additional Details</p>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Special Requests</label>
                          <textarea
                            rows={3}
                            placeholder="Any special requirements, dietary needs, accessibility needs..."
                            value={newPrivateForm.specialRequests}
                            onChange={(e) => setNewPrivateForm((p) => ({ ...p, specialRequests: e.target.value }))}
                            className="mt-1.5 block w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:bg-white outline-none transition-all resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Modal footer */}
                    <div className="flex gap-3 px-6 pb-6 pt-2">
                      <button
                        onClick={() => setShowNewPrivate(false)}
                        className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreatePrivate}
                        disabled={createPrivateMutation.isPending}
                        className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-sm disabled:opacity-50 transition-all hover:shadow-md"
                      >
                        {createPrivateMutation.isPending ? 'Creating...' : 'Create Booking'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Loading */}
              {privateLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-8 h-8 border-3 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                  <p className="text-sm text-gray-400">Loading safaris...</p>
                </div>
              )}

              {/* Empty state */}
              {!privateLoading && privateSafaris?.length === 0 && (
                <motion.div {...fadeIn}>
                  <Card>
                    <CardContent className="py-16 text-center">
                      <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                        👑
                      </div>
                      <p className="font-semibold text-gray-800 text-base">No Private Safaris Yet</p>
                      <p className="text-gray-400 text-sm mt-1.5 max-w-xs mx-auto">
                        When customers contact you via WhatsApp, phone, or email — create their booking here.
                      </p>
                      <button
                        onClick={() => setShowNewPrivate(true)}
                        className="mt-5 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
                      >
                        + Create First Booking
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Safari cards */}
              {privateSafaris?.map((safari: any, i: number) => {
                const customer = safari.booking?.customer?.user;
                const displayName = safari.customerName || customer?.name;
                const displayPhone = safari.customerPhone || customer?.phone;
                const displayEmail = safari.customerEmail || customer?.email;
                const statusClass = STATUS_COLORS[safari.status] || 'bg-gray-50 text-gray-700 border-gray-200';
                const next = nextStatus[safari.status];
                return (
                  <motion.div key={safari.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <Card className="hover:shadow-lg transition-all duration-200 border border-gray-100">
                      <CardContent className="p-5">
                        {/* Card header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                              {safari.safariType === 'Full Day' ? '🌅' : safari.safariType === 'Half Day Morning' ? '🌄' : '🌇'}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{safari.safariType}</p>
                              <p className="text-sm text-gray-500">{formatShortDate(safari.safariDate)}</p>
                              {safari.location && <p className="text-xs text-gray-400 mt-0.5">📍 {safari.location.name}</p>}
                            </div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${statusClass}`}>
                            {safari.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Customer info */}
                        {(displayName || displayPhone || displayEmail) && (
                          <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1.5">
                            {displayName && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400 w-4 text-center">👤</span>
                                <span className="font-medium text-gray-800">{displayName}</span>
                              </div>
                            )}
                            {displayPhone && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400 w-4 text-center">📞</span>
                                <span className="text-gray-600">{displayPhone}</span>
                              </div>
                            )}
                            {displayEmail && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400 w-4 text-center">✉️</span>
                                <span className="text-gray-600">{displayEmail}</span>
                              </div>
                            )}
                            {safari.specialRequests && (
                              <div className="flex items-start gap-2 text-sm pt-1 border-t border-gray-200 mt-1">
                                <span className="text-gray-400 w-4 text-center mt-0.5">📝</span>
                                <span className="text-gray-500 italic text-xs">{safari.specialRequests}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400 mb-0.5">Guests</p>
                            <p className="font-bold text-gray-900 text-lg">{safari.numberOfGuests}</p>
                          </div>
                          <div className="bg-green-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400 mb-0.5">Total</p>
                            <p className="font-bold text-green-700 text-base">{formatCurrency(parseFloat(safari.totalAmount))}</p>
                          </div>
                          <div className={`${safari.depositPaid ? 'bg-emerald-50' : 'bg-amber-50'} rounded-xl p-3 text-center`}>
                            <p className="text-xs text-gray-400 mb-0.5">Deposit (30%)</p>
                            <p className={`font-bold text-sm ${safari.depositPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {formatCurrency(parseFloat(safari.depositAmount))}
                            </p>
                            <p className={`text-xs mt-0.5 ${safari.depositPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {safari.depositPaid ? '✓ Paid' : 'Pending'}
                            </p>
                          </div>
                        </div>

                        {/* WhatsApp deposit link — shown when deposit is requested but not yet paid */}
                        {safari.status === 'DEPOSIT_PENDING' && !safari.depositPaid && displayPhone && (
                          <a
                            href={`https://wa.me/${displayPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Hi ${displayName || 'there'}, your ${safari.safariType} safari on ${formatShortDate(safari.safariDate)} is confirmed. Please pay the 30% deposit of ${formatCurrency(parseFloat(safari.depositAmount))} to secure your booking. Thank you!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full mb-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            Send Deposit Request via WhatsApp
                          </a>
                        )}

                        {/* Action button */}
                        {next && (
                          <button
                            onClick={() => statusMutation.mutate({ id: safari.id, status: next })}
                            disabled={statusMutation.isPending}
                            className="w-full text-sm font-semibold py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-all hover:shadow-md disabled:opacity-50"
                          >
                            {next === 'DEPOSIT_PENDING' ? '📩 Request Deposit' :
                             next === 'DEPOSIT_PAID'    ? '✅ Mark Deposit Paid' :
                             next === 'CONFIRMED'       ? '🎉 Confirm Safari' :
                             '🏁 Mark Completed'}
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
                  onClick={() => setShowNewShared(true)}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  + New Safari
                </button>
              </div>
              {/* New shared safari modal */}
              {showNewShared && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-bold mb-4">New Shared Safari</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Location *</label>
                        <select
                          value={newSharedForm.locationId}
                          onChange={(e) => setNewSharedForm((p) => ({ ...p, locationId: e.target.value }))}
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                        >
                          <option value="">Select location...</option>
                          {ownerLocations.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Safari Date *</label>
                        <input
                          type="date"
                          value={newSharedForm.safariDate}
                          onChange={(e) => setNewSharedForm((p) => ({ ...p, safariDate: e.target.value }))}
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Safari Type *</label>
                        <select
                          value={newSharedForm.safariType}
                          onChange={(e) => setNewSharedForm((p) => ({ ...p, safariType: e.target.value }))}
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                        >
                          {['Full Day', 'Morning Half', 'Afternoon Half'].map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Price Per Seat (LKR) *</label>
                        <input
                          type="number"
                          placeholder="3500"
                          value={newSharedForm.pricePerSeat}
                          onChange={(e) => setNewSharedForm((p) => ({ ...p, pricePerSeat: e.target.value }))}
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => setShowNewShared(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                      <button
                        onClick={handleCreateShared}
                        disabled={createSharedMutation.isPending}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                      >
                        {createSharedMutation.isPending ? 'Creating...' : 'Create Safari'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

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
