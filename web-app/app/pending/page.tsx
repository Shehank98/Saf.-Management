'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Check } from 'lucide-react';

export default function PendingPage() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('pendingUser');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const isOwner = user?.role === 'SAFARI_OWNER';
  const roleLabel = isOwner ? 'Safari Owner' : 'Service Provider';

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FAFAF7' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[20px] p-10 w-full max-w-lg text-center"
        style={{ border: '1px solid #E8E5DE', boxShadow: '0 6px 18px rgba(28,38,32,0.06), 0 1px 2px rgba(20,20,20,0.04)' }}
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#E3EFE9' }}>
          <CheckCircle2 className="w-9 h-9" style={{ color: '#2D6A4F' }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
          Registration Successful!
        </h1>
        {user && (
          <p className="mb-1" style={{ color: '#555555' }}>
            Welcome, <span className="font-semibold">{user.name}</span>
          </p>
        )}
        <p className="text-sm mb-8" style={{ color: '#8A8A8A' }}>
          {user ? `Registered as ${roleLabel}` : 'Your account has been created'}
        </p>

        <div className="rounded-[14px] p-5 mb-6 text-left" style={{ background: '#FAEFD9', border: '1px solid #F4E1C1' }}>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#D97706' }} />
            <div>
              <p className="font-semibold mb-1" style={{ color: '#8B5E3C' }}>Pending Admin Approval</p>
              <p className="text-sm" style={{ color: '#8B5E3C' }}>
                Your account is under review. This usually takes 1–2 business days.
                You will be notified once your account is approved.
              </p>
            </div>
          </div>
        </div>

        {/* Step-by-step flow */}
        <div className="space-y-3 text-sm mb-6 text-left" style={{ color: '#555555' }}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#2D6A4F' }}>
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </span>
            <span>Account created successfully</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#D97706' }}>
              <span className="text-white text-xs font-bold">2</span>
            </span>
            <span>Waiting for Super Admin approval</span>
          </div>
          {isOwner && (
            <div className="flex items-start gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E8E5DE' }}>
                <span className="text-xs font-bold" style={{ color: '#8A8A8A' }}>3</span>
              </span>
              <div>
                <span style={{ color: '#8A8A8A' }}>Pay monthly subscription</span>
                <span className="ml-1.5 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FAEFD9', color: '#8B5E3C' }}>
                  LKR 2,500 / month
                </span>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E8E5DE' }}>
              <span className="text-xs font-bold" style={{ color: '#8A8A8A' }}>{isOwner ? '4' : '3'}</span>
            </span>
            <span style={{ color: '#8A8A8A' }}>Access your dashboard</span>
          </div>
        </div>

        {isOwner && (
          <div className="rounded-[14px] p-4 mb-6 text-left" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#2E6BB8' }}>About Your Subscription</p>
            <p className="text-xs" style={{ color: '#2E6BB8' }}>
              After admin approval, a monthly subscription of <strong>LKR 2,500</strong> is required to activate
              your account. The admin will contact you with payment instructions. Shared safari access and other
              features are enabled by the admin after subscription is confirmed.
            </p>
          </div>
        )}

        {user?.email && (
          <p className="text-xs mb-6" style={{ color: '#8A8A8A' }}>
            Registered email: <span className="font-medium">{user.email}</span>
          </p>
        )}

        <Link
          href="/login"
          className="inline-block text-white font-semibold px-8 py-3 rounded-[14px] transition-colors"
          style={{ background: '#2D6A4F' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#1F4F3A'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#2D6A4F'; }}
        >
          Back to Login
        </Link>
      </motion.div>
    </main>
  );
}
