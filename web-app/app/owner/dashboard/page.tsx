'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { NavItem } from '@/components/layout/Sidebar';
import {
  LayoutDashboard, Globe, Car, Wallet, Settings, LogOut, Lock,
  Plus, AlertCircle, Clock, CalendarClock, Sun, Sunrise, Sunset,
  MapPin, User, Phone, Mail, FileText, DollarSign, Tag, Check,
  ArrowRight, Flag, Users, Compass, UtensilsCrossed, BedDouble, Camera,
  TrendingUp, Copy, CheckCircle2, BarChart2,
} from 'lucide-react';

interface UserFeature { feature: string; enabled: boolean; }
interface MeData {
  name: string; role: string; approvalStatus: string;
  features: UserFeature[];
  safariOwner?: {
    companyName: string;
    subscriptionStatus: string;
    subscriptionEnd: string | null;
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

// PWA badge class mapping for safari booking statuses
const STATUS_PWA_BADGE: Record<string, string> = {
  INQUIRY:         'pwa-badge pwa-badge-blue',
  DEPOSIT_PENDING: 'pwa-badge pwa-badge-amber',
  DEPOSIT_PAID:    'pwa-badge pwa-badge-green',
  CONFIRMED:       'pwa-badge pwa-badge-green',
  COMPLETED:       'pwa-badge pwa-badge-gray',
  CANCELLED:       'pwa-badge pwa-badge-red',
  OPEN:            'pwa-badge pwa-badge-blue',
  PENDING_PAYMENT: 'pwa-badge pwa-badge-amber',
  FULLY_BOOKED:    'pwa-badge pwa-badge-green',
  PAID:            'pwa-badge pwa-badge-green',
  PENDING:         'pwa-badge pwa-badge-amber',
};

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

export default function OwnerDashboard() {
  const [tab, setTab]             = useState<string>('overview');
  const [mounted, setMounted]     = useState(false);
  const [showNewPrivate, setShowNewPrivate] = useState(false);
  const [showSendLink, setShowSendLink] = useState(false);
  const [sendLinkPhone, setSendLinkPhone] = useState('');
  const [sendLinkName, setSendLinkName] = useState('');
  const [newPrivateForm, setNewPrivateForm] = useState({
    safariDate: '', safariType: 'Full Day', numberOfGuests: '', totalAmount: '',
    customerName: '', customerPhone: '', customerEmail: '', specialRequests: '', locationId: '',
  });
  const [showNewShared, setShowNewShared] = useState(false);
  const [newSharedForm, setNewSharedForm] = useState({ safariDate: '', safariType: 'Full Day', pricePerSeat: '', locationId: '' });
  const [expandedJeeps, setExpandedJeeps] = useState<Set<string>>(new Set());
  const toggleJeep = (id: string) => setExpandedJeeps((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Vendor assignment state
  const [vendorAssignSafari, setVendorAssignSafari] = useState<any>(null);
  const [vendorTab, setVendorTab] = useState<string>('JEEP_PROVIDER');
  const [vendorForm, setVendorForm] = useState({
    jeepVendorId: '', jeepNumber: '', rentalFee: '',
    guideVendorId: '', guideFee: '',
    restaurantVendorId: '', mealCost: '', numberOfMeals: '1',
    accommodationVendorId: '', accommodationCost: '',
    cameraVendorId: '', cameraCost: '',
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

  const { data: ownerLocations = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['owner-locations'],
    queryFn: () => api.get('/owner/locations').then((r) => r.data.data),
    enabled: mounted,
  });

  const [sharedStatusFilter, setSharedStatusFilter] = useState<string>('ALL');

  const { data: jeepsData } = useQuery({
    queryKey: ['owner-jeeps'],
    queryFn: () => api.get('/shared-safari/owner/jeeps').then((r) => r.data.data),
    enabled: tab === 'shared' || tab === 'overview',
    refetchInterval: (tab === 'shared' || tab === 'overview') ? 30_000 : false,
  });

  const { data: privateSafaris, isLoading: privateLoading } = useQuery({
    queryKey: ['owner-private-safaris'],
    queryFn: () => api.get('/private-safari/owner/list').then((r) => r.data.data),
    enabled: tab === 'private' || tab === 'revenue',
  });

  const { data: vendorPaymentsData } = useQuery({
    queryKey: ['owner-vendor-payments'],
    queryFn: () => api.get('/owner/vendor-payments').then((r) => r.data.data),
    enabled: tab === 'vendors',
  });

  const { data: pricingData, isLoading: pricingLoading } = useQuery<{
    priceFullDay: string | null; priceHalfDayMorning: string | null; priceHalfDayAfternoon: string | null;
    mealPrice: string | null; portalUrl: string; ownerId?: string;
  }>({
    queryKey: ['owner-pricing'],
    queryFn: () => api.get('/owner/pricing').then((r) => {
      const d = r.data.data;
      // If backend returned a relative URL (no WEB_APP_URL set), fix it client-side
      if (d.portalUrl && d.portalUrl.startsWith('/')) {
        d.portalUrl = `${window.location.origin}${d.portalUrl}`;
      }
      return d;
    }),
    enabled: mounted,
  });

  const [pricingForm, setPricingForm] = useState({ priceFullDay: '', priceHalfDayMorning: '', priceHalfDayAfternoon: '', mealPrice: '' });
  const [pricingLoaded, setPricingLoaded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState('');

  useEffect(() => {
    if (pricingData && !pricingLoaded) {
      setPricingForm({
        priceFullDay:          pricingData.priceFullDay ?? '',
        priceHalfDayMorning:   pricingData.priceHalfDayMorning ?? '',
        priceHalfDayAfternoon: pricingData.priceHalfDayAfternoon ?? '',
        mealPrice:             pricingData.mealPrice ?? '',
      });
      setPricingLoaded(true);
    }
  }, [pricingData, pricingLoaded]);

  const savePricingMutation = useMutation({
    mutationFn: (body: any) => api.put('/owner/pricing', body),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['owner-pricing'] });
      const msg = res.data?.message || 'Pricing saved.';
      setScheduleMsg(msg);
      setTimeout(() => setScheduleMsg(''), 6000);
    },
  });

  const { data: availableVendors = [] } = useQuery<any[]>({
    queryKey: ['available-vendors', vendorAssignSafari?.safariDate],
    queryFn: () =>
      api.get('/vendors/available', {
        params: { date: vendorAssignSafari?.safariDate },
      }).then((r) => r.data.data),
    enabled: !!vendorAssignSafari,
  });

  const assignVendorMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      api.patch(`/private-safari/${id}/assign-vendors`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-private-safaris'] });
      setVendorAssignSafari(null);
      setVendorForm({ jeepVendorId: '', jeepNumber: '', rentalFee: '', guideVendorId: '', guideFee: '', restaurantVendorId: '', mealCost: '', numberOfMeals: '1', accommodationVendorId: '', accommodationCost: '', cameraVendorId: '', cameraCost: '' });
    },
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

  const cancelSharedMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/shared-safari/${id}/status`, { status: 'CANCELLED' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-jeeps'] }),
  });

  const features = me?.features?.filter((f) => f.enabled).map((f) => f.feature) || [];
  const has      = (f: string) => features.includes(f);
  const stats    = dashData?.stats;

  const navItems: NavItem[] = [{ key: 'overview', label: 'Overview', icon: LayoutDashboard }];
  if (has('PRIVATE_SAFARI'))   navItems.push({ key: 'private', label: 'Private Safaris', icon: Globe });
  if (has('SHARED_TRIPS'))     navItems.push({ key: 'shared',  label: 'Shared Safaris',  icon: Car });
  if (has('VENDOR_LISTINGS'))  navItems.push({ key: 'vendors', label: 'Vendor Payments', icon: Wallet });
  if (has('REPORTS_ANALYTICS')) navItems.push({ key: 'revenue', label: 'Analytics', icon: BarChart2 });
  navItems.push({ key: 'settings', label: 'Booking Settings', icon: Settings });
  navItems.push({ key: 'logout', label: 'Sign Out', icon: LogOut, danger: true });

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

  const handleTabChange = (key: string) => {
    if (key === 'logout') { localStorage.clear(); window.location.href = '/login'; return; }
    setTab(key);
  };

  return (
    <DashboardShell
      title={me?.safariOwner?.companyName || dashData?.owner?.companyName || 'Owner Dashboard'}
      navItems={navItems}
      activeTab={tab}
      onTabChange={handleTabChange}
      userName={me?.name}
      userRole={me?.role}
      onLogout={() => { localStorage.clear(); window.location.href = '/login'; }}
    >
      <div className="max-w-4xl mx-auto" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Subscription banner */}
        {me?.safariOwner?.subscriptionStatus && (() => {
          const s = me.safariOwner!;
          const daysLeft = s.subscriptionEnd
            ? Math.ceil((new Date(s.subscriptionEnd).getTime() - Date.now()) / 86400000)
            : null;
          if (s.subscriptionStatus === 'EXPIRED')
            return (
              <div className="pwa-notice pwa-notice-red">
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 2 }}>Subscription Expired</p>
                  <p style={{ fontSize: 13 }}>Your account is inactive. Contact Super Admin to renew your subscription.</p>
                </div>
              </div>
            );
          if (s.subscriptionStatus === 'PENDING_PAYMENT')
            return (
              <div className="pwa-notice pwa-notice-amber">
                <Clock style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 2 }}>Subscription Pending Payment</p>
                  <p style={{ fontSize: 13 }}>Contact Super Admin to complete your subscription payment (LKR 2,500/month).</p>
                </div>
              </div>
            );
          if (s.subscriptionStatus === 'ACTIVE' && daysLeft !== null && daysLeft <= 14)
            return (
              <div className="pwa-notice pwa-notice-amber">
                <CalendarClock style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 2 }}>Subscription Expiring Soon</p>
                  <p style={{ fontSize: 13 }}>
                    Expires on {new Date(s.subscriptionEnd!).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })} ({daysLeft} day{daysLeft !== 1 ? 's' : ''} left). Contact Super Admin to renew.
                  </p>
                </div>
              </div>
            );
          return null;
        })()}

        {/* No features */}
        {features.length === 0 && (
          <div className="pwa-card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, background: '#F1EEE7', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Lock style={{ width: 24, height: 24, color: '#8A8A8A' }} />
            </div>
            <p style={{ fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>No features enabled yet</p>
            <p style={{ color: '#8A8A8A', fontSize: 13 }}>The Super Admin will assign features to your account.</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ========== OVERVIEW ========== */}
          {tab === 'overview' && (
            <motion.div key="overview" {...fadeIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {has('PRIVATE_SAFARI') && (
                    <StatCard label="Upcoming Private" value={stats.upcomingPrivate} icon={Globe} iconBg="bg-amber-100" iconColor="text-amber-600" />
                  )}
                  {has('SHARED_TRIPS') && (
                    <StatCard label="Upcoming Shared" value={stats.upcomingShared} icon={Car} iconBg="bg-green-100" iconColor="text-green-600" />
                  )}
                  {has('REPORTS_ANALYTICS') && (
                    <StatCard label="Month Revenue" value={formatCurrency(parseFloat(stats.monthRevenue || '0'))} icon={TrendingUp} iconBg="bg-blue-100" iconColor="text-blue-600" />
                  )}
                  {has('VENDOR_LISTINGS') && (
                    <StatCard label="Pending Payments" value={stats.pendingVendorPayments} icon={Clock} iconBg="bg-red-100" iconColor="text-red-600" />
                  )}
                </div>
              )}

              {/* Customer Booking Portal — always visible in overview */}
              {has('SHARED_TRIPS') && (
                <div className="pwa-card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E3EFE9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#1A1A1A', margin: 0 }}>Your Customer Booking Portal</p>
                      <p style={{ fontSize: 12, color: '#8A8A8A', margin: 0 }}>Share this link — customers book only your safaris</p>
                    </div>
                  </div>
                  {pricingData?.portalUrl ? (
                    <>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <input
                          readOnly
                          value={pricingData.portalUrl}
                          className="pwa-input"
                          style={{ fontFamily: 'monospace', fontSize: 12, color: '#555', flex: 1, minWidth: 0 }}
                        />
                        <button
                          onClick={() => { navigator.clipboard.writeText(pricingData.portalUrl); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }}
                          className="pwa-btn pwa-btn-primary"
                          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                        >
                          {copySuccess ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                      <button
                        onClick={() => { setShowSendLink(true); setSendLinkPhone(''); setSendLinkName(''); }}
                        className="pwa-btn pwa-btn-secondary"
                        style={{ width: '100%', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                        Send WhatsApp Link to Customer
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setTab('settings')} className="pwa-btn pwa-btn-secondary" style={{ width: '100%', fontSize: 13 }}>
                      Set pricing to activate portal →
                    </button>
                  )}
                </div>
              )}

              {/* Jeep pipeline card */}
              {has('SHARED_TRIPS') && jeepsData && jeepsData.length > 0 && (() => {
                const open      = (jeepsData as any[]).filter((j) => j.status === 'OPEN').length;
                const paying    = (jeepsData as any[]).filter((j) => j.status === 'PENDING_PAYMENT').length;
                const confirmed = (jeepsData as any[]).filter((j) => j.status === 'CONFIRMED').length;
                const done      = (jeepsData as any[]).filter((j) => ['COMPLETED','CANCELLED'].includes(j.status)).length;
                const nudgeBookings = (jeepsData as any[]).flatMap((j) => (j.bookings || []).filter((b: any) => b.status === 'RESERVED' && j.status !== 'CANCELLED'));
                const recentBookings = (jeepsData as any[])
                  .flatMap((j) => (j.bookings || []).map((b: any) => ({ ...b, jeep: j })))
                  .sort((a: any, bk: any) => new Date(bk.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5);
                return (
                  <>
                    {/* Status pipeline */}
                    <div className="pwa-card" style={{ padding: 16 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>Shared Safari Pipeline</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        {[
                          { label: 'Open', count: open, bg: '#DBEAFE', color: '#1D4ED8' },
                          { label: 'Paying', count: paying, bg: '#FEF3C7', color: '#92400E' },
                          { label: 'Confirmed', count: confirmed, bg: '#DCFCE7', color: '#166534' },
                          { label: 'Done', count: done, bg: '#F1F5F9', color: '#64748B' },
                        ].map(({ label, count, bg, color }) => (
                          <div key={label} style={{ background: bg, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color }}>{count}</div>
                            <div style={{ fontSize: 11, color, opacity: 0.8, fontWeight: 600, marginTop: 2 }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* WhatsApp nudge callout */}
                    {nudgeBookings.length > 0 && (
                      <div className="pwa-notice pwa-notice-amber" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                          <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <p style={{ fontWeight: 700, margin: 0, fontSize: 13 }}>{nudgeBookings.length} customer{nudgeBookings.length !== 1 ? 's' : ''} awaiting payment</p>
                            <p style={{ margin: 0, fontSize: 12 }}>Nudge via WhatsApp to collect faster</p>
                          </div>
                        </div>
                        <button onClick={() => setTab('shared')} className="pwa-btn pwa-btn-sm" style={{ background: '#25D366', color: '#fff', border: 'none', flexShrink: 0, fontSize: 11, padding: '6px 10px' }}>
                          View
                        </button>
                      </div>
                    )}

                    {/* Recent bookings */}
                    {recentBookings.length > 0 && (
                      <div className="pwa-card" style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid #F0EDE6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Recent Bookings</p>
                          <button onClick={() => setTab('shared')} style={{ fontSize: 12, color: '#2D6A4F', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>See all →</button>
                        </div>
                        {recentBookings.map((b: any, i: number) => {
                          const name = b.customer?.user?.name || 'Guest';
                          const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                          const isPaid = b.status === 'PAID' || b.status === 'CONFIRMED';
                          return (
                            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < recentBookings.length - 1 ? '1px solid #F7F5F2' : 'none' }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: isPaid ? '#E3EFE9' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: isPaid ? '#2D6A4F' : '#92400E', flexShrink: 0 }}>
                                {initials}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                                <p style={{ fontSize: 11, color: '#8A8A8A', margin: 0 }}>{b.jeep.safariType} · Seat {b.seatNumber}</p>
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '2px 7px', background: isPaid ? '#E3EFE9' : '#FEF3C7', color: isPaid ? '#2D6A4F' : '#92400E', flexShrink: 0 }}>
                                {b.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}

              {features.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {has('PRIVATE_SAFARI') && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                      onClick={() => setTab('private')}
                      style={{
                        background: '#FAEFD9', border: '2px solid #F4E1C1', borderRadius: 14,
                        padding: 20, textAlign: 'left', transition: 'all 0.18s', cursor: 'pointer',
                      }}
                    >
                      <div style={{ width: 40, height: 40, background: '#F4E1C1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Globe style={{ width: 20, height: 20, color: '#8B5E3C' }} />
                      </div>
                      <p style={{ fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>Private Safaris</p>
                      <p style={{ fontSize: 12, color: '#8A8A8A' }}>Manual bookings you control</p>
                    </motion.button>
                  )}
                  {has('SHARED_TRIPS') && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.16 }}
                      onClick={() => setTab('shared')}
                      style={{
                        background: '#E3EFE9', border: '2px solid #C6DDD1', borderRadius: 14,
                        padding: 20, textAlign: 'left', transition: 'all 0.18s', cursor: 'pointer',
                      }}
                    >
                      <div style={{ width: 40, height: 40, background: '#C6DDD1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Car style={{ width: 20, height: 20, color: '#2D6A4F' }} />
                      </div>
                      <p style={{ fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>Shared Safaris</p>
                      <p style={{ fontSize: 12, color: '#8A8A8A' }}>Group bookings via link</p>
                    </motion.button>
                  )}
                  {has('VENDOR_LISTINGS') && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.22 }}
                      onClick={() => setTab('vendors')}
                      style={{
                        background: '#DBEAFE', border: '2px solid #BFDBFE', borderRadius: 14,
                        padding: 20, textAlign: 'left', transition: 'all 0.18s', cursor: 'pointer',
                      }}
                    >
                      <div style={{ width: 40, height: 40, background: '#BFDBFE', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Wallet style={{ width: 20, height: 20, color: '#1E40AF' }} />
                      </div>
                      <p style={{ fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>Vendor Payments</p>
                      <p style={{ fontSize: 12, color: '#8A8A8A' }}>Pay your vendors</p>
                    </motion.button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ========== PRIVATE SAFARIS ========== */}
          {tab === 'private' && has('PRIVATE_SAFARI') && (
            <motion.div key="private" {...fadeIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Private Safaris</h2>
                  <p style={{ fontSize: 13, color: '#8A8A8A', marginTop: 2 }}>Manage your manual customer bookings</p>
                </div>
                <button
                  onClick={() => setShowNewPrivate(true)}
                  className="pwa-btn pwa-btn-primary"
                  style={{ background: '#8B5E3C', gap: 6 }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New Booking
                </button>
              </div>

              {/* New booking modal */}
              {showNewPrivate && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)', zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                  }}
                  onClick={(e) => e.target === e.currentTarget && setShowNewPrivate(false)}
                >
                  <motion.div
                    initial={{ scale: 0.94, opacity: 0, y: 16 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.94, opacity: 0, y: 16 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    style={{
                      background: '#fff', borderRadius: 20,
                      boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
                      width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto',
                    }}
                  >
                    {/* Modal header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '24px 24px 16px', borderBottom: '1px solid #E8E5DE',
                    }}>
                      <div>
                        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>New Private Safari Booking</h3>
                        <p style={{ fontSize: 12, color: '#8A8A8A', marginTop: 3 }}>Fill in the customer and safari details</p>
                      </div>
                      <button
                        onClick={() => setShowNewPrivate(false)}
                        style={{
                          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '50%', border: 'none', background: 'transparent',
                          color: '#8A8A8A', cursor: 'pointer', fontSize: 20, lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </div>

                    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {/* Customer Info section */}
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#8B5E3C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Customer Information</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
                              Customer Name <span style={{ color: '#C0392B' }}>*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. John Silva"
                              value={newPrivateForm.customerName}
                              onChange={(e) => setNewPrivateForm((p) => ({ ...p, customerName: e.target.value }))}
                              className="pwa-input"
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                              <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>Phone Number</label>
                              <input
                                type="tel"
                                placeholder="+94771234567"
                                value={newPrivateForm.customerPhone}
                                onChange={(e) => setNewPrivateForm((p) => ({ ...p, customerPhone: e.target.value }))}
                                className="pwa-input"
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>Email Address</label>
                              <input
                                type="email"
                                placeholder="john@example.com"
                                value={newPrivateForm.customerEmail}
                                onChange={(e) => setNewPrivateForm((p) => ({ ...p, customerEmail: e.target.value }))}
                                className="pwa-input"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Safari Details section */}
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#8B5E3C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Safari Details</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                              <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
                                Safari Date <span style={{ color: '#C0392B' }}>*</span>
                              </label>
                              <input
                                type="date"
                                value={newPrivateForm.safariDate}
                                onChange={(e) => setNewPrivateForm((p) => ({ ...p, safariDate: e.target.value }))}
                                className="pwa-input"
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
                                No. of Guests <span style={{ color: '#C0392B' }}>*</span>
                              </label>
                              <input
                                type="number"
                                min="1"
                                placeholder="e.g. 4"
                                value={newPrivateForm.numberOfGuests}
                                onChange={(e) => setNewPrivateForm((p) => ({ ...p, numberOfGuests: e.target.value }))}
                                className="pwa-input"
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
                              Safari Location <span style={{ color: '#C0392B' }}>*</span>
                            </label>
                            <select
                              value={newPrivateForm.locationId}
                              onChange={(e) => setNewPrivateForm((p) => ({ ...p, locationId: e.target.value }))}
                              className="pwa-input"
                            >
                              <option value="">Select a location...</option>
                              {ownerLocations.map((l) => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 8 }}>
                              Safari Type <span style={{ color: '#C0392B' }}>*</span>
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                              {[
                                { value: 'Full Day', label: 'Full Day', icon: Sun },
                                { value: 'Half Day Morning', label: 'Morning', icon: Sunrise },
                                { value: 'Half Day Afternoon', label: 'Afternoon', icon: Sunset },
                              ].map((t) => (
                                <button
                                  key={t.value}
                                  type="button"
                                  onClick={() => setNewPrivateForm((p) => ({ ...p, safariType: t.value }))}
                                  style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                    padding: 12, borderRadius: 12,
                                    border: newPrivateForm.safariType === t.value ? '2px solid #8B5E3C' : '2px solid #E8E5DE',
                                    background: newPrivateForm.safariType === t.value ? '#FAEFD9' : '#FAFAF7',
                                    cursor: 'pointer', fontSize: 12, fontWeight: 500,
                                    color: newPrivateForm.safariType === t.value ? '#8B5E3C' : '#8A8A8A',
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  <t.icon style={{ width: 20, height: 20, color: newPrivateForm.safariType === t.value ? '#8B5E3C' : '#8A8A8A' }} />
                                  <span style={{ textAlign: 'center', lineHeight: 1.3 }}>{t.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pricing section */}
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#8B5E3C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Pricing</p>
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
                            Total Package Price (LKR) <span style={{ color: '#C0392B' }}>*</span>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 600, color: '#8A8A8A' }}>LKR</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="50,000"
                              value={newPrivateForm.totalAmount}
                              onChange={(e) => setNewPrivateForm((p) => ({ ...p, totalAmount: e.target.value }))}
                              className="pwa-input"
                              style={{ paddingLeft: 52 }}
                            />
                          </div>
                          {newPrivateForm.totalAmount && parseFloat(newPrivateForm.totalAmount) > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              style={{
                                marginTop: 10, display: 'flex', alignItems: 'center', gap: 12,
                                background: '#FAEFD9', border: '1px solid #F4E1C1', borderRadius: 12, padding: '12px 16px',
                              }}
                            >
                              <DollarSign style={{ width: 20, height: 20, color: '#8B5E3C' }} />
                              <div>
                                <p style={{ fontSize: 12, color: '#8B5E3C', fontWeight: 600, marginBottom: 2 }}>30% Deposit Required</p>
                                <p style={{ fontSize: 16, fontWeight: 800, color: '#7A5233' }}>{formatCurrency(Math.round(parseFloat(newPrivateForm.totalAmount) * 30) / 100)}</p>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Special Requests */}
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#8B5E3C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Additional Details</p>
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>Special Requests</label>
                          <textarea
                            rows={3}
                            placeholder="Any special requirements, dietary needs, accessibility needs..."
                            value={newPrivateForm.specialRequests}
                            onChange={(e) => setNewPrivateForm((p) => ({ ...p, specialRequests: e.target.value }))}
                            className="pwa-input"
                            style={{ height: 'auto', resize: 'none', paddingTop: 10, paddingBottom: 10 }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Modal footer */}
                    <div style={{ display: 'flex', gap: 12, padding: '8px 24px 24px' }}>
                      <button
                        onClick={() => setShowNewPrivate(false)}
                        className="pwa-btn pwa-btn-secondary"
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreatePrivate}
                        disabled={createPrivateMutation.isPending}
                        className="pwa-btn pwa-btn-primary"
                        style={{ flex: 1, background: '#8B5E3C' }}
                      >
                        {createPrivateMutation.isPending ? 'Creating...' : 'Create Booking'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Loading */}
              {privateLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12 }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #E8E5DE', borderTopColor: '#8B5E3C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ fontSize: 13, color: '#8A8A8A' }}>Loading safaris...</p>
                </div>
              )}

              {/* Empty state */}
              {!privateLoading && privateSafaris?.length === 0 && (
                <motion.div {...fadeIn}>
                  <div className="pwa-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, background: '#FAEFD9', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Globe style={{ width: 32, height: 32, color: '#8B5E3C' }} />
                    </div>
                    <p style={{ fontWeight: 700, color: '#1A1A1A', fontSize: 16, marginBottom: 8 }}>No Private Safaris Yet</p>
                    <p style={{ color: '#8A8A8A', fontSize: 13, maxWidth: 280, margin: '0 auto 20px' }}>
                      When customers contact you via WhatsApp, phone, or email — create their booking here.
                    </p>
                    <button
                      onClick={() => setShowNewPrivate(true)}
                      className="pwa-btn pwa-btn-primary"
                      style={{ background: '#8B5E3C' }}
                    >
                      + Create First Booking
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Safari cards */}
              {privateSafaris?.map((safari: any, i: number) => {
                const customer = safari.booking?.customer?.user;
                const displayName = safari.customerName || customer?.name;
                const displayPhone = safari.customerPhone || customer?.phone;
                const displayEmail = safari.customerEmail || customer?.email;
                const badgeClass = STATUS_PWA_BADGE[safari.status] || 'pwa-badge pwa-badge-gray';
                const next = nextStatus[safari.status];
                return (
                  <motion.div key={safari.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <div className="pwa-card" style={{ padding: 16 }}>
                      {/* Card header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ width: 40, height: 40, background: '#FAEFD9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {safari.safariType === 'Full Day'
                              ? <Sun style={{ width: 20, height: 20, color: '#8B5E3C' }} />
                              : safari.safariType === 'Half Day Morning'
                              ? <Sunrise style={{ width: 20, height: 20, color: '#8B5E3C' }} />
                              : <Sunset style={{ width: 20, height: 20, color: '#8B5E3C' }} />}
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{safari.safariType}</p>
                            <p style={{ fontSize: 13, color: '#8A8A8A' }}>{formatShortDate(safari.safariDate)}</p>
                            {safari.location && (
                              <p style={{ fontSize: 12, color: '#8A8A8A', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <MapPin style={{ width: 12, height: 12 }} />{safari.location.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={badgeClass} style={{ whiteSpace: 'nowrap' }}>
                          {safari.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Customer info */}
                      {(displayName || displayPhone || displayEmail) && (
                        <div style={{ background: '#FAFAF7', borderRadius: 10, padding: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {displayName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                              <User style={{ width: 14, height: 14, color: '#8A8A8A', flexShrink: 0 }} />
                              <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{displayName}</span>
                            </div>
                          )}
                          {displayPhone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                              <Phone style={{ width: 14, height: 14, color: '#8A8A8A', flexShrink: 0 }} />
                              <span style={{ color: '#555' }}>{displayPhone}</span>
                            </div>
                          )}
                          {displayEmail && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                              <Mail style={{ width: 14, height: 14, color: '#8A8A8A', flexShrink: 0 }} />
                              <span style={{ color: '#555' }}>{displayEmail}</span>
                            </div>
                          )}
                          {safari.specialRequests && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, paddingTop: 8, borderTop: '1px solid #E8E5DE', marginTop: 2 }}>
                              <FileText style={{ width: 14, height: 14, color: '#8A8A8A', flexShrink: 0, marginTop: 1 }} />
                              <span style={{ color: '#8A8A8A', fontStyle: 'italic' }}>{safari.specialRequests}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Stats row — 2 cols */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                        <div style={{ background: '#FAFAF7', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                          <p style={{ fontSize: 12, color: '#8A8A8A', marginBottom: 2 }}>Guests</p>
                          <p style={{ fontWeight: 800, color: '#1A1A1A', fontSize: 20 }}>{safari.numberOfGuests}</p>
                        </div>
                        <div style={{ background: '#E3EFE9', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                          <p style={{ fontSize: 12, color: '#8A8A8A', marginBottom: 2 }}>Total Package</p>
                          <p style={{ fontWeight: 800, color: '#2D6A4F', fontSize: 15 }}>{formatCurrency(Math.round(parseFloat(safari.totalAmount)))}</p>
                        </div>
                      </div>

                      {/* Deposit panel */}
                      <div style={{
                        borderRadius: 12,
                        border: safari.depositPaid
                          ? '1px solid #C6DDD1'
                          : safari.status === 'DEPOSIT_PENDING'
                          ? '1px solid #F4E1C1'
                          : '1px solid #E8E5DE',
                        background: safari.depositPaid
                          ? '#E3EFE9'
                          : safari.status === 'DEPOSIT_PENDING'
                          ? '#FAEFD9'
                          : '#FAFAF7',
                        marginBottom: 10,
                        overflow: 'hidden',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                          <div>
                            <p style={{ fontSize: 11, color: '#8A8A8A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>30% Deposit</p>
                            <p style={{ fontWeight: 800, fontSize: 18, marginTop: 2, color: safari.depositPaid ? '#2D6A4F' : '#1A1A1A' }}>
                              {formatCurrency(Math.round(parseFloat(safari.depositAmount)))}
                            </p>
                          </div>
                          <span style={{
                            fontSize: 12, fontWeight: 600, padding: '6px 10px', borderRadius: 8,
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: safari.depositPaid ? '#C6DDD1' : safari.status === 'DEPOSIT_PENDING' ? '#F4E1C1' : '#E8E5DE',
                            color: safari.depositPaid ? '#1F4F3A' : safari.status === 'DEPOSIT_PENDING' ? '#8B5E3C' : '#8A8A8A',
                          }}>
                            {safari.depositPaid
                              ? <><CheckCircle2 style={{ width: 12, height: 12 }} />Received</>
                              : safari.status === 'DEPOSIT_PENDING'
                              ? <><Clock style={{ width: 12, height: 12 }} />Awaiting Payment</>
                              : 'Not Yet Requested'}
                          </span>
                        </div>

                        {safari.status === 'DEPOSIT_PENDING' && !safari.depositPaid && (
                          <div style={{ borderTop: '1px solid #F4E1C1', background: '#fff', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {displayPhone && (
                              <a
                                href={`https://wa.me/${displayPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                  `Hi ${displayName || 'there'}, your ${safari.safariType} safari on ${formatShortDate(safari.safariDate)} is confirmed. Please pay the 30% deposit of ${formatCurrency(Math.round(parseFloat(safari.depositAmount)))} to secure your booking. Thank you!`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                  width: '100%', padding: '10px 0', borderRadius: 10,
                                  background: '#25D366', color: '#fff', fontSize: 13,
                                  fontWeight: 600, textDecoration: 'none', transition: 'background 0.15s',
                                }}
                              >
                                <svg style={{ width: 16, height: 16 }} fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                Send Deposit Request via WhatsApp
                              </a>
                            )}
                            <button
                              onClick={() => statusMutation.mutate({ id: safari.id, status: 'DEPOSIT_PAID' })}
                              disabled={statusMutation.isPending}
                              className="pwa-btn pwa-btn-primary"
                              style={{ width: '100%' }}
                            >
                              <CheckCircle2 style={{ width: 16, height: 16 }} /> Mark Deposit Received
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Assigned vendors summary */}
                      {(safari.jeepAssignment || safari.guideAssignment || safari.mealOrders?.length > 0) && (
                        <div style={{ border: '1px solid #E8E5DE', borderRadius: 12, padding: 12, marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Assigned Vendors</p>
                          {safari.jeepAssignment && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                              <span style={{ color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Car style={{ width: 14, height: 14 }} /> Jeep — {safari.jeepAssignment.vendor?.user?.name} ({safari.jeepAssignment.jeepNumber})
                              </span>
                              <span style={{ fontWeight: 600 }}>{formatCurrency(parseFloat(safari.jeepAssignment.rentalFee))}</span>
                            </div>
                          )}
                          {safari.guideAssignment && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                              <span style={{ color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Compass style={{ width: 14, height: 14 }} /> Guide — {safari.guideAssignment.vendor?.user?.name}
                              </span>
                              <span style={{ fontWeight: 600 }}>{formatCurrency(parseFloat(safari.guideAssignment.guideFee))}</span>
                            </div>
                          )}
                          {safari.mealOrders?.map((m: any) => (
                            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                              <span style={{ color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <UtensilsCrossed style={{ width: 14, height: 14 }} /> Meals — {m.vendor?.user?.name}
                              </span>
                              <span style={{ fontWeight: 600 }}>{formatCurrency(parseFloat(m.totalCost))}</span>
                            </div>
                          ))}
                          {parseFloat(safari.vendorCosts) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingTop: 6, borderTop: '1px solid #E8E5DE', marginTop: 2 }}>
                              <span style={{ color: '#8A8A8A' }}>Vendor costs</span>
                              <span style={{ fontWeight: 600, color: '#C0392B' }}>− {formatCurrency(parseFloat(safari.vendorCosts))}</span>
                            </div>
                          )}
                          {parseFloat(safari.vendorCosts) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                              <span style={{ color: '#555', fontWeight: 500 }}>Net profit</span>
                              <span style={{ fontWeight: 700, color: '#2D6A4F' }}>{formatCurrency(parseFloat(safari.profit))}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Assign vendors button — available from DEPOSIT_PAID onward */}
                      {['DEPOSIT_PAID', 'CONFIRMED', 'DEPOSIT_PENDING'].includes(safari.status) && (
                        <button
                          onClick={() => {
                            setVendorAssignSafari(safari);
                            setVendorTab('JEEP_PROVIDER');
                            setVendorForm({
                              jeepVendorId: safari.jeepAssignment?.vendorId || '',
                              jeepNumber: safari.jeepAssignment?.jeepNumber || '',
                              rentalFee: safari.jeepAssignment?.rentalFee?.toString() || '',
                              guideVendorId: safari.guideAssignment?.vendorId || '',
                              guideFee: safari.guideAssignment?.guideFee?.toString() || '',
                              restaurantVendorId: safari.mealOrders?.[0]?.vendorId || '',
                              mealCost: safari.mealOrders?.[0]?.totalCost?.toString() || '',
                              numberOfMeals: safari.mealOrders?.[0]?.numberOfMeals?.toString() || '1',
                              accommodationVendorId: safari.accommodationId || '',
                              accommodationCost: '',
                              cameraVendorId: '',
                              cameraCost: '',
                            });
                          }}
                          className="pwa-btn pwa-btn-secondary"
                          style={{ width: '100%', marginBottom: 8, borderColor: '#F4E1C1', color: '#8B5E3C' }}
                        >
                          <Tag style={{ width: 14, height: 14 }} />
                          {safari.jeepAssignment || safari.guideAssignment ? 'Edit Vendor Assignments' : 'Assign Vendors'}
                        </button>
                      )}

                      {/* Action button — DEPOSIT_PAID handled inside deposit panel above */}
                      {next && next !== 'DEPOSIT_PAID' && (
                        <button
                          onClick={() => statusMutation.mutate({ id: safari.id, status: next })}
                          disabled={statusMutation.isPending}
                          className="pwa-btn pwa-btn-primary"
                          style={{
                            width: '100%',
                            background: next === 'DEPOSIT_PENDING'
                              ? '#8B5E3C'
                              : next === 'CONFIRMED'
                              ? '#2E6BB8'
                              : '#2D6A4F',
                          }}
                        >
                          {next === 'DEPOSIT_PENDING' ? 'Request Deposit' :
                           next === 'CONFIRMED'        ? 'Confirm Safari' :
                           'Mark as Completed'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ========== VENDOR ASSIGNMENT MODAL ========== */}
          {vendorAssignSafari && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
              }}
              onClick={(e) => e.target === e.currentTarget && setVendorAssignSafari(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{
                  background: '#fff', borderRadius: 16,
                  boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
                  width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '20px 24px 16px', borderBottom: '1px solid #E8E5DE',
                }}>
                  <div>
                    <p style={{ fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Assign Vendors</p>
                    <p style={{ fontSize: 12, color: '#8A8A8A', marginTop: 2 }}>{vendorAssignSafari.safariType} · {formatShortDate(vendorAssignSafari.safariDate)}</p>
                  </div>
                  <button
                    onClick={() => setVendorAssignSafari(null)}
                    style={{
                      width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%', border: 'none', background: 'transparent',
                      color: '#8A8A8A', cursor: 'pointer', fontSize: 20,
                    }}
                  >×</button>
                </div>

                {/* Vendor type tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #E8E5DE', overflowX: 'auto' }}>
                  {[
                    { key: 'JEEP_PROVIDER',  label: 'Jeep' },
                    { key: 'GUIDE',          label: 'Guide' },
                    { key: 'RESTAURANT',     label: 'Meals' },
                    { key: 'ACCOMMODATION',  label: 'Stay' },
                    { key: 'CAMERA_RENTAL',  label: 'Camera' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setVendorTab(t.key)}
                      style={{
                        padding: '10px 16px', fontSize: 12,
                        fontWeight: vendorTab === t.key ? 600 : 500,
                        whiteSpace: 'nowrap', border: 'none', background: 'transparent',
                        cursor: 'pointer', transition: 'all 0.15s',
                        borderBottom: vendorTab === t.key ? '2px solid #2D6A4F' : '2px solid transparent',
                        color: vendorTab === t.key ? '#2D6A4F' : '#8A8A8A',
                        marginBottom: -1,
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Filter vendors by current tab type */}
                  {(() => {
                    const typeVendors = availableVendors.filter((v: any) => v.vendorType === vendorTab);

                    const VendorSelect = ({ fieldKey, label }: { fieldKey: string; label: string }) => (
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>{label}</label>
                        <select
                          value={(vendorForm as any)[fieldKey]}
                          onChange={(e) => setVendorForm((p) => ({ ...p, [fieldKey]: e.target.value }))}
                          className="pwa-input"
                        >
                          <option value="">Select vendor...</option>
                          {typeVendors.map((v: any) => (
                            <option key={v.id} value={v.id}>
                              {v.user?.name} {v.averageRating ? `· ${v.averageRating} rating` : ''}
                            </option>
                          ))}
                        </select>
                        {typeVendors.length === 0 && (
                          <p style={{ fontSize: 12, color: '#8A8A8A', marginTop: 4 }}>No available vendors for this date and location.</p>
                        )}
                      </div>
                    );

                    const CostInput = ({ fieldKey, label, placeholder = '0' }: { fieldKey: string; label: string; placeholder?: string }) => (
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>{label}</label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#8A8A8A', fontWeight: 600 }}>LKR</span>
                          <input
                            type="number" min="0" placeholder={placeholder}
                            value={(vendorForm as any)[fieldKey]}
                            onChange={(e) => setVendorForm((p) => ({ ...p, [fieldKey]: e.target.value }))}
                            className="pwa-input"
                            style={{ paddingLeft: 44 }}
                          />
                        </div>
                      </div>
                    );

                    if (vendorTab === 'JEEP_PROVIDER') return (
                      <>
                        <VendorSelect fieldKey="jeepVendorId" label="Jeep Provider" />
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>Jeep / Vehicle Number</label>
                          <input
                            type="text" placeholder="e.g. WP-CAR-1234"
                            value={vendorForm.jeepNumber}
                            onChange={(e) => setVendorForm((p) => ({ ...p, jeepNumber: e.target.value }))}
                            className="pwa-input"
                          />
                        </div>
                        <CostInput fieldKey="rentalFee" label="Rental Fee (LKR)" placeholder="15000" />
                      </>
                    );

                    if (vendorTab === 'GUIDE') return (
                      <>
                        <VendorSelect fieldKey="guideVendorId" label="Safari Guide" />
                        <CostInput fieldKey="guideFee" label="Guide Fee (LKR)" placeholder="8000" />
                      </>
                    );

                    if (vendorTab === 'RESTAURANT') return (
                      <>
                        <VendorSelect fieldKey="restaurantVendorId" label="Restaurant / Meals" />
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>Number of Meals</label>
                          <input
                            type="number" min="1"
                            value={vendorForm.numberOfMeals}
                            onChange={(e) => setVendorForm((p) => ({ ...p, numberOfMeals: e.target.value }))}
                            className="pwa-input"
                          />
                        </div>
                        <CostInput fieldKey="mealCost" label="Total Meal Cost (LKR)" placeholder="5000" />
                      </>
                    );

                    if (vendorTab === 'ACCOMMODATION') return (
                      <>
                        <VendorSelect fieldKey="accommodationVendorId" label="Accommodation" />
                        <CostInput fieldKey="accommodationCost" label="Accommodation Cost (LKR)" placeholder="12000" />
                      </>
                    );

                    if (vendorTab === 'CAMERA_RENTAL') return (
                      <>
                        <VendorSelect fieldKey="cameraVendorId" label="Camera Rental" />
                        <CostInput fieldKey="cameraCost" label="Camera Rental Cost (LKR)" placeholder="3000" />
                      </>
                    );
                  })()}
                </div>

                <div style={{ display: 'flex', gap: 12, padding: '0 24px 24px' }}>
                  <button
                    onClick={() => setVendorAssignSafari(null)}
                    className="pwa-btn pwa-btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const body: any = {};
                      if (vendorForm.jeepVendorId)          { body.jeepVendorId = vendorForm.jeepVendorId; body.jeepNumber = vendorForm.jeepNumber; body.rentalFee = parseFloat(vendorForm.rentalFee) || 0; }
                      if (vendorForm.guideVendorId)         { body.guideVendorId = vendorForm.guideVendorId; body.guideFee = parseFloat(vendorForm.guideFee) || 0; }
                      if (vendorForm.restaurantVendorId)    { body.restaurantVendorId = vendorForm.restaurantVendorId; body.mealCost = parseFloat(vendorForm.mealCost) || 0; body.numberOfMeals = parseInt(vendorForm.numberOfMeals) || 1; }
                      if (vendorForm.accommodationVendorId) { body.accommodationVendorId = vendorForm.accommodationVendorId; body.accommodationCost = parseFloat(vendorForm.accommodationCost) || 0; }
                      if (vendorForm.cameraVendorId)        { body.cameraVendorId = vendorForm.cameraVendorId; body.cameraCost = parseFloat(vendorForm.cameraCost) || 0; }
                      assignVendorMutation.mutate({ id: vendorAssignSafari.id, body });
                    }}
                    disabled={assignVendorMutation.isPending}
                    className="pwa-btn pwa-btn-primary"
                    style={{ flex: 1 }}
                  >
                    {assignVendorMutation.isPending ? 'Saving...' : 'Save Assignments'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ========== SHARED SAFARIS ========== */}
          {tab === 'shared' && has('SHARED_TRIPS') && (
            <motion.div key="shared" {...fadeIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Shared Safaris</h2>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={() => setTab('settings')} style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #E8E5DE', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Pricing settings">
                    <Settings style={{ width: 16, height: 16, color: '#6B6B6B' }} />
                  </button>
                  <button
                    onClick={() => setShowNewShared(true)}
                    className="pwa-btn pwa-btn-primary"
                  >
                    + New Safari
                  </button>
                </div>
              </div>

              {/* Status filter chips */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                {[
                  { key: 'ALL', label: 'All' },
                  { key: 'OPEN', label: 'Open' },
                  { key: 'PENDING_PAYMENT', label: 'Paying' },
                  { key: 'CONFIRMED', label: 'Confirmed' },
                  { key: 'COMPLETED', label: 'Done' },
                ].map(({ key, label }) => {
                  const active = sharedStatusFilter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSharedStatusFilter(key)}
                      style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        border: active ? '1.5px solid #2D6A4F' : '1.5px solid #E8E5DE',
                        background: active ? '#E3EFE9' : '#fff',
                        color: active ? '#2D6A4F' : '#6B6B6B',
                        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* New shared safari modal */}
              {showNewShared && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                    zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    style={{
                      background: '#fff', borderRadius: 16,
                      boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
                      padding: 24, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto',
                    }}
                  >
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1A1A1A', margin: '0 0 20px' }}>New Shared Safari</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>Location *</label>
                        <select
                          value={newSharedForm.locationId}
                          onChange={(e) => setNewSharedForm((p) => ({ ...p, locationId: e.target.value }))}
                          className="pwa-input"
                        >
                          <option value="">Select location...</option>
                          {ownerLocations.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>Safari Date *</label>
                        <input
                          type="date"
                          value={newSharedForm.safariDate}
                          onChange={(e) => setNewSharedForm((p) => ({ ...p, safariDate: e.target.value }))}
                          className="pwa-input"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>Safari Type *</label>
                        <select
                          value={newSharedForm.safariType}
                          onChange={(e) => setNewSharedForm((p) => ({ ...p, safariType: e.target.value }))}
                          className="pwa-input"
                        >
                          {['Full Day', 'Morning Half', 'Afternoon Half'].map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>Price Per Seat (LKR) *</label>
                        <input
                          type="number"
                          placeholder="3500"
                          value={newSharedForm.pricePerSeat}
                          onChange={(e) => setNewSharedForm((p) => ({ ...p, pricePerSeat: e.target.value }))}
                          className="pwa-input"
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                      <button
                        onClick={() => setShowNewShared(false)}
                        className="pwa-btn pwa-btn-secondary"
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateShared}
                        disabled={createSharedMutation.isPending}
                        className="pwa-btn pwa-btn-primary"
                        style={{ flex: 1 }}
                      >
                        {createSharedMutation.isPending ? 'Creating...' : 'Create Safari'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Empty state */}
              {jeepsData?.length === 0 && (
                <div className="pwa-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: '#E3EFE9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <Car size={26} color="#2D6A4F" />
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', margin: '0 0 6px' }}>No shared safaris yet</p>
                  <p style={{ fontSize: 13, color: '#8A8A8A', margin: '0 0 20px' }}>Create your first shared safari to start selling seats to multiple customers.</p>
                  <button onClick={() => setShowNewShared(true)} className="pwa-btn pwa-btn-primary" style={{ display: 'inline-flex' }}>+ New Shared Safari</button>
                </div>
              )}

              {[...(jeepsData || [])].filter((j: any) => sharedStatusFilter === 'ALL' || j.status === sharedStatusFilter).sort((a: any, b: any) => {
                const DONE = ['CANCELLED', 'COMPLETED'];
                const aDone = DONE.includes(a.status) ? 1 : 0;
                const bDone = DONE.includes(b.status) ? 1 : 0;
                if (aDone !== bDone) return aDone - bDone;
                return new Date(a.safariDate).getTime() - new Date(b.safariDate).getTime();
              }).map((jeep: any, i: number) => {
                const totalSeats = jeep.totalSeats || 6;
                const paidSeats = jeep.paidSeats || 0;
                const reservedSeats = jeep.reservedSeats || 0;
                const availableSeats = totalSeats - paidSeats - reservedSeats;
                const fillPct = Math.round((paidSeats / totalSeats) * 100);
                const revenue = jeep.pricePerSeat ? paidSeats * jeep.pricePerSeat : null;
                const isExpanded = expandedJeeps.has(jeep.id);
                const bookingCount = jeep.bookings?.length || 0;

                return (
                  <motion.div key={jeep.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <div className="pwa-card" style={{ overflow: 'hidden' }}>

                      {/* Card header */}
                      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #F0EDE6', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>
                              {jeep.location?.name || 'Shared Safari'}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#5B7C58', background: '#E3EFE9', borderRadius: 6, padding: '2px 8px' }}>
                              {jeep.safariType}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#8A8A8A', background: '#F0EDE6', borderRadius: 5, padding: '2px 6px', letterSpacing: '0.03em' }}>
                              JP-{jeep.id.slice(-4).toUpperCase()}
                            </span>
                          </div>
                          <span style={{ fontSize: 13, color: '#8A8A8A', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            {formatShortDate(jeep.safariDate)}
                          </span>
                        </div>
                        <span className={STATUS_PWA_BADGE[jeep.status] || 'pwa-badge pwa-badge-gray'} style={{ flexShrink: 0 }}>
                          {jeep.status}
                        </span>
                      </div>

                      {/* Seat map */}
                      <div style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Seats</span>
                          <span style={{ fontSize: 12, color: '#8A8A8A' }}>
                            {paidSeats} paid · {reservedSeats} reserved · {availableSeats} open
                          </span>
                        </div>

                        {/* Seat circles */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 12 }}>
                          {Array.from({ length: totalSeats }, (_, idx) => {
                            const b = jeep.bookings?.find((bk: any) => bk.seatNumber === idx + 1);
                            const isPaid = b && (b.status === 'PAID' || b.status === 'CONFIRMED');
                            const isPending = b && !isPaid;
                            return (
                              <div
                                key={idx}
                                title={b ? `Seat ${idx + 1}: ${b.customer?.user?.name || 'Guest'} — ${b.status}` : `Seat ${idx + 1}: Available`}
                                style={{
                                  aspectRatio: '1',
                                  borderRadius: 8,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: isPaid ? '#2D6A4F' : isPending ? '#D97706' : '#F0EDE6',
                                  color: isPaid ? '#fff' : isPending ? '#fff' : '#9A9A9A',
                                  border: isPaid ? 'none' : isPending ? 'none' : '1.5px dashed #D4CFC6',
                                }}
                              >
                                {idx + 1}
                              </div>
                            );
                          })}
                        </div>

                        {/* Fill bar */}
                        <div style={{ height: 6, borderRadius: 99, background: '#F0EDE6', overflow: 'hidden', marginBottom: 8 }}>
                          <div style={{ height: '100%', borderRadius: 99, background: fillPct === 100 ? '#2D6A4F' : '#52A879', width: `${fillPct}%`, transition: 'width 0.6s ease' }} />
                        </div>

                        {/* Fill summary row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: '#8A8A8A' }}>{fillPct}% filled ({paidSeats}/{totalSeats} seats)</span>
                          {revenue !== null && (
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#2D6A4F' }}>
                              LKR {revenue.toLocaleString()} collected
                            </span>
                          )}
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
                          {[
                            { color: '#2D6A4F', label: 'Paid' },
                            { color: '#D97706', label: 'Reserved' },
                            { color: '#F0EDE6', label: 'Available', border: '1.5px dashed #D4CFC6' },
                          ].map(({ color, label, border }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <div style={{ width: 10, height: 10, borderRadius: 3, background: color, border: border || 'none', flexShrink: 0 }} />
                              <span style={{ fontSize: 11, color: '#8A8A8A' }}>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bookings toggle */}
                      {bookingCount > 0 && (
                        <div style={{ borderTop: '1px solid #F0EDE6' }}>
                          <button
                            onClick={() => toggleJeep(jeep.id)}
                            style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#2D6A4F' }}
                          >
                            <span>Bookings ({bookingCount})</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9" /></svg>
                          </button>

                          {isExpanded && (
                            <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {jeep.bookings.map((b: any) => {
                                const name = b.customer?.user?.name || 'Guest';
                                const phone = b.customer?.user?.phone || '';
                                const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                                const isPaid = b.status === 'PAID' || b.status === 'CONFIRMED';
                                const needsNudge = b.status === 'RESERVED' || b.status === 'PAYMENT_PENDING';
                                const nudgeText = encodeURIComponent(
                                  `Hi ${name}! 👋 This is a reminder that your safari seat (${jeep.safariType} on ${new Date(jeep.safariDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}) is waiting for payment. Please complete your payment to confirm your spot. Thank you! 🦁`
                                );
                                return (
                                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#FAFAF7', borderRadius: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 10, background: isPaid ? '#E3EFE9' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: isPaid ? '#2D6A4F' : '#92400E', flexShrink: 0 }}>
                                      {initials}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                                      {phone && (
                                        <p style={{ fontSize: 11, color: '#8A8A8A', margin: 0 }}>{phone}</p>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                      <span style={{ fontSize: 11, fontWeight: 600, color: '#8A8A8A', background: '#F0EDE6', borderRadius: 6, padding: '2px 7px' }}>Seat {b.seatNumber}</span>
                                      <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '2px 7px', background: isPaid ? '#E3EFE9' : '#FEF3C7', color: isPaid ? '#2D6A4F' : '#92400E' }}>
                                        {b.status}
                                      </span>
                                      {needsNudge && phone && (
                                        <a
                                          href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${nudgeText}`}
                                          target="_blank" rel="noreferrer"
                                          title="Send WhatsApp nudge"
                                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 8, background: '#25D366', color: '#fff', flexShrink: 0 }}
                                        >
                                          <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                      {/* Cancel button — only for active safaris */}
                      {jeep.status !== 'CANCELLED' && jeep.status !== 'COMPLETED' && (
                        <div style={{ padding: '10px 12px 12px', borderTop: bookingCount > 0 ? 'none' : '1px solid #F0EDE6' }}>
                          <button
                            onClick={() => { if (window.confirm('Cancel this shared safari? All bookings will be notified.')) cancelSharedMutation.mutate(jeep.id); }}
                            disabled={cancelSharedMutation.isPending}
                            style={{ width: '100%', padding: '9px 16px', borderRadius: 10, border: '1.5px solid #FECACA', background: '#FFF5F5', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                          >
                            {cancelSharedMutation.isPending ? 'Cancelling…' : 'Cancel Safari'}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ========== VENDOR PAYMENTS ========== */}
          {tab === 'vendors' && has('VENDOR_LISTINGS') && (
            <motion.div key="vendors" {...fadeIn} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Vendor Payments</h2>
              {vendorPaymentsData?.length === 0 && (
                <div className="pwa-card" style={{ padding: 32, textAlign: 'center', color: '#8A8A8A', fontSize: 14 }}>
                  No vendor payments found.
                </div>
              )}
              {vendorPaymentsData?.map((payment: any, i: number) => (
                <motion.div key={payment.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <div className="pwa-card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: '#1A1A1A', marginBottom: 2 }}>{payment.vendor?.user?.name}</p>
                      <p style={{ fontSize: 12, color: '#8A8A8A', marginBottom: 4 }}>{payment.description}</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#2D6A4F' }}>{formatCurrency(parseFloat(payment.amount))}</p>
                    </div>
                    {payment.status === 'PENDING' ? (
                      <button
                        onClick={() => markPaidMutation.mutate(payment.id)}
                        disabled={markPaidMutation.isPending}
                        className="pwa-btn pwa-btn-primary pwa-btn-sm"
                      >
                        Mark Paid
                      </button>
                    ) : (
                      <span className="pwa-badge pwa-badge-green">PAID</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ========== REVENUE ANALYTICS ========== */}
          {tab === 'revenue' && has('REPORTS_ANALYTICS') && (
            <motion.div key="revenue" {...fadeIn} className="space-y-4" style={{ padding: '0 16px 16px' }}>
              {/* Stats row */}
              {stats && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="pwa-stat-card highlight">
                    <div className="pwa-stat-ico" style={{ background: '#E3EFE9' }}>
                      <TrendingUp size={16} color="#2D6A4F" />
                    </div>
                    <div className="pwa-stat-label">Month Revenue</div>
                    <div className="pwa-stat-value tnum">{formatCurrency(parseFloat(stats.monthRevenue || '0'))}</div>
                  </div>
                  <div className="pwa-stat-card">
                    <div className="pwa-stat-ico" style={{ background: '#DBEAFE' }}>
                      <Car size={16} color="#1E40AF" />
                    </div>
                    <div className="pwa-stat-label">Upcoming Shared</div>
                    <div className="pwa-stat-value tnum">{stats.upcomingShared || 0}</div>
                  </div>
                </div>
              )}

              {/* Revenue line chart card */}
              <div className="pwa-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#8A8A8A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Net Revenue · This Month</div>
                    <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 2, color: '#1A1A1A' }} className="tnum">
                      {stats ? formatCurrency(parseFloat(stats.monthRevenue || '0')) : 'LKR —'}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#2D6A4F', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <TrendingUp size={11} /> Growing this month
                    </div>
                  </div>
                </div>
                <div style={{ margin: '12px -4px 0' }}>
                  <svg viewBox="0 0 320 90" width="100%" height="90" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M 0 70 L 40 62 L 80 55 L 120 42 L 160 48 L 200 32 L 240 28 L 280 18 L 320 12" fill="none" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 0 70 L 40 62 L 80 55 L 120 42 L 160 48 L 200 32 L 240 28 L 280 18 L 320 12 L 320 90 L 0 90 Z" fill="url(#revGrad)" />
                    <circle cx="320" cy="12" r="4" fill="#2D6A4F" stroke="#fff" strokeWidth="2" />
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#8A8A8A', fontWeight: 500 }}>
                    <span>1</span><span>7</span><span>14</span><span>21</span><span>28</span>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="pwa-card" style={{ padding: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 14px', color: '#1A1A1A' }}>Revenue Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {(() => {
                    const gross = parseFloat(stats?.monthRevenue || '0') * 1.12;
                    const commission = gross * 0.1;
                    const vendorPayouts = gross * 0.07;
                    const net = gross - commission - vendorPayouts;
                    return [
                      { label: 'Gross bookings', val: gross, color: '#1A1A1A', bold: false },
                      { label: 'Platform commission (10%)', val: -commission, color: '#C0392B', bold: false },
                      { label: 'Vendor payouts', val: -vendorPayouts, color: '#C0392B', bold: false },
                      { label: 'Net revenue', val: net, color: '#2D6A4F', bold: true },
                    ].map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: r.bold ? '10px 0 2px' : '6px 0', borderTop: r.bold ? '1px solid #E8E5DE' : 'none', marginTop: r.bold ? 4 : 0 }}>
                        <span style={{ fontSize: r.bold ? 13 : 12.5, fontWeight: r.bold ? 700 : 500, color: r.bold ? '#1A1A1A' : '#555' }}>{r.label}</span>
                        <span style={{ fontSize: r.bold ? 15 : 13, fontWeight: r.bold ? 700 : 600, color: r.color }} className="tnum">
                          {r.val < 0 ? '−' : ''}LKR {Math.abs(Math.round(r.val)).toLocaleString()}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Shared vs Private split — computed from live data */}
              {(() => {
                const sharedCount = jeepsData?.length || 0;
                const privateCount = privateSafaris?.length || 0;
                const total = sharedCount + privateCount;
                const sharedPct = total > 0 ? Math.round((sharedCount / total) * 100) : 50;
                const privatePct = 100 - sharedPct;
                const circumference = 2 * Math.PI * 38;
                const sharedDash = (sharedPct / 100) * circumference;
                return (
                  <div className="pwa-card" style={{ padding: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 14px', color: '#1A1A1A' }}>Shared vs Private</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <svg width="100" height="100" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#F1EEE7" strokeWidth="12" />
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#2D6A4F" strokeWidth="12"
                          strokeDasharray={`${sharedDash.toFixed(1)} ${circumference.toFixed(1)}`}
                          strokeDashoffset="0" transform="rotate(-90 50 50)" />
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#8B5E3C" strokeWidth="12"
                          strokeDasharray={`${(circumference - sharedDash).toFixed(1)} ${circumference.toFixed(1)}`}
                          strokeDashoffset={`${-sharedDash.toFixed(1)}`} transform="rotate(-90 50 50)" />
                        <text x="50" y="46" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1A1A1A">{sharedPct}%</text>
                        <text x="50" y="60" textAnchor="middle" fontSize="9" fill="#8A8A8A">shared</text>
                      </svg>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: '#2D6A4F' }} />
                            <span style={{ fontSize: 12.5, fontWeight: 600 }}>Shared ({sharedCount})</span>
                          </div>
                          <span style={{ fontSize: 12.5, fontWeight: 700 }} className="tnum">{sharedPct}%</span>
                        </div>
                        <div style={{ height: 1, background: '#E8E5DE', margin: '10px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: '#8B5E3C' }} />
                            <span style={{ fontSize: 12.5, fontWeight: 600 }}>Private ({privateCount})</span>
                          </div>
                          <span style={{ fontSize: 12.5, fontWeight: 700 }} className="tnum">{privatePct}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* ========== SETTINGS ========== */}
          {tab === 'settings' && (
            <motion.div key="settings" {...fadeIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Portal link card */}
              <div className="pwa-card" style={{ padding: 20 }}>
                <h2 style={{ fontWeight: 700, color: '#1A1A1A', marginBottom: 4, fontSize: 15 }}>Customer Booking Portal</h2>
                <p style={{ fontSize: 13, color: '#8A8A8A', marginBottom: 16 }}>Share this link with your customers so they can book seats directly.</p>
                {pricingLoading ? (
                  <div style={{ height: 44, background: '#F1EEE7', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
                ) : pricingData?.portalUrl ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      readOnly
                      value={pricingData.portalUrl}
                      className="pwa-input"
                      style={{ fontFamily: 'monospace', fontSize: 13, color: '#555', flex: 1 }}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pricingData.portalUrl);
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                      }}
                      className="pwa-btn pwa-btn-primary"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {copySuccess ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: '#8B5E3C' }}>Save your pricing below to activate the portal link.</p>
                )}
                <p style={{ fontSize: 12, color: '#8A8A8A', marginTop: 12 }}>
                  The link filters to your safaris only. Customers can pick a date, type, and seat without logging in.
                </p>
              </div>

              {/* Pricing form */}
              <div className="pwa-card" style={{ padding: 20 }}>
                <h2 style={{ fontWeight: 700, color: '#1A1A1A', marginBottom: 4, fontSize: 15 }}>Safari Pricing</h2>
                <p style={{ fontSize: 13, color: '#8A8A8A', marginBottom: 20 }}>
                  Set your prices once. The system will auto-create jeep slots for the next 30 days at these prices.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>
                      Full Day Price (LKR) <span style={{ color: '#8A8A8A', fontWeight: 400 }}>6:00 AM – 6:00 PM</span>
                    </label>
                    <input
                      type="number"
                      value={pricingForm.priceFullDay}
                      onChange={(e) => setPricingForm((p) => ({ ...p, priceFullDay: e.target.value }))}
                      placeholder="e.g. 15000"
                      className="pwa-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>
                      Half Day Morning (LKR) <span style={{ color: '#8A8A8A', fontWeight: 400 }}>6:00 AM – 12:00 PM</span>
                    </label>
                    <input
                      type="number"
                      value={pricingForm.priceHalfDayMorning}
                      onChange={(e) => setPricingForm((p) => ({ ...p, priceHalfDayMorning: e.target.value }))}
                      placeholder="e.g. 9000"
                      className="pwa-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>
                      Half Day Afternoon (LKR) <span style={{ color: '#8A8A8A', fontWeight: 400 }}>12:00 PM – 6:00 PM</span>
                    </label>
                    <input
                      type="number"
                      value={pricingForm.priceHalfDayAfternoon}
                      onChange={(e) => setPricingForm((p) => ({ ...p, priceHalfDayAfternoon: e.target.value }))}
                      placeholder="e.g. 9000"
                      className="pwa-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>
                      Meal Add-on (LKR) <span style={{ color: '#8A8A8A', fontWeight: 400 }}>per person, optional</span>
                    </label>
                    <input
                      type="number"
                      value={pricingForm.mealPrice}
                      onChange={(e) => setPricingForm((p) => ({ ...p, mealPrice: e.target.value }))}
                      placeholder="e.g. 500 (leave blank to disable)"
                      className="pwa-input"
                    />
                  </div>
                </div>

                {scheduleMsg && (
                  <div className="pwa-notice pwa-notice-green" style={{ marginBottom: 16 }}>
                    <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
                    <span style={{ fontSize: 13 }}>{scheduleMsg}</span>
                  </div>
                )}

                <button
                  onClick={() => savePricingMutation.mutate(pricingForm)}
                  disabled={savePricingMutation.isPending}
                  className="pwa-btn pwa-btn-primary"
                >
                  {savePricingMutation.isPending ? 'Saving...' : 'Save & Auto-Schedule Jeeps'}
                </button>
                <p style={{ fontSize: 12, color: '#8A8A8A', marginTop: 8 }}>
                  Existing jeep slots are never modified. Only missing days are created.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── SEND BOOKING LINK MODAL ── */}
      {showSendLink && pricingData?.portalUrl && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => e.target === e.currentTarget && setShowSendLink(false)}
        >
          <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 20px 48px rgba(0,0,0,0.2)', width: '100%', maxWidth: 420 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #E8E5DE' }}>
              <div>
                <p style={{ fontWeight: 700, color: '#1A1A1A', margin: 0, fontSize: 16 }}>Send Booking Link</p>
                <p style={{ fontSize: 12, color: '#8A8A8A', marginTop: 2 }}>Customer will see only your safaris</p>
              </div>
              <button onClick={() => setShowSendLink(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'transparent', fontSize: 20, color: '#8A8A8A', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Customer Name (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. John Silva"
                  value={sendLinkName}
                  onChange={(e) => setSendLinkName(e.target.value)}
                  className="pwa-input"
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Customer WhatsApp Number <span style={{ color: '#C0392B' }}>*</span></label>
                <input
                  type="tel"
                  placeholder="+94 77 123 4567"
                  value={sendLinkPhone}
                  onChange={(e) => setSendLinkPhone(e.target.value)}
                  className="pwa-input"
                />
                <p style={{ fontSize: 11, color: '#8A8A8A', marginTop: 4 }}>Include country code, e.g. +94771234567</p>
              </div>

              {/* Preview message */}
              <div style={{ background: '#F5F0E8', borderRadius: 12, padding: '12px 14px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#8B5E3C', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' }}>WhatsApp message preview</p>
                <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
                  {sendLinkName ? `Hi ${sendLinkName}! ` : 'Hi! '}Here is your personal booking link for Safari Adventures. Click to choose a date and reserve your seat:{' '}
                  <span style={{ color: '#2D6A4F', fontWeight: 600 }}>{pricingData.portalUrl}</span>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, padding: '0 24px 24px' }}>
              <button onClick={() => setShowSendLink(false)} className="pwa-btn pwa-btn-secondary" style={{ flex: 1 }}>Cancel</button>
              {(() => {
                const phone = sendLinkPhone.replace(/\D/g, '');
                const name = sendLinkName.trim();
                const msg = `${name ? `Hi ${name}! ` : 'Hi! '}Here is your personal booking link for Safari Adventures. Click to choose a date and reserve your seat: ${pricingData.portalUrl}`;
                const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
                return (
                  <a
                    href={phone ? whatsappUrl : undefined}
                    target="_blank"
                    rel="noreferrer"
                    onClick={!phone ? (e) => e.preventDefault() : undefined}
                    className="pwa-btn pwa-btn-primary"
                    style={{ flex: 1, textDecoration: 'none', textAlign: 'center', background: '#25D366', opacity: phone ? 1 : 0.5, cursor: phone ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                    Send via WhatsApp
                  </a>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
