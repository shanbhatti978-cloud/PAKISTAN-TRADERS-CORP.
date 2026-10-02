import React, { useState } from 'react';
import {
  X,
  User,
  Package,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Calculator,
  ShoppingBag,
  Truck,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { Customer, StockItem, ShopSettings, Agreement } from '../types';

interface NewAgreementModalProps {
  customers: Customer[];
  stock: StockItem[];
  settings: ShopSettings;
  onClose: () => void;
  preselectedItemId?: string;
  preselectedCustomerId?: string;
  onCreateAgreement: (params: {
    customerId: string;
    itemId: string;
    cashPrice: number;
    interestPercentage?: number;
    markupAmount?: number;
    unitCost?: number;
    purchaseDate?: string;
    deliveryDate?: string;
    totalInstalmentPrice: number;
    downPayment: number;
    monthDuration: number;
    monthlyInstalment?: number;
    dueDayOfMonth: number;
    startDate: string;
    notes?: string;
  }) => Agreement;
}

export const NewAgreementModal: React.FC<NewAgreementModalProps> = ({
  customers,
  stock,
  settings,
  onClose,
  preselectedItemId,
  preselectedCustomerId,
  onCreateAgreement,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(preselectedItemId ? 2 : 1);

  const availableStock = stock.filter((s) => s.status === 'available');

  const [selectedCustId, setSelectedCustId] = useState<string>(
    preselectedCustomerId || customers[0]?.id || ''
  );
  const [selectedItemId, setSelectedItemId] = useState<string>(
    preselectedItemId || availableStock[0]?.id || ''
  );

  const selectedStockItem = stock.find((s) => s.id === selectedItemId);

  // Financial State
  const defaultCash = selectedStockItem?.cashPrice || 35000;
  const defaultUnitCost = selectedStockItem?.unitCost || Math.round(defaultCash * 0.85);

  const [purchaseDate, setPurchaseDate] = useState<string>(
    selectedStockItem?.purchaseDate || new Date().toISOString().split('T')[0]
  );
  const [unitCost, setUnitCost] = useState<number>(defaultUnitCost);
  const [deliveryDate, setDeliveryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [totalInstalmentPrice, setTotalInstalmentPrice] = useState<number>(
    selectedStockItem?.instalmentPrice || 42000
  );
  const [downPayment, setDownPayment] = useState<number>(
    selectedStockItem?.minDownPayment || 6000
  );
  const [monthDuration, setMonthDuration] = useState<number>(12);
  const [customMonthlyAmount, setCustomMonthlyAmount] = useState<number | ''>('');
  const [dueDayOfMonth, setDueDayOfMonth] = useState<number>(10);
  const [cashPrice, setCashPrice] = useState<number>(defaultCash);
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Handle stock item change
  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = stock.find((s) => s.id === itemId);
    if (item) {
      setCashPrice(item.cashPrice);
      setTotalInstalmentPrice(item.instalmentPrice);
      setDownPayment(item.minDownPayment);
      setUnitCost(item.unitCost || Math.round(item.cashPrice * 0.85));
      if (item.purchaseDate) {
        setPurchaseDate(item.purchaseDate);
      }
    }
  };

  // Calculations
  const remainingBalance = Math.max(0, totalInstalmentPrice - downPayment);
  const autoCalculatedMonthly = monthDuration > 0 ? Math.round(remainingBalance / monthDuration) : 0;
  const finalMonthlyInstalment = customMonthlyAmount !== '' ? Number(customMonthlyAmount) : autoCalculatedMonthly;

  // Shop Gross Margin (Profit): Customer Sale Price - Shop Purchase Cost
  const shopProfitMargin = Math.max(0, totalInstalmentPrice - unitCost);
  const profitPercentage = unitCost > 0 ? Math.round((shopProfitMargin / unitCost) * 100) : 0;

  // Handler for Month Duration change
  const handleDurationChange = (val: number) => {
    const validMonths = Math.max(1, val);
    setMonthDuration(validMonths);
    setCustomMonthlyAmount('');
  };

  // Handler for Manual Monthly Amount change
  const handleMonthlyAmountChange = (val: number) => {
    if (val <= 0) {
      setCustomMonthlyAmount('');
      return;
    }
    setCustomMonthlyAmount(val);
    if (val > 0 && remainingBalance > 0) {
      const suggestedMonths = Math.ceil(remainingBalance / val);
      if (suggestedMonths > 0 && suggestedMonths <= 60) {
        setMonthDuration(suggestedMonths);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!selectedCustId || !selectedItemId) {
      setValidationError('Please select a valid customer profile and available stock item.');
      return;
    }

    onCreateAgreement({
      customerId: selectedCustId,
      itemId: selectedItemId,
      cashPrice,
      interestPercentage: 0,
      markupAmount: shopProfitMargin,
      unitCost,
      purchaseDate,
      deliveryDate,
      totalInstalmentPrice,
      downPayment,
      monthDuration,
      monthlyInstalment: finalMonthlyInstalment,
      dueDayOfMonth,
      startDate: deliveryDate,
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="m3-card border rounded-t-[28px] sm:rounded-[28px] w-full max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-4 relative shadow-2xl m3-bottom-sheet-slide sm:animate-in" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
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

        {/* Wizard Header */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>
            Agreement Wizard
          </span>
          <h2 className="text-lg sm:text-xl font-bold font-heading mt-0.5" style={{ color: 'var(--theme-text-primary)' }}>
            New Instalment Agreement
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Set customer sale price, down payment, plan months, and delivery date
          </p>

          <div className="flex items-center gap-1.5 mt-2.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-all ${
                  step >= s ? '' : 'bg-slate-500/20'
                }`}
                style={step >= s ? { backgroundColor: 'var(--theme-primary)' } : undefined}
              />
            ))}
          </div>
        </div>

        {validationError && (
          <div className="flex items-center gap-2 p-3 rounded-xl border text-xs animate-in" style={{ backgroundColor: 'var(--theme-tonal-bg)', borderColor: 'var(--theme-tonal-border)', color: 'var(--theme-primary)' }}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* STEP 1: SELECT CUSTOMER */}
          {step === 1 && (
            <div className="space-y-3 text-xs">
              <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                <User className="w-4 h-4 text-slate-400" />
                <span>1. Select Customer</span>
              </h3>

              <div>
                <label className="block font-medium mb-1" style={{ color: 'var(--theme-text-primary)' }}>Customer Profile *</label>
                <select
                  value={selectedCustId}
                  onChange={(e) => setSelectedCustId(e.target.value)}
                  className="m3-input p-2 font-medium"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} — CNIC: {c.cnic} ({c.city})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustId && (
                <div className="p-3 rounded-xl border space-y-1 font-mono-tabular" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
                  {(() => {
                    const cust = customers.find((c) => c.id === selectedCustId);
                    if (!cust) return null;
                    return (
                      <>
                        <div className="font-semibold text-xs" style={{ color: 'var(--theme-text-primary)' }}>{cust.fullName}</div>
                        <div className="text-slate-400">Phone: {cust.phone} | CNIC: {cust.cnic}</div>
                        <div className="text-slate-400 text-[11px]">Guarantor: {cust.guarantor1.name} ({cust.guarantor1.relation} - {cust.guarantor1.phone})</div>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="m3-btn-base m3-btn-filled text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <span>Next: Choose Item</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT ITEM & SHOP PURCHASE DETAILS */}
          {step === 2 && (
            <div className="space-y-3 text-xs">
              <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                <Package className="w-4 h-4 text-slate-400" />
                <span>2. Select Stock Item & Purchase Record</span>
              </h3>

              <div>
                <label className="block font-medium mb-1" style={{ color: 'var(--theme-text-primary)' }}>Available Product *</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className="m3-input p-2 font-medium"
                >
                  {availableStock.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — [Serial: {s.serialNumber || 'No Serial'}] — ({s.inStock} In Stock)
                    </option>
                  ))}
                </select>
              </div>

              {selectedStockItem && (
                <div className="p-3 rounded-xl border space-y-2.5" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-xs" style={{ color: 'var(--theme-text-primary)' }}>{selectedStockItem.name}</div>
                      <div className="text-slate-400 text-[11px] font-mono-tabular">Serial / IMEI: {selectedStockItem.serialNumber}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium border font-mono-tabular" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                      {selectedStockItem.inStock} In Showroom
                    </span>
                  </div>

                  {/* Shop Purchase Details */}
                  <div className="p-2.5 rounded-lg border space-y-2" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium flex items-center gap-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                        <span>Shop Purchase Record</span>
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <EyeOff className="w-3 h-3" />
                        <span>Private</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                      <div>
                        <label className="block font-medium mb-1 text-[11px]" style={{ color: 'var(--theme-text-primary)' }}>
                          Date of Purchase by Shop *
                        </label>
                        <input
                          type="date"
                          value={purchaseDate}
                          onChange={(e) => setPurchaseDate(e.target.value)}
                          className="m3-input p-1.5 font-mono-tabular text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-medium mb-1 text-[11px]" style={{ color: 'var(--theme-text-primary)' }}>
                          Shop Purchase Cost (PKR) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={unitCost}
                          onChange={(e) => setUnitCost(Number(e.target.value))}
                          className="m3-input p-1.5 font-mono-tabular font-medium text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="m3-btn-base m3-btn-outlined text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="m3-btn-base m3-btn-filled text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <span>Next: Sale & Plan Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SALE DETAILS */}
          {step === 3 && (
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                  <Calculator className="w-4 h-4 text-slate-400" />
                  <span>3. Sale Terms & Instalment Calculation</span>
                </h3>
              </div>

              {/* Summary Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono-tabular">
                <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">
                    Shop Cost
                  </span>
                  <span className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                    {settings.currencySymbol} {unitCost.toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">
                    Customer Price
                  </span>
                  <span className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                    {settings.currencySymbol} {totalInstalmentPrice.toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-tonal-bg)', borderColor: 'var(--theme-tonal-border)' }}>
                  <span className="text-[10px] uppercase font-medium block" style={{ color: 'var(--theme-primary)' }}>
                    Gross Margin
                  </span>
                  <span className="text-sm font-bold" style={{ color: 'var(--theme-primary)' }}>
                    +{settings.currencySymbol} {shopProfitMargin.toLocaleString()} ({profitPercentage}%)
                  </span>
                </div>
              </div>

              {/* INPUT CONTROLS */}
              <div className="p-3.5 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
                
                {/* Row 1: Date of Delivery & Customer Sale Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium mb-1 flex items-center gap-1 text-[11px]" style={{ color: 'var(--theme-text-primary)' }}>
                      <Truck className="w-3 h-3 text-slate-400" />
                      <span>Date Given to Customer *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="m3-input p-2 font-mono-tabular text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-[11px]" style={{ color: 'var(--theme-text-primary)' }}>
                      Customer Sale Price (PKR) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={totalInstalmentPrice}
                      onChange={(e) => setTotalInstalmentPrice(Number(e.target.value))}
                      className="m3-input p-2 font-mono-tabular font-bold text-sm"
                      placeholder="e.g. 35000"
                    />
                  </div>
                </div>

                {/* Row 2: Down Payment & Month of Instalments */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t" style={{ borderColor: 'var(--theme-surface-border)' }}>
                  <div>
                    <label className="block font-medium mb-1 text-[11px]" style={{ color: 'var(--theme-text-primary)' }}>
                      Down Payment / Advance (PKR) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={totalInstalmentPrice}
                      value={downPayment}
                      onChange={(e) => setDownPayment(Number(e.target.value))}
                      className="m3-input p-2 font-mono-tabular font-bold text-sm"
                      placeholder="e.g. 5000"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-[11px]" style={{ color: 'var(--theme-text-primary)' }}>
                      Month of Instalments *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={60}
                      value={monthDuration}
                      onChange={(e) => handleDurationChange(Number(e.target.value))}
                      className="m3-input p-2 font-mono-tabular font-bold text-sm"
                      placeholder="e.g. 10"
                    />
                    {/* Quick Month Fill Buttons */}
                    <div className="flex items-center gap-1 mt-1.5 overflow-x-auto no-scrollbar">
                      <span className="text-[10px] text-slate-400 shrink-0">Quick:</span>
                      {[1, 2, 3, 4, 6, 8, 10, 12, 15, 18, 24].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleDurationChange(m)}
                          className="px-1.5 py-0.5 text-[10px] font-medium rounded font-mono-tabular transition-all shrink-0 border"
                          style={{
                            backgroundColor: monthDuration === m ? 'var(--theme-primary)' : 'var(--theme-surface-card)',
                            color: monthDuration === m ? 'var(--theme-primary-foreground)' : 'var(--theme-text-secondary)',
                            borderColor: monthDuration === m ? 'var(--theme-primary)' : 'var(--theme-surface-border)',
                          }}
                        >
                          {m}M
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 3: Auto Calculated Monthly Installment & Due Day */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t" style={{ borderColor: 'var(--theme-surface-border)' }}>
                  <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-medium text-[11px]" style={{ color: 'var(--theme-text-primary)' }}>
                        Monthly Installment (PKR) *
                      </label>
                      <span className="text-[10px] px-1.5 py-0.2 rounded border text-slate-400" style={{ borderColor: 'var(--theme-surface-border)' }}>
                        Auto
                      </span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={customMonthlyAmount !== '' ? customMonthlyAmount : autoCalculatedMonthly}
                      onChange={(e) => handleMonthlyAmountChange(Number(e.target.value))}
                      className="m3-input p-1.5 font-mono-tabular font-bold text-xs"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>Formula: ({totalInstalmentPrice} - {downPayment}) ÷ {monthDuration} = Rs. {autoCalculatedMonthly.toLocaleString()}</span>
                      {customMonthlyAmount !== '' && (
                        <button
                          type="button"
                          onClick={() => setCustomMonthlyAmount('')}
                          className="font-medium hover:underline"
                          style={{ color: 'var(--theme-primary)' }}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 font-medium mb-1 text-[11px]">Due Day</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={dueDayOfMonth}
                        onChange={(e) => setDueDayOfMonth(Number(e.target.value))}
                        className="m3-input p-2 font-mono-tabular font-medium text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-medium mb-1 text-[11px]">Cash Price</label>
                      <input
                        type="number"
                        value={cashPrice}
                        onChange={(e) => setCashPrice(Number(e.target.value))}
                        className="m3-input p-2 font-mono-tabular font-medium text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1 text-[11px]">Remarks / Delivery Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Delivered with warranty card"
                    className="m3-input p-2 text-xs"
                  />
                </div>

              </div>

              {/* Bottom Buttons */}
              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="m3-btn-base m3-btn-outlined text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="m3-btn-base m3-btn-filled text-xs py-2 px-5 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Agreement</span>
                </button>
              </div>

            </div>
          )}

        </form>
      </div>
    </div>
  );
};
