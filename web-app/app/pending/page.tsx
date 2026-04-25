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

  const roleLabel = user?.role === 'SAFARI_OWNER' ? 'Safari Owner' : 'Vendor';

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

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 text-left">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-semibold text-amber-800 mb-1">Pending Admin Approval</p>
              <p className="text-amber-700 text-sm">
                Your account is under review by the Super Admin. This usually takes 1–2 business days.
                You will receive a notification once your account is approved.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm text-gray-500 mb-8 text-left">
          <div className="flex items-center gap-2">
            <span className="text-green-500 font-bold">✓</span>
            <span>Account created successfully</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">→</span>
            <span>Waiting for Super Admin approval</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-300 font-bold">○</span>
            <span className="text-gray-400">Access dashboard after approval</span>
          </div>
        </div>

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
