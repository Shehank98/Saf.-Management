'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PendingPage() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('pendingUser');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const isOwner = user?.role === 'SAFARI_OWNER';
  const roleLabel = isOwner ? 'Safari Owner' : 'Service Provider';

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-800 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-lg text-center"
      >
        <div className="text-6xl mb-5">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Registration Successful!
        </h1>
        {user && (
          <p className="text-gray-600 mb-1">
            Welcome, <span className="font-semibold">{user.name}</span>
          </p>
        )}
        <p className="text-gray-500 text-sm mb-8">
          {user ? `Registered as ${roleLabel}` : 'Your account has been created'}
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-left">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-semibold text-amber-800 mb-1">Pending Admin Approval</p>
              <p className="text-amber-700 text-sm">
                Your account is under review. This usually takes 1–2 business days.
                You will be notified once your account is approved.
              </p>
            </div>
          </div>
        </div>

        {/* Step-by-step flow */}
        <div className="space-y-3 text-sm text-gray-600 mb-6 text-left">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">✓</span>
            </span>
            <span>Account created successfully</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">2</span>
            </span>
            <span>Waiting for Super Admin approval</span>
          </div>
          {isOwner && (
            <div className="flex items-start gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                <span className="text-gray-500 text-xs font-bold">3</span>
              </span>
              <div>
                <span className="text-gray-400">Pay monthly subscription</span>
                <span className="ml-1.5 text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
                  LKR 2,500 / month
                </span>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <span className="mt-0.5 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
              <span className="text-gray-400 text-xs font-bold">{isOwner ? '4' : '3'}</span>
            </span>
            <span className="text-gray-400">Access your dashboard</span>
          </div>
        </div>

        {isOwner && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-blue-700 mb-1">About Your Subscription</p>
            <p className="text-xs text-blue-600">
              After admin approval, a monthly subscription of <strong>LKR 2,500</strong> is required to activate
              your account. The admin will contact you with payment instructions. Shared safari access and other
              features are enabled by the admin after subscription is confirmed.
            </p>
          </div>
        )}

        {user?.email && (
          <p className="text-xs text-gray-400 mb-6">
            Registered email: <span className="font-medium">{user.email}</span>
          </p>
        )}

        <Link
          href="/login"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Back to Login
        </Link>
      </motion.div>
    </main>
  );
}
