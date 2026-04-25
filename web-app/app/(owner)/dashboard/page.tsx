'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'destructive' | 'info'> = {
  CONFIRMED: 'success',
  OPEN: 'info',
  PENDING_PAYMENT: 'warning',
  CANCELLED: 'destructive',
  COMPLETED: 'success',
};

export default function OwnerDashboard() {
  const [tab, setTab] = useState<'overview' | 'safaris' | 'vendors'>('overview');

  const { data: dashData } = useQuery({
    queryKey: ['owner-dashboard'],
    queryFn: () => api.get('/owner/dashboard').then((r) => r.data.data),
  });

  const { data: jeepsData } = useQuery({
    queryKey: ['owner-jeeps'],
    queryFn: () => api.get('/shared-safari/owner/jeeps').then((r) => r.data.data),
    enabled: tab === 'safaris',
  });

  const { data: vendorPaymentsData } = useQuery({
    queryKey: ['owner-vendor-payments'],
    queryFn: () => api.get('/owner/vendor-payments').then((r) => r.data.data),
    enabled: tab === 'vendors',
  });

  const stats = dashData?.stats;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{dashData?.owner?.companyName || 'Owner Dashboard'}</h1>
          <p className="text-sm text-gray-500">Safari Owner Portal</p>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.href = '/auth/login'; }} className="text-sm text-red-600">Logout</button>
      </div>

      <div className="bg-white border-b px-6">
        <div className="flex">
          {(['overview', 'safaris', 'vendors'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium border-b-2 capitalize ${
                tab === t ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Upcoming Shared', value: stats.upcomingShared, icon: '🚙' },
                { label: 'Upcoming Private', value: stats.upcomingPrivate, icon: '👑' },
                { label: 'Month Revenue', value: formatCurrency(parseFloat(stats.monthRevenue)), icon: '💰' },
                { label: 'Pending Payments', value: stats.pendingVendorPayments, icon: '⏳' },
              ].map((s) => (
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
          </div>
        )}

        {tab === 'safaris' && (
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

                  {jeep.bookings.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-2">Bookings</p>
                      <div className="grid grid-cols-2 gap-2">
                        {jeep.bookings.map((b: any) => (
                          <div key={b.id} className="text-xs bg-gray-50 rounded p-2">
                            <p className="font-medium">Seat #{b.seatNumber} — {b.customer.user.name}</p>
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

        {tab === 'vendors' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Vendor Payments</h2>
            {vendorPaymentsData?.map((payment: any) => (
              <Card key={payment.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{payment.vendor.user.name}</p>
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
      </div>
    </main>
  );
}
