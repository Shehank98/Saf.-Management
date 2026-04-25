'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BillingTab } from '@/components/admin/BillingTab';

const TABS = ['Overview', 'Billing', 'Owners', 'Vendors', 'Analytics'];
const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data.data),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics').then((r) => r.data.data),
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: () => api.get('/admin/vendors').then((r) => r.data.data),
    enabled: activeTab === 'Vendors',
  });

  const stats = statsData;
  const analytics = analyticsData;

  const sharedPieData = analytics?.sharedByStatus?.map((s: any) => ({
    name: s.status,
    value: s._count,
  })) || [];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Safari Management System</p>
        </div>
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {activeTab === 'Overview' && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Active Owners', value: stats.owners.active, total: stats.owners.total, color: 'text-green-700', bg: 'bg-green-50' },
                { label: 'Active Vendors', value: stats.vendors.active, total: stats.vendors.total, color: 'text-blue-700', bg: 'bg-blue-50' },
                { label: 'Shared Safaris', value: stats.safaris.shared, total: 'this month', color: 'text-purple-700', bg: 'bg-purple-50' },
                { label: 'Monthly Revenue', value: formatCurrency(parseFloat(String(stats.revenue.thisMonth))), total: `${formatCurrency(parseFloat(String(stats.revenue.pending)))} pending`, color: 'text-amber-700', bg: 'bg-amber-50' },
              ].map((s) => (
                <Card key={s.label} className={s.bg}>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1">/ {s.total}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            {sharedPieData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Shared Safaris by Status</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={sharedPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {sharedPieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Safari Overview</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={[
                        { name: 'Shared', count: stats.safaris.shared },
                        { name: 'Private', count: stats.safaris.private },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Billing' && <BillingTab />}

        {activeTab === 'Vendors' && (
          <Card>
            <CardHeader><CardTitle>All Vendors</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b">
                    <th className="text-left py-2 text-gray-500 font-medium">Name</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Type</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Email</th>
                  </tr></thead>
                  <tbody>
                    {vendorsData?.map((v: any) => (
                      <tr key={v.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">{v.businessName}</td>
                        <td className="py-3 text-gray-500">{v.vendorType}</td>
                        <td className="py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            v.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                            v.subscriptionStatus === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>{v.subscriptionStatus}</span>
                        </td>
                        <td className="py-3 text-gray-500">{v.user.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
