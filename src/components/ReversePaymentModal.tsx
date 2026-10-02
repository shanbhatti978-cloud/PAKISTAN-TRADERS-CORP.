import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Payment, ShopSettings } from '../types';

interface ReversePaymentModalProps {
  payment: Payment;
  settings: ShopSettings;
  onClose: () => void;
  onConfirmReversal: (paymentId: string, reason: string) => void;
}

export const ReversePaymentModal: React.FC<ReversePaymentModalProps> = ({
  payment,
  settings,
  onClose,
  onConfirmReversal,
}) => {
  const [reason, setReason] = useState('Incorrect payment entry error');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!reason.trim()) {
      setValidationError('Please enter a valid reason for payment reversal.');
      return;
    }

    onConfirmReversal(payment.id, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="m3-card border rounded-t-[28px] sm:rounded-[28px] w-full max-w-md p-5 sm:p-6 space-y-4 relative shadow-2xl m3-bottom-sheet-slide sm:animate-in"
        style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}
      >
        {/* Android Material 3 Drag Handle Pill for Mobile */}
        <div className="w-10 h-1 bg-slate-400/40 rounded-full mx-auto mb-1 sm:hidden" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 p-2 rounded-full transition-all border"
          style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)', color: 'var(--theme-text-secondary)' }}
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>Authorized Audit Corrective Action</span>
          <h2 className="text-xl font-extrabold font-heading mt-0.5 flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
            <RotateCcw className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
            Reverse Payment Transaction
          </h2>
        </div>

        {validationError && (
          <div className="flex items-center gap-2 p-3 rounded-xl border text-xs animate-in" style={{ backgroundColor: 'var(--theme-tonal-bg)', borderColor: 'var(--theme-tonal-border)', color: 'var(--theme-primary)' }}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="p-3 border rounded-xl space-y-1 text-xs" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
          <div className="font-bold" style={{ color: 'var(--theme-primary)' }}>Receipt #{payment.receiptNumber}</div>
          <div style={{ color: 'var(--theme-text-primary)' }}>Customer: {payment.customerName}</div>
          <div className="font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>
            Amount: {settings.currencySymbol} {payment.amountPaid.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400">Date: {payment.date} | Method: {payment.paymentMethod}</div>
        </div>

        <p className="text-xs text-slate-400">
          Reversing this transaction will restore the unpaid balance on the customer schedule and record a compensating cashbook outflow entry. Financial records are never hard-deleted.
        </p>

        <div className="space-y-1 text-xs">
          <label className="block font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Reason for Reversal *</label>
          <textarea
            rows={3}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Duplicate collection entry / Cash returned to customer"
            className="m3-input w-full p-2.5 font-sans text-xs"
          />
        </div>

        <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--theme-surface-border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="m3-btn-base m3-btn-outlined text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="m3-btn-base m3-btn-filled text-xs"
          >
            Confirm Reversal
          </button>
        </div>
      </form>
    </div>
  );
};
