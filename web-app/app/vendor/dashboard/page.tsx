'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const TABS = ['Overview', 'Jobs', 'Earnings'];

const JOB_STATUS_BADGE: Record<string, string> = {
  PENDING:  'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  DECLINED: 'bg-red-100 text-red-700',
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
    <div className="border rounded-xl p-4 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">{safariType(job)} Safari</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${JOB_STATUS_BADGE[job.jobStatus] || 'bg-gray-100 text-gray-600'}`}>
              {job.jobStatus}
            </span>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {kind === 'jeep' ? '🚙 Jeep' : '🧭 Guide'}
            </span>
          </div>
          <p className="text-sm text-gray-600">📅 {safariDate(job)} · 👥 {guestCount(job)} guests · {fee(job)}</p>
          {job.privateSafari?.customerName && (
            <p className="text-xs text-gray-400 mt-1">Customer: {job.privateSafari.customerName}</p>
          )}
          {job.privateSafari?.specialRequests && (
            <p className="text-xs text-gray-400 mt-0.5">Notes: {job.privateSafari.specialRequests}</p>
          )}
          {kind === 'jeep' && job.jeepNumber && (
            <p className="text-xs text-gray-400 mt-0.5">Jeep: {job.jeepNumber}</p>
          )}
          {job.sharedJeep?.owner?.user?.name && (
            <p className="text-xs text-gray-400 mt-0.5">Owner: {job.sharedJeep.owner.user.name}</p>
          )}
        </div>
        {job.jobStatus === 'PENDING' && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onRespond(job.id, kind, 'ACCEPTED')}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => onRespond(job.id, kind, 'DECLINED')}
              className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Decline
            </button>
          </div>
        )}
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

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{me?.vendor?.businessName || 'Vendor Dashboard'}</h1>
          <p className="text-sm text-gray-500">
            {me?.vendor?.vendorType?.replace(/_/g, ' ')} · {me?.vendor?.subscriptionStatus}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {pendingJobs.length > 0 && (
            <button onClick={() => setActiveTab('Jobs')} className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {pendingJobs.length} pending
            </button>
          )}
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="text-sm text-red-600 hover:text-red-700">
            Logout
          </button>
        </div>
      </div>

      {/* Subscription warning */}
      {me?.vendor?.subscriptionStatus !== 'ACTIVE' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <p className="text-amber-800 text-sm font-medium">
            ⚠️ Subscription {me?.vendor?.subscriptionStatus?.toLowerCase()}. Contact Super Admin to activate.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {tab === 'Jobs' && pendingJobs.length > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingJobs.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">

        {/* ── OVERVIEW ── */}
        {activeTab === 'Overview' && (
          <>
            {enabledFeatures.length > 0 ? (
              <div>
                <h2 className="text-base font-semibold text-gray-700 mb-3">Enabled Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enabledFeatures.map((feature) => {
                    const info: Record<string, { icon: string; label: string; desc: string }> = {
                      BOOKING_MANAGEMENT: { icon: '📋', label: 'Booking Management', desc: 'View and manage your assigned bookings' },
                      REPORTS_ANALYTICS:  { icon: '📊', label: 'Reports & Analytics', desc: 'View earnings and performance data' },
                    };
                    const item = info[feature];
                    if (!item) return null;
                    return (
                      <Card key={feature}>
                        <CardContent className="p-5 flex items-start gap-4">
                          <span className="text-3xl">{item.icon}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
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
                  <p className="text-gray-400 text-sm mt-1">The Super Admin will assign features to your account.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ── JOBS ── */}
        {activeTab === 'Jobs' && (
          <div className="space-y-6">
            {jobsLoading ? (
              <p className="text-gray-400 text-center py-8">Loading jobs...</p>
            ) : (
              <>
                {/* Pending */}
                {pendingJobs.length > 0 && (
                  <div>
                    <h2 className="text-base font-semibold text-amber-700 mb-3">
                      ⏳ Pending Response ({pendingJobs.length})
                    </h2>
                    <div className="space-y-3">
                      {pendingJobs.map(j => (
                        <JobCard key={j.id} job={j} kind={j.kind} onRespond={handleRespond} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming */}
                {upcomingJobs.length > 0 && (
                  <div>
                    <h2 className="text-base font-semibold text-green-700 mb-3">
                      ✅ Upcoming Jobs ({upcomingJobs.length})
                    </h2>
                    <div className="space-y-3">
                      {upcomingJobs.map(j => (
                        <JobCard key={j.id} job={j} kind={j.kind} onRespond={handleRespond} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Declined */}
                {declinedJobs.length > 0 && (
                  <div>
                    <h2 className="text-base font-semibold text-red-600 mb-3">
                      ❌ Declined ({declinedJobs.length})
                    </h2>
                    <div className="space-y-3 opacity-60">
                      {declinedJobs.map(j => (
                        <JobCard key={j.id} job={j} kind={j.kind} onRespond={handleRespond} />
                      ))}
                    </div>
                  </div>
                )}

                {allJobs.length === 0 && (
                  <Card>
                    <CardContent className="p-10 text-center">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-gray-500 font-medium">No jobs yet</p>
                      <p className="text-gray-400 text-sm mt-1">You'll see job assignments here when owners select you.</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* ── EARNINGS ── */}
        {activeTab === 'Earnings' && (
          <div className="space-y-4">
            {enabledFeatures.includes('REPORTS_ANALYTICS') ? (
              earningsData ? (
                <Card>
                  <CardHeader><CardTitle>Earnings This Month</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
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
                    {earningsData.payments?.length > 0 && (
                      <div className="space-y-2">
                        {earningsData.payments.map((p: any) => (
                          <div key={p.id} className="flex justify-between items-center py-2 border-b last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{p.description}</p>
                              <p className="text-xs text-gray-400">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</p>
                            </div>
                            <p className="text-sm font-semibold text-green-700">LKR {parseFloat(p.amount).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <p className="text-gray-400 text-center py-8">Loading earnings...</p>
              )
            ) : (
              <Card>
                <CardContent className="p-10 text-center">
                  <div className="text-4xl mb-3">📊</div>
                  <p className="text-gray-500 font-medium">Reports & Analytics not enabled</p>
                  <p className="text-gray-400 text-sm mt-1">Contact Super Admin to enable this feature.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
