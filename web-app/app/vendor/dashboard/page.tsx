'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatCard } from '@/components/ui/stat-card';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { NavItem } from '@/components/layout/Sidebar';
import {
  LayoutDashboard, Briefcase, TrendingUp, LogOut,
  Car, Compass, Calendar, Users, Lock, ClipboardList, BarChart2,
  CheckCircle, XCircle, Clock, AlertCircle,
  Zap, Bell, Star, Headphones,
} from 'lucide-react';

interface UserFeature { feature: string; enabled: boolean; }
interface MeData {
  name: string; role: string; approvalStatus: string;
  features: UserFeature[];
  vendor?: { businessName: string; vendorType: string; subscriptionStatus: string; subscriptionEnd?: string | null; };
}
interface Assignment {
  id: string;
  jobStatus: string;
  paymentStatus: string;
  respondedAt: string | null;
  rentalFee?: string;
  guideFee?: string;
  jeepNumber?: string;
  privateSafari?: {
    id: string; safariDate: string; safariType: string; numberOfGuests: number;
    customerName?: string; customerPhone?: string; specialRequests?: string;
  } | null;
  sharedJeep?: {
    id: string; safariDate: string; safariType: string; paidSeats: number;
    owner?: { user?: { name?: string; phone?: string } };
    bookings?: { status: string }[];
  } | null;
}

const VENDOR_NAV_ITEMS: NavItem[] = [
  { key: 'Overview',  label: 'Overview',  icon: LayoutDashboard },
  { key: 'Jobs',      label: 'Jobs',      icon: Briefcase },
  { key: 'Earnings',      label: 'Earnings',   icon: TrendingUp },
  { key: 'Subscription', label: 'Subscribe',  icon: Zap },
  { key: 'logout',       label: 'Sign Out',   icon: LogOut, danger: true },
];

const JOB_STATUS_BADGE: Record<string, string> = {
  PENDING:   'pwa-badge pwa-badge-amber',
  ACCEPTED:  'pwa-badge pwa-badge-green',
  DECLINED:  'pwa-badge pwa-badge-red',
  COMPLETED: 'pwa-badge pwa-badge-gray',
};

function safariDate(job: Assignment) {
  const d = job.privateSafari?.safariDate || job.sharedJeep?.safariDate;
  return d ? new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—';
}
function safariType(job: Assignment) {
  return job.privateSafari?.safariType || job.sharedJeep?.safariType || '—';
}
function guestCount(job: Assignment) {
  if (job.privateSafari) return job.privateSafari.numberOfGuests;
  if (job.sharedJeep) return job.sharedJeep.bookings?.length || job.sharedJeep.paidSeats;
  return 0;
}
function fee(job: Assignment) {
  const f = job.rentalFee || job.guideFee;
  return f ? `LKR ${parseFloat(f).toLocaleString()}` : '—';
}

function JobCard({ job, kind, onRespond }: {
  job: Assignment;
  kind: 'jeep' | 'guide';
  onRespond: (id: string, kind: 'jeep' | 'guide', status: 'ACCEPTED' | 'DECLINED') => void;
}) {
  return (
    <div className="pwa-card">
      <div style={{ padding: 16 }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1" style={{ flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{safariType(job)} Safari</span>
              <span className={JOB_STATUS_BADGE[job.jobStatus] || 'pwa-badge pwa-badge-gray'}>
                {job.jobStatus}
              </span>
              <span className="pwa-badge pwa-badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {kind === 'jeep' ? <><Car style={{ width: 12, height: 12 }} /> Jeep</> : <><Compass style={{ width: 12, height: 12 }} /> Guide</>}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#6B6B6B', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: 0 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Calendar style={{ width: 14, height: 14, color: '#8A8A8A' }} />{safariDate(job)}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Users style={{ width: 14, height: 14, color: '#8A8A8A' }} />{guestCount(job)} guests
              </span>
              <span>{fee(job)}</span>
            </p>
            {job.privateSafari?.customerName && (
              <p style={{ fontSize: 12, color: '#8A8A8A', marginTop: 4 }}>Customer: {job.privateSafari.customerName}</p>
            )}
            {job.privateSafari?.specialRequests && (
              <p style={{ fontSize: 12, color: '#8A8A8A', marginTop: 2 }}>Notes: {job.privateSafari.specialRequests}</p>
            )}
            {kind === 'jeep' && job.jeepNumber && (
              <p style={{ fontSize: 12, color: '#8A8A8A', marginTop: 2 }}>Jeep: {job.jeepNumber}</p>
            )}
            {job.sharedJeep?.owner?.user?.name && (
              <p style={{ fontSize: 12, color: '#8A8A8A', marginTop: 2 }}>Owner: {job.sharedJeep.owner.user.name}</p>
            )}
          </div>
          {job.jobStatus === 'PENDING' && (
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => onRespond(job.id, kind, 'ACCEPTED')}
                className="pwa-btn pwa-btn-primary pwa-btn-sm"
              >
                Accept
              </button>
              <button
                onClick={() => onRespond(job.id, kind, 'DECLINED')}
                className="pwa-btn pwa-btn-sm"
                style={{ background: '#FEE2E2', color: '#991B1B' }}
              >
                Decline
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VendorDashboard() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const qc = useQueryClient();

  useEffect(() => setMounted(true), []);

  const { data: me } = useQuery<MeData>({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data),
    enabled: mounted,
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery<{ jeepJobs: Assignment[]; guideJobs: Assignment[] }>({
    queryKey: ['vendor-jobs'],
    queryFn: () => api.get('/vendor/jobs').then((r) => r.data.data),
    enabled: mounted && (activeTab === 'Jobs' || activeTab === 'Overview'),
    refetchInterval: (activeTab === 'Jobs' || activeTab === 'Overview') ? 60_000 : false,
  });

  const { data: earningsData } = useQuery({
    queryKey: ['vendor-earnings'],
    queryFn: () => api.get('/vendor/earnings').then((r) => r.data.data),
    enabled: mounted && activeTab === 'Earnings',
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, kind, status }: { id: string; kind: 'jeep' | 'guide'; status: 'ACCEPTED' | 'DECLINED' }) =>
      api.patch(`/vendor/jobs/${kind}/${id}/respond`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-jobs'] }),
  });

  const handleRespond = (id: string, kind: 'jeep' | 'guide', status: 'ACCEPTED' | 'DECLINED') => {
    respondMutation.mutate({ id, kind, status });
  };

  const allJobs = [...(jobsData?.jeepJobs?.map(j => ({ ...j, kind: 'jeep' as const })) || []),
                   ...(jobsData?.guideJobs?.map(j => ({ ...j, kind: 'guide' as const })) || [])];
  const pendingJobs   = allJobs.filter(j => j.jobStatus === 'PENDING');
  const upcomingJobs  = allJobs.filter(j => j.jobStatus === 'ACCEPTED');
  const declinedJobs  = allJobs.filter(j => j.jobStatus === 'DECLINED');

  const enabledFeatures = me?.features?.filter((f) => f.enabled).map((f) => f.feature) || [];

  const handleVendorTabChange = (key: string) => {
    if (key === 'logout') { localStorage.clear(); window.location.href = '/login'; return; }
    setActiveTab(key);
  };

  return (
    <DashboardShell
      title={me?.vendor?.businessName || 'Vendor Dashboard'}
      navItems={VENDOR_NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={handleVendorTabChange}
      userName={me?.name}
      userRole={me?.role}
      onLogout={() => { localStorage.clear(); window.location.href = '/login'; }}
    >
      <div style={{ maxWidth: 768, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Subscription inactive notice */}
        {me?.vendor?.subscriptionStatus !== 'ACTIVE' && (
          <div className="pwa-notice pwa-notice-amber">
            <AlertCircle style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontWeight: 600, margin: 0 }}>Subscription Inactive</p>
              <p style={{ margin: 0, fontSize: 13 }}>
                Subscription {me?.vendor?.subscriptionStatus?.toLowerCase()}. Contact Super Admin to activate.
              </p>
            </div>
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {activeTab === 'Overview' && (() => {
          const allJobsOverview = [
            ...(jobsData?.jeepJobs?.map((j) => ({ ...j, kind: 'jeep' as const })) || []),
            ...(jobsData?.guideJobs?.map((j) => ({ ...j, kind: 'guide' as const })) || []),
          ];
          const pendingCount  = allJobsOverview.filter((j) => j.jobStatus === 'PENDING').length;
          const upcomingCount = allJobsOverview.filter((j) => j.jobStatus === 'ACCEPTED').length;
          const completedCount = allJobsOverview.filter((j) => j.jobStatus === 'COMPLETED').length;
          const subEnd = me?.vendor?.subscriptionEnd ? new Date(me.vendor.subscriptionEnd) : null;
          const daysLeft = subEnd ? Math.max(0, Math.ceil((subEnd.getTime() - Date.now()) / 86400000)) : null;
          const subPct = daysLeft !== null ? Math.max(4, Math.min(100, (daysLeft / 30) * 100)) : 100;
          const upcomingJobs2 = allJobsOverview.filter((j) => j.jobStatus === 'ACCEPTED').slice(0, 3);

          return (
            <>
              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div className="pwa-card" style={{ padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#92400E' }}>{pendingCount}</div>
                  <div style={{ fontSize: 11, color: '#6B6B6B', marginTop: 2, fontWeight: 600 }}>Pending</div>
                </div>
                <div className="pwa-card" style={{ padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#2D6A4F' }}>{upcomingCount}</div>
                  <div style={{ fontSize: 11, color: '#6B6B6B', marginTop: 2, fontWeight: 600 }}>Upcoming</div>
                </div>
                <div className="pwa-card" style={{ padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#1E40AF' }}>{completedCount}</div>
                  <div style={{ fontSize: 11, color: '#6B6B6B', marginTop: 2, fontWeight: 600 }}>Completed</div>
                </div>
              </div>

              {/* Pending jobs callout */}
              {pendingCount > 0 && (
                <div className="pwa-notice pwa-notice-amber" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                    <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p style={{ fontWeight: 700, margin: 0, fontSize: 13 }}>{pendingCount} job{pendingCount !== 1 ? 's' : ''} awaiting response</p>
                      <p style={{ margin: 0, fontSize: 12 }}>Accept within 6h to confirm your spot</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('Jobs')} className="pwa-btn pwa-btn-sm" style={{ background: '#D97706', color: '#fff', border: 'none', flexShrink: 0, fontSize: 11, padding: '6px 10px' }}>
                    View
                  </button>
                </div>
              )}

              {/* Subscription mini-banner */}
              {daysLeft !== null && (
                <div style={{ background: '#F5F0E8', borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Zap size={14} color="#8B5E3C" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>Vendor Pro</span>
                      <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 8, background: me?.vendor?.subscriptionStatus === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2', color: me?.vendor?.subscriptionStatus === 'ACTIVE' ? '#166534' : '#991B1B', fontWeight: 600 }}>
                        {me?.vendor?.subscriptionStatus || 'INACTIVE'}
                      </span>
                    </div>
                    <button onClick={() => setActiveTab('Subscription')} style={{ fontSize: 11, color: '#8B5E3C', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                      Manage →
                    </button>
                  </div>
                  <div style={{ height: 5, background: '#E5DDD0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${subPct}%`, background: '#8B5E3C', borderRadius: 3 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: '#6B6B6B' }}>{daysLeft} days remaining</span>
                    <span style={{ fontSize: 11, color: '#6B6B6B' }}>{subEnd?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              )}

              {/* Upcoming jobs preview */}
              {upcomingJobs2.length > 0 && (
                <div className="pwa-card" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid #F0EDE6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Upcoming Jobs</p>
                    <button onClick={() => setActiveTab('Jobs')} style={{ fontSize: 12, color: '#2D6A4F', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>See all →</button>
                  </div>
                  {upcomingJobs2.map((j, i) => (
                    <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < upcomingJobs2.length - 1 ? '1px solid #F7F5F2' : 'none' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: '#E3EFE9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {j.kind === 'jeep' ? <Car size={15} color="#2D6A4F" /> : <Compass size={15} color="#2D6A4F" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', margin: 0 }}>{safariType(j)} Safari</p>
                        <p style={{ fontSize: 11, color: '#8A8A8A', margin: 0 }}>{safariDate(j)} · {guestCount(j)} guests</p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '2px 7px', background: '#DCFCE7', color: '#166534', flexShrink: 0 }}>
                        Accepted
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Enabled features (when no jobs yet) */}
              {allJobsOverview.length === 0 && enabledFeatures.length > 0 && (
                <div>
                  <div className="pwa-section-head" style={{ marginBottom: 12 }}>
                    <h2>Enabled Features</h2>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {enabledFeatures.map((feature) => {
                      const info: Record<string, { icon: React.ElementType; label: string; desc: string }> = {
                        BOOKING_MANAGEMENT: { icon: ClipboardList, label: 'Booking Management', desc: 'View and manage your assigned bookings' },
                        REPORTS_ANALYTICS:  { icon: BarChart2,     label: 'Reports & Analytics', desc: 'View earnings and performance data' },
                      };
                      const item = info[feature];
                      if (!item) return null;
                      const ItemIcon = item.icon;
                      return (
                        <div key={feature} className="pwa-card">
                          <div style={{ padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                            <div style={{ width: 40, height: 40, background: '#E3EFE9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <ItemIcon style={{ width: 20, height: 20, color: '#2D6A4F' }} />
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, color: '#1A1A1A', margin: 0 }}>{item.label}</p>
                              <p style={{ fontSize: 13, color: '#6B6B6B', marginTop: 2, marginBottom: 0 }}>{item.desc}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {enabledFeatures.length === 0 && (
                <div className="pwa-card">
                  <div style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, background: '#F1EEE7', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Lock style={{ width: 24, height: 24, color: '#8A8A8A' }} />
                    </div>
                    <p style={{ color: '#6B6B6B', fontWeight: 500, margin: 0 }}>No features enabled yet</p>
                    <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                      The Super Admin will assign features to your account.
                    </p>
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {/* ── JOBS ── */}
        {activeTab === 'Jobs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {jobsLoading ? (
              <p style={{ color: '#8A8A8A', textAlign: 'center', padding: '32px 0' }}>Loading jobs...</p>
            ) : (
              <>
                {/* Pending */}
                {pendingJobs.length > 0 && (
                  <div>
                    <div className="pwa-section-head" style={{ marginBottom: 12 }}>
                      <h2 style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#92400E' }}>
                        <Clock style={{ width: 16, height: 16 }} /> Pending Response ({pendingJobs.length})
                      </h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {pendingJobs.map(j => (
                        <JobCard key={j.id} job={j} kind={j.kind} onRespond={handleRespond} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming */}
                {upcomingJobs.length > 0 && (
                  <div>
                    <div className="pwa-section-head" style={{ marginBottom: 12 }}>
                      <h2 style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2D6A4F' }}>
                        <CheckCircle style={{ width: 16, height: 16 }} /> Upcoming Jobs ({upcomingJobs.length})
                      </h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {upcomingJobs.map(j => (
                        <JobCard key={j.id} job={j} kind={j.kind} onRespond={handleRespond} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Declined */}
                {declinedJobs.length > 0 && (
                  <div style={{ opacity: 0.6 }}>
                    <div className="pwa-section-head" style={{ marginBottom: 12 }}>
                      <h2 style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#991B1B' }}>
                        <XCircle style={{ width: 16, height: 16 }} /> Declined ({declinedJobs.length})
                      </h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {declinedJobs.map(j => (
                        <JobCard key={j.id} job={j} kind={j.kind} onRespond={handleRespond} />
                      ))}
                    </div>
                  </div>
                )}

                {allJobs.length === 0 && (
                  <div className="pwa-card">
                    <div style={{ padding: 40, textAlign: 'center' }}>
                      <div style={{
                        width: 48, height: 48, background: '#F1EEE7', borderRadius: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                      }}>
                        <Briefcase style={{ width: 24, height: 24, color: '#8A8A8A' }} />
                      </div>
                      <p style={{ color: '#6B6B6B', fontWeight: 500, margin: 0 }}>No jobs yet</p>
                      <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                        You'll see job assignments here when owners select you.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── EARNINGS ── */}
        {activeTab === 'Earnings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {enabledFeatures.includes('REPORTS_ANALYTICS') ? (
              earningsData ? (
                <div className="pwa-card">
                  <div style={{ padding: 16 }}>
                    <div className="pwa-section-head" style={{ marginBottom: 16 }}>
                      <h2>Earnings This Month</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div style={{ background: '#E3EFE9', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                        <p style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 4, marginTop: 0 }}>Total Earnings</p>
                        <p style={{ fontSize: 22, fontWeight: 800, color: '#2D6A4F', margin: 0 }}>
                          LKR {parseFloat(earningsData.total || '0').toLocaleString()}
                        </p>
                      </div>
                      <div style={{ background: '#DBEAFE', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                        <p style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 4, marginTop: 0 }}>Payments</p>
                        <p style={{ fontSize: 22, fontWeight: 800, color: '#1E40AF', margin: 0 }}>
                          {earningsData.payments?.length || 0}
                        </p>
                      </div>
                    </div>
                    {earningsData.payments?.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {earningsData.payments.map((p: any) => (
                          <div key={p.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 0', borderBottom: '1px solid #E8E5DE',
                          }}>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A', margin: 0 }}>{p.description}</p>
                              <p style={{ fontSize: 12, color: '#8A8A8A', margin: 0 }}>
                                {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}
                              </p>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#2D6A4F', margin: 0 }}>
                              LKR {parseFloat(p.amount).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ color: '#8A8A8A', textAlign: 'center', padding: '32px 0' }}>Loading earnings...</p>
              )
            ) : (
              <div className="pwa-card">
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <div style={{
                    width: 48, height: 48, background: '#F1EEE7', borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                  }}>
                    <BarChart2 style={{ width: 24, height: 24, color: '#8A8A8A' }} />
                  </div>
                  <p style={{ color: '#6B6B6B', fontWeight: 500, margin: 0 }}>Reports & Analytics not enabled</p>
                  <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                    Contact Super Admin to enable this feature.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SUBSCRIPTION ── */}
        {activeTab === 'Subscription' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Plan card */}
            <div style={{
              background: 'linear-gradient(135deg, #1F4F3A 0%, #2D6A4F 100%)',
              borderRadius: 16, padding: '22px 20px', color: '#fff', position: 'relative', overflow: 'hidden'
            }}>
              {/* decorative circles */}
              <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', bottom: -50, left: -20, width: 160, height: 160, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Current Plan</div>
                    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Vendor Pro</div>
                  </div>
                  <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                    {me?.vendor?.subscriptionStatus || 'ACTIVE'}
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em' }}>
                  LKR 2,500<span style={{ fontSize: 14, fontWeight: 500, opacity: 0.7 }}>/month</span>
                </div>
                {me?.vendor?.subscriptionEnd && (() => {
                  const end = new Date(me!.vendor!.subscriptionEnd!);
                  const daysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
                  const pct = Math.max(4, Math.min(100, (daysLeft / 30) * 100));
                  return (
                    <div style={{ marginTop: 18, padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, opacity: 0.85 }}>Renews in {daysLeft} days</span>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#fff' }} />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Renew button */}
            <a
              href="mailto:admin@safari.lk?subject=Subscription Renewal"
              className="pwa-btn pwa-btn-primary pwa-btn-block pwa-btn-lg"
              style={{ textDecoration: 'none', textAlign: 'center' }}
            >
              Contact Admin to Renew
            </a>

            {/* Benefits */}
            <div>
              <div className="pwa-section-head"><h2>Plan benefits</h2></div>
              <div className="pwa-card">
                {[
                  { icon: Briefcase,   text: 'Unlimited job assignments' },
                  { icon: Bell,        text: 'Push notifications for new jobs' },
                  { icon: BarChart2,   text: 'Earnings analytics & history' },
                  { icon: Star,        text: 'Featured listing in vendor directory' },
                  { icon: Headphones,  text: 'Priority support · 24/7' },
                ].map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < 4 ? '1px solid #F1EEE7' : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: '#E3EFE9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <b.icon size={15} color="#2D6A4F" />
                    </div>
                    <span style={{ fontSize: 13, flex: 1, color: '#1A1A1A' }}>{b.text}</span>
                    <CheckCircle size={16} color="#2D6A4F" />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '10px 14px', background: '#FAFAF7', borderRadius: 12, fontSize: 11.5, color: '#8A8A8A', textAlign: 'center', lineHeight: 1.5 }}>
              Subscription managed by <strong style={{ color: '#1A1A1A' }}>Super Admin</strong> · LKR 2,500/month
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
