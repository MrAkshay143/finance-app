import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  compact?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  description,
  icon,
  children,
  footer,
  maxWidth,
  compact = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    // Save active element before modal opens
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Auto focus first input element or first focusable element
    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        if (modalRef.current.contains(document.activeElement)) {
          return;
        }
        const inputs = modalRef.current.querySelectorAll<HTMLElement>(
          'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'
        );
        if (inputs.length > 0) {
          inputs[0]?.focus();
        } else {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0]?.focus();
          } else {
            modalRef.current.focus();
          }
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);

      // Restore focus to trigger element
      if (previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === 'function') {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const subOrDesc = subtitle || description;
  const titleId = `modal-title-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const descriptionId = subOrDesc ? `modal-description-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined;

  const effectiveMaxWidth = maxWidth || (compact ? 'max-w-[340px]' : 'max-w-[390px]');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`w-full ${effectiveMaxWidth} bg-white ${compact ? 'rounded-2xl shadow-lg' : 'rounded-modal shadow-modal'} border border-borderDefault overflow-hidden flex flex-col max-h-[90vh] focus:outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${compact ? 'px-4 pt-4 pb-3' : 'px-5 pt-5 pb-4'} border-b border-borderDefault flex items-start justify-between bg-white relative`}>
          <div className="flex items-center gap-2.5 pr-8">
            {icon && (
              <div className={`${compact ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl'} bg-brand-primary-soft text-brand-primary flex items-center justify-center shrink-0`} aria-hidden="true">
                {icon}
              </div>
            )}
            <div>
              <h2 id={titleId} className={`${compact ? 'text-sm' : 'text-base'} font-bold text-textDefault tracking-tight leading-tight`}>
                {title}
              </h2>
              {subOrDesc && (
                <p id={descriptionId} className="text-xs text-textMuted mt-0.5 leading-normal">
                  {subOrDesc}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full text-textMuted hover:text-textDefault hover:bg-gray-100 flex items-center justify-center transition-colors absolute right-3 top-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className={`${compact ? 'p-4 space-y-3' : 'p-5 space-y-4'} overflow-y-auto flex-1`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={`${compact ? 'px-4 py-3 gap-2' : 'px-5 py-4 gap-2.5'} border-t border-borderDefault bg-gray-50 flex items-center justify-end`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
