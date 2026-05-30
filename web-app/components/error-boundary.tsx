'use client';

import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center min-h-[300px] p-6">
          <div className="text-center max-w-sm">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: '#FEE2E2' }}
            >
              <AlertTriangle className="h-7 w-7" style={{ color: '#DC2626' }} />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: '#1A1A1A' }}>
              Something went wrong
            </h2>
            <p className="text-sm mb-6" style={{ color: '#8A8A8A' }}>
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>
            <button
              onClick={this.handleRetry}
              className="pwa-btn pwa-btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <RotateCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
