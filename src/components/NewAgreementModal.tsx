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
  FileSignature,
  FileCheck,
  Plus,
} from 'lucide-react';
import { Customer, StockItem, ShopSettings, Agreement, CustomerRating } from '../types';
import { ListPicker } from './ListPicker';

interface NewAgreementModalProps {
  customers: Customer[];
  stock: StockItem[];
  settings: ShopSettings;
  onClose: () => void;
  preselectedItemId?: string;
  preselectedCustomerId?: string;
  onAddCustomer?: (customerData: Omit<Customer, 'id' | 'customerCode' | 'createdAt'>) => Customer;
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
  onAddCustomer,
  onCreateAgreement,
}) => {
  // 4 Stepper steps: 1 Customer, 2 Item, 3 Terms, 4 Review
  const [step, setStep] = useState<1 | 2 | 3 | 4>(
    preselectedCustomerId && preselectedItemId ? 3 : preselectedCustomerId ? 2 : 1
  );

  const availableStock = stock.filter((s) => s.status === 'available');

  const [selectedCustId, setSelectedCustId] = useState<string>(preselectedCustomerId || '');
  const [selectedItemId, setSelectedItemId] = useState<string>(preselectedItemId || '');

  const selectedCustomer = customers.find((c) => c.id === selectedCustId);
  const selectedStockItem = stock.find((s) => s.id === selectedItemId);

  // Financial & Agreement Terms State
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

  // Inline Quick Add Customer Modal
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [quickCustName, setQuickCustName] = useState('');
  const [quickCustCnic, setQuickCustCnic] = useState('');
  const [quickCustPhone, setQuickCustPhone] = useState('');
  const [quickCustCity, setQuickCustCity] = useState(settings.city || 'Lahore');
  const [quickCustAddress, setQuickCustAddress] = useState('');
  const [quickCustRating, setQuickCustRating] = useState<CustomerRating>('good');
  const [quickG1Name, setQuickG1Name] = useState('');
  const [quickG1Phone, setQuickG1Phone] = useState('');

  // Handle stock item change
  const handleItemSelect = (item: StockItem) => {
    setSelectedItemId(item.id);
    setCashPrice(item.cashPrice);
    setTotalInstalmentPrice(item.instalmentPrice);
    setDownPayment(item.minDownPayment);
    setUnitCost(item.unitCost || Math.round(item.cashPrice * 0.85));
    if (item.purchaseDate) {
      setPurchaseDate(item.purchaseDate);
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

  // Quick Down Payment Add chips
  const handleAddDownPayment = (amount: number) => {
    setDownPayment((prev) => Math.min(totalInstalmentPrice, prev + amount));
  };

  const handlePercentageDownPayment = (pct: number) => {
    const val = Math.round((totalInstalmentPrice * pct) / 100);
    setDownPayment(val);
  };

  // Quick Add Customer Submission
  const handleSaveQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddCustomer) return;
    if (!quickCustName.trim() || !quickCustPhone.trim()) {
      setValidationError('Please enter customer full name and phone number.');
      return;
    }

    const created = onAddCustomer({
      fullName: quickCustName.trim(),
      cnic: quickCustCnic.trim() || '35202-0000000-1',
      phone: quickCustPhone.trim(),
      address: quickCustAddress.trim() || 'Local Area',
      city: quickCustCity.trim() || 'Lahore',
      rating: quickCustRating,
      guarantor1: {
        name: quickG1Name.trim() || 'Family Member',
        phone: quickG1Phone.trim() || quickCustPhone.trim(),
        cnic: '35202-0000000-2',
        relation: 'Relative',
        address: quickCustAddress.trim() || 'Local Area',
      },
    });

    setSelectedCustId(created.id);
    setShowQuickAddCustomer(false);
    setValidationError(null);
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

  const stepLabels = [
    { num: 1, label: 'Customer' },
    { num: 2, label: 'Stock Item' },
    { num: 3, label: 'Sale Terms' },
    { num: 4, label: 'Review & Sign' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div
        className="m3-card border rounded-t-[28px] sm:rounded-[28px] w-full max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-4 relative shadow-2xl m3-bottom-sheet-slide sm:animate-in flex flex-col justify-between"
        style={{
          backgroundColor: 'var(--theme-surface-card)',
          borderColor: 'var(--theme-surface-border)',
        }}
      >
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-400/40 rounded-full mx-auto mb-1 sm:hidden" />

        <button
          onClick={onClose}
          type="button"
          aria-label="Close dialog"
          className="absolute right-4 top-4 p-2 rounded-full transition-all border cursor-pointer hover:bg-surface-2"
          style={{
            backgroundColor: 'var(--theme-surface-input)',
            borderColor: 'var(--theme-surface-border)',
            color: 'var(--theme-text-secondary)',
          }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Wizard Header & Stepper */}
        <div>
          <span
            className="text-caption font-bold uppercase tracking-wider font-mono-tabular"
            style={{ color: 'var(--theme-primary)' }}
          >
            Step {step} of 4 · New Agreement Wizard
          </span>
          <h2
            className="text-title sm:text-heading font-extrabold font-heading mt-0.5"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            Create Instalment Agreement
          </h2>

          {/* Stepper Tabs with Labels */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {stepLabels.map((s) => {
              const isActive = step === s.num;
              const isPassed = step > s.num;

              return (
                <div key={s.num} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      isActive
                        ? 'bg-primary'
                        : isPassed
                        ? 'bg-primary/50'
                        : 'bg-surface-2 border border-border'
                    }`}
                  />
                  <div className="text-caption font-bold truncate flex items-center gap-1">
                    <span
                      className={`${
                        isActive
                          ? 'text-primary'
                          : isPassed
                          ? 'text-text-muted'
                          : 'text-text-subtle'
                      }`}
                    >
                      {s.num}. {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {validationError && (
          <div className="flex items-center gap-2 p-3 rounded-xl border text-caption font-bold bg-danger/10 text-danger border-danger/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
          {/* STEP 1: SELECT CUSTOMER (ListPicker with Sticky Search) */}
          {step === 1 && (
            <div className="space-y-3">
              <ListPicker<Customer>
                type="customer"
                items={customers}
                selectedId={selectedCustId}
                onSelect={(cust) => {
                  setSelectedCustId(cust.id);
                  setValidationError(null);
                }}
                title="Select Registered Customer Profile"
                currencySymbol={settings.currencySymbol}
                onAddNew={onAddCustomer ? () => setShowQuickAddCustomer(true) : undefined}
                addNewLabel="Register New Customer"
                maxHeight="max-h-[320px]"
              />

              {/* Warning for Defaulter Customer */}
              {selectedCustomer?.rating === 'defaulter' && (
                <div className="p-3.5 rounded-xl bg-danger/15 border border-danger/30 text-danger text-caption flex items-start gap-2.5 animate-in">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block text-body-sm">Caution: Customer is on DEFAULTER List</span>
                    <span className="text-caption text-danger/90 font-medium">
                      Prior installment default on record. Additional guarantor verification or higher down payment is advised.
                    </span>
                  </div>
                </div>
              )}

              {/* Sticky Action Footer */}
              <div className="pt-3 border-t border-border flex justify-end">
                <button
                  type="button"
                  disabled={!selectedCustId}
                  onClick={() => setStep(2)}
                  className={`m3-btn-base ${
                    selectedCustId
                      ? 'm3-btn-filled'
                      : 'opacity-40 cursor-not-allowed bg-surface-2 text-text-subtle'
                  } text-body-sm py-2.5 px-5 font-bold flex items-center gap-2`}
                >
                  <span>Next: Choose Item</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT STOCK ITEM (ListPicker with Sticky Search) */}
          {step === 2 && (
            <div className="space-y-3">
              <ListPicker<StockItem>
                type="stock"
                items={availableStock}
                selectedId={selectedItemId}
                onSelect={(item) => {
                  handleItemSelect(item);
                  setValidationError(null);
                }}
                title="Select Available Showroom Stock Item"
                currencySymbol={settings.currencySymbol}
                maxHeight="max-h-[320px]"
              />

              {/* Shop Purchase Record Info for Selected Item */}
              {selectedStockItem && (
                <div className="p-3.5 rounded-xl border border-border bg-surface-2/40 space-y-2.5 text-body-sm">
                  <div className="flex items-center justify-between text-caption font-bold">
                    <span className="flex items-center gap-1.5 text-text">
                      <ShoppingBag className="w-4 h-4 text-text-muted" />
                      <span>Shop Purchase Baseline</span>
                    </span>
                    <span className="text-caption text-text-muted flex items-center gap-1">
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Confidential</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-caption font-bold text-text-muted mb-1">
                        Shop Purchase Date
                      </label>
                      <input
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        className="m3-input p-2 text-body font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="block text-caption font-bold text-text-muted mb-1">
                        Shop Cost ({settings.currencySymbol})
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={unitCost}
                        onChange={(e) => setUnitCost(Number(e.target.value))}
                        className="m3-input p-2 text-body font-mono-tabular font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Footer */}
              <div className="pt-3 border-t border-border flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="m3-btn-base m3-btn-outlined text-body-sm py-2.5 px-4 font-bold flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={!selectedItemId}
                  onClick={() => setStep(3)}
                  className={`m3-btn-base ${
                    selectedItemId
                      ? 'm3-btn-filled'
                      : 'opacity-40 cursor-not-allowed bg-surface-2 text-text-subtle'
                  } text-body-sm py-2.5 px-5 font-bold flex items-center gap-2`}
                >
                  <span>Next: Set Terms</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: FINANCIAL SALE TERMS & QUICK CHIPS */}
          {step === 3 && (
            <div className="space-y-4 text-body-sm">
              {/* Financial KPI Banner */}
              <div className="grid grid-cols-3 gap-2 font-mono-tabular text-center">
                <div className="p-3 rounded-xl border border-border bg-surface-2">
                  <span className="text-caption text-text-muted block uppercase font-bold">
                    Shop Cost
                  </span>
                  <span className="text-body font-extrabold text-text">
                    {settings.currencySymbol} {unitCost.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-surface-2">
                  <span className="text-caption text-text-muted block uppercase font-bold">
                    Customer Price
                  </span>
                  <span className="text-body font-extrabold text-text">
                    {settings.currencySymbol} {totalInstalmentPrice.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-primary/30 bg-primary/10">
                  <span className="text-caption text-primary block uppercase font-bold">
                    Shop Margin
                  </span>
                  <span className="text-body font-extrabold text-primary">
                    +{settings.currencySymbol} {shopProfitMargin.toLocaleString()} ({profitPercentage}%)
                  </span>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="p-4 rounded-2xl border border-border bg-surface-input space-y-4">
                {/* Row 1: Delivery Date & Customer Sale Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1.5 text-body-sm text-text">
                      Delivery Date to Customer *
                    </label>
                    <input
                      type="date"
                      required
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="m3-input p-2.5 font-mono-tabular text-body"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-body-sm text-text">
                      Total Instalment Sale Price ({settings.currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={totalInstalmentPrice}
                      onChange={(e) => setTotalInstalmentPrice(Number(e.target.value))}
                      className="m3-input p-2.5 font-mono-tabular font-bold text-body"
                    />
                  </div>
                </div>

                {/* Row 2: Down Payment with Quick Add Chips */}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-body-sm text-text">
                      Down Payment / Advance ({settings.currencySymbol}) *
                    </label>
                    <span className="text-caption font-mono-tabular text-text-muted font-semibold">
                      Remaining: {settings.currencySymbol} {remainingBalance.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="number"
                    required
                    min={0}
                    max={totalInstalmentPrice}
                    value={downPayment}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                    className="m3-input p-2.5 font-mono-tabular font-bold text-body"
                  />

                  {/* Quick-add chips for Down Payment */}
                  <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
                    <span className="text-caption text-text-muted font-bold shrink-0">Quick Add:</span>
                    {[5000, 10000, 20000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleAddDownPayment(amt)}
                        className="px-2.5 py-1 text-caption font-bold rounded-full border border-border bg-surface-2 hover:bg-primary-container hover:text-on-primary-container transition-colors shrink-0"
                      >
                        +{amt.toLocaleString()}
                      </button>
                    ))}
                    {[20, 25, 30].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handlePercentageDownPayment(pct)}
                        className="px-2.5 py-1 text-caption font-bold rounded-full border border-border bg-surface-2 hover:bg-primary-container hover:text-on-primary-container transition-colors shrink-0"
                      >
                        {pct}% Down
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 3: Month Duration with Quick Chips */}
                <div className="pt-2 border-t border-border">
                  <label className="block font-bold mb-1.5 text-body-sm text-text">
                    Duration (Months) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={60}
                    value={monthDuration}
                    onChange={(e) => handleDurationChange(Number(e.target.value))}
                    className="m3-input p-2.5 font-mono-tabular font-bold text-body"
                  />

                  {/* Quick Month Chips */}
                  <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
                    <span className="text-caption text-text-muted font-bold shrink-0">Plan:</span>
                    {[3, 6, 8, 10, 12, 18, 24].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleDurationChange(m)}
                        className={`px-3 py-1 text-caption font-bold rounded-full border transition-all shrink-0 ${
                          monthDuration === m
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface-2 border-border text-text-muted hover:border-primary'
                        }`}
                      >
                        {m} Months
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 4: Monthly Installment & Due Day */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                  <div className="p-3 rounded-xl border border-border bg-surface-2/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-body-sm text-text">
                        Monthly Installment
                      </label>
                      <span className="text-caption px-2 py-0.5 rounded bg-surface border border-border text-text-muted font-bold">
                        Auto Formula
                      </span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={customMonthlyAmount !== '' ? customMonthlyAmount : autoCalculatedMonthly}
                      onChange={(e) => setCustomMonthlyAmount(Number(e.target.value))}
                      className="m3-input p-2 font-mono-tabular font-bold text-body"
                    />
                    <div className="text-caption text-text-muted mt-1 font-mono-tabular font-medium">
                      ({totalInstalmentPrice} - {downPayment}) ÷ {monthDuration} = Rs. {autoCalculatedMonthly.toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-body-sm font-bold text-text mb-1">
                        Due Day
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={dueDayOfMonth}
                        onChange={(e) => setDueDayOfMonth(Number(e.target.value))}
                        className="m3-input p-2 font-mono-tabular font-bold text-body"
                      />
                    </div>
                    <div>
                      <label className="block text-body-sm font-bold text-text mb-1">
                        Cash Price
                      </label>
                      <input
                        type="number"
                        value={cashPrice}
                        onChange={(e) => setCashPrice(Number(e.target.value))}
                        className="m3-input p-2 font-mono-tabular text-body"
                      />
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-body-sm font-bold text-text mb-1">
                    Agreement Remarks / Delivery Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Delivered with manufacturer warranty card"
                    className="m3-input p-2.5 text-body"
                  />
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-border flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="m3-btn-base m3-btn-outlined text-body-sm py-2.5 px-4 font-bold flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="m3-btn-base m3-btn-filled text-body-sm py-2.5 px-5 font-bold flex items-center gap-2"
                >
                  <span>Review & Summary</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & CONFIRMATION */}
          {step === 4 && (
            <div className="space-y-4 text-body-sm">
              <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3.5">
                <div className="flex items-center gap-2 text-primary font-bold text-title">
                  <FileCheck className="w-5 h-5" />
                  <span>Agreement Summary Preview</span>
                </div>

                {/* Customer Snapshot */}
                {selectedCustomer && (
                  <div className="p-3.5 rounded-xl bg-surface border border-border flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-title text-text">
                        {selectedCustomer.fullName} ({selectedCustomer.customerCode})
                      </div>
                      <div className="text-body-sm text-text-muted font-mono-tabular font-medium">
                        CNIC: {selectedCustomer.cnic} · Phone: {selectedCustomer.phone}
                      </div>
                      <div className="text-caption text-text-muted mt-0.5 font-medium">
                        Guarantor: {selectedCustomer.guarantor1.name} ({selectedCustomer.guarantor1.phone})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-body-sm text-primary font-bold hover:underline p-1"
                    >
                      Edit
                    </button>
                  </div>
                )}

                {/* Item Snapshot */}
                {selectedStockItem && (
                  <div className="p-3.5 rounded-xl bg-surface border border-border flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-title text-text">
                        {selectedStockItem.name}
                      </div>
                      <div className="text-body-sm text-text-muted font-mono-tabular font-medium">
                        {selectedStockItem.brand} {selectedStockItem.model} · Serial: {selectedStockItem.serialNumber || 'N/A'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-body-sm text-primary font-bold hover:underline p-1"
                    >
                      Edit
                    </button>
                  </div>
                )}

                {/* Financial Terms Grid */}
                <div className="p-3.5 rounded-xl bg-surface border border-border grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-tabular text-center">
                  <div>
                    <span className="text-caption text-text-muted block font-bold">Total Sale</span>
                    <span className="font-extrabold text-title text-text">
                      {settings.currencySymbol} {totalInstalmentPrice.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-caption text-text-muted block font-bold">Down Payment</span>
                    <span className="font-extrabold text-title text-success">
                      {settings.currencySymbol} {downPayment.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-caption text-text-muted block font-bold">Monthly Due</span>
                    <span className="font-extrabold text-title text-primary">
                      {settings.currencySymbol} {finalMonthlyInstalment.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-caption text-text-muted block font-bold">Term</span>
                    <span className="font-extrabold text-title text-text">
                      {monthDuration} Months
                    </span>
                  </div>
                </div>

                <div className="text-caption text-text-muted flex items-center justify-between px-1 font-semibold">
                  <span>First Due Date: {deliveryDate.slice(0, 7)}-{dueDayOfMonth.toString().padStart(2, '0')}</span>
                  <span>Estimated Profit: +{settings.currencySymbol} {shopProfitMargin.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-border flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="m3-btn-base m3-btn-outlined text-body-sm py-2.5 px-4 font-bold flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Terms</span>
                </button>
                <button
                  type="submit"
                  className="m3-btn-base m3-btn-filled text-body-sm py-2.5 px-6 font-bold flex items-center gap-2 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Issue Agreement</span>
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Quick Add Customer Drawer/Modal */}
        {showQuickAddCustomer && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
            <div className="m3-card max-w-md w-full p-5 space-y-3 relative shadow-2xl bg-surface border border-border">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h3 className="font-bold text-title text-text flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <span>Quick Register Customer</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowQuickAddCustomer(false)}
                  className="p-1 rounded-full text-text-muted hover:text-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-body-sm">
                <div>
                  <label className="block text-body-sm font-bold text-text mb-1">
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Asif"
                    value={quickCustName}
                    onChange={(e) => setQuickCustName(e.target.value)}
                    className="m3-input p-2.5 text-body"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-body-sm font-bold text-text mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="0300-1234567"
                      value={quickCustPhone}
                      onChange={(e) => setQuickCustPhone(e.target.value)}
                      className="m3-input p-2.5 font-mono-tabular text-body"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-bold text-text mb-1">
                      CNIC Number
                    </label>
                    <input
                      type="text"
                      placeholder="35202-1234567-1"
                      value={quickCustCnic}
                      onChange={(e) => setQuickCustCnic(e.target.value)}
                      className="m3-input p-2.5 font-mono-tabular text-body"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-body-sm font-bold text-text mb-1">City</label>
                    <input
                      type="text"
                      value={quickCustCity}
                      onChange={(e) => setQuickCustCity(e.target.value)}
                      className="m3-input p-2.5 text-body"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-bold text-text mb-1">
                      Initial Rating
                    </label>
                    <select
                      value={quickCustRating}
                      onChange={(e) => setQuickCustRating(e.target.value as CustomerRating)}
                      className="m3-input p-2.5 text-body font-bold"
                    >
                      <option value="good">Good (Normal)</option>
                      <option value="watch">Watchlist</option>
                      <option value="defaulter">Defaulter</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-surface-2/40 space-y-2">
                  <span className="text-caption font-bold text-text-muted block uppercase tracking-wider">
                    Guarantor 1 Contact
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Guarantor Name"
                      value={quickG1Name}
                      onChange={(e) => setQuickG1Name(e.target.value)}
                      className="m3-input p-2 text-body"
                    />
                    <input
                      type="text"
                      placeholder="Guarantor Phone"
                      value={quickG1Phone}
                      onChange={(e) => setQuickG1Phone(e.target.value)}
                      className="m3-input p-2 font-mono-tabular text-body"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddCustomer(false)}
                  className="m3-btn-base m3-btn-text text-body-sm py-2 px-3.5 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickCustomer}
                  className="m3-btn-base m3-btn-filled text-body-sm py-2 px-4 font-bold"
                >
                  Save & Select
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
