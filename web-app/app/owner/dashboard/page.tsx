'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
};

export default function OwnerDashboard() {
  const [tab, setTab] = useState<'overview' | 'shared' | 'private' | 'vendors'>('overview');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: me } = useQuery<MeData>({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data),
    enabled: mounted,
  });

  const { data: dashData } = useQuery({
    queryKey: ['owner-dashboard'],
    queryFn: () => api.get('/owner/dashboard').then((r) => r.data.data),
    enabled: mounted,
  });

  const { data: jeepsData } = useQuery({
    queryKey: ['owner-jeeps'],
    queryFn: () => api.get('/shared-safari/owner/jeeps').then((r) => r.data.data),
    enabled: tab === 'shared',
  });

  const { data: vendorPaymentsData } = useQuery({
    queryKey: ['owner-vendor-payments'],
    queryFn: () => api.get('/owner/vendor-payments').then((r) => r.data.data),
    enabled: tab === 'vendors',
  });

  const features = me?.features?.filter((f) => f.enabled).map((f) => f.feature) || [];
  const has = (f: string) => features.includes(f);
  const stats = dashData?.stats;

  // Build dynamic tabs based on enabled features
  const tabs: { key: string; label: string }[] = [{ key: 'overview', label: 'Overview' }];
  if (has('SHARED_TRIPS'))       tabs.push({ key: 'shared',   label: 'Shared Safaris' });
  if (has('PRIVATE_SAFARI'))     tabs.push({ key: 'private',  label: 'Private Safaris' });
  if (has('VENDOR_LISTINGS'))    tabs.push({ key: 'vendors',  label: 'Vendor Payments' });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {me?.safariOwner?.companyName || dashData?.owner?.companyName || 'Owner Dashboard'}
          </h1>
          <p className="text-sm text-gray-500">Safari Owner Portal</p>
        </div>
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Logout
        </button>
      </div>

      {/* Dynamic tabs — only enabled features appear */}
      <div className="bg-white border-b px-6">
        <div className="flex overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-5 py-3 text-sm font-medium border-b-2 capitalize whitespace-nowrap ${
                tab === t.key ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {/* Subscription warning */}
        {me?.safariOwner?.subscriptionStatus && me.safariOwner.subscriptionStatus !== 'ACTIVE' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 text-sm font-medium">
              ⚠️ Subscription {me.safariOwner.subscriptionStatus.toLowerCase()}. Contact Super Admin.
            </p>
          </div>
        )}

        {/* No features yet */}
        {features.length === 0 && (
          <Card className="mb-6">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-3">🔒</div>
              <p className="font-semibold text-gray-700">No features enabled yet</p>
              <p className="text-gray-400 text-sm mt-1">
                The Super Admin will assign features to your account. Check back soon.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Overview */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Upcoming Shared',   value: stats.upcomingShared,    icon: '🚙', show: has('SHARED_TRIPS') },
                { label: 'Upcoming Private',  value: stats.upcomingPrivate,   icon: '👑', show: has('PRIVATE_SAFARI') },
                { label: 'Month Revenue',     value: formatCurrency(parseFloat(stats.monthRevenue || '0')), icon: '💰', show: has('REPORTS_ANALYTICS') },
                { label: 'Pending Payments',  value: stats.pendingVendorPayments, icon: '⏳', show: has('VENDOR_LISTINGS') },
              ].filter((s) => s.show).map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <span className="text-3xl">{s.icon}</span>
                    <div>
                      <p className="text-xs text-gray-500">{s.label}</p>
                      <p className="text-xl font-bold">{s.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Feature quick-access cards */}
            {features.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {has('SHARED_TRIPS') && (
                  <button onClick={() => setTab('shared')}
                    className="bg-green-50 hover:bg-green-100 border-2 border-green-100 rounded-2xl p-5 text-left transition-colors">
                    <div className="text-3xl mb-2">🚙</div>
                    <p className="font-semibold text-gray-800">Shared Safaris</p>
                    <p className="text-xs text-gray-500 mt-0.5">Manage group trips</p>
                  </button>
                )}
                {has('PRIVATE_SAFARI') && (
                  <button onClick={() => setTab('private')}
                    className="bg-amber-50 hover:bg-amber-100 border-2 border-amber-100 rounded-2xl p-5 text-left transition-colors">
                    <div className="text-3xl mb-2">👑</div>
                    <p className="font-semibold text-gray-800">Private Safaris</p>
                    <p className="text-xs text-gray-500 mt-0.5">Exclusive bookings</p>
                  </button>
                )}
                {has('VENDOR_LISTINGS') && (
                  <button onClick={() => setTab('vendors')}
                    className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-100 rounded-2xl p-5 text-left transition-colors">
                    <div className="text-3xl mb-2">🔧</div>
                    <p className="font-semibold text-gray-800">Vendor Payments</p>
                    <p className="text-xs text-gray-500 mt-0.5">Pay your vendors</p>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Shared Safaris */}
        {tab === 'shared' && has('SHARED_TRIPS') && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Shared Safaris</h2>
              <button
                onClick={() => {
                  const date = prompt('Safari date (YYYY-MM-DD):');
                  const type = prompt('Type (Full Day / Morning Half / Afternoon Half):');
                  const price = prompt('Price per seat (LKR):');
                  if (date && type && price) {
                    api.post('/shared-safari/jeeps', { safariDate: date, safariType: type, pricePerSeat: parseFloat(price) })
                      .then(() => alert('Safari created!'))
                      .catch(() => alert('Failed to create safari'));
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                + New Safari
              </button>
            </div>
            {jeepsData?.map((jeep: any) => (
              <Card key={jeep.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{jeep.safariType}</p>
                      <p className="text-sm text-gray-500">{formatShortDate(jeep.safariDate)}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {jeep.paidSeats}/{jeep.totalSeats} paid · {jeep.reservedSeats} reserved
                      </p>
                    </div>
                    <Badge variant={STATUS_BADGE[jeep.status] || 'secondary'}>{jeep.status}</Badge>
                  </div>
                  {jeep.bookings?.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-2">Bookings</p>
                      <div className="grid grid-cols-2 gap-2">
                        {jeep.bookings.map((b: any) => (
                          <div key={b.id} className="text-xs bg-gray-50 rounded p-2">
                            <p className="font-medium">Seat #{b.seatNumber} — {b.customer?.user?.name}</p>
                            <p className="text-gray-400">{b.status}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Vendor Payments */}
        {tab === 'vendors' && has('VENDOR_LISTINGS') && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Vendor Payments</h2>
            {vendorPaymentsData?.map((payment: any) => (
              <Card key={payment.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{payment.vendor?.user?.name}</p>
                    <p className="text-xs text-gray-500">{payment.description}</p>
                    <p className="text-sm font-semibold mt-1">{formatCurrency(parseFloat(payment.amount))}</p>
                  </div>
                  {payment.status === 'PENDING' ? (
                    <button
                      onClick={() => api.post(`/owner/vendor-payments/${payment.id}/mark-paid`).then(() => alert('Marked paid!'))}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded-lg"
                    >
                      Mark Paid
                    </button>
                  ) : (
                    <Badge variant="success">PAID</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Private Safaris placeholder */}
        {tab === 'private' && has('PRIVATE_SAFARI') && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-3">👑</div>
              <p className="font-semibold text-gray-700">Private Safaris</p>
              <p className="text-gray-400 text-sm mt-1">Manage via the mobile app for full functionality.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
