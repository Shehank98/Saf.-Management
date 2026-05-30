'use client';

import * as React from 'react';
import { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  hideCloseButton?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = '520px',
  className,
  hideCloseButton,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && contentRef.current) {
        const focusable = contentRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        const firstFocusable = contentRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      });
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (!open) previousFocusRef.current?.focus();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-desc' : undefined}
    >
      <div
        ref={contentRef}
        className={cn(
          'bg-white rounded-2xl shadow-lg w-full overflow-hidden',
          'animate-in zoom-in-95 fade-in duration-200',
          className
        )}
        style={{ maxWidth, maxHeight: '92vh' }}
      >
        {(title || !hideCloseButton) && (
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b" style={{ borderColor: '#E8E5DE' }}>
            <div>
              {title && (
                <h3 id="modal-title" className="text-base font-extrabold" style={{ color: '#1A1A1A' }}>
                  {title}
                </h3>
              )}
              {description && (
                <p id="modal-desc" className="text-xs mt-1" style={{ color: '#8A8A8A' }}>
                  {description}
                </p>
              )}
            </div>
            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close dialog"
                style={{ color: '#8A8A8A' }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 120px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('flex gap-3 px-6 py-4 border-t', className)} style={{ borderColor: '#E8E5DE' }}>
      {children}
    </div>
  );
}
