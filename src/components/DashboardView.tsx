import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  ArrowUpRight,
  ShieldAlert,
  Send,
  CheckCircle2,
  Clock,
  Plus,
  Users,
  Boxes,
  Truck,
  FileSpreadsheet,
  Menu,
  Sliders,
  Search,
  X,
  Download,
  Database,
  ShieldCheck,
  HardDriveDownload,
  RotateCw,
  BadgeDollarSign,
} from 'lucide-react';
import { Agreement, Customer, Payment, ShopSettings, StockItem, CategoryItem } from '../types';
import { getCategoryStockStatuses } from '../utils/stockThresholds';
import { CategoryThresholdModal } from './CategoryThresholdModal';
import { TodaysSummary } from './TodaysSummary';

interface DashboardViewProps {
  agreements: Agreement[];
  customers: Customer[];
  stock: StockItem[];
  payments: Payment[];
  settings: ShopSettings;
  categories?: CategoryItem[];
  searchQuery?: string;
  onClearSearch?: () => void;
  onExportBackupJSON?: () => string;
  onUpdateCategory?: (id: string, updates: Partial<CategoryItem>) => void;
  onOpenNewAgreement: () => void;
  onOpenCollectPayment: (agreementId?: string, installmentNum?: number) => void;
  onSendWhatsApp: (customer: Customer, agreement: Agreement, amount: number, dueDate: string) => void;
  onNavigateTab: (tab: any) => void;
  onOpenBusinessReport?: () => void;
  onToggleDrawer?: () => void;
  onOpenReceiveStock?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  agreements,
  customers,
  stock,
  payments,
  settings,
  categories = [],
  searchQuery = '',
  onClearSearch,
  onExportBackupJSON,
  onUpdateCategory,
  onOpenNewAgreement,
  onOpenCollectPayment,
  onSendWhatsApp,
  onNavigateTab,
  onOpenBusinessReport,
  onToggleDrawer,
  onOpenReceiveStock,
}) => {
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const todayStr = '2026-09-28'; // System current date
  const today = new Date(todayStr);

  // Daily Backup Notification State
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(() => {
    return localStorage.getItem('qistflow_last_backup_date');
  });
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    return localStorage.getItem('qistflow_last_backup_time');
  });
  const [isBackupDismissed, setIsBackupDismissed] = useState<boolean>(() => {
    return localStorage.getItem('qistflow_backup_dismissed_date') === todayStr;
  });
  const [backupSuccessToast, setBackupSuccessToast] = useState<boolean>(false);
  const [backupErrorToast, setBackupErrorToast] = useState<string | null>(null);

  const isBackupNeededToday = lastBackupDate !== todayStr && !isBackupDismissed;

  const handleDownloadDailyBackup = () => {
    if (!onExportBackupJSON) return;
    try {
      const jsonStr = onExportBackupJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const nowTime = new Date().toLocaleTimeString();
      a.href = url;
      a.download = `QistFlow_Database_Backup_${todayStr}.json`;
      a.click();
      URL.revokeObjectURL(url);

      localStorage.setItem('qistflow_last_backup_date', todayStr);
      localStorage.setItem('qistflow_last_backup_time', nowTime);
      setLastBackupDate(todayStr);
      setLastBackupTime(nowTime);
      setIsBackupDismissed(false);
      setBackupSuccessToast(true);
      setTimeout(() => setBackupSuccessToast(false), 5000);
    } catch (err) {
      console.error('Failed to download daily backup:', err);
      setBackupErrorToast('Error generating backup file. Please try again.');
      setTimeout(() => setBackupErrorToast(null), 5000);
    }
  };

  const handleDismissBackupReminder = () => {
    localStorage.setItem('qistflow_backup_dismissed_date', todayStr);
    setIsBackupDismissed(true);
  };

  // Category Low-Stock Analysis using registered category thresholds
  const categoryStatuses = getCategoryStockStatuses(categories, stock);
  const lowStockCategories = categoryStatuses.filter((s) => s.isLowStock);
  const hasLowStock = lowStockCategories.length > 0;

  // Critical Summary Counters
  const todaysCollections = payments
    .filter((p) => p.date === todayStr)
    .reduce((sum, p) => sum + p.amountPaid, 0);

  const totalInventoryValue = stock.reduce(
    (sum, s) => sum + s.cashPrice * s.inStock,
    0
  );

  const activeAgreementsCount = agreements.filter(
    (a) => a.status === 'active' || a.status === 'defaulter'
  ).length;

  // Operational Figures
  const totalStockReceived = stock.reduce((sum, s) => sum + (s.totalReceived || s.inStock), 0);
  const totalStockIssued = stock.reduce((sum, s) => sum + (s.totalIssued || (s.status === 'sold' ? 1 : 0)), 0);
  const totalStockAvailable = stock.reduce((sum, s) => sum + s.inStock, 0);

  // Calculate Totals
  const activeAgreements = agreements.filter((a) => a.status === 'active' || a.status === 'defaulter');
  
  const totalReceivables = activeAgreements.reduce(
    (sum, a) => sum + a.remainingBalance,
    0
  );

  const totalCollectedAllTime = payments.reduce(
    (sum, p) => sum + p.amountPaid,
    0
  );

  // Overdue Installments
  const overdueList: {
    agreement: Agreement;
    customer?: Customer;
    slot: any;
    daysLate: number;
  }[] = [];

  agreements.forEach((agr) => {
    const cust = customers.find((c) => c.id === agr.customerId);
    agr.schedule.forEach((slot) => {
      if (slot.status === 'overdue' || (slot.status === 'pending' && new Date(slot.dueDate) < today)) {
        const due = new Date(slot.dueDate);
        const diffDays = Math.max(1, Math.floor((today.getTime() - due.getTime()) / (1000 * 3600 * 24)));
        overdueList.push({
          agreement: agr,
          customer: cust,
          slot,
          daysLate: diffDays,
        });
      }
    });
  });

  const totalOverdueAmount = overdueList.reduce(
    (sum, item) => sum + (item.slot.amount - item.slot.paidAmount),
    0
  );

  return (
    <div className="space-y-6">
      
      {/* Global Search Results Panel on Dashboard when Searching */}
      {searchQuery.trim().length > 0 && (
        <div className="m3-card p-4 sm:p-5 space-y-4 m3-animate-in">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)' }}>
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold font-heading" style={{ color: 'var(--theme-text-primary)' }}>
                  Search Results for: <span className="font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>"{searchQuery}"</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Live matches found across Master Inventory, Sale Agreements, and Customers
                </p>
              </div>
            </div>

            {onClearSearch && (
              <button
                onClick={onClearSearch}
                className="m3-btn-base m3-btn-outlined"
              >
                <X className="w-4 h-4" />
                <span>Clear Search</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Inventory Matches */}
            <div className="p-3.5 rounded-xl border space-y-2.5" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
              <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--theme-primary)' }}>
                <span className="flex items-center gap-1.5">
                  <Boxes className="w-4 h-4" />
                  <span>Master Inventory</span>
                </span>
                <button
                  onClick={() => onNavigateTab('stock')}
                  className="text-[10px] hover:underline"
                  style={{ color: 'var(--theme-primary)' }}
                >
                  View Tab →
                </button>
              </div>

              {stock.filter(
                (s) =>
                  s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <div className="text-slate-400 text-xs py-2">No matching stock items</div>
              ) : (
                stock
                  .filter(
                    (s) =>
                      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .slice(0, 3)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onNavigateTab('stock')}
                      className="p-2 rounded-lg cursor-pointer border flex items-center justify-between text-xs transition-colors"
                      style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}
                    >
                      <div>
                        <div className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>{item.name}</div>
                        <div className="text-[10px] text-slate-400">S/N: {item.serialNumber || 'N/A'}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono-tabular" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)' }}>
                        {item.inStock} In Stock
                      </span>
                    </div>
                  ))
              )}
            </div>

            {/* 2. Agreements Matches */}
            <div className="p-3.5 rounded-xl border space-y-2.5" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
              <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--theme-primary)' }}>
                <span className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Sale Agreements</span>
                </span>
                <button
                  onClick={() => onNavigateTab('agreements')}
                  className="text-[10px] hover:underline"
                  style={{ color: 'var(--theme-primary)' }}
                >
                  View Tab →
                </button>
              </div>

              {agreements.filter((a) => {
                const cust = customers.find((c) => c.id === a.customerId);
                return (
                  a.agreementNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  a.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  a.itemSerial.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (cust?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
                );
              }).length === 0 ? (
                <div className="text-slate-400 text-xs py-2">No matching agreements</div>
              ) : (
                agreements
                  .filter((a) => {
                    const cust = customers.find((c) => c.id === a.customerId);
                    return (
                      a.agreementNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      a.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      a.itemSerial.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (cust?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
                    );
                  })
                  .slice(0, 3)
                  .map((agr) => (
                    <div
                      key={agr.id}
                      onClick={() => onNavigateTab('agreements')}
                      className="p-2 rounded-lg cursor-pointer border flex items-center justify-between text-xs transition-colors"
                      style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}
                    >
                      <div>
                        <div className="font-bold font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>{agr.agreementNumber}</div>
                        <div className="text-[10px] text-slate-400">{agr.itemName}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>
                          {settings.currencySymbol} {agr.remainingBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* 3. Customers Matches */}
            <div className="p-3.5 rounded-xl border space-y-2.5" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
              <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--theme-primary)' }}>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>Customers</span>
                </span>
                <button
                  onClick={() => onNavigateTab('customers')}
                  className="text-[10px] hover:underline"
                  style={{ color: 'var(--theme-primary)' }}
                >
                  View Tab →
                </button>
              </div>

              {customers.filter(
                (c) =>
                  c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.phone.includes(searchQuery) ||
                  c.cnic.includes(searchQuery)
              ).length === 0 ? (
                <div className="text-slate-400 text-xs py-2">No matching customers</div>
              ) : (
                customers
                  .filter(
                    (c) =>
                      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.phone.includes(searchQuery) ||
                      c.cnic.includes(searchQuery)
                  )
                  .slice(0, 3)
                  .map((cust) => (
                    <div
                      key={cust.id}
                      onClick={() => onNavigateTab('customers')}
                      className="p-2 rounded-lg cursor-pointer border flex items-center justify-between text-xs transition-colors"
                      style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}
                    >
                      <div>
                        <div className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>{cust.fullName}</div>
                        <div className="text-[10px] text-slate-400">{cust.phone}</div>
                      </div>
                      <span className="text-[10px] font-mono-tabular text-slate-400">{cust.city}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visual Warning Alert Banner when items fall below category threshold */}
      {hasLowStock && (
        <div className="m3-card p-4 sm:p-5 relative overflow-hidden animate-in fade-in duration-200 border-2" style={{ borderColor: 'var(--theme-primary)' }}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md" style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }}>
                  <AlertTriangle className="w-3.5 h-3.5 fill-current" />
                  MINIMUM STOCK THRESHOLD WARNING
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono-tabular border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                  {lowStockCategories.length} {lowStockCategories.length === 1 ? 'Category' : 'Categories'} Under Safety Limit
                </span>
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-bold font-heading tracking-tight flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                  <span>Low Stock Safety Limit Triggered</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
                  Available physical inventory in the following product categories has fallen to or below the safety limit. Log incoming shipment or adjust thresholds.
                </p>
              </div>

              {/* Scannable Category Pills Grid */}
              <div className="flex flex-wrap gap-2 pt-1">
                {lowStockCategories.map(({ category, threshold, availableUnits, isOutOfStock }) => (
                  <div
                    key={category.id}
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-medium transition-all"
                    style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}
                  >
                    <span className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{category.name}:</span>
                    <span
                      className="font-mono-tabular font-bold"
                      style={{ color: isOutOfStock ? '#DC2626' : 'var(--theme-primary)' }}
                    >
                      {isOutOfStock ? '0 Available' : `${availableUnits} in shop`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono-tabular px-1.5 py-0.5 rounded-full border" style={{ borderColor: 'var(--theme-surface-border)' }}>
                      Min: {threshold}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions on Alert */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
              {onOpenReceiveStock && (
                <button
                  onClick={onOpenReceiveStock}
                  className="m3-btn-base m3-btn-filled"
                >
                  <Boxes className="w-4 h-4" />
                  <span>Receive Stock</span>
                </button>
              )}

              <button
                onClick={() => onNavigateTab('stock')}
                className="m3-btn-base m3-btn-tonal"
              >
                <span>View Stock</span>
              </button>

              <button
                onClick={() => setShowThresholdModal(true)}
                className="m3-btn-base m3-btn-outlined"
                title="Change or tune low stock category thresholds"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust Limits</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTOMATED DAILY DATABASE BACKUP REMINDER BANNER */}
      {onExportBackupJSON && (
        <div className="transition-all duration-200">
          {isBackupNeededToday ? (
            <div className="m3-card p-4 sm:p-5 relative overflow-hidden">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1 border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                      <HardDriveDownload className="w-3 h-3" />
                      Daily Backup Reminder
                    </span>
                    <span className="text-xs text-slate-400 font-mono-tabular">
                      Pending for today ({todayStr})
                    </span>
                  </div>

                  <div>
                    <h2 className="text-sm sm:text-base font-bold font-heading flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                      <Database className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                      <span>Daily Database Backup Recommended</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
                      Download a secure offline JSON backup to preserve customer agreements, guarantor profiles, payments, and stock records.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <div className="px-2 py-0.5 rounded-full border text-slate-400 font-mono-tabular" style={{ borderColor: 'var(--theme-surface-border)' }}>
                      {customers.length} Customers
                    </div>
                    <div className="px-2 py-0.5 rounded-full border text-slate-400 font-mono-tabular" style={{ borderColor: 'var(--theme-surface-border)' }}>
                      {agreements.length} Agreements
                    </div>
                    <div className="px-2 py-0.5 rounded-full border text-slate-400 font-mono-tabular" style={{ borderColor: 'var(--theme-surface-border)' }}>
                      {stock.length} Stock Models
                    </div>
                    <div className="px-2 py-0.5 rounded-full border text-slate-400 font-mono-tabular" style={{ borderColor: 'var(--theme-surface-border)' }}>
                      {payments.length} Payments
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 pt-1 lg:pt-0">
                  <button
                    onClick={handleDownloadDailyBackup}
                    className="m3-btn-base m3-btn-filled"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Backup (JSON)</span>
                  </button>

                  <button
                    onClick={handleDismissBackupReminder}
                    className="m3-btn-base m3-btn-outlined"
                  >
                    Remind Later
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="m3-card p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)' }}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                    <span>Database Backup:</span>
                    <span style={{ color: 'var(--theme-primary)' }}>
                      {lastBackupDate === todayStr ? "Secured for Today" : "Saved"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {lastBackupDate === todayStr
                      ? `Downloaded today at ${lastBackupTime || 'earlier today'}`
                      : `Last exported: ${lastBackupDate || 'Never'}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleDownloadDailyBackup}
                  className="m3-btn-base m3-btn-tonal"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Copy (.JSON)</span>
                </button>
              </div>
            </div>
          )}

          {backupSuccessToast && (
            <div className="mt-2 p-3 rounded-xl border text-xs flex items-center justify-between shadow-md" style={{ backgroundColor: 'var(--theme-tonal-bg)', borderColor: 'var(--theme-tonal-border)', color: 'var(--theme-primary)' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Success:</strong> Full offline JSON database backup downloaded ({todayStr}).
                </span>
              </div>
              <button
                onClick={() => setBackupSuccessToast(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* MATERIAL 3 EXPRESSIVE QUICK ACTION BAR */}
      <div className="m3-card p-3.5 sm:p-4 m3-animate-in">
        <div className="flex items-center justify-between gap-3 mb-3 border-b pb-2.5" style={{ borderColor: 'var(--theme-surface-border)' }}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--theme-primary)' }} />
            <h2 className="text-xs sm:text-sm font-bold font-heading tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
              Quick Operations
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Daily Workflow Actions
          </span>
        </div>

        {/* Action Buttons following single theme color */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            onClick={onOpenNewAgreement}
            className="m3-btn-base m3-btn-filled w-full"
            title="Create new installment sale agreement"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Sale</span>
          </button>

          <button
            onClick={() => onOpenCollectPayment()}
            className="m3-btn-base m3-btn-tonal w-full"
            title="Collect customer installment payment"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Collect</span>
          </button>

          <button
            onClick={() => onNavigateTab('recovery')}
            className="m3-btn-base m3-btn-tonal w-full"
            title="View recovery and overdue list"
          >
            <BadgeDollarSign className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Recovery</span>
          </button>

          <button
            onClick={onOpenReceiveStock}
            className="m3-btn-base m3-btn-outlined w-full"
            title="Log incoming inventory stock"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Stock In</span>
          </button>

          <button
            onClick={() => onNavigateTab('customers')}
            className="m3-btn-base m3-btn-outlined w-full"
            title="View customer directory & ledgers"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clients</span>
          </button>

          <button
            onClick={() => onNavigateTab('cashbook')}
            className="m3-btn-base m3-btn-text w-full"
            title="Daily cashbook inflows & expenses"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Cashbook</span>
          </button>
        </div>
      </div>

      {/* TODAY'S SUMMARY & DAILY MONITORING HERO COMPONENT */}
      <TodaysSummary
        payments={payments}
        agreements={agreements}
        stock={stock}
        customers={customers}
        settings={settings}
        todayStr={todayStr}
        onOpenNewAgreement={onOpenNewAgreement}
        onOpenCollectPayment={() => onOpenCollectPayment()}
        onNavigateTab={onNavigateTab}
        onOpenReceiveStock={onOpenReceiveStock}
      />

      {/* Core Operational Figures: Total Received, Total Dispatched, Available Stock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        
        <div className="m3-card p-4 flex items-center justify-between transition-all duration-180 shadow-sm">
          <div>
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <span>Total Received</span>
            </div>
            <div className="text-xl font-bold font-mono-tabular mt-1" style={{ color: 'var(--theme-text-primary)' }}>
              {totalStockReceived} <span className="text-xs text-slate-400 font-normal">Units</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Shipments logged in system</div>
          </div>
          <button
            onClick={() => onNavigateTab('stock')}
            className="m3-btn-base m3-btn-tonal text-xs"
          >
            Log Stock
          </button>
        </div>

        <div className="m3-card p-4 flex items-center justify-between transition-all duration-180 shadow-sm">
          <div>
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <span>Units Dispatched</span>
            </div>
            <div className="text-xl font-bold font-mono-tabular mt-1" style={{ color: 'var(--theme-text-primary)' }}>
              {totalStockIssued} <span className="text-xs text-slate-400 font-normal">Units</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{activeAgreements.length} Active contracts</div>
          </div>
          <button
            onClick={() => onNavigateTab('agreements')}
            className="m3-btn-base m3-btn-tonal text-xs"
          >
            Agreements
          </button>
        </div>

        <div className="m3-card p-4 flex items-center justify-between transition-all duration-180 shadow-sm">
          <div>
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <span>Available in Showroom</span>
              {hasLowStock && (
                <span className="px-2 py-0.2 rounded-full border text-[10px] font-mono-tabular font-semibold" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                  {lowStockCategories.length} Low
                </span>
              )}
            </div>
            <div className="text-xl font-bold font-mono-tabular mt-1" style={{ color: 'var(--theme-primary)' }}>
              {totalStockAvailable} <span className="text-xs text-slate-400 font-normal">Units</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {hasLowStock ? `${lowStockCategories.length} categories under safety limit` : 'Ready in inventory'}
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('stock')}
            className="m3-btn-base m3-btn-tonal text-xs"
          >
            Inventory
          </button>
        </div>

      </div>

      {/* Metric Cards Grid - 4 Material 3 Expressive KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Metric 1: Total Receivables */}
        <div className="m3-card p-4 transition-all duration-180 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Receivables</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)' }}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>
              {settings.currencySymbol} {totalReceivables.toLocaleString()}
            </span>
            <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: 'var(--theme-primary)' }}>
              <CheckCircle2 className="w-3 h-3" />
              {activeAgreements.length} Active Accounts
            </p>
          </div>
        </div>

        {/* Metric 2: Overdue Amounts Alert */}
        <div className="m3-card p-4 transition-all duration-180 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Dues</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)' }}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
              {settings.currencySymbol} {totalOverdueAmount.toLocaleString()}
            </span>
            <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: 'var(--theme-primary)' }}>
              <ShieldAlert className="w-3 h-3" />
              {overdueList.length} Delayed Instalments
            </p>
          </div>
        </div>

        {/* Metric 3: Total Cash Collected All Time */}
        <div className="m3-card p-4 transition-all duration-180 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Recovery Paid</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)' }}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>
              {settings.currencySymbol} {totalCollectedAllTime.toLocaleString()}
            </span>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <FileCheck className="w-3 h-3" style={{ color: 'var(--theme-primary)' }} />
              {payments.length} Verified Receipts
            </p>
          </div>
        </div>

        {/* Metric 4: Total Customer Base */}
        <div className="m3-card p-4 transition-all duration-180 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Clients</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)' }}>
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>
              {customers.length} Clients
            </span>
            <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: 'var(--theme-primary)' }}>
              <ArrowUpRight className="w-3 h-3" />
              With Guarantor Records
            </p>
          </div>
        </div>

      </div>

      {/* Main Overdue Action Section & Recent Payments split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Urgent Recovery Dues */}
        <div className="lg:col-span-2 m3-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2 font-heading" style={{ color: 'var(--theme-text-primary)' }}>
                <AlertTriangle className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                Urgent Recovery & Overdue Dues List
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Customers with pending due dates that require immediate recovery follow-up.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('recovery')}
              className="text-xs font-semibold flex items-center gap-1 hover:underline"
              style={{ color: 'var(--theme-primary)' }}
            >
              Full Recovery Hub &rarr;
            </button>
          </div>

          {overdueList.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-60" style={{ color: 'var(--theme-primary)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>All accounts are up to date!</p>
              <p className="text-xs text-slate-400 mt-1">No pending overdue instalments currently flagged.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-[11px] font-semibold text-slate-400 uppercase tracking-wider" style={{ borderColor: 'var(--theme-surface-border)' }}>
                    <th className="py-2.5 px-3">Customer / CNIC</th>
                    <th className="py-2.5 px-3">Item / Agreement</th>
                    <th className="py-2.5 px-3">Ins #</th>
                    <th className="py-2.5 px-3 text-right">Due Amount</th>
                    <th className="py-2.5 px-3 text-center">Overdue</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs" style={{ borderColor: 'var(--theme-surface-border)' }}>
                  {overdueList.map(({ agreement, customer, slot, daysLate }, idx) => {
                    const dueAmt = slot.amount - slot.paidAmount;

                    return (
                      <tr key={`${agreement.id}-${slot.installmentNumber}-${idx}`} className="transition-colors hover:bg-slate-500/5">
                        <td className="py-3 px-3">
                          <div className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>{customer?.fullName || 'Customer'}</div>
                          <div className="text-[11px] text-slate-400 font-mono-tabular">{customer?.phone || customer?.cnic}</div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-medium truncate max-w-[160px]" style={{ color: 'var(--theme-text-primary)' }}>{agreement.itemName}</div>
                          <div className="text-[10px] text-slate-400 font-mono-tabular">{agreement.agreementNumber}</div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded font-semibold text-[11px] border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                            #{slot.installmentNumber}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-bold font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                          {settings.currencySymbol} {dueAmt.toLocaleString()}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                            {daysLate} Days Late
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right space-x-1">
                          {customer && (
                            <button
                              onClick={() => onSendWhatsApp(customer, agreement, dueAmt, slot.dueDate)}
                              title="Send WhatsApp Reminder"
                              className="p-1.5 rounded-lg border transition-all"
                              style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onOpenCollectPayment(agreement.id, slot.installmentNumber)}
                            className="m3-btn-base m3-btn-filled text-[11px] py-1 px-2.5"
                          >
                            Collect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Col: Recent Payments History */}
        <div className="m3-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
            <h2 className="text-base font-bold flex items-center gap-2 font-heading" style={{ color: 'var(--theme-text-primary)' }}>
              <Clock className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
              Recent Receipt Logs
            </h2>
            <button
              onClick={() => onNavigateTab('cashbook')}
              className="text-xs text-slate-400 hover:underline"
            >
              Cashbook &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {payments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No payments recorded yet.</p>
            ) : (
              payments.slice(0, 5).map((pay) => (
                <div
                  key={pay.id}
                  className="p-3 rounded-xl border flex items-center justify-between transition-all"
                  style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}
                >
                  <div>
                    <div className="font-bold text-xs" style={{ color: 'var(--theme-text-primary)' }}>{pay.customerName}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>{pay.receiptNumber}</span>
                      <span>·</span>
                      <span>{pay.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-extrabold text-xs font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                      +{settings.currencySymbol} {pay.amountPaid.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">{pay.date}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Category Threshold Modal */}
      {showThresholdModal && (
        <CategoryThresholdModal
          isOpen={showThresholdModal}
          onClose={() => setShowThresholdModal(false)}
          categories={categories}
          stock={stock}
          onUpdateCategory={(id, updates) => onUpdateCategory?.(id, updates)}
          onOpenReceiveStock={onOpenReceiveStock}
        />
      )}

    </div>
  );
};
