'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, Users, User, Phone, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface Assignment {
  id: string;
  jobStatus: string;
  paymentStatus: string;
  rentalFee?: string;
  guideFee?: string;
  jeepNumber?: string;
  privateSafari?: {
    id: string; safariDate: string; safariType: string; numberOfGuests: number;
    customerName?: string; customerPhone?: string; pickupLocation?: string;
  } | null;
  sharedJeep?: {
    id: string; safariDate: string; safariType: string; paidSeats: number;
    owner?: { user?: { name?: string; phone?: string } };
    bookings?: { status: string; pickupLocation?: string }[];
  } | null;
}

export default function VendorJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const jobId = params.id as string;

  const { data: jobsData, isLoading } = useQuery<{ jeepJobs: Assignment[]; guideJobs: Assignment[] }>({
    queryKey: ['vendor-jobs'],
    queryFn: () => api.get('/vendor/jobs').then((r) => r.data.data),
  });

  const respondMutation = useMutation({
    mutationFn: ({ kind, status }: { kind: 'jeep' | 'guide'; status: string }) =>
      api.patch(`/vendor/jobs/${kind}/${jobId}/respond`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-jobs'] }),
  });

  const allJobs = [
    ...(jobsData?.jeepJobs?.map((j) => ({ ...j, kind: 'jeep' as const })) || []),
    ...(jobsData?.guideJobs?.map((j) => ({ ...j, kind: 'guide' as const })) || []),
  ];
  const job = allJobs.find((j) => j.id === jobId);

  const safari = job?.privateSafari || job?.sharedJeep;
  const fee = job?.rentalFee || job?.guideFee;
  const ownerPhone = job?.sharedJeep?.owner?.user?.phone;
  const ownerName = job?.sharedJeep?.owner?.user?.name;

  const pickupPoints = job?.sharedJeep?.bookings
    ?.filter((b) => ['PAID','CONFIRMED','PAYMENT_PENDING'].includes(b.status) && b.pickupLocation)
    .map((b) => b.pickupLocation!)
    .filter(Boolean) || [];

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: 32, height: 32, color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!job || !safari) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Job not found.</p>
          <button className="pwa-btn pwa-btn-secondary" style={{ marginTop: 16 }} onClick={() => router.back()}>← Go back</button>
        </div>
      </div>
    );
  }

  const isAccepted = job.jobStatus === 'ACCEPTED';
  const isPending = job.jobStatus === 'PENDING';
  const guests = (safari as any).numberOfGuests || (safari as any).paidSeats || 0;
  const safariDate = new Date(safari.safariDate).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: isPending ? 100 : 32 }}>

      {/* Top bar */}
      <div className="pwa-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{ width: 36, height: 36, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} color="var(--text-2)" />
          </button>
          <h1>Job Detail</h1>
        </div>
        <span className={`pwa-badge ${isAccepted ? 'pwa-badge-green' : isPending ? 'pwa-badge-amber' : 'pwa-badge-gray'}`}>
          {job.jobStatus}
        </span>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* Payment highlight card */}
        <div className="pwa-card pwa-card-pad" style={{ marginBottom: 14, textAlign: 'center', background: isAccepted ? '#E3EFE9' : '#FAEFD9', border: isAccepted ? '1px solid #C6DDD1' : '1px solid #F4E1C1' }}>
          <p style={{ fontSize: 12, color: isAccepted ? 'var(--primary)' : 'var(--brown)', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {job.paymentStatus}
          </p>
          <p style={{ fontSize: 32, fontWeight: 800, color: isAccepted ? 'var(--primary)' : 'var(--brown)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            {fee ? formatCurrency(parseFloat(fee)) : 'TBD'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
            {job.kind === 'jeep' ? 'Jeep rental fee' : 'Guide fee'}
          </p>
        </div>

        {/* Info grid */}
        <div className="pwa-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: 14, overflow: 'hidden' }}>
          {[
            { icon: Calendar, label: 'Date', value: safariDate },
            { icon: MapPin, label: 'Type', value: safari.safariType },
            { icon: Users, label: 'Guests', value: `${guests} guest${guests !== 1 ? 's' : ''}` },
            { icon: User, label: 'Owner', value: ownerName || 'Safari Owner' },
          ].map(({ icon: Icon, label, value }, i) => (
            <div key={label} style={{ padding: '14px 16px', borderBottom: i < 2 ? '1px solid var(--line)' : 'none', borderRight: i % 2 === 0 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Icon size={13} color="var(--text-3)" />
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{label}</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Map placeholder */}
        <div
          className="pwa-card"
          style={{ marginBottom: 14, height: 140, background: 'repeating-linear-gradient(45deg, #E8E0CE 0 8px, #DCD2BB 8px 16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
        >
          <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: 10, padding: '8px 16px', fontSize: 12, color: 'var(--brown)', fontWeight: 600 }}>
            📍 Route map
          </div>
        </div>

        {/* Pickup points */}
        {pickupPoints.length > 0 && (
          <div className="pwa-card pwa-card-pad" style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: '0 0 12px' }}>Pickup points</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pickupPoints.map((pt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>{pt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jeep number */}
        {job.jeepNumber && (
          <div className="pwa-card pwa-card-pad" style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>Jeep</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)', margin: 0, fontFamily: 'monospace' }}>
              {job.jeepNumber}
            </p>
          </div>
        )}

        {/* Accepted banner */}
        {isAccepted && (
          <div className="pwa-notice pwa-notice-green" style={{ marginBottom: 14 }}>
            <CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Job accepted · Owner notified</span>
          </div>
        )}
      </div>

      {/* Fixed action footer */}
      {isPending && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid var(--line)', padding: '12px 16px', display: 'flex', gap: 10, zIndex: 40, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
          {ownerPhone && (
            <a
              href={`tel:${ownerPhone}`}
              className="pwa-btn pwa-btn-secondary"
              style={{ flex: 1 }}
            >
              <Phone size={15} /> Call Owner
            </a>
          )}
          <button
            className="pwa-btn pwa-btn-primary"
            style={{ flex: 2 }}
            disabled={respondMutation.isPending}
            onClick={() => respondMutation.mutate({ kind: job.kind, status: 'ACCEPTED' })}
          >
            {respondMutation.isPending ? (
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                <CheckCircle size={15} /> Accept Job
              </>
            )}
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
