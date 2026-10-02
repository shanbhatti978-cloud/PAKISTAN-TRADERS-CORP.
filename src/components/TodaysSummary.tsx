import React from 'react';
import {
  Calendar,
  Wallet,
  FileCheck2,
  Boxes,
  CreditCard,
  Plus,
  AlertTriangle,
  Banknote,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { Agreement, Customer, Payment, ShopSettings, StockItem } from '../types';

interface TodaysSummaryProps {
  payments: Payment[];
  agreements: Agreement[];
  stock: StockItem[];
  customers: Customer[];
  settings: ShopSettings;
  todayStr: string;
  onOpenNewAgreement?: () => void;
  onOpenCollectPayment?: () => void;
  onNavigateTab?: (tab: any) => void;
  onOpenReceiveStock?: () => void;
}

export const TodaysSummary: React.FC<TodaysSummaryProps> = ({
  payments,
  agreements,
  stock,
  customers,
  settings,
  todayStr,
  onOpenNewAgreement,
  onOpenCollectPayment,
  onNavigateTab,
  onOpenReceiveStock,
}) => {
  // 1. Filter Today's Payments & Collections
  const todaysPayments = payments.filter((p) => p.date === todayStr);
  const totalCollectedToday = todaysPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  
  const cashPaymentsToday = todaysPayments
    .filter((p) => p.paymentMethod === 'Cash')
    .reduce((sum, p) => sum + p.amountPaid, 0);
  const digitalPaymentsToday = todaysPayments
    .filter((p) => p.paymentMethod === 'Bank Transfer' || p.paymentMethod === 'EasyPaisa' || p.paymentMethod === 'JazzCash')
    .reduce((sum, p) => sum + p.amountPaid, 0);

  // 2. Filter Today's New Agreements
  const todaysAgreements = agreements.filter((a) => {
    return a.startDate === todayStr || (a.createdAt && a.createdAt.startsWith(todayStr)) || (a.notes && a.notes.includes(todayStr));
  });
  const newAgreementsCount = todaysAgreements.length;
  const todaysNewSalesValue = todaysAgreements.reduce((sum, a) => sum + (a.totalInstalmentPrice || a.cashPrice || 0), 0);
  const todaysAdvanceCollected = todaysAgreements.reduce((sum, a) => sum + (a.downPayment || 0), 0);

  // 3. Current Stock Valuation & Metrics
  const totalStockUnits = stock.reduce((sum, s) => sum + (s.inStock || 0), 0);
  const totalStockValuation = stock.reduce(
    (sum, s) => sum + (s.cashPrice || s.unitCost || 0) * (s.inStock || 0),
    0
  );
  const lowStockCount = stock.filter((s) => s.inStock > 0 && s.inStock <= 2).length;

  return (
    <div className="m3-card p-4 sm:p-5 space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5" style={{ borderColor: 'var(--theme-surface-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-heading" style={{ color: 'var(--theme-text-primary)' }}>
                Today's Overview
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono-tabular font-medium" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)' }}>
                {todayStr}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily summary of collections, newly registered agreements, and active stock value
            </p>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenCollectPayment && (
            <button
              onClick={onOpenCollectPayment}
              className="m3-btn-base m3-btn-tonal"
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Collect Payment</span>
            </button>
          )}
          {onOpenNewAgreement && (
            <button
              onClick={onOpenNewAgreement}
              className="m3-btn-base m3-btn-filled"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Agreement</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Core Highlight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* CARD 1: Total Collected Payments Today */}
        <div className="p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3.5 shadow-sm" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold flex items-center gap-2 uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>
                <div className="w-6 h-6 rounded-lg border flex items-center justify-center" style={{ backgroundColor: 'var(--theme-tonal-bg)', borderColor: 'var(--theme-tonal-border)' }}>
                  <Wallet className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <span>Today's Collections</span>
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border font-mono-tabular" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                {todaysPayments.length} {todaysPayments.length === 1 ? 'Receipt' : 'Receipts'}
              </span>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>
                {settings.currencySymbol} {totalCollectedToday.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Total received today
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t space-y-1.5 text-xs" style={{ borderColor: 'var(--theme-surface-border)' }}>
            <div className="flex items-center justify-between text-slate-400">
              <span>Cash in Shop:</span>
              <span className="font-medium font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>
                {settings.currencySymbol} {cashPaymentsToday.toLocaleString()}
              </span>
            </div>
            {digitalPaymentsToday > 0 && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Bank / Digital:</span>
                <span className="font-medium font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                  {settings.currencySymbol} {digitalPaymentsToday.toLocaleString()}
                </span>
              </div>
            )}
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('recovery')}
                className="w-full pt-1 text-[11px] font-medium flex items-center justify-between transition-colors group"
                style={{ color: 'var(--theme-primary)' }}
              >
                <span>View Recovery Ledger</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>

        {/* CARD 2: New Agreements Opened Today */}
        <div className="p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3.5 shadow-sm" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold flex items-center gap-2 uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>
                <div className="w-6 h-6 rounded-lg border flex items-center justify-center" style={{ backgroundColor: 'var(--theme-tonal-bg)', borderColor: 'var(--theme-tonal-border)' }}>
                  <FileCheck2 className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <span>New Agreements Today</span>
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border font-mono-tabular" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                {newAgreementsCount} Booked
              </span>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>
                {newAgreementsCount} <span className="text-sm font-normal text-slate-400">Contracts</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                New customer agreements registered
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t space-y-1.5 text-xs" style={{ borderColor: 'var(--theme-surface-border)' }}>
            <div className="flex items-center justify-between text-slate-400">
              <span>Sales Value:</span>
              <span className="font-medium font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>
                {settings.currencySymbol} {todaysNewSalesValue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Advance Paid:</span>
              <span className="font-medium font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                {settings.currencySymbol} {todaysAdvanceCollected.toLocaleString()}
              </span>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('agreements')}
                className="w-full pt-1 text-[11px] font-medium flex items-center justify-between transition-colors group"
                style={{ color: 'var(--theme-primary)' }}
              >
                <span>View Agreements</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>

        {/* CARD 3: Current Total Stock Value */}
        <div className="p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3.5 shadow-sm" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold flex items-center gap-2 uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>
                <div className="w-6 h-6 rounded-lg border flex items-center justify-center" style={{ backgroundColor: 'var(--theme-tonal-bg)', borderColor: 'var(--theme-tonal-border)' }}>
                  <Boxes className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <span>Total Stock Valuation</span>
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border font-mono-tabular" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                {totalStockUnits} Units
              </span>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>
                {settings.currencySymbol} {totalStockValuation.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Current showroom & warehouse value
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t space-y-1.5 text-xs" style={{ borderColor: 'var(--theme-surface-border)' }}>
            <div className="flex items-center justify-between text-slate-400">
              <span>Stock Models:</span>
              <span className="font-medium font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>
                {stock.length} Models
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Inventory Status:</span>
              <span className="font-medium font-mono-tabular" style={{ color: lowStockCount > 0 ? 'var(--theme-primary)' : 'var(--theme-text-primary)' }}>
                {lowStockCount > 0 ? `${lowStockCount} models low` : 'Optimal stock'}
              </span>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('stock')}
                className="w-full pt-1 text-[11px] font-medium flex items-center justify-between transition-colors group"
                style={{ color: 'var(--theme-primary)' }}
              >
                <span>Manage Inventory</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mini Today's Activity Feed if there are actions today */}
      {(todaysPayments.length > 0 || todaysAgreements.length > 0) && (
        <div className="rounded-xl p-3 space-y-2 border" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Recent Activity ({todaysPayments.length} collections, {newAgreementsCount} new sales)</span>
            <span className="text-[10px] font-mono-tabular">Synchronized</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-0.5">
            {todaysPayments.slice(0, 2).map((pay) => {
              const agr = agreements.find((a) => a.id === pay.agreementId);
              const cust = customers.find((c) => c.id === agr?.customerId);
              const instStr = pay.installmentNumbers?.length > 0 ? `Inst. #${pay.installmentNumbers.join(', #')}` : 'Payment';
              return (
                <div
                  key={pay.id}
                  className="rounded-lg p-2 flex items-center justify-between text-xs border"
                  style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}
                >
                  <div className="truncate pr-2">
                    <div className="font-medium truncate" style={{ color: 'var(--theme-text-primary)' }}>
                      {cust?.fullName || pay.customerName || 'Customer Payment'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono-tabular truncate">
                      {agr?.agreementNumber || pay.receiptNumber} • {instStr}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                      +{settings.currencySymbol} {pay.amountPaid.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}

            {todaysAgreements.slice(0, 2).map((agr) => {
              const cust = customers.find((c) => c.id === agr.customerId);
              return (
                <div
                  key={agr.id}
                  className="rounded-lg p-2 flex items-center justify-between text-xs border"
                  style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}
                >
                  <div className="truncate pr-2">
                    <div className="font-medium truncate" style={{ color: 'var(--theme-text-primary)' }}>
                      {cust?.fullName || agr.itemName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono-tabular truncate">
                      {agr.agreementNumber} • {agr.itemName}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                      {settings.currencySymbol} {(agr.totalInstalmentPrice || agr.cashPrice).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
