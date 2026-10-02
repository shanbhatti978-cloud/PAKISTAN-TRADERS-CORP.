import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Download,
  Send,
  DollarSign,
  ShieldCheck,
  Building,
  Smartphone,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Agreement, Customer, ShopSettings, Payment } from '../types';
import { generatePaymentReceiptPDF, generateThermalReceiptPDF } from '../utils/pdfGenerator';

interface PaymentModalProps {
  agreements: Agreement[];
  customers: Customer[];
  settings: ShopSettings;
  preselectedAgreementId?: string;
  preselectedInstallmentNum?: number;
  onClose: () => void;
  onRecordPayment: (params: {
    agreementId: string;
    installmentNumber: number;
    amountPaid: number;
    lateFee?: number;
    discount?: number;
    paymentMethod: 'Cash' | 'Bank Transfer' | 'JazzCash' | 'EasyPaisa';
    date: string;
    collectorName: string;
    notes?: string;
  }) => Payment;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  agreements,
  customers,
  settings,
  preselectedAgreementId,
  preselectedInstallmentNum,
  onClose,
  onRecordPayment,
}) => {
  const activeAgreements = agreements.filter((a) => a.status === 'active' || a.status === 'defaulter');

  const [selectedAgrId, setSelectedAgrId] = useState<string>(
    preselectedAgreementId || activeAgreements[0]?.id || ''
  );

  const selectedAgreement = agreements.find((a) => a.id === selectedAgrId);
  const selectedCustomer = customers.find((c) => c.id === selectedAgreement?.customerId);

  // Unpaid installment slots
  const unpaidSlots = selectedAgreement?.schedule.filter((s) => s.status !== 'paid') || [];

  const [installmentNum, setInstallmentNum] = useState<number>(
    preselectedInstallmentNum || unpaidSlots[0]?.installmentNumber || 1
  );

  const selectedSlot = selectedAgreement?.schedule.find((s) => s.installmentNumber === installmentNum);
  const defaultDueAmt = selectedSlot ? selectedSlot.amount - selectedSlot.paidAmount : 0;

  const [amountPaid, setAmountPaid] = useState<number>(defaultDueAmt);
  const [lateFee, setLateFee] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'JazzCash' | 'EasyPaisa'>('Cash');
  const [collectorName, setCollectorName] = useState(settings.proprietorName);
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [completedPayment, setCompletedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if (selectedSlot) {
      setAmountPaid(selectedSlot.amount - selectedSlot.paidAmount);
    }
  }, [selectedAgrId, installmentNum]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!selectedAgreement) {
      setValidationError('Please select a valid active agreement.');
      return;
    }
    if (amountPaid <= 0) {
      setValidationError('Amount paid must be greater than zero.');
      return;
    }

    const newPayment = onRecordPayment({
      agreementId: selectedAgreement.id,
      installmentNumber: installmentNum,
      amountPaid,
      lateFee,
      discount,
      paymentMethod,
      date: new Date().toISOString().split('T')[0],
      collectorName,
      notes,
    });

    setCompletedPayment(newPayment);

    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="m3-card border rounded-t-[28px] sm:rounded-[28px] w-full max-w-lg p-5 sm:p-6 space-y-4 sm:space-y-5 relative shadow-2xl max-h-[92vh] overflow-y-auto m3-bottom-sheet-slide sm:animate-in" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
        {/* Drag Handle Pill for Mobile */}
        <div className="w-10 h-1 bg-slate-400/40 rounded-full mx-auto mb-1 sm:hidden" />

        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 p-2 rounded-full transition-all border"
          style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)', color: 'var(--theme-text-secondary)' }}
        >
          <X className="w-4 h-4" />
        </button>

        {!completedPayment ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>Quick Recovery Terminal</span>
              <h2 className="text-lg sm:text-xl font-extrabold font-heading" style={{ color: 'var(--theme-text-primary)' }}>
                Collect Instalment Payment
              </h2>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 p-3 rounded-xl border text-xs animate-in" style={{ backgroundColor: 'var(--theme-tonal-bg)', borderColor: 'var(--theme-tonal-border)', color: 'var(--theme-primary)' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              
              {/* Select Agreement */}
              <div>
                <label className="block font-semibold mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>Select Active Agreement *</label>
                <select
                  value={selectedAgrId}
                  onChange={(e) => setSelectedAgrId(e.target.value)}
                  className="m3-input p-2.5 font-semibold text-xs"
                >
                  {activeAgreements.map((a) => {
                    const cust = customers.find((c) => c.id === a.customerId);
                    return (
                      <option key={a.id} value={a.id}>
                        {a.agreementNumber} - {cust?.fullName} ({a.itemName})
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedAgreement && selectedCustomer && (
                <div className="p-3 rounded-2xl border space-y-1" style={{ backgroundColor: 'var(--theme-tonal-bg)', borderColor: 'var(--theme-tonal-border)' }}>
                  <div className="font-bold text-sm" style={{ color: 'var(--theme-primary)' }}>{selectedCustomer.fullName}</div>
                  <div className="text-text-muted flex justify-between font-mono-tabular">
                    <span>{selectedAgreement.itemName}</span>
                    <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                      Bal: {settings.currencySymbol} {selectedAgreement.remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Select Installment Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>Instalment #</label>
                  <select
                    value={installmentNum}
                    onChange={(e) => setInstallmentNum(Number(e.target.value))}
                    className="m3-input p-2.5 font-mono-tabular font-bold text-xs"
                  >
                    {unpaidSlots.map((s) => (
                      <option key={s.installmentNumber} value={s.installmentNumber}>
                        Month #{s.installmentNumber} (Due: {s.dueDate})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="m3-input p-2.5 font-semibold text-xs"
                  >
                    <option value="Cash">Cash at Counter</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Financial Inputs */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>Amount Paid *</label>
                  <input
                    type="number"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="m3-input p-2.5 font-extrabold font-mono-tabular"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>Late Fee (+)</label>
                  <input
                    type="number"
                    value={lateFee}
                    onChange={(e) => setLateFee(Number(e.target.value))}
                    className="m3-input p-2.5 font-bold font-mono-tabular"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>Discount (-)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="m3-input p-2.5 font-bold font-mono-tabular"
                  />
                </div>
              </div>

              {/* Collector */}
              <div>
                <label className="block font-semibold mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>Collected By</label>
                <input
                  type="text"
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  className="m3-input p-2.5 font-medium"
                />
              </div>

            </div>

            <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <button
                type="button"
                onClick={onClose}
                className="m3-btn-base m3-btn-outlined"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="m3-btn-base m3-btn-filled"
              >
                Confirm Payment & Generate Receipt
              </button>
            </div>
          </form>
        ) : (
          /* Success Receipt View */
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="w-16 h-16 mx-auto animate-bounce" style={{ color: 'var(--theme-primary)' }} />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>Payment Recorded Successfully</span>
              <h2 className="text-2xl font-extrabold font-heading mt-1" style={{ color: 'var(--theme-text-primary)' }}>
                Receipt #{completedPayment.receiptNumber}
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Collected {settings.currencySymbol} {completedPayment.amountPaid.toLocaleString()} for {completedPayment.customerName}.
              </p>
            </div>

            <div className="p-4 rounded-xl border space-y-2 text-xs" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (selectedAgreement && selectedCustomer) {
                      generatePaymentReceiptPDF(completedPayment, selectedAgreement, selectedCustomer, settings);
                    }
                  }}
                  className="m3-btn-base m3-btn-filled py-2.5"
                >
                  <Download className="w-4 h-4" />
                  <span>A5 PDF Receipt</span>
                </button>

                <button
                  onClick={() => {
                    if (selectedAgreement && selectedCustomer) {
                      generateThermalReceiptPDF(completedPayment, selectedAgreement, selectedCustomer, settings);
                    }
                  }}
                  className="m3-btn-base m3-btn-tonal py-2.5"
                >
                  <Download className="w-4 h-4" />
                  <span>80mm Thermal Slip</span>
                </button>
              </div>

              {selectedCustomer && selectedAgreement && (
                <a
                  href={`https://wa.me/+92${selectedCustomer.phone.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(
                    `Assalam-o-Alaikum ${selectedCustomer.fullName} Sahib,\nReceived payment of Rs. ${completedPayment.amountPaid.toLocaleString()} against Receipt #${completedPayment.receiptNumber} for ${selectedAgreement.itemName}.\nRemaining Balance: Rs. ${selectedAgreement.remainingBalance.toLocaleString()}.\nThank you! - ${settings.shopName}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="m3-btn-base m3-btn-outlined w-full py-2.5 text-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send WhatsApp Receipt to Customer</span>
                </a>
              )}
            </div>

            <button
              onClick={onClose}
              className="m3-btn-base m3-btn-tonal px-6 py-2"
            >
              Close Window
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
