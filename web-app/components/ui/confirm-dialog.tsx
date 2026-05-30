'use client';

import * as React from 'react';
import { Modal, ModalFooter } from './modal';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type DialogVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  loading?: boolean;
}

const VARIANT_CONFIG: Record<DialogVariant, { icon: React.ElementType; iconBg: string; iconColor: string; btnClass: string }> = {
  danger: {
    icon: Trash2,
    iconBg: '#FEE2E2',
    iconColor: '#DC2626',
    btnClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    icon: Info,
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <Modal open={open} onClose={onClose} maxWidth="400px" hideCloseButton>
      <div className="px-6 pt-8 pb-2 text-center">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: config.iconBg }}
        >
          <Icon className="h-6 w-6" style={{ color: config.iconColor }} />
        </div>
        <h3 className="text-lg font-extrabold mb-2" style={{ color: '#1A1A1A' }}>
          {title}
        </h3>
        {description && (
          <p className="text-sm" style={{ color: '#6B6B6B' }}>
            {description}
          </p>
        )}
      </div>
      <ModalFooter>
        <button
          onClick={onClose}
          disabled={loading}
          className="pwa-btn pwa-btn-secondary flex-1"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn('pwa-btn flex-1 transition-colors', config.btnClass)}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            confirmLabel
          )}
        </button>
      </ModalFooter>
    </Modal>
  );
}
