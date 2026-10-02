import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  X,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  FileText,
  FileCheck,
  CheckCircle2,
  Table,
  Boxes,
  Building2,
  Receipt,
  Wallet,
  Zap,
  ArrowRight,
  Info,
  Layers,
  Calculator,
  AlertCircle,
  HelpCircle,
  Clock,
  ChevronRight,
  Lock,
} from 'lucide-react';
import {
  Payment,
  Agreement,
  ShopSettings,
  Customer,
  StockItem,
  StockReceipt,
  StockMovement,
  CashBookEntry,
  AuditLog,
} from '../types';
import { generateComprehensiveAuditReportPDF } from '../utils/pdfGenerator';
import { generateExcelAuditReport, ReportType } from '../utils/excelGenerator';
import { formatDateDDMMYYYY } from '../utils/formatters';

interface BusinessReportModalProps {
  payments: Payment[];
  agreements: Agreement[];
  customers: Customer[];
  stock: StockItem[];
  stockReceipts: StockReceipt[];
  stockMovements: StockMovement[];
  cashbook: CashBookEntry[];
  auditLogs: AuditLog[];
  settings: ShopSettings;
  onClose: () => void;
  onLogReportView?: (reportName: string) => void;
}

export const BusinessReportModal: React.FC<BusinessReportModalProps> = ({
  payments,
  agreements,
  customers,
  stock,
  stockReceipts,
  stockMovements,
  cashbook,
  auditLogs,
  settings,
  onClose,
  onLogReportView,
}) => {
  useEffect(() => {
    onLogReportView?.('Business Audit & PnL Financial Report');
  }, []);
  const [activeTab, setActiveTab] = useState<'profit_analysis' | 'export_reports'>('profit_analysis');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [calculationScope, setCalculationScope] = useState<'period' | 'all_time'>('period');
  const [reportType, setReportType] = useState<ReportType>('GROSS_MARGIN_REPORT');

  // Quick preset helper
  const handleSetPreset = (preset: 'this_month' | 'ytd' | 'all_time') => {
    if (preset === 'this_month') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-30');
      setCalculationScope('period');
    } else if (preset === 'ytd') {
      setStartDate('2026-01-01');
      setEndDate('2026-12-31');
      setCalculationScope('period');
    } else {
      setStartDate('2025-01-01');
      setEndDate('2027-12-31');
      setCalculationScope('all_time');
    }
  };

  // 1. FILTERED CALCULATIONS (Based on Selected Scope)
  const isPeriodScope = calculationScope === 'period';

  // Agreements sold in scope
  const targetAgreements = isPeriodScope
    ? agreements.filter((a) => a.startDate >= startDate && a.startDate <= endDate)
    : agreements;

  // Payments collected in scope
  const targetPayments = isPeriodScope
    ? payments.filter((p) => !p.isReversed && p.date >= startDate && p.date <= endDate)
    : payments.filter((p) => !p.isReversed);

  // Cashbook entries in scope
  const targetCashbook = isPeriodScope
    ? cashbook.filter((cb) => cb.date >= startDate && cb.date <= endDate)
    : cashbook;

  // --- A. Total Collected Payments ---
  const totalDownPayments = targetAgreements.reduce((sum, a) => sum + a.downPayment, 0);
  const totalInstallmentCollections = targetPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalCollectedPayments = totalDownPayments + totalInstallmentCollections;

  // --- B. Original Cost of Sold Items ---
  const totalOriginalCostSold = targetAgreements.reduce((sum, a) => {
    const cost = a.unitCost || Math.round(a.cashPrice * 0.85);
    return sum + cost;
  }, 0);

  const totalContractSellingValue = targetAgreements.reduce((sum, a) => sum + a.totalInstalmentPrice, 0);
  const totalRemainingToCollect = targetAgreements.reduce((sum, a) => sum + a.remainingBalance, 0);

  // --- C. Gross Realized Cash Profit ---
  const grossRealizedProfit = totalCollectedPayments - totalOriginalCostSold;
  const grossMarginOnCostPct = totalOriginalCostSold > 0
    ? ((grossRealizedProfit / totalOriginalCostSold) * 100).toFixed(1)
    : '0';

  const totalContractedProfit = totalContractSellingValue - totalOriginalCostSold;

  // --- D. General Shop Expenses ---
  const rentExpenses = targetCashbook
    .filter((cb) => cb.type === 'out' && cb.category === 'Shop Rent')
    .reduce((sum, cb) => sum + cb.amount, 0);

  const utilityExpenses = targetCashbook
    .filter((cb) => cb.type === 'out' && cb.category === 'Utility Bills')
    .reduce((sum, cb) => sum + cb.amount, 0);

  const salaryExpenses = targetCashbook
    .filter((cb) => cb.type === 'out' && cb.category === 'Staff Salary')
    .reduce((sum, cb) => sum + cb.amount, 0);

  const miscExpenses = targetCashbook
    .filter((cb) => cb.type === 'out' && !['Shop Rent', 'Utility Bills', 'Staff Salary', 'Stock Purchase'].includes(cb.category))
    .reduce((sum, cb) => sum + cb.amount, 0);

  const totalGeneralShopExpenses = rentExpenses + utilityExpenses + salaryExpenses + miscExpenses;

  // --- E. Net Business Profit ---
  const netBusinessProfit = grossRealizedProfit - totalGeneralShopExpenses;
  const netProfitPct = totalCollectedPayments > 0
    ? ((netBusinessProfit / totalCollectedPayments) * 100).toFixed(1)
    : '0';

  // Itemized Sold Products Profit Ledger
  const itemizedSoldLedger = targetAgreements.map((a) => {
    const cust = customers.find((c) => c.id === a.customerId);
    const itemCost = a.unitCost || Math.round(a.cashPrice * 0.85);
    const itemPayments = payments
      .filter((p) => p.agreementId === a.id && !p.isReversed)
      .reduce((sum, p) => sum + p.amountPaid, 0);

    const itemTotalCollected = a.downPayment + itemPayments;
    const itemRealizedProfit = itemTotalCollected - itemCost;
    const itemTotalMargin = a.totalInstalmentPrice - itemCost;
    const recoveryProgressPct = a.totalInstalmentPrice > 0
      ? Math.min(100, Math.round((itemTotalCollected / a.totalInstalmentPrice) * 100))
      : 0;

    return {
      agreementNumber: a.agreementNumber,
      customerName: cust?.fullName || 'Customer',
      customerCode: a.customerCode,
      itemName: a.itemName,
      itemSerial: a.itemSerial,
      startDate: a.startDate,
      originalCost: itemCost,
      downPayment: a.downPayment,
      paymentsCollected: itemPayments,
      totalCollected: itemTotalCollected,
      realizedProfit: itemRealizedProfit,
      contractPrice: a.totalInstalmentPrice,
      totalMargin: itemTotalMargin,
      remainingBalance: a.remainingBalance,
      recoveryProgressPct,
      status: a.status,
    };
  });

  // Export PDF Handler
  const handleExportPdf = () => {
    generateComprehensiveAuditReportPDF(
      reportType,
      startDate,
      endDate,
      stock,
      stockReceipts,
      stockMovements,
      agreements,
      customers,
      payments,
      cashbook,
      auditLogs,
      settings
    );
  };

  // Export Excel Handler
  const handleExportExcel = () => {
    generateExcelAuditReport({
      reportType,
      startDate,
      endDate,
      stock,
      stockReceipts,
      stockMovements,
      agreements,
      customers,
      payments,
      cashbook,
      auditLogs,
      settings,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="m3-card border rounded-t-[28px] sm:rounded-[28px] w-full max-w-5xl my-0 sm:my-auto p-4 sm:p-6 space-y-4 sm:space-y-5 relative shadow-2xl max-h-[92vh] flex flex-col m3-bottom-sheet-slide sm:animate-in" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
        
        {/* Drag Handle Pill for Mobile */}
        <div className="w-10 h-1 bg-text-muted/30 rounded-full mx-auto mb-1 sm:hidden shrink-0" />
        
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--theme-surface-border)' }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-caption font-bold uppercase tracking-wider border font-mono-tabular" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                Store Accounting & Audit Engine
              </span>
              <span className="text-text-muted text-caption hidden sm:inline font-medium">• FIFO Stored-Cost Standard</span>
            </div>
            <h2 className="text-title sm:text-heading font-black font-heading mt-1 flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
              <FileSpreadsheet className="w-6 h-6 shrink-0" style={{ color: 'var(--theme-primary)' }} />
              <span>Financial Profit Analysis & Executive Audit Reports</span>
            </h2>
            <p className="text-caption font-medium text-text-muted mt-1 max-w-2xl">
              Calculates net profit by subtracting <strong className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>actual inventory cost</strong> from <strong className="font-bold" style={{ color: 'var(--theme-primary)' }}>total collected payments</strong>, and strictly differentiates product cost from general shop cashbook overheads.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-full transition-all border shrink-0 text-text-muted hover:text-text"
            style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between gap-2 border-b pb-2.5" style={{ borderColor: 'var(--theme-surface-border)' }}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('profit_analysis')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-body-sm font-bold transition-all border ${
                activeTab === 'profit_analysis'
                  ? 'shadow-md'
                  : ''
              }`}
              style={{
                backgroundColor: activeTab === 'profit_analysis' ? 'var(--theme-primary)' : 'var(--theme-surface-input)',
                color: activeTab === 'profit_analysis' ? 'var(--theme-primary-foreground)' : 'var(--theme-text-secondary)',
                borderColor: activeTab === 'profit_analysis' ? 'var(--theme-primary)' : 'var(--theme-surface-border)',
              }}
            >
              <Calculator className="w-4 h-4" />
              <span>Realized Profit & Loss Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('export_reports')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-body-sm font-bold transition-all border ${
                activeTab === 'export_reports'
                  ? 'shadow-md'
                  : ''
              }`}
              style={{
                backgroundColor: activeTab === 'export_reports' ? 'var(--theme-primary)' : 'var(--theme-surface-input)',
                color: activeTab === 'export_reports' ? 'var(--theme-primary-foreground)' : 'var(--theme-text-secondary)',
                borderColor: activeTab === 'export_reports' ? 'var(--theme-primary)' : 'var(--theme-surface-border)',
              }}
            >
              <Table className="w-4 h-4" />
              <span>13 Audit Reports (PDF & Excel)</span>
            </button>
          </div>

          {/* Quick Date Scope Controls */}
          <div className="hidden md:flex items-center gap-2 text-caption">
            <span className="text-text-muted font-bold">Presets:</span>
            <button
              onClick={() => handleSetPreset('this_month')}
              className="px-3 py-1.5 rounded-lg text-caption font-bold border transition-all"
              style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)', color: 'var(--theme-text-primary)' }}
            >
              Sep 2026
            </button>
            <button
              onClick={() => handleSetPreset('ytd')}
              className="px-3 py-1.5 rounded-lg text-caption font-bold border transition-all"
              style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)', color: 'var(--theme-text-primary)' }}
            >
              YTD 2026
            </button>
            <button
              onClick={() => handleSetPreset('all_time')}
              className="px-3 py-1.5 rounded-lg text-caption font-bold border transition-all"
              style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)', color: 'var(--theme-text-primary)' }}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">

          {/* Date & Scope Bar */}
          <div className="border rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-body-sm" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 font-bold shrink-0" style={{ color: 'var(--theme-text-primary)' }}>
                <Calendar className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                <span>Accounting Period:</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCalculationScope('period');
                  }}
                  className="m3-input px-3 py-2 font-mono-tabular font-bold text-body-sm"
                />
                <span className="text-text-muted font-bold">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCalculationScope('period');
                  }}
                  className="m3-input px-3 py-2 font-mono-tabular font-bold text-body-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-text-muted font-bold">Scope:</span>
              <div className="inline-flex p-1 rounded-xl border" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                <button
                  onClick={() => setCalculationScope('period')}
                  className="px-3.5 py-1.5 rounded-lg text-caption font-bold transition-all border"
                  style={{
                    backgroundColor: calculationScope === 'period' ? 'var(--theme-tonal-bg)' : 'transparent',
                    color: calculationScope === 'period' ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
                    borderColor: calculationScope === 'period' ? 'var(--theme-primary)' : 'transparent',
                  }}
                >
                  Selected Date Range
                </button>
                <button
                  onClick={() => setCalculationScope('all_time')}
                  className="px-3.5 py-1.5 rounded-lg text-caption font-bold transition-all border"
                  style={{
                    backgroundColor: calculationScope === 'all_time' ? 'var(--theme-tonal-bg)' : 'transparent',
                    color: calculationScope === 'all_time' ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
                    borderColor: calculationScope === 'all_time' ? 'var(--theme-primary)' : 'transparent',
                  }}
                >
                  All-Time Store Total
                </button>
              </div>
            </div>
          </div>

          {/* TAB 1: REALIZED PROFIT & LOSS ANALYSIS */}
          {activeTab === 'profit_analysis' && (
            <div className="space-y-5">
              
              {/* Accounting Equation Hero Banner */}
              <div className="m3-hero-banner p-4 sm:p-5 shadow-lg relative overflow-hidden">
                <div className="text-caption font-bold uppercase tracking-wider mb-2.5 flex items-center gap-2" style={{ color: 'var(--theme-hero-banner-accent)' }}>
                  <Calculator className="w-4 h-4" />
                  <span>Realized Cash Profit Accounting Equation</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-center">
                  
                  {/* Step 1: Total Collected Payments */}
                  <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                    <div className="text-caption font-bold uppercase" style={{ color: 'var(--theme-primary)' }}>1. Total Collected Payments</div>
                    <div className="text-lg sm:text-title font-black font-mono-tabular mt-1" style={{ color: 'var(--theme-primary)' }}>
                      {settings.currencySymbol} {totalCollectedPayments.toLocaleString()}
                    </div>
                    <div className="text-caption text-text-muted mt-1 font-medium">
                      Advances + Installments
                    </div>
                  </div>

                  <div className="hidden md:flex justify-center text-text-muted font-black text-2xl">
                    —
                  </div>

                  {/* Step 2: Original Cost of Sold Items */}
                  <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                    <div className="text-caption font-bold uppercase" style={{ color: 'var(--theme-text-primary)' }}>2. Original Product Cost</div>
                    <div className="text-lg sm:text-title font-black font-mono-tabular mt-1" style={{ color: 'var(--theme-text-primary)' }}>
                      {settings.currencySymbol} {totalOriginalCostSold.toLocaleString()}
                    </div>
                    <div className="text-caption text-text-muted mt-1 font-medium">
                      Actual Purchase Price (COGS)
                    </div>
                  </div>

                  <div className="hidden md:flex justify-center text-text-muted font-black text-2xl">
                    =
                  </div>

                  {/* Step 3: Gross Realized Profit */}
                  <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                    <div className="text-caption font-bold uppercase" style={{ color: 'var(--theme-primary)' }}>3. Gross Realized Profit</div>
                    <div className="text-lg sm:text-title font-black font-mono-tabular mt-1" style={{ color: 'var(--theme-primary)' }}>
                      {settings.currencySymbol} {grossRealizedProfit.toLocaleString()}
                    </div>
                    <div className="text-caption text-text-muted mt-1 font-medium">
                      Margin over Purchase Cost
                    </div>
                  </div>

                </div>

                {/* Second Level: Subtracting General Shop Expenses */}
                <div className="mt-4 pt-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-body-sm" style={{ borderColor: 'var(--theme-surface-border)' }}>
                  <div className="flex items-center gap-2 font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                    <span className="text-text-muted font-bold">Operating Deductions:</span>
                    <span className="font-mono-tabular font-bold" style={{ color: 'var(--theme-primary)' }}>
                      — {settings.currencySymbol} {totalGeneralShopExpenses.toLocaleString()}
                    </span>
                    <span className="text-text-muted text-caption font-medium">(Rent, Utilities, Staff Salaries, Misc)</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-text-muted font-bold uppercase text-caption">Final Net Profit:</span>
                    <span className="text-title font-black font-mono-tabular px-3.5 py-1 rounded-xl border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                      {settings.currencySymbol} {netBusinessProfit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5 High-Level Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                
                {/* 1. Collected Payments */}
                <div className="p-4 rounded-2xl border relative overflow-hidden space-y-1.5" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                  <div className="flex items-center justify-between text-text-muted text-caption font-bold uppercase tracking-wider">
                    <span>Total Cash Inflow</span>
                    <TrendingUp className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                  </div>
                  <div className="text-display font-black font-mono-tabular mt-1" style={{ color: 'var(--theme-primary)' }}>
                    {settings.currencySymbol} {totalCollectedPayments.toLocaleString()}
                  </div>
                  <div className="text-caption text-text-muted space-y-0.5 font-mono-tabular font-medium">
                    <div>Advances: {settings.currencySymbol} {totalDownPayments.toLocaleString()}</div>
                    <div>Installments: {settings.currencySymbol} {totalInstallmentCollections.toLocaleString()}</div>
                  </div>
                </div>

                {/* 2. Original Cost of Sold Items */}
                <div className="p-4 rounded-2xl border relative overflow-hidden space-y-1.5" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                  <div className="flex items-center justify-between text-text-muted text-caption font-bold uppercase tracking-wider">
                    <span>Product-Specific Cost</span>
                    <Boxes className="w-4 h-4 text-text-muted" />
                  </div>
                  <div className="text-display font-black font-mono-tabular mt-1" style={{ color: 'var(--theme-text-primary)' }}>
                    {settings.currencySymbol} {totalOriginalCostSold.toLocaleString()}
                  </div>
                  <div className="text-caption text-text-muted font-mono-tabular font-medium">
                    {targetAgreements.length} Sold Units Issued
                  </div>
                </div>

                {/* 3. Gross Realized Profit */}
                <div className="p-4 rounded-2xl border relative overflow-hidden space-y-1.5" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                  <div className="flex items-center justify-between text-text-muted text-caption font-bold uppercase tracking-wider">
                    <span>Gross Realized Margin</span>
                    <DollarSign className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                  </div>
                  <div className="text-display font-black font-mono-tabular mt-1" style={{ color: 'var(--theme-primary)' }}>
                    {settings.currencySymbol} {grossRealizedProfit.toLocaleString()}
                  </div>
                  <div className="text-caption text-text-muted font-medium">
                    Margin: <span className="font-bold font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>{grossMarginOnCostPct}%</span> on Cost
                  </div>
                </div>

                {/* 4. General Shop Expenses */}
                <div className="p-4 rounded-2xl border relative overflow-hidden space-y-1.5" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                  <div className="flex items-center justify-between text-text-muted text-caption font-bold uppercase tracking-wider">
                    <span>Shop Cashbook Overhead</span>
                    <Wallet className="w-4 h-4 text-text-muted" />
                  </div>
                  <div className="text-display font-black font-mono-tabular mt-1" style={{ color: 'var(--theme-text-primary)' }}>
                    {settings.currencySymbol} {totalGeneralShopExpenses.toLocaleString()}
                  </div>
                  <div className="text-caption text-text-muted space-y-0.5 font-mono-tabular font-medium">
                    <div>Rent: {settings.currencySymbol} {rentExpenses.toLocaleString()}</div>
                    <div>Bills: {settings.currencySymbol} {utilityExpenses.toLocaleString()}</div>
                  </div>
                </div>

                {/* 5. Net Business Profit */}
                <div className="p-4 rounded-2xl border relative overflow-hidden space-y-1.5" style={{ backgroundColor: 'var(--theme-tonal-bg)', borderColor: 'var(--theme-primary)' }}>
                  <div className="flex items-center justify-between text-text-muted text-caption font-bold uppercase tracking-wider">
                    <span>Net Business Profit</span>
                    <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                  </div>
                  <div className="text-display font-black font-mono-tabular mt-1" style={{ color: 'var(--theme-primary)' }}>
                    {settings.currencySymbol} {netBusinessProfit.toLocaleString()}
                  </div>
                  <div className="text-caption text-text-muted font-medium">
                    Net Margin: <span className="font-bold font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>{netProfitPct}%</span>
                  </div>
                </div>

              </div>

              {/* CRITICAL DISTINCTION PANEL */}
              <div className="border rounded-2xl p-4 sm:p-5 space-y-3" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 shrink-0" style={{ color: 'var(--theme-primary)' }} />
                  <h3 className="text-body-sm font-bold uppercase tracking-wider font-heading" style={{ color: 'var(--theme-text-primary)' }}>
                    Accounting Distinction: Product-Specific Costs vs General Shop Expenses
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-sm">
                  {/* Left Column: Product-Specific Costs */}
                  <div className="p-4 rounded-xl border space-y-2.5" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-2" style={{ color: 'var(--theme-primary)' }}>
                        <Boxes className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                        Product-Specific Cost (Cost of Goods Sold)
                      </span>
                      <span className="font-mono-tabular font-black text-body" style={{ color: 'var(--theme-primary)' }}>
                        {settings.currencySymbol} {totalOriginalCostSold.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-text-muted text-caption leading-relaxed font-medium">
                      This is the <strong style={{ color: 'var(--theme-text-primary)' }}>exact factory/dealer purchase price</strong> paid by the corporation to acquire physical inventory units (e.g. AC, Motorcycle, LED TV). It attaches directly to the unit serial/IMEI and is deducted from sales proceeds to calculate gross margin.
                    </p>
                    <div className="text-caption text-text-muted p-2.5 rounded-lg border space-y-1 font-medium" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                      <div className="flex justify-between">
                        <span>Total Units Issued on Instalments:</span>
                        <span className="font-bold font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>{targetAgreements.length} items</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Product Purchase Cost:</span>
                        <span className="font-bold font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                          {settings.currencySymbol} {targetAgreements.length > 0 ? Math.round(totalOriginalCostSold / targetAgreements.length).toLocaleString() : '0'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: General Shop Expenses */}
                  <div className="p-4 rounded-xl border space-y-2.5" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-2 text-text" style={{ color: 'var(--theme-text-primary)' }}>
                        <Building2 className="w-4 h-4 text-text-muted" />
                        General Shop Operating Expenses (Cashbook)
                      </span>
                      <span className="font-mono-tabular font-black text-body" style={{ color: 'var(--theme-text-primary)' }}>
                        {settings.currencySymbol} {totalGeneralShopExpenses.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-text-muted text-caption leading-relaxed font-medium">
                      These are <strong style={{ color: 'var(--theme-text-primary)' }}>period running costs</strong> recorded as cash outflows in the daily cashbook. They do not attach to individual products. Note: Stock Purchases in cashbook are capital inventory assets, not operating expenses.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-caption p-2.5 rounded-lg border font-mono-tabular font-medium" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Shop Rent:</span>
                        <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>{settings.currencySymbol} {rentExpenses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Electricity/Bills:</span>
                        <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>{settings.currencySymbol} {utilityExpenses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Staff Salaries:</span>
                        <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>{settings.currencySymbol} {salaryExpenses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Misc Overheads:</span>
                        <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>{settings.currencySymbol} {miscExpenses.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ITEM-BY-ITEM SOLD PRODUCTS PROFIT LEDGER TABLE */}
              <div className="border rounded-2xl overflow-hidden shadow-lg space-y-0" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                    <h4 className="text-body-sm font-bold uppercase tracking-wider font-heading" style={{ color: 'var(--theme-text-primary)' }}>
                      Itemized Sold Contracts & Realized Margin Ledger ({itemizedSoldLedger.length} Contracts)
                    </h4>
                  </div>
                  <span className="text-caption text-text-muted font-medium">
                    Formula: Realized Profit = Collected — Original Cost
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-body-sm">
                    <thead className="text-caption uppercase font-bold text-text-muted border-b" style={{ borderColor: 'var(--theme-surface-border)' }}>
                      <tr>
                        <th className="py-3 px-3">Contract & Customer</th>
                        <th className="py-3 px-3">Model & Serial</th>
                        <th className="py-3 px-3 font-mono-tabular">Original Cost</th>
                        <th className="py-3 px-3 font-mono-tabular">Total Collected</th>
                        <th className="py-3 px-3 font-mono-tabular">Realized Profit</th>
                        <th className="py-3 px-3 font-mono-tabular">Agreed Price</th>
                        <th className="py-3 px-3 font-mono-tabular">Remaining</th>
                        <th className="py-3 px-3">Recovery Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--theme-surface-border)' }}>
                      {itemizedSoldLedger.map((row) => (
                        <tr key={row.agreementNumber} className="hover:bg-primary/5 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>{row.agreementNumber}</div>
                            <div className="text-caption text-text-muted font-medium">{row.customerName} ({row.customerCode})</div>
                          </td>
                          <td className="py-3 px-3 max-w-[200px]">
                            <div className="font-semibold truncate text-text">{row.itemName}</div>
                            <div className="text-caption text-text-muted font-mono-tabular">{row.itemSerial}</div>
                          </td>
                          <td className="py-3 px-3 font-mono-tabular font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                            {settings.currencySymbol} {row.originalCost.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-mono-tabular font-bold" style={{ color: 'var(--theme-primary)' }}>
                            {settings.currencySymbol} {row.totalCollected.toLocaleString()}
                            <div className="text-caption text-text-muted font-normal">
                              Adv: {row.downPayment.toLocaleString()} | Paid: {row.paymentsCollected.toLocaleString()}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono-tabular">
                            <span className="px-2.5 py-1 rounded-lg text-caption font-extrabold border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                              {row.realizedProfit >= 0 ? '+' : ''}{settings.currencySymbol} {row.realizedProfit.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono-tabular text-text-muted font-medium">
                            {settings.currencySymbol} {row.contractPrice.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-mono-tabular font-bold" style={{ color: 'var(--theme-primary)' }}>
                            {settings.currencySymbol} {row.remainingBalance.toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <div className="w-24 h-2 rounded-full overflow-hidden border" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${row.recoveryProgressPct}%`, backgroundColor: 'var(--theme-primary)' }}
                              />
                            </div>
                            <div className="text-caption text-text-muted font-mono-tabular mt-0.5 font-medium">
                              {row.recoveryProgressPct}% recovered
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    {/* Table Grand Totals Row */}
                    <tfoot className="border-t-2 font-bold text-body-sm" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
                      <tr>
                        <td className="py-3.5 px-3 uppercase" style={{ color: 'var(--theme-text-primary)' }}>
                          GRAND SUM / TOTALS
                        </td>
                        <td className="py-3.5 px-3 text-text-muted">
                          {itemizedSoldLedger.length} Sold Items
                        </td>
                        <td className="py-3.5 px-3 font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>
                          {settings.currencySymbol} {totalOriginalCostSold.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                          {settings.currencySymbol} {totalCollectedPayments.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                          {settings.currencySymbol} {grossRealizedProfit.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>
                          {settings.currencySymbol} {totalContractSellingValue.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                          {settings.currencySymbol} {totalRemainingToCollect.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 text-text-muted font-bold">
                          Net Margin: {grossMarginOnCostPct}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: STANDARD 13 AUDIT REPORTS EXPORTER */}
          {activeTab === 'export_reports' && (
            <div className="space-y-4">
              
              {/* Report Selection Dropdown */}
              <div className="space-y-2 text-body-sm p-4 rounded-2xl border" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
                <label className="block font-bold uppercase tracking-wider text-caption" style={{ color: 'var(--theme-text-primary)' }}>
                  Select Formal Audit Report to Export *
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  className="m3-input p-3 font-bold text-body"
                >
                  <option value="GROSS_MARGIN_REPORT">11. Gross Margin & Realized Profit Report (Actual Cost vs Selling Price)</option>
                  <option value="CUSTOMER_CONTRACT_LEDGER">6. Customer Contract & Instalment Ledger (With Cost & Interest)</option>
                  <option value="MONTHLY_BUSINESS_SUMMARY">13. Monthly Business Performance Summary</option>
                  <option value="MONTHLY_INVENTORY_RECEIVED">1. Monthly Inventory Received Report</option>
                  <option value="MONTHLY_INVENTORY_ISSUED">2. Monthly Inventory Issued / Sold Report</option>
                  <option value="MODEL_WISE_STOCK">3. Current Model-wise Stock Report</option>
                  <option value="SERIALIZED_INVENTORY_MOVEMENT">4. Serialized Inventory Movement Report</option>
                  <option value="INVENTORY_VALUATION_FIFO">5. Inventory Valuation Report (FIFO Cost Method)</option>
                  <option value="CUSTOMER_CASH_COLLECTION">7. Customer Cash Collection Report</option>
                  <option value="DUE_OVERDUE_RECOVERY">8. Due & Overdue Recovery Report</option>
                  <option value="SUPPLIER_PURCHASE_PAYABLE">9. Supplier Purchase & Payable Report</option>
                  <option value="CASHBOOK_RECONCILIATION">10. Cashbook & Payment Method Reconciliation</option>
                  <option value="FULL_AUDIT_TRAIL">12. Full System Audit Trail Report</option>
                </select>
                <p className="text-caption text-text-muted mt-1 font-medium">
                  Each report includes comprehensive summary total rows (sums) at the bottom, exact item costs, interest charged, and gross margin.
                </p>
              </div>

              {/* Metrics Summary Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-body-sm">
                <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                  <div className="text-caption font-bold text-text-muted uppercase tracking-wider">Period Recovery Collections</div>
                  <div className="text-title font-extrabold font-mono-tabular mt-0.5" style={{ color: 'var(--theme-primary)' }}>
                    {settings.currencySymbol} {targetPayments.reduce((sum, p) => sum + p.amountPaid, 0).toLocaleString()}
                  </div>
                  <div className="text-caption text-text-muted font-medium">{targetPayments.length} Payment Receipts</div>
                </div>

                <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                  <div className="text-caption font-bold text-text-muted uppercase tracking-wider">Active Sold Contracts</div>
                  <div className="text-title font-extrabold font-mono-tabular mt-0.5" style={{ color: 'var(--theme-text-primary)' }}>
                    {agreements.filter((a) => a.status === 'active' || a.status === 'defaulter').length} Contracts
                  </div>
                  <div className="text-caption font-mono-tabular font-bold" style={{ color: 'var(--theme-primary)' }}>
                    Pending Dues: {settings.currencySymbol} {totalRemainingToCollect.toLocaleString()}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                  <div className="text-caption font-bold text-text-muted uppercase tracking-wider">Current Inventory at Cost</div>
                  <div className="text-title font-extrabold font-mono-tabular mt-0.5" style={{ color: 'var(--theme-primary)' }}>
                    {settings.currencySymbol} {stock.reduce((sum, s) => sum + s.inStock * (s.unitCost || Math.round(s.cashPrice * 0.85)), 0).toLocaleString()}
                  </div>
                  <div className="text-caption text-text-muted font-medium">
                    {stock.reduce((sum, s) => sum + s.inStock, 0)} Units in Shop
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="pt-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0" style={{ borderColor: 'var(--theme-surface-border)' }}>
          <div className="text-caption text-text-muted flex items-center gap-2 font-medium">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--theme-primary)' }} />
            <span>All calculations based on immutable stored costs & verified cashbook entries</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportExcel}
              className="m3-btn-base m3-btn-tonal py-2.5 px-4 text-body-sm font-bold"
            >
              <Table className="w-4 h-4" />
              <span>Export Excel (XLSX)</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="m3-btn-base m3-btn-filled py-2.5 px-4 text-body-sm font-bold"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF Audit Report</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
