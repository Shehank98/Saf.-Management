'use client';

import { Compass, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FAFAF7' }}>
      <div className="text-center max-w-sm">
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{ background: '#E3EFE9' }}
        >
          <Compass className="h-10 w-10" style={{ color: '#2D6A4F' }} />
        </div>
        <h1 className="text-4xl font-extrabold mb-2" style={{ color: '#1A1A1A', letterSpacing: '-0.03em' }}>
          404
        </h1>
        <h2 className="text-lg font-bold mb-3" style={{ color: '#1A1A1A' }}>
          Page Not Found
        </h2>
        <p className="text-sm mb-8" style={{ color: '#8A8A8A', lineHeight: 1.6 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="pwa-btn pwa-btn-primary pwa-btn-lg"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <button
            onClick={() => typeof window !== 'undefined' && window.history.back()}
            className="pwa-btn pwa-btn-secondary pwa-btn-lg"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </main>
  );
}
