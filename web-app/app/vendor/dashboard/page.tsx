'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UserFeature { feature: string; enabled: boolean; }
interface MeData {
  name: string; role: string; approvalStatus: string;
  features: UserFeature[];
  vendor?: { businessName: string; vendorType: string; subscriptionStatus: string; };
}

const FEATURE_LABELS: Record<string, { icon: string; label: string; desc: string }> = {
  BOOKING_MANAGEMENT: { icon: '📋', label: 'Booking Management', desc: 'View and manage your assigned bookings' },
  REPORTS_ANALYTICS:  { icon: '📊', label: 'Reports & Analytics', desc: 'View earnings and performance data' },
};

export default function VendorDashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: me } = useQuery<MeData>({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data),
    enabled: mounted,
  });

  const { data: earningsData } = useQuery({
    queryKey: ['vendor-earnings'],
    queryFn: () => api.get('/vendor/earnings').then((r) => r.data.data),
    enabled: mounted && !!me?.features?.find((f) => f.feature === 'REPORTS_ANALYTICS' && f.enabled),
  });

  const enabledFeatures = me?.features?.filter((f) => f.enabled).map((f) => f.feature) || [];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {me?.vendor?.businessName || 'Vendor Dashboard'}
          </h1>
          <p className="text-sm text-gray-500">
            {me?.vendor?.vendorType?.replace('_', ' ')} · {me?.vendor?.subscriptionStatus}
          </p>
        </div>
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Logout
        </button>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Subscription warning */}
        {me?.vendor?.subscriptionStatus !== 'ACTIVE' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm font-medium">
              ⚠️ Subscription {me?.vendor?.subscriptionStatus?.toLowerCase()}. Contact Super Admin to activate your subscription.
            </p>
          </div>
        )}

        {/* Active features */}
        {enabledFeatures.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enabledFeatures.map((feature) => {
                const info = FEATURE_LABELS[feature];
                if (!info) return null;
                return (
                  <Card key={feature} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-5 flex items-start gap-4">
                      <span className="text-3xl">{info.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{info.label}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{info.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-10 text-center">
              <div className="text-4xl mb-3">🔒</div>
              <p className="text-gray-500 font-medium">No features enabled yet</p>
              <p className="text-gray-400 text-sm mt-1">
                The Super Admin will assign features to your account.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Earnings (only if REPORTS_ANALYTICS enabled) */}
        {enabledFeatures.includes('REPORTS_ANALYTICS') && earningsData && (
          <Card>
            <CardHeader><CardTitle>Earnings</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-700">
                    LKR {parseFloat(earningsData.total || '0').toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Payments</p>
                  <p className="text-2xl font-bold text-blue-700">{earningsData.payments?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
