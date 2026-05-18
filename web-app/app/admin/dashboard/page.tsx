'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { BillingTab } from '@/components/admin/BillingTab';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { NavItem } from '@/components/layout/Sidebar';
import { StatCard } from '@/components/ui/stat-card';
import {
  LayoutDashboard, Users, Zap, CreditCard, Store, MapPin, CalendarDays, BarChart2,
  LogOut, Car, Globe, ClipboardList, Wrench, TrendingUp, ChevronDown, ChevronUp,
  CheckCircle, XCircle, MousePointerClick,
} from 'lucide-react';

const ADMIN_NAV_ITEMS: NavItem[] = [
  { key: 'Overview',   label: 'Overview',   icon: LayoutDashboard },
  { key: 'Users',      label: 'Users',      icon: Users },
  { key: 'Features',   label: 'Features',   icon: Zap },
  { key: 'Billing',    label: 'Billing',    icon: CreditCard },
  { key: 'Vendors',    label: 'Vendors',    icon: Store },
  { key: 'Locations',  label: 'Locations',  icon: MapPin },
  { key: 'Bookings',   label: 'Bookings',   icon: CalendarDays },
  { key: 'Analytics',  label: 'Analytics',  icon: BarChart2 },
  { key: 'logout',     label: 'Sign Out',   icon: LogOut, danger: true },
];

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

const ALL_FEATURES = [
  { key: 'SHARED_TRIPS',        label: 'Shared Trips',        icon: Car,             roles: ['SAFARI_OWNER'] },
  { key: 'PRIVATE_SAFARI',      label: 'Private Safari',      icon: Globe,           roles: ['SAFARI_OWNER'] },
  { key: 'BOOKING_MANAGEMENT',  label: 'Booking Management',  icon: ClipboardList,   roles: ['SAFARI_OWNER', 'VENDOR'] },
  { key: 'VENDOR_LISTINGS',     label: 'Vendor Listings',     icon: Wrench,          roles: ['SAFARI_OWNER'] },
  { key: 'REPORTS_ANALYTICS',   label: 'Reports & Analytics', icon: TrendingUp,      roles: ['SAFARI_OWNER', 'VENDOR'] },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [newLocName, setNewLocName] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');
  const [editLocId, setEditLocId] = useState<string | null>(null);
  const [editLocName, setEditLocName] = useState('');
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('PAYMENT_PENDING');
  const [editEmailUserId, setEditEmailUserId] = useState<string | null>(null);
  const [editEmailValue, setEditEmailValue] = useState('');
  const qc = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
    } else {
      setAuthed(true);
    }
  }, [router]);

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data.data),
    enabled: authed,
    retry: false,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics').then((r) => r.data.data),
    enabled: authed,
    retry: false,
  });

  const { data: pendingUsers, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin-pending-users'],
    queryFn: () => api.get('/admin/users/pending').then((r) => r.data.data),
    enabled: authed && activeTab === 'Users',
    retry: false,
  });

  const { data: allUsers } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: () => api.get('/admin/users').then((r) => r.data.data),
    enabled: authed && (activeTab === 'Users' || activeTab === 'Features' || activeTab === 'Analytics'),
    retry: false,
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: () => api.get('/admin/vendors').then((r) => r.data.data),
    enabled: authed && activeTab === 'Vendors',
    retry: false,
  });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['admin-bookings', bookingStatusFilter],
    queryFn: () => api.get(`/admin/bookings?status=${bookingStatusFilter}`).then((r) => r.data.data),
    enabled: authed && activeTab === 'Bookings',
    retry: false,
  });

  const { data: locationsData, isLoading: locLoading } = useQuery({
    queryKey: ['admin-locations'],
    queryFn: () => api.get('/admin/locations').then((r) => r.data.data),
    enabled: authed && activeTab === 'Locations',
    retry: false,
  });

  const { data: ownersData } = useQuery({
    queryKey: ['admin-owners'],
    queryFn: () => api.get('/admin/owners').then((r) => r.data.data),
    enabled: authed && activeTab === 'Locations',
    retry: false,
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

  const ownerLocationMutation = useMutation({
    mutationFn: ({ userId, locationIds }: { userId: string; locationIds: string[] }) =>
      api.put(`/admin/owners/${userId}/locations`, { locationIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-owners'] }),
  });

  const vendorLocationMutation = useMutation({
    mutationFn: ({ userId, locationIds }: { userId: string; locationIds: string[] }) =>
      api.put(`/admin/vendors/${userId}/locations`, { locationIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-vendors'] }),
  });

  const refundMutation = useMutation({
    mutationFn: (bookingId: string) => api.post(`/admin/bookings/${bookingId}/refund`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-bookings', bookingStatusFilter] }),
  });

  const createLocMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      api.post('/admin/locations', { name, description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-locations'] });
      setNewLocName('');
      setNewLocDesc('');
    },
  });

  const toggleLocMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/locations/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-locations'] }),
  });

  const updateLocMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch(`/admin/locations/${id}`, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-locations'] });
      setEditLocId(null);
    },
  });

  const changeEmailMutation = useMutation({
    mutationFn: ({ userId, email }: { userId: string; email: string }) =>
      api.patch(`/admin/users/${userId}/email`, { email }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-all-users'] });
      setEditEmailUserId(null);
      setEditEmailValue('');
    },
  });

  const selectedUser = allUsers?.find((u: any) => u.id === selectedUserId);

  const toggleFeature = (userId: string, feature: string, currentEnabled: boolean) => {
    featureMutation.mutate({ userId, features: [{ feature, enabled: !currentEnabled }] });
  };

  const stats = statsData;
  const sharedPieData = analyticsData?.sharedByStatus?.map((s: any) => ({ name: s.status, value: s._count })) || [];

  const statusBadge = (status: string): string => {
    const map: Record<string, string> = {
      PENDING:  'pwa-badge pwa-badge-amber',
      APPROVED: 'pwa-badge pwa-badge-green',
      REJECTED: 'pwa-badge pwa-badge-red',
    };
    return map[status] || 'pwa-badge';
  };

  const handleAdminTabChange = (key: string) => {
    if (key === 'logout') { localStorage.clear(); window.location.href = '/login'; return; }
    setActiveTab(key);
  };

  if (!authed) return null;

  return (
    <DashboardShell
      title="Super Admin Dashboard"
      navItems={ADMIN_NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={handleAdminTabChange}
      userName="Super Admin"
      userRole="SUPER_ADMIN"
      onLogout={() => { localStorage.clear(); window.location.href = '/login'; }}
    >
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* ── OVERVIEW ── */}
        {activeTab === 'Overview' && stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Active Owners" value={`${stats.owners.active} / ${stats.owners.total}`} icon={Globe} iconBg="bg-green-100" iconColor="text-green-600" />
              <StatCard label="Active Vendors" value={`${stats.vendors.active} / ${stats.vendors.total}`} icon={Store} iconBg="bg-blue-100" iconColor="text-blue-600" />
              <StatCard label="Pending Approvals" value={stats.pendingApprovals} icon={Users} iconBg="bg-amber-100" iconColor="text-amber-600" highlight={stats.pendingApprovals > 0} />
              <StatCard label="Monthly Revenue" value={formatCurrency(parseFloat(String(stats.revenue.thisMonth)))} icon={TrendingUp} iconBg="bg-purple-100" iconColor="text-purple-600" sub={`${formatCurrency(parseFloat(String(stats.revenue.pending)))} pending`} />
            </div>
            {sharedPieData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="pwa-card">
                  <div style={{ padding: '16px 16px 0' }}>
                    <h2 style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', margin: 0 }}>Shared Safaris by Status</h2>
                  </div>
                  <div style={{ padding: 16 }}>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={sharedPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {sharedPieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="pwa-card">
                  <div style={{ padding: '16px 16px 0' }}>
                    <h2 style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', margin: 0 }}>Safari Overview</h2>
                  </div>
                  <div style={{ padding: 16 }}>
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
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === 'Users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Pending approvals */}
            <div className="pwa-card">
              <div style={{ padding: '16px 16px 0' }}>
                <h2 style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Pending Approvals
                  {pendingUsers?.length > 0 && (
                    <span style={{ background: '#ef4444', color: '#fff', fontSize: 11, borderRadius: 999, padding: '1px 8px' }}>{pendingUsers.length}</span>
                  )}
                </h2>
              </div>
              <div style={{ padding: 16 }}>
                {pendingLoading ? (
                  <p style={{ color: '#6B6B6B', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Loading...</p>
                ) : pendingUsers?.length === 0 ? (
                  <p style={{ color: '#6B6B6B', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No pending approvals</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {pendingUsers?.map((u: any) => (
                      <div key={u.id} style={{ border: '1px solid #E8E5DE', borderRadius: 12, padding: 16, background: '#FFFBF0' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <p style={{ fontWeight: 600, color: '#1A1A1A', margin: 0 }}>{u.name}</p>
                              <span style={{ fontSize: 11, background: '#E8E5DE', color: '#6B6B6B', borderRadius: 999, padding: '1px 8px' }}>{u.role}</span>
                            </div>
                            <p style={{ fontSize: 13, color: '#6B6B6B', margin: 0 }}>{u.email}</p>
                            {u.vendor && (
                              <p style={{ fontSize: 11, color: '#9B9B9B', marginTop: 4 }}>
                                {u.vendor.businessName} · {u.vendor.vendorType?.replace('_', ' ')}
                                {u.vendor.businessAddress && ` · ${u.vendor.businessAddress}`}
                              </p>
                            )}
                            {u.safariOwner && (
                              <p style={{ fontSize: 11, color: '#9B9B9B', marginTop: 4 }}>
                                {u.safariOwner.companyName} · {u.safariOwner.companyAddress}
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <button
                              onClick={() => approveMutation.mutate(u.id)}
                              disabled={approveMutation.isPending}
                              className="pwa-btn pwa-btn-primary pwa-btn-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const note = prompt('Rejection reason (optional):') || 'Rejected by admin';
                                rejectMutation.mutate({ userId: u.id, note });
                              }}
                              disabled={rejectMutation.isPending}
                              className="pwa-btn pwa-btn-sm"
                              style={{ background: '#fee2e2', color: '#b91c1c' }}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                        <p style={{ fontSize: 11, color: '#9B9B9B', marginTop: 8 }}>
                          Registered {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* All users */}
            <div className="pwa-card">
              <div style={{ padding: '16px 16px 0' }}>
                <h2 style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', margin: 0 }}>All Users</h2>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E8E5DE' }}>
                        <th style={{ textAlign: 'left', padding: '8px 0', color: '#6B6B6B', fontWeight: 600, fontSize: 12 }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '8px 0', color: '#6B6B6B', fontWeight: 600, fontSize: 12 }}>Role</th>
                        <th style={{ textAlign: 'left', padding: '8px 0', color: '#6B6B6B', fontWeight: 600, fontSize: 12 }}>Business</th>
                        <th style={{ textAlign: 'left', padding: '8px 0', color: '#6B6B6B', fontWeight: 600, fontSize: 12 }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '8px 0', color: '#6B6B6B', fontWeight: 600, fontSize: 12 }}>Features</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers?.map((u: any) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #E8E5DE' }}>
                          <td style={{ padding: '12px 0' }}>
                            <p style={{ fontWeight: 500, margin: 0 }}>{u.name}</p>
                            {editEmailUserId === u.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                <input
                                  value={editEmailValue}
                                  onChange={(e) => setEditEmailValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') changeEmailMutation.mutate({ userId: u.id, email: editEmailValue });
                                    if (e.key === 'Escape') setEditEmailUserId(null);
                                  }}
                                  className="pwa-input"
                                  style={{ fontSize: 11, padding: '2px 8px', width: 160 }}
                                  autoFocus
                                />
                                <button
                                  onClick={() => changeEmailMutation.mutate({ userId: u.id, email: editEmailValue })}
                                  disabled={changeEmailMutation.isPending}
                                  className="pwa-btn pwa-btn-primary pwa-btn-sm"
                                  style={{ fontSize: 11, padding: '2px 8px' }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditEmailUserId(null)}
                                  style={{ fontSize: 11, color: '#6B6B6B', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditEmailUserId(u.id); setEditEmailValue(u.email); }}
                                style={{ fontSize: 11, color: '#6B6B6B', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', marginTop: 2 }}
                                title="Click to change email"
                              >
                                {u.email}
                              </button>
                            )}
                          </td>
                          <td style={{ padding: '12px 0', color: '#6B6B6B', fontSize: 11 }}>{u.role}</td>
                          <td style={{ padding: '12px 0', color: '#6B6B6B', fontSize: 11 }}>
                            {u.vendor?.businessName || u.safariOwner?.companyName || '—'}
                          </td>
                          <td style={{ padding: '12px 0' }}>
                            <span className={statusBadge(u.approvalStatus)}>{u.approvalStatus}</span>
                          </td>
                          <td style={{ padding: '12px 0', fontSize: 11, color: '#9B9B9B' }}>
                            {u.features?.filter((f: any) => f.enabled).length || 0} enabled
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FEATURES ── */}
        {activeTab === 'Features' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User selector */}
            <div className="pwa-card md:col-span-1">
              <div style={{ padding: '16px 16px 0' }}>
                <h2 style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', margin: 0 }}>Select User</h2>
              </div>
              <div style={{ padding: 0 }}>
                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                  {allUsers?.filter((u: any) => u.approvalStatus === 'APPROVED').map((u: any) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 16px',
                        background: selectedUserId === u.id ? '#E3EFE9' : 'transparent',
                        borderLeft: selectedUserId === u.id ? '3px solid #2D6A4F' : '3px solid transparent',
                        border: 'none',
                        borderBottom: '1px solid #E8E5DE',
                        cursor: 'pointer',
                        display: 'block',
                      }}
                    >
                      <p style={{ fontWeight: 500, fontSize: 13, color: '#1A1A1A', margin: 0 }}>{u.name}</p>
                      <p style={{ fontSize: 11, color: '#9B9B9B', margin: '2px 0 0' }}>{u.role} · {u.vendor?.businessName || u.safariOwner?.companyName}</p>
                      <p style={{ fontSize: 11, color: '#2D6A4F', margin: '2px 0 0' }}>
                        {u.features?.filter((f: any) => f.enabled).length || 0} features active
                      </p>
                    </button>
                  ))}
                  {allUsers?.filter((u: any) => u.approvalStatus === 'APPROVED').length === 0 && (
                    <p style={{ color: '#6B6B6B', fontSize: 13, textAlign: 'center', padding: 16 }}>No approved users yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Feature toggles */}
            <div className="pwa-card md:col-span-2">
              <div style={{ padding: '16px 16px 0' }}>
                <h2 style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', margin: 0 }}>
                  {selectedUser ? `Features for ${selectedUser.name}` : 'Select a user to manage features'}
                </h2>
              </div>
              <div style={{ padding: 16 }}>
                {!selectedUser ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#9B9B9B' }}>
                    <MousePointerClick style={{ width: 32, height: 32, margin: '0 auto 8px', color: '#D1D5DB', display: 'block' }} />
                    <p style={{ fontSize: 13, margin: 0 }}>Select an approved user from the left</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {ALL_FEATURES.filter((f) => f.roles.includes(selectedUser.role)).map((feat) => {
                      const userFeat = selectedUser.features?.find((f: any) => f.feature === feat.key);
                      const isEnabled = userFeat?.enabled || false;
                      return (
                        <div
                          key={feat.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 16,
                            borderRadius: 12,
                            border: isEnabled ? '2px solid #C6DDD1' : '2px solid #E8E5DE',
                            background: isEnabled ? '#E3EFE9' : '#FAFAF7',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 8,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: isEnabled ? '#C6DDD1' : '#E8E5DE',
                            }}>
                              <feat.icon style={{ width: 18, height: 18, color: isEnabled ? '#2D6A4F' : '#9B9B9B' }} />
                            </div>
                            <div>
                              <p style={{ fontWeight: 500, fontSize: 13, color: '#1A1A1A', margin: 0 }}>{feat.label}</p>
                              <p style={{ fontSize: 11, color: '#9B9B9B', margin: '2px 0 0' }}>For {feat.roles.join(', ').replace(/_/g, ' ')}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleFeature(selectedUser.id, feat.key, isEnabled)}
                            disabled={featureMutation.isPending}
                            style={{
                              position: 'relative',
                              display: 'inline-flex',
                              height: 24,
                              width: 44,
                              alignItems: 'center',
                              borderRadius: 9999,
                              background: isEnabled ? '#2D6A4F' : '#D1D5DB',
                              border: 'none',
                              cursor: featureMutation.isPending ? 'not-allowed' : 'pointer',
                              opacity: featureMutation.isPending ? 0.5 : 1,
                              transition: 'background 0.2s',
                              padding: 0,
                              flexShrink: 0,
                            }}
                          >
                            <span style={{
                              display: 'inline-block',
                              height: 16,
                              width: 16,
                              borderRadius: 9999,
                              background: '#fff',
                              transform: isEnabled ? 'translateX(24px)' : 'translateX(4px)',
                              transition: 'transform 0.2s',
                            }} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Billing' && <BillingTab />}

        {/* ── LOCATIONS ── */}
        {activeTab === 'Locations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Create new location */}
            <div className="pwa-card">
              <div style={{ padding: '16px 16px 0' }}>
                <h2 style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', margin: 0 }}>Add New Location</h2>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <input
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                    placeholder="Location name (e.g. Yala National Park)"
                    className="pwa-input"
                    style={{ flex: 1, minWidth: 200 }}
                  />
                  <input
                    value={newLocDesc}
                    onChange={(e) => setNewLocDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="pwa-input"
                    style={{ flex: 1, minWidth: 200 }}
                  />
                  <button
                    onClick={() => {
                      if (!newLocName.trim()) return;
                      createLocMutation.mutate({ name: newLocName.trim(), description: newLocDesc.trim() || undefined });
                    }}
                    disabled={createLocMutation.isPending || !newLocName.trim()}
                    className="pwa-btn pwa-btn-primary"
                  >
                    {createLocMutation.isPending ? 'Adding...' : '+ Add Location'}
                  </button>
                </div>
              </div>
            </div>

            {/* Locations list */}
            <div className="pwa-card">
              <div style={{ padding: '16px 16px 0' }}>
                <h2 style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  All Locations
                  {locationsData && (
                    <span style={{ fontSize: 13, fontWeight: 400, color: '#9B9B9B' }}>
                      ({locationsData.filter((l: any) => l.isActive).length} active)
                    </span>
                  )}
                </h2>
              </div>
              <div style={{ padding: 16 }}>
                {locLoading ? (
                  <p style={{ color: '#6B6B6B', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Loading...</p>
                ) : !locationsData?.length ? (
                  <p style={{ color: '#6B6B6B', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No locations yet. Add one above.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {locationsData.map((loc: any) => (
                      <div
                        key={loc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          padding: 16,
                          borderRadius: 12,
                          border: loc.isActive ? '2px solid #C6DDD1' : '2px solid #E8E5DE',
                          background: loc.isActive ? '#E3EFE9' : '#FAFAF7',
                          opacity: loc.isActive ? 1 : 0.7,
                          transition: 'all 0.2s',
                        }}
                      >
                        <MapPin style={{ width: 16, height: 16, color: '#6B6B6B', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {editLocId === loc.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input
                                value={editLocName}
                                onChange={(e) => setEditLocName(e.target.value)}
                                className="pwa-input"
                                style={{ flex: 1, fontSize: 13, padding: '4px 8px' }}
                                autoFocus
                              />
                              <button
                                onClick={() => updateLocMutation.mutate({ id: loc.id, name: editLocName })}
                                disabled={updateLocMutation.isPending}
                                className="pwa-btn pwa-btn-primary pwa-btn-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditLocId(null)}
                                className="pwa-btn pwa-btn-secondary pwa-btn-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p style={{ fontWeight: 600, fontSize: 13, color: '#1A1A1A', margin: 0 }}>{loc.name}</p>
                              {loc.description && (
                                <p style={{ fontSize: 11, color: '#9B9B9B', margin: '2px 0 0' }}>{loc.description}</p>
                              )}
                              <p style={{ fontSize: 11, color: '#9B9B9B', margin: '2px 0 0' }}>
                                {loc._count?.owners || 0} owners · {loc._count?.vendors || 0} vendors
                              </p>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {editLocId !== loc.id && (
                            <button
                              onClick={() => { setEditLocId(loc.id); setEditLocName(loc.name); }}
                              className="pwa-btn pwa-btn-secondary pwa-btn-sm"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => toggleLocMutation.mutate({ id: loc.id, isActive: !loc.isActive })}
                            disabled={toggleLocMutation.isPending}
                            className="pwa-btn pwa-btn-sm"
                            style={loc.isActive
                              ? { background: '#fee2e2', color: '#b91c1c' }
                              : { background: '#E3EFE9', color: '#2D6A4F' }
                            }
                          >
                            {loc.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Owner location assignments */}
            <div className="pwa-card">
              <div style={{ padding: '16px 16px 0' }}>
                <h2 style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', margin: 0 }}>Owner Operating Locations</h2>
              </div>
              <div style={{ padding: 16 }}>
                {!ownersData?.length ? (
                  <p style={{ color: '#6B6B6B', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No approved owners yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {ownersData.map((owner: any) => {
                      const assigned = owner.locations.map((l: any) => l.location.id) as string[];
                      return (
                        <div key={owner.id} style={{ border: '1px solid #E8E5DE', borderRadius: 12, padding: 16 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, color: '#1A1A1A', margin: 0 }}>{owner.user?.name}</p>
                          <p style={{ fontSize: 11, color: '#9B9B9B', margin: '2px 0 12px' }}>{owner.companyName}</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                            {owner.locations.length === 0 && (
                              <span style={{ fontSize: 11, color: '#ef4444', fontStyle: 'italic' }}>No locations assigned</span>
                            )}
                            {owner.locations.map((l: any) => (
                              <span
                                key={l.location.id}
                                className="pwa-badge pwa-badge-green"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                <MapPin style={{ width: 10, height: 10 }} /> {l.location.name}
                                <button
                                  onClick={() => ownerLocationMutation.mutate({
                                    userId: owner.user.id,
                                    locationIds: assigned.filter((id) => id !== l.location.id),
                                  })}
                                  style={{ marginLeft: 4, color: '#2D6A4F', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, lineHeight: 1, padding: 0 }}
                                  title="Remove"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                if (!e.target.value) return;
                                if (assigned.includes(e.target.value)) return;
                                ownerLocationMutation.mutate({
                                  userId: owner.user.id,
                                  locationIds: [...assigned, e.target.value],
                                });
                                e.target.value = '';
                              }}
                              className="pwa-input"
                              style={{ flex: 1 }}
                            >
                              <option value="">+ Add a location...</option>
                              {locationsData?.filter((l: any) => l.isActive && !assigned.includes(l.id)).map((l: any) => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── VENDORS ── */}
        {activeTab === 'Vendors' && (
          <div className="pwa-card">
            <div style={{ padding: '16px 16px 0' }}>
              <h2 style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', margin: 0 }}>All Vendors</h2>
            </div>
            <div style={{ padding: 0 }}>
              <div>
                {vendorsData?.map((v: any) => {
                  const isExpanded = expandedVendorId === v.user.id;
                  const assigned = (v.locations ?? []).map((l: any) => l.location.id) as string[];
                  return (
                    <div key={v.id} style={{ borderBottom: '1px solid #E8E5DE' }}>
                      <button
                        onClick={() => setExpandedVendorId(isExpanded ? null : v.user.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px 20px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontWeight: 500, color: '#1A1A1A', fontSize: 13, margin: 0 }}>{v.businessName}</p>
                            <p style={{ fontSize: 11, color: '#9B9B9B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0' }}>{v.user.email} · {v.vendorType?.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span className={
                            v.subscriptionStatus === 'ACTIVE' ? 'pwa-badge pwa-badge-green' :
                            v.subscriptionStatus === 'EXPIRED' ? 'pwa-badge pwa-badge-red' :
                            'pwa-badge pwa-badge-amber'
                          }>{v.subscriptionStatus}</span>
                          <span className={statusBadge(v.user.approvalStatus)}>{v.user.approvalStatus}</span>
                          {isExpanded ? <ChevronUp style={{ width: 16, height: 16, color: '#6B6B6B' }} /> : <ChevronDown style={{ width: 16, height: 16, color: '#6B6B6B' }} />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div style={{ padding: '0 20px 16px', background: '#FAFAF7', borderTop: '1px solid #E8E5DE' }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '12px 0 8px' }}>Operating Locations</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                            {assigned.length === 0 && (
                              <span style={{ fontSize: 11, color: '#ef4444', fontStyle: 'italic' }}>No locations assigned</span>
                            )}
                            {(v.locations ?? []).map((l: any) => (
                              <span
                                key={l.location.id}
                                className="pwa-badge pwa-badge-green"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                <MapPin style={{ width: 10, height: 10 }} /> {l.location.name}
                                <button
                                  onClick={() => vendorLocationMutation.mutate({
                                    userId: v.user.id,
                                    locationIds: assigned.filter((id) => id !== l.location.id),
                                  })}
                                  style={{ marginLeft: 4, color: '#2D6A4F', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, lineHeight: 1, padding: 0 }}
                                  title="Remove"
                                >×</button>
                              </span>
                            ))}
                          </div>
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (!e.target.value || assigned.includes(e.target.value)) return;
                              vendorLocationMutation.mutate({ userId: v.user.id, locationIds: [...assigned, e.target.value] });
                              e.target.value = '';
                            }}
                            className="pwa-input"
                          >
                            <option value="">+ Add a location…</option>
                            {locationsData?.filter((l: any) => l.isActive && !assigned.includes(l.id)).map((l: any) => (
                              <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {activeTab === 'Bookings' && (
          <div className="pwa-card">
            <div style={{ padding: '16px 16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', margin: 0 }}>Bookings</h2>
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="pwa-input"
                  style={{ width: 'auto' }}
                >
                  <option value="PAYMENT_PENDING">Payment Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="RELEASED">Released</option>
                </select>
              </div>
            </div>
            <div style={{ padding: 16 }}>
              {bookingsLoading && <p style={{ fontSize: 13, color: '#6B6B6B', textAlign: 'center', padding: '24px 0' }}>Loading…</p>}
              {!bookingsLoading && (!bookingsData || bookingsData.length === 0) && (
                <p style={{ fontSize: 13, color: '#6B6B6B', textAlign: 'center', padding: '24px 0' }}>No bookings found.</p>
              )}
              {bookingsData && bookingsData.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E8E5DE' }}>
                        <th style={{ textAlign: 'left', padding: '8px 0', color: '#6B6B6B', fontWeight: 600, fontSize: 12 }}>Customer</th>
                        <th style={{ textAlign: 'left', padding: '8px 0', color: '#6B6B6B', fontWeight: 600, fontSize: 12 }}>Safari</th>
                        <th style={{ textAlign: 'left', padding: '8px 0', color: '#6B6B6B', fontWeight: 600, fontSize: 12 }}>Seat</th>
                        <th style={{ textAlign: 'left', padding: '8px 0', color: '#6B6B6B', fontWeight: 600, fontSize: 12 }}>Amount</th>
                        <th style={{ textAlign: 'left', padding: '8px 0', color: '#6B6B6B', fontWeight: 600, fontSize: 12 }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '8px 0', color: '#6B6B6B', fontWeight: 600, fontSize: 12 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsData.map((b: any) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid #E8E5DE' }}>
                          <td style={{ padding: '12px 0' }}>
                            <p style={{ fontWeight: 500, margin: 0 }}>{b.customer?.user?.name}</p>
                            <p style={{ fontSize: 11, color: '#9B9B9B', margin: '2px 0 0' }}>{b.customer?.user?.phone}</p>
                          </td>
                          <td style={{ padding: '12px 0' }}>
                            <p style={{ fontWeight: 500, margin: 0 }}>{b.jeep?.safariType}</p>
                            <p style={{ fontSize: 11, color: '#9B9B9B', margin: '2px 0 0' }}>
                              {b.jeep?.safariDate ? new Date(b.jeep.safariDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                            </p>
                          </td>
                          <td style={{ padding: '12px 0', color: '#1A1A1A' }}>#{b.seatNumber}</td>
                          <td style={{ padding: '12px 0', fontWeight: 500 }}>LKR {parseFloat(b.totalAmount).toLocaleString()}</td>
                          <td style={{ padding: '12px 0' }}>
                            <span className={
                              b.status === 'PAID' ? 'pwa-badge pwa-badge-green' :
                              b.status === 'PAYMENT_PENDING' ? 'pwa-badge pwa-badge-amber' :
                              b.status === 'REFUNDED' ? 'pwa-badge pwa-badge-red' :
                              'pwa-badge'
                            }>{b.status}</span>
                          </td>
                          <td style={{ padding: '12px 0' }}>
                            {b.status === 'PAID' && (
                              <button
                                onClick={() => {
                                  if (!confirm(`Refund LKR ${parseFloat(b.totalAmount).toLocaleString()} for ${b.customer?.user?.name}?`)) return;
                                  refundMutation.mutate(b.id);
                                }}
                                disabled={refundMutation.isPending}
                                className="pwa-btn pwa-btn-sm"
                                style={{ background: '#fee2e2', color: '#b91c1c' }}
                              >
                                Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {activeTab === 'Analytics' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Platform revenue card */}
            <div className="pwa-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#8A8A8A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Subscription Revenue · This Month</div>
                  <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 2, color: '#1A1A1A' }} className="tnum">
                    {analyticsData ? formatCurrency(parseFloat(String(analyticsData.subscriptionRevenue || '0'))) : '—'}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#2D6A4F', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {stats ? formatCurrency(parseFloat(String(stats.revenue.thisMonth || '0'))) + ' bookings' : ''}
                </span>
              </div>
              <div style={{ marginTop: 12 }}>
                <svg viewBox="0 0 320 100" width="100%" height="100">
                  <defs>
                    <linearGradient id="lg2" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M 0 90 L 32 85 L 64 75 L 96 70 L 128 55 L 160 60 L 192 42 L 224 38 L 256 28 L 288 22 L 320 12" fill="none" stroke="#2D6A4F" strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M 0 90 L 32 85 L 64 75 L 96 70 L 128 55 L 160 60 L 192 42 L 224 38 L 256 28 L 288 22 L 320 12 L 320 100 L 0 100 Z" fill="url(#lg2)" />
                  <circle cx="320" cy="12" r="4" fill="#2D6A4F" stroke="#fff" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Safari status breakdown */}
            {analyticsData && (
              <div className="pwa-card" style={{ padding: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 14px', color: '#1A1A1A' }}>Safari Status Breakdown</h3>
                {(() => {
                  const combined: Record<string, { shared: number; private: number }> = {};
                  (analyticsData.sharedByStatus || []).forEach((s: any) => {
                    combined[s.status] = { ...( combined[s.status] || { shared: 0, private: 0 }), shared: s._count };
                  });
                  (analyticsData.privateByStatus || []).forEach((s: any) => {
                    combined[s.status] = { ...( combined[s.status] || { shared: 0, private: 0 }), private: s._count };
                  });
                  const chartData = Object.entries(combined).map(([status, counts]) => ({
                    status: status.replace(/_/g, ' ').slice(0, 12),
                    Shared: counts.shared,
                    Private: counts.private,
                  }));
                  if (chartData.length === 0) return <p style={{ color: '#8A8A8A', fontSize: 13, textAlign: 'center' }}>No safari data this period</p>;
                  return (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" vertical={false} />
                        <XAxis dataKey="status" tick={{ fontSize: 9, fill: '#8A8A8A' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#8A8A8A' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8E5DE' }} />
                        <Bar dataKey="Shared" fill="#2D6A4F" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Private" fill="#8B5E3C" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            )}

            {/* Safari type split */}
            {stats && (
              <div className="pwa-card" style={{ padding: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 14px', color: '#1A1A1A' }}>Shared vs Private Safaris</h3>
                {(() => {
                  const total = (stats.safaris.shared || 0) + (stats.safaris.private || 0);
                  const sharedPct = total > 0 ? Math.round((stats.safaris.shared / total) * 100) : 50;
                  const privatePct = 100 - sharedPct;
                  const circumference = 2 * Math.PI * 38;
                  const sharedDash = (sharedPct / 100) * circumference;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <svg width="100" height="100" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#F1EEE7" strokeWidth="12" />
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#2D6A4F" strokeWidth="12"
                          strokeDasharray={`${sharedDash.toFixed(1)} ${circumference.toFixed(1)}`} strokeDashoffset="0"
                          transform="rotate(-90 50 50)" />
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#8B5E3C" strokeWidth="12"
                          strokeDasharray={`${(circumference - sharedDash).toFixed(1)} ${circumference.toFixed(1)}`}
                          strokeDashoffset={`${-sharedDash.toFixed(1)}`}
                          transform="rotate(-90 50 50)" />
                        <text x="50" y="46" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1A1A1A">{sharedPct}%</text>
                        <text x="50" y="60" textAnchor="middle" fontSize="9" fill="#8A8A8A">shared</text>
                      </svg>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: '#2D6A4F' }} />
                            <span style={{ fontSize: 12.5, fontWeight: 600 }}>Shared ({stats.safaris.shared})</span>
                          </div>
                          <span style={{ fontSize: 12.5, fontWeight: 700 }}>{sharedPct}%</span>
                        </div>
                        <div style={{ height: 1, background: '#E8E5DE', margin: '10px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: '#8B5E3C' }} />
                            <span style={{ fontSize: 12.5, fontWeight: 600 }}>Private ({stats.safaris.private})</span>
                          </div>
                          <span style={{ fontSize: 12.5, fontWeight: 700 }}>{privatePct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Top safari owners */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', color: '#1A1A1A' }}>Top Safari Owners</h3>
              <div className="pwa-card" style={{ overflow: 'hidden' }}>
                {(allUsers?.filter((u: any) => u.role === 'SAFARI_OWNER' && u.approvalStatus === 'APPROVED') || [])
                  .slice(0, 5)
                  .map((o: any, i: number, arr: any[]) => (
                    <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid #F1EEE7' : 'none' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: i < 3 ? '#FAEFD9' : '#FAFAF7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i < 3 ? 14 : 12, fontWeight: 700, color: '#8B5E3C', flexShrink: 0 }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {o.safariOwner?.companyName || o.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#8A8A8A' }}>Safari Owner</div>
                      </div>
                      <span className="pwa-badge pwa-badge-green">Active</span>
                    </div>
                  ))}
                {(!allUsers || allUsers.filter((u: any) => u.role === 'SAFARI_OWNER').length === 0) && (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#8A8A8A', fontSize: 13 }}>No safari owners yet</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
