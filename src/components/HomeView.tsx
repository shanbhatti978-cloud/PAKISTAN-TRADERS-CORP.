import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  Boxes,
  FileSignature,
  Wallet,
  Building2,
  KeyRound,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  Send,
  Users,
  BookOpen,
  Settings,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Search,
  Plus,
  Receipt,
  PackageCheck,
  ArrowUpRight,
  Smartphone,
  Phone,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { Agreement, Customer, StockItem, ShopSettings, Payment } from '../types';
import { NavTabId, NAV_ITEMS } from '../config/navigation';
import { formatDateDDMMYYYY } from '../utils/formatters';
import { useAppActions } from '../context/AppActionsContext';
import { ExpandableSearch } from './ExpandableSearch';

interface HomeViewProps {
  agreements: Agreement[];
  customers: Customer[];
  stock: StockItem[];
  payments: Payment[];
  settings: ShopSettings;
  searchQuery: string;
  setSearchQuery?: (q: string) => void;
  onNavigateTab: (tab: NavTabId) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  agreements,
  customers,
  stock,
  payments,
  settings,
  searchQuery,
  setSearchQuery,
  onNavigateTab,
}) => {
  const { runAction } = useAppActions();
  const todayStr = new Date().toISOString().split('T')[0];
  const [dueSearchQuery, setDueSearchQuery] = useState('');

  // 1. KPI Calculations
  const activeAgreements = agreements.filter(
    (a) => a.status === 'active'
  );
  const activeAgreementsCount = activeAgreements.length;
  const totalStockCount = stock.reduce((sum, item) => sum + (item.inStock || 0), 0);

  const todayPayments = payments.filter((p) => !p.isReversed && p.date === todayStr);
  const todayCollectedTotal = todayPayments.reduce((sum, p) => sum + p.amountPaid, 0);

  // Overdue and Due Today slots
  let overdueCount = 0;
  let overdueAmountTotal = 0;
  let dueTodayCount = 0;
  let dueTodayAmountTotal = 0;
  const dueTodaySlots: { agreement: Agreement; customer?: Customer; slot: any }[] = [];

  agreements.forEach((agr) => {
    if (agr.status === 'completed' || agr.status === 'cancelled') return;
    const cust = customers.find((c) => c.id === agr.customerId);

    agr.schedule?.forEach((slot) => {
      if (slot.status === 'paid') return;
      const unpaidDue = slot.amount - (slot.paidAmount || 0);

      if (slot.dueDate === todayStr) {
        dueTodayCount++;
        dueTodayAmountTotal += unpaidDue;
        dueTodaySlots.push({ agreement: agr, customer: cust, slot });
      } else if (slot.dueDate < todayStr) {
        overdueCount++;
        overdueAmountTotal += unpaidDue;
      }
    });
  });

  const lowStockCount = stock.filter(
    (s) => s.status === 'available' && s.inStock <= 2
  ).length;

  // Search filtered due today list
  const filteredDueSlots = useMemo(() => {
    const q = dueSearchQuery.toLowerCase().trim();
    if (!q) return dueTodaySlots;
    return dueTodaySlots.filter(({ agreement, customer }) => {
      return (
        (customer?.fullName || '').toLowerCase().includes(q) ||
        (customer?.phone || '').includes(q) ||
        agreement.agreementNumber.toLowerCase().includes(q) ||
        agreement.itemName.toLowerCase().includes(q)
      );
    });
  }, [dueTodaySlots, dueSearchQuery]);

  // Mock 7-day sparkline bar heights
  const sparklineData = [45, 60, 30, 85, 55, 95, 75];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 select-none pb-6">
      {/* 1. Bento Asymmetric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
        
        {/* Wide Hero Card: Today's Recovery Hub & Sparkline (Span 8 on desktop) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-8 p-6 sm:p-7 rounded-[28px] border border-border shadow-2 bg-surface text-text relative overflow-hidden flex flex-col justify-between"
        >
          {/* Subtle Glass Gradient Glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                <Building2 className="w-3.5 h-3.5" />
                <span>{settings.shopName || 'Pakistan Traders Corporation'}</span>
              </div>
              <span className="text-xs font-mono-tabular text-text-subtle">
                Date: {todayStr}
              </span>
            </div>

            <div>
              <span className="text-caption font-semibold text-text-muted block">
                Today's Realized Recovery
              </span>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-text font-mono-tabular mt-1">
                <span className="text-xl sm:text-2xl text-text-muted mr-1">{settings.currencySymbol}</span>
                <span className="text-primary">{todayCollectedTotal.toLocaleString()}</span>
              </div>
              <p className="text-body-sm text-text-muted mt-1 max-w-md font-medium">
                Cash collection & mobile wallets collected from customer installment plans today.
              </p>
            </div>

            {/* Sparkline & Target Status */}
            <div className="pt-2 flex items-end justify-between gap-4">
              <div className="space-y-1">
                <span className="text-caption text-text-muted font-semibold block">
                  Today's Pending Scheduled:
                </span>
                <span className="text-base font-extrabold font-mono-tabular text-text">
                  {settings.currencySymbol} {dueTodayAmountTotal.toLocaleString()} ({dueTodayCount} dues)
                </span>
              </div>

              {/* Mini Sparkline Chart */}
              <div className="flex items-end gap-1.5 h-10 px-3 py-1 rounded-xl bg-surface-2/60 border border-border">
                {sparklineData.map((val, idx) => (
                  <div
                    key={idx}
                    className="w-2.5 rounded-full transition-all duration-300"
                    style={{
                      height: `${val}%`,
                      backgroundColor: idx === 6 ? 'var(--primary)' : 'rgba(100, 116, 139, 0.35)',
                    }}
                    title={`Day ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="relative z-10 pt-5 mt-4 border-t border-border flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => runAction('collect_payment')}
              className="m3-btn-base m3-btn-filled text-body-sm py-2.5 px-4 shadow-sm min-h-[48px]"
            >
              <Receipt className="w-4 h-4" />
              <span>Collect Payment</span>
            </button>
            <button
              onClick={() => runAction('new_agreement')}
              className="m3-btn-base m3-btn-tonal text-body-sm py-2.5 px-4 min-h-[48px]"
            >
              <Plus className="w-4 h-4" />
              <span>New Sale Agreement</span>
            </button>
            <button
              onClick={() => runAction('receive_stock')}
              className="m3-btn-base m3-btn-outlined text-body-sm py-2.5 px-4 min-h-[48px]"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Receive Stock</span>
            </button>
            <button
              onClick={() => runAction('business_report')}
              className="m3-btn-base m3-btn-text text-body-sm py-2.5 px-4 ml-auto text-primary min-h-[48px]"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Audit PnL</span>
            </button>
          </div>
        </motion.div>

        {/* 2x2 KPI Tiles on Desktop (Span 4 on desktop, 2x2 grid) */}
        <div className="md:col-span-4 grid grid-cols-2 gap-3 sm:gap-4">
          {/* Tile 1: Active Agreements */}
          <div
            onClick={() => onNavigateTab('agreements')}
            className="p-4 rounded-[24px] border border-border bg-surface hover:border-primary transition-all cursor-pointer shadow-1 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-caption font-semibold text-text-muted">Active Sales</span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <FileSignature className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-black font-mono-tabular text-text">
                {activeAgreementsCount}
              </div>
              <span className="text-caption text-text-muted font-medium">Active contracts</span>
            </div>
            <div className="text-caption text-primary font-bold flex items-center gap-0.5">
              <span>View sales</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Tile 2: Overdue Dues (Coral Tint) */}
          <div
            onClick={() => onNavigateTab('recovery')}
            className={`p-4 rounded-[24px] border transition-all cursor-pointer shadow-1 flex flex-col justify-between ${
              overdueCount > 0
                ? 'border-danger/30 bg-danger/5 hover:border-danger'
                : 'border-border bg-surface hover:border-primary'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-caption font-semibold text-text-muted">Overdue</span>
              <div
                className={`p-2 rounded-xl ${
                  overdueCount > 0 ? 'bg-danger/20 text-danger' : 'bg-surface-2 text-text-muted'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div
                className={`text-2xl font-black font-mono-tabular ${
                  overdueCount > 0 ? 'text-danger' : 'text-text'
                }`}
              >
                {overdueCount}
              </div>
              <span className="text-caption text-text-muted font-medium">
                {overdueCount > 0 ? 'Late instalments' : 'All clear'}
              </span>
            </div>
            <div className="text-caption text-danger font-bold flex items-center gap-0.5">
              <span>Recover</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Tile 3: Total Stock */}
          <div
            onClick={() => onNavigateTab('stock')}
            className="p-4 rounded-[24px] border border-border bg-surface hover:border-primary transition-all cursor-pointer shadow-1 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-caption font-semibold text-text-muted">Warehouse</span>
              <div className="p-2 rounded-xl bg-surface-2 text-primary">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-black font-mono-tabular text-text">
                {totalStockCount}
              </div>
              <span className="text-caption text-text-muted font-medium">Units available</span>
            </div>
            <div className="text-caption text-primary font-bold flex items-center gap-0.5">
              <span>Inventory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Tile 4: Low Stock Alert (Amber Tint) */}
          <div
            onClick={() => onNavigateTab('stock')}
            className={`p-4 rounded-[24px] border transition-all cursor-pointer shadow-1 flex flex-col justify-between ${
              lowStockCount > 0
                ? 'border-warning/30 bg-warning/5 hover:border-warning'
                : 'border-border bg-surface hover:border-primary'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-caption font-semibold text-text-muted">Stock Alert</span>
              <div
                className={`p-2 rounded-xl ${
                  lowStockCount > 0 ? 'bg-warning/20 text-warning' : 'bg-surface-2 text-text-muted'
                }`}
              >
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div
                className={`text-2xl font-black font-mono-tabular ${
                  lowStockCount > 0 ? 'text-warning' : 'text-text'
                }`}
              >
                {lowStockCount}
              </div>
              <span className="text-caption text-text-muted font-medium">
                {lowStockCount > 0 ? 'Low stock items' : 'Well stocked'}
              </span>
            </div>
            <div className="text-caption text-warning font-bold flex items-center gap-0.5">
              <span>Reorder</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Due Today Recovery Feed (Search + Scrollable List) */}
      <div className="m3-card p-5 rounded-[28px] border border-border bg-surface space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-title font-heading text-text flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span>Today's Instalment Schedule ({dueTodaySlots.length} dues scheduled)</span>
            </h3>
            <p className="text-body-sm text-text-muted mt-0.5 font-medium">
              Scheduled customer payments due on {todayStr}.
            </p>
          </div>

          {/* Icon-First Expandable Search for Due Today List */}
          <ExpandableSearch
            value={dueSearchQuery}
            onChange={setDueSearchQuery}
            placeholder="Search dues..."
            recentKey="HOME_DUES"
            resultCount={dueSearchQuery ? { current: filteredDueSlots.length, total: dueTodaySlots.length } : undefined}
            ariaLabel="Search Today's Schedule"
          />
        </div>

        {/* Due Today List */}
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {filteredDueSlots.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-surface-2/40 space-y-1.5">
              <CheckCircle2 className="w-8 h-8 text-success mx-auto stroke-[1.8]" />
              <p className="font-bold text-body-sm text-text">No pending installments due today</p>
              <p className="text-caption text-text-muted font-medium">
                All daily dues have either been collected or none scheduled for today.
              </p>
            </div>
          ) : (
            filteredDueSlots.map(({ agreement, customer, slot }) => {
              const unpaidDue = slot.amount - (slot.paidAmount || 0);

              return (
                <div
                  key={`${agreement.id}-${slot.installmentNumber}`}
                  className="p-4 rounded-2xl border border-border bg-surface-input hover:border-primary/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-body-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20 text-body-sm">
                      {(customer?.fullName || 'C')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-base text-text truncate flex items-center gap-2">
                        <span>{customer?.fullName || 'Customer'}</span>
                        <span className="text-caption font-mono-tabular px-2 py-0.5 rounded bg-surface-2 text-text-muted border border-border">
                          {agreement.agreementNumber}
                        </span>
                      </div>
                      <div className="text-body-sm text-text-muted font-medium flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="font-semibold text-text">{agreement.itemName}</span>
                        <span>·</span>
                        <span>Instalment #{slot.installmentNumber}</span>
                        <span>·</span>
                        <span className="font-mono">{customer?.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                    <div className="text-left sm:text-right font-mono-tabular">
                      <span className="text-caption text-text-muted block font-medium">Due Amount</span>
                      <span className="font-extrabold text-base text-primary">
                        {settings.currencySymbol} {unpaidDue.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {customer?.phone && (
                        <a
                          href={`https://wa.me/92${customer.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                            `Salam ${customer.fullName}, reminder for installment of Rs. ${unpaidDue.toLocaleString()} due on ${todayStr} for ${agreement.itemName} (${settings.shopName || 'Pakistan Traders'}).`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl text-success hover:bg-success/10 border border-border flex items-center justify-center"
                          title="WhatsApp Reminder"
                        >
                          <Send className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() =>
                          runAction('collect_payment', {
                            agreementId: agreement.id,
                            installmentNum: slot.installmentNumber,
                          })
                        }
                        className="m3-btn-base m3-btn-filled text-body-sm py-2 px-4 shadow-xs min-h-[44px]"
                      >
                        <span>Collect</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. AI Assistant & Risk Intelligence Suggestion Card */}
      <div className="p-5 rounded-[28px] border border-primary/20 bg-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-caption font-black uppercase text-primary tracking-wide">
            <Sparkles className="w-4 h-4" />
            <span>AI Risk Intelligence Advisor</span>
          </div>
          <p className="text-caption font-medium text-text-muted max-w-xl">
            Audit customer creditworthiness, evaluate guarantor risk, or analyze profit margins before approving new high-value installment agreements.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-caption">
            <span className="text-text-muted font-bold">Suggested checks:</span>
            {['Defaulter Detection', 'Guarantor Cross-Link Audit', 'Margin Health'].map((chip) => (
              <span
                key={chip}
                onClick={() => onNavigateTab('ai_assistant')}
                className="px-2.5 py-0.5 rounded-full border border-primary/30 bg-surface text-primary font-bold cursor-pointer hover:bg-primary-container transition-colors"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('ai_assistant')}
          className="m3-btn-base m3-btn-filled text-body-sm py-2.5 px-4 font-bold shadow-sm shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch AI Assistant</span>
        </button>
      </div>
    </div>
  );
};
