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
  Receipt,
  FileText,
  Printer,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Agreement, Customer, ShopSettings, Payment } from '../types';
import { generatePaymentReceiptPDF, generateThermalReceiptPDF } from '../utils/pdfGenerator';
import { ListPicker } from './ListPicker';

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
  // Normalize status check
  const activeAgreements = agreements.filter(
    (a) =>
      a.status === 'active' ||
      a.status === 'defaulter'
  );

  const [selectedAgrId, setSelectedAgrId] = useState<string>(
    preselectedAgreementId || ''
  );

  const selectedAgreement = agreements.find((a) => a.id === selectedAgrId);
  const selectedCustomer = customers.find((c) => c.id === selectedAgreement?.customerId);

  // Unpaid installment slots
  const unpaidSlots =
    selectedAgreement?.schedule.filter((s) => s.status !== 'paid') || [];

  const [installmentNum, setInstallmentNum] = useState<number>(
    preselectedInstallmentNum || unpaidSlots[0]?.installmentNumber || 1
  );

  const selectedSlot = selectedAgreement?.schedule.find(
    (s) => s.installmentNumber === installmentNum
  );
  const defaultDueAmt = selectedSlot ? selectedSlot.amount - selectedSlot.paidAmount : 0;

  const [amountPaid, setAmountPaid] = useState<number>(defaultDueAmt);
  const [lateFee, setLateFee] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'JazzCash' | 'EasyPaisa'>('Cash');
  const [collectorName, setCollectorName] = useState(settings.proprietorName || 'Manager');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [completedPayment, setCompletedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if (selectedSlot) {
      setAmountPaid(selectedSlot.amount - selectedSlot.paidAmount);
    }
  }, [selectedAgrId, installmentNum]);

  // When agreement selected, auto pick first unpaid installment
  const handleSelectAgreement = (agr: Agreement) => {
    setSelectedAgrId(agr.id);
    const firstUnpaid = agr.schedule.find((s) => s.status !== 'paid');
    if (firstUnpaid) {
      setInstallmentNum(firstUnpaid.installmentNumber);
      setAmountPaid(firstUnpaid.amount - firstUnpaid.paidAmount);
    }
    setValidationError(null);
  };

  const handleQuickAddAmount = (add: number) => {
    setAmountPaid((prev) => prev + add);
  };

  const handleSetFullBalance = () => {
    if (selectedSlot) {
      setAmountPaid(selectedSlot.amount - selectedSlot.paidAmount);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!selectedAgreement) {
      setValidationError('Please choose an active agreement from the list.');
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

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div
        className="m3-card border rounded-t-[28px] sm:rounded-[28px] w-full max-w-lg p-5 sm:p-6 space-y-4 relative shadow-2xl max-h-[92vh] overflow-y-auto m3-bottom-sheet-slide sm:animate-in"
        style={{
          backgroundColor: 'var(--theme-surface-card)',
          borderColor: 'var(--theme-surface-border)',
        }}
      >
        {/* Drag Handle Pill for Mobile */}
        <div className="w-10 h-1 bg-slate-400/40 rounded-full mx-auto mb-1 sm:hidden" />

        <button
          onClick={onClose}
          type="button"
          aria-label="Close dialog"
          className="absolute right-4 top-4 p-2 rounded-full transition-all border hover:bg-surface-2 cursor-pointer"
          style={{
            backgroundColor: 'var(--theme-surface-input)',
            borderColor: 'var(--theme-surface-border)',
            color: 'var(--theme-text-secondary)',
          }}
        >
          <X className="w-4 h-4" />
        </button>

        {!completedPayment ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span
                className="text-[11px] font-bold uppercase tracking-wider font-mono-tabular"
                style={{ color: 'var(--theme-primary)' }}
              >
                Quick Recovery Terminal
              </span>
              <h2
                className="text-lg sm:text-xl font-extrabold font-heading"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                Collect Instalment Payment
              </h2>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 p-3 rounded-xl border text-xs bg-danger/10 text-danger border-danger/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              {/* 1. SELECT AGREEMENT WITH LISTPICKER (List + Search) */}
              <ListPicker<Agreement>
                type="agreement"
                items={activeAgreements}
                selectedId={selectedAgrId}
                onSelect={handleSelectAgreement}
                title="Select Customer Agreement"
                currencySymbol={settings.currencySymbol}
                placeholder="Search agreement #, customer name or model..."
                maxHeight="max-h-[220px]"
              />

              {/* Installment Slot Selection Pills */}
              {selectedAgreement && unpaidSlots.length > 0 && (
                <div className="p-3 rounded-2xl border border-border bg-surface-2/40 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-text">
                    <span>Select Installment Due</span>
                    <span className="font-mono-tabular text-text-subtle">
                      {unpaidSlots.length} unpaid slots remaining
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {unpaidSlots.map((slot) => {
                      const isSelected = slot.installmentNumber === installmentNum;
                      const isOverdue = slot.status === 'overdue';

                      return (
                        <button
                          key={slot.installmentNumber}
                          type="button"
                          onClick={() => {
                            setInstallmentNum(slot.installmentNumber);
                            setAmountPaid(slot.amount - slot.paidAmount);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono-tabular border transition-all shrink-0 flex flex-col items-center ${
                            isSelected
                              ? 'bg-primary text-on-primary border-primary shadow-xs'
                              : isOverdue
                              ? 'bg-danger/10 text-danger border-danger/30 hover:border-danger'
                              : 'bg-surface border-border text-text hover:border-primary/50'
                          }`}
                        >
                          <span>Slot #{slot.installmentNumber}</span>
                          <span className="text-[10px] opacity-80">
                            {settings.currencySymbol} {(slot.amount - slot.paidAmount).toLocaleString()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Amount to Collect with Quick-Add Chips */}
              <div className="p-3.5 rounded-2xl border border-border bg-surface-input space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[11px] text-text">
                    Amount Received ({settings.currencySymbol}) *
                  </label>
                  {selectedSlot && (
                    <button
                      type="button"
                      onClick={handleSetFullBalance}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      Set Exact Due (Rs. {(selectedSlot.amount - selectedSlot.paidAmount).toLocaleString()})
                    </button>
                  )}
                </div>

                <input
                  type="number"
                  required
                  min={1}
                  value={amountPaid || ''}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="m3-input p-2.5 font-mono-tabular font-extrabold text-base"
                  placeholder="0"
                />

                {/* Quick Add Chips */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] text-text-subtle shrink-0">Quick Add:</span>
                  {[500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAddAmount(amt)}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono-tabular border border-border bg-surface-2 hover:bg-primary-container hover:text-on-primary-container transition-colors shrink-0"
                    >
                      +{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method Pills */}
              <div>
                <label className="block font-semibold mb-1 text-[11px] text-text">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2 rounded-xl text-xs font-bold border text-center transition-all ${
                        paymentMethod === method
                          ? 'bg-primary text-on-primary border-primary shadow-xs'
                          : 'bg-surface-2 border-border text-text-muted hover:border-primary/50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Late Fee & Discount Optional Fields */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-text mb-1">
                    Late Fine / Surcharge
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={lateFee || ''}
                    onChange={(e) => setLateFee(Number(e.target.value))}
                    placeholder="0"
                    className="m3-input p-1.5 font-mono-tabular text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text mb-1">
                    Waiver / Discount
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={discount || ''}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    placeholder="0"
                    className="m3-input p-1.5 font-mono-tabular text-xs"
                  />
                </div>
              </div>

              {/* Collector & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-text mb-1">
                    Received By / Staff Name
                  </label>
                  <input
                    type="text"
                    required
                    value={collectorName}
                    onChange={(e) => setCollectorName(e.target.value)}
                    className="m3-input p-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text mb-1">
                    Notes / Receipt Remarks
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Paid at showroom counter"
                    className="m3-input p-1.5 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="m3-btn-base m3-btn-outlined text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedAgreement || amountPaid <= 0}
                className={`m3-btn-base ${
                  selectedAgreement && amountPaid > 0
                    ? 'm3-btn-filled'
                    : 'opacity-40 cursor-not-allowed bg-surface-2 text-text-subtle'
                } text-xs py-2.5 px-6 flex items-center gap-1.5 shadow-md`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Issue Receipt</span>
              </button>
            </div>
          </form>
        ) : (
          /* Payment Receipt Screen */
          <div className="space-y-4 text-center py-2 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-success/15 text-success rounded-full flex items-center justify-center mx-auto border border-success/30">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold font-heading text-text">
                Payment Collected Successfully!
              </h2>
              <p className="text-xs text-text-muted mt-1 font-mono-tabular">
                Receipt #{completedPayment.receiptNumber} · Amount: {settings.currencySymbol} {completedPayment.amountPaid.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-surface-2 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-subtle">Customer:</span>
                <span className="font-bold text-text">{completedPayment.customerName}</span>
              </div>
              <div className="flex justify-between font-mono-tabular">
                <span className="text-text-subtle">Date & Time:</span>
                <span className="text-text">{completedPayment.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-subtle">Method:</span>
                <span className="font-bold text-primary">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-subtle">Received By:</span>
                <span className="text-text">{completedPayment.collectorName}</span>
              </div>
            </div>

            {/* Print & Download Receipt Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedAgreement && selectedCustomer) {
                    generateThermalReceiptPDF(
                      completedPayment,
                      selectedAgreement,
                      selectedCustomer,
                      settings
                    );
                  }
                }}
                className="m3-btn-base m3-btn-outlined text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Thermal Slip (80mm)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedAgreement && selectedCustomer) {
                    generatePaymentReceiptPDF(
                      completedPayment,
                      selectedAgreement,
                      selectedCustomer,
                      settings
                    );
                  }
                }}
                className="m3-btn-base m3-btn-filled text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Full A4 Invoice</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="m3-btn-base m3-btn-tonal w-full text-xs py-2.5 mt-2"
            >
              Done & Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
