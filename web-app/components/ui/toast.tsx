'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const ICONS: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES: Record<ToastVariant, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, variant, duration }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div
        className="fixed z-[100] flex flex-col gap-2 pointer-events-none"
        style={{ bottom: 'max(88px, calc(72px + env(safe-area-inset-bottom, 0px)))', right: 16, left: 16, maxWidth: 420, marginLeft: 'auto' }}
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const Icon = ICONS[toast.variant];
          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-elevated animate-in slide-in-from-bottom-2 fade-in duration-200',
                STYLES[toast.variant]
              )}
              role="alert"
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
