'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BillingTab } from '@/components/admin/BillingTab';

const TABS = ['Overview', 'Users', 'Features', 'Billing', 'Vendors', 'Analytics'];
const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

const ALL_FEATURES = [
  { key: 'SHARED_TRIPS',        label: 'Shared Trips',        icon: '🚙', roles: ['SAFARI_OWNER'] },
  { key: 'PRIVATE_SAFARI',      label: 'Private Safari',      icon: '👑', roles: ['SAFARI_OWNER'] },
  { key: 'BOOKING_MANAGEMENT',  label: 'Booking Management',  icon: '📋', roles: ['SAFARI_OWNER', 'VENDOR'] },
  { key: 'VENDOR_LISTINGS',     label: 'Vendor Listings',     icon: '🔧', roles: ['SAFARI_OWNER'] },
  { key: 'REPORTS_ANALYTICS',   label: 'Reports & Analytics', icon: '📊', roles: ['SAFARI_OWNER', 'VENDOR'] },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const qc = useQueryClient();

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data.data),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics').then((r) => r.data.data),
  });

  const { data: pendingUsers, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin-pending-users'],
    queryFn: () => api.get('/admin/users/pending').then((r) => r.data.data),
    enabled: activeTab === 'Users',
  });

  const { data: allUsers } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: () => api.get('/admin/users').then((r) => r.data.data),
    enabled: activeTab === 'Users' || activeTab === 'Features',
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: () => api.get('/admin/vendors').then((r) => r.data.data),
    enabled: activeTab === 'Vendors',
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`/admin/users/${userId}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pending-users'] }); qc.invalidateQueries({ queryKey: ['admin-all-users'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ userId, note }: { userId: string; note: string }) =>
      api.patch(`/admin/users/${userId}/reject`, { note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pending-users'] }); qc.invalidateQueries({ queryKey: ['admin-all-users'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); },
  });

  const featureMutation = useMutation({
    mutationFn: ({ userId, features }: { userId: string; features: { feature: string; enabled: boolean }[] }) =>
      api.patch(`/admin/users/${userId}/features`, { features }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-all-users'] }),
  });

  const selectedUser = allUsers?.find((u: any) => u.id === selectedUserId);

  const toggleFeature = (userId: string, feature: string, currentEnabled: boolean) => {
    featureMutation.mutate({ userId, features: [{ feature, enabled: !currentEnabled }] });
  };

  const stats = statsData;
  const sharedPieData = analyticsData?.sharedByStatus?.map((s: any) => ({ name: s.status, value: s._count })) || [];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING:  'bg-amber-100 text-amber-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
    };
    return `text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-gray-100 text-gray-700'}`;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Safari Management System</p>
        </div>
        <div className="flex items-center gap-4">
          {stats?.pendingApprovals > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {stats.pendingApprovals} pending
            </span>
          )}
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Logout
          </button>
        </div>
      </div>

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
              {tab === 'Users' && stats?.pendingApprovals > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5">{stats.pendingApprovals}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {/* ── OVERVIEW ── */}
        {activeTab === 'Overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Active Owners',   value: stats.owners.active,    total: stats.owners.total,   color: 'text-green-700',  bg: 'bg-green-50' },
                { label: 'Active Vendors',  value: stats.vendors.active,   total: stats.vendors.total,  color: 'text-blue-700',   bg: 'bg-blue-50' },
                { label: 'Pending Approvals', value: stats.pendingApprovals, total: 'awaiting review', color: 'text-amber-700',  bg: 'bg-amber-50' },
                { label: 'Monthly Revenue', value: formatCurrency(parseFloat(String(stats.revenue.thisMonth))), total: `${formatCurrency(parseFloat(String(stats.revenue.pending)))} pending`, color: 'text-purple-700', bg: 'bg-purple-50' },
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
            {sharedPieData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Shared Safaris by Status</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={sharedPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
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
                        <XAxis dataKey="name" /><YAxis />
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

        {/* ── USERS ── */}
        {activeTab === 'Users' && (
          <div className="space-y-6">
            {/* Pending approvals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Pending Approvals
                  {pendingUsers?.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{pendingUsers.length}</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <p className="text-gray-400 text-sm py-4 text-center">Loading...</p>
                ) : pendingUsers?.length === 0 ? (
                  <p className="text-gray-400 text-sm py-4 text-center">No pending approvals</p>
                ) : (
                  <div className="space-y-3">
                    {pendingUsers?.map((u: any) => (
                      <div key={u.id} className="border rounded-xl p-4 bg-amber-50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900">{u.name}</p>
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{u.role}</span>
                            </div>
                            <p className="text-sm text-gray-500">{u.email}</p>
                            {u.vendor && (
                              <p className="text-xs text-gray-400 mt-1">
                                {u.vendor.businessName} · {u.vendor.vendorType?.replace('_', ' ')}
                                {u.vendor.businessAddress && ` · ${u.vendor.businessAddress}`}
                              </p>
                            )}
                            {u.safariOwner && (
                              <p className="text-xs text-gray-400 mt-1">
                                {u.safariOwner.companyName} · {u.safariOwner.companyAddress}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => approveMutation.mutate(u.id)}
                              disabled={approveMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const note = prompt('Rejection reason (optional):') || 'Rejected by admin';
                                rejectMutation.mutate({ userId: u.id, note });
                              }}
                              disabled={rejectMutation.isPending}
                              className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Registered {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All users */}
            <Card>
              <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="text-left py-2 text-gray-500 font-medium">Name</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Role</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Business</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Features</th>
                    </tr></thead>
                    <tbody>
                      {allUsers?.map((u: any) => (
                        <tr key={u.id} className="border-b hover:bg-gray-50">
                          <td className="py-3">
                            <p className="font-medium">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </td>
                          <td className="py-3 text-gray-500 text-xs">{u.role}</td>
                          <td className="py-3 text-gray-500 text-xs">
                            {u.vendor?.businessName || u.safariOwner?.companyName || '—'}
                          </td>
                          <td className="py-3">
                            <span className={statusBadge(u.approvalStatus)}>{u.approvalStatus}</span>
                          </td>
                          <td className="py-3 text-xs text-gray-400">
                            {u.features?.filter((f: any) => f.enabled).length || 0} enabled
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── FEATURES ── */}
        {activeTab === 'Features' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User selector */}
            <Card className="md:col-span-1">
              <CardHeader><CardTitle className="text-base">Select User</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[500px] overflow-y-auto">
                  {allUsers?.filter((u: any) => u.approvalStatus === 'APPROVED').map((u: any) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                        selectedUserId === u.id ? 'bg-green-50 border-l-2 border-green-600' : ''
                      }`}
                    >
                      <p className="font-medium text-sm text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.role} · {u.vendor?.businessName || u.safariOwner?.companyName}</p>
                      <p className="text-xs text-green-600 mt-0.5">
                        {u.features?.filter((f: any) => f.enabled).length || 0} features active
                      </p>
                    </button>
                  ))}
                  {allUsers?.filter((u: any) => u.approvalStatus === 'APPROVED').length === 0 && (
                    <p className="text-gray-400 text-sm p-4 text-center">No approved users yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Feature toggles */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedUser ? `Features for ${selectedUser.name}` : 'Select a user to manage features'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedUser ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-3xl mb-2">👈</div>
                    <p className="text-sm">Select an approved user from the left</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ALL_FEATURES.filter((f) => f.roles.includes(selectedUser.role)).map((feat) => {
                      const userFeat = selectedUser.features?.find((f: any) => f.feature === feat.key);
                      const isEnabled = userFeat?.enabled || false;
                      return (
                        <div key={feat.key} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
                          isEnabled ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{feat.icon}</span>
                            <div>
                              <p className="font-medium text-sm text-gray-900">{feat.label}</p>
                              <p className="text-xs text-gray-400">For {feat.roles.join(', ').replace(/_/g, ' ')}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleFeature(selectedUser.id, feat.key, isEnabled)}
                            disabled={featureMutation.isPending}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                              isEnabled ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'Billing' && <BillingTab />}

        {/* ── VENDORS ── */}
        {activeTab === 'Vendors' && (
          <Card>
            <CardHeader><CardTitle>All Vendors</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b">
                    <th className="text-left py-2 text-gray-500 font-medium">Name</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Type</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Subscription</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Approval</th>
                  </tr></thead>
                  <tbody>
                    {vendorsData?.map((v: any) => (
                      <tr key={v.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <p className="font-medium">{v.businessName}</p>
                          <p className="text-xs text-gray-400">{v.user.email}</p>
                        </td>
                        <td className="py-3 text-gray-500">{v.vendorType?.replace('_', ' ')}</td>
                        <td className="py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            v.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                            v.subscriptionStatus === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>{v.subscriptionStatus}</span>
                        </td>
                        <td className="py-3">
                          <span className={statusBadge(v.user.approvalStatus)}>{v.user.approvalStatus}</span>
                        </td>
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
