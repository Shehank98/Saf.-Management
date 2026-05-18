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
} from 'lucide-react';

interface UserFeature { feature: string; enabled: boolean; }
interface MeData {
  name: string; role: string; approvalStatus: string;
  features: UserFeature[];
  vendor?: { businessName: string; vendorType: string; subscriptionStatus: string; };
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
  { key: 'Earnings',  label: 'Earnings',  icon: TrendingUp },
  { key: 'logout',    label: 'Sign Out',  icon: LogOut, danger: true },
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
    enabled: mounted && activeTab === 'Jobs',
    refetchInterval: activeTab === 'Jobs' ? 30_000 : false,
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
        {activeTab === 'Overview' && (
          <>
            {enabledFeatures.length > 0 ? (
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
                          <div style={{
                            width: 40, height: 40, background: '#E3EFE9', borderRadius: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
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
            ) : (
              <div className="pwa-card">
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <div style={{
                    width: 48, height: 48, background: '#F1EEE7', borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                  }}>
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
        )}

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
      </div>
    </DashboardShell>
  );
}
