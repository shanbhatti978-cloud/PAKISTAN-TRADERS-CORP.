import React, { useState } from 'react';
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
} from 'lucide-react';
import { Agreement, Customer, StockItem, ShopSettings, Payment } from '../types';
import { NavTabId, NAV_ITEMS } from '../config/navigation';
import { formatDateDDMMYYYY } from '../utils/formatters';
import { useAppActions } from '../context/AppActionsContext';

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

  // 1. KPI Calculations
  const activeAgreements = agreements.filter((a) => a.status === 'active');
  const activeAgreementsCount = activeAgreements.length;
  const totalStockCount = stock.reduce((sum, item) => sum + (item.inStock || 0), 0);

  const todayPayments = payments.filter((p) => !p.isReversed && p.date === todayStr);
  const todayCollectedTotal = todayPayments.reduce((sum, p) => sum + p.amountPaid, 0);

  // Overdue and Due Today slots
  let overdueCount = 0;
  let dueTodayCount = 0;
  const dueTodaySlots: { agreement: Agreement; customer?: Customer; slot: any }[] = [];

  agreements.forEach((agr) => {
    if (agr.status === 'completed' || agr.status === 'cancelled') return;
    const cust = customers.find((c) => c.id === agr.customerId);

    agr.schedule.forEach((slot) => {
      if (slot.status === 'paid') return;
      if (slot.dueDate === todayStr) {
        dueTodayCount++;
        dueTodaySlots.push({ agreement: agr, customer: cust, slot });
      } else if (slot.dueDate < todayStr) {
        overdueCount++;
      }
    });
  });

  const lowStockCount = stock.filter((s) => s.status === 'available' && s.inStock <= 2).length;

  const mainModules = [
    {
      id: 'agreements' as NavTabId,
      title: 'Dispatches & Sales',
      subtitle: 'Customer Sales & Agreements',
      badge: `${activeAgreementsCount} Active`,
      badgeColor: 'bg-primary-container text-on-primary-container border-border',
      icon: FileSignature,
    },
    {
      id: 'recovery' as NavTabId,
      title: 'Installment Recovery',
      subtitle: 'Due Collections & Overdue',
      badge: overdueCount > 0 ? `${overdueCount} Overdue` : 'Clear',
      badgeColor: overdueCount > 0 ? 'bg-danger-container text-on-danger-container border-border' : 'bg-success-container text-on-success-container border-border',
      icon: Wallet,
    },
    {
      id: 'stock' as NavTabId,
      title: 'Master Inventory',
      subtitle: 'Warehouse & Stock Models',
      badge: lowStockCount > 0 ? `${lowStockCount} Low Stock` : `${totalStockCount} Items`,
      badgeColor: lowStockCount > 0 ? 'bg-warning-container text-on-warning-container border-border' : 'bg-info-container text-on-info-container border-border',
      icon: Boxes,
    },
    {
      id: 'customers' as NavTabId,
      title: 'Customer Profiles',
      subtitle: 'CNIC Records & Guarantors',
      badge: `${customers.length} Profiles`,
      badgeColor: 'bg-surface-2 text-text border-border',
      icon: Users,
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-6 select-none">
      
      {/* 1. Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden p-6 sm:p-7 rounded-3xl border border-border shadow-2 bg-surface text-text backdrop-blur-xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-primary-container text-on-primary-container border border-border">
              <Building2 className="w-3.5 h-3.5" />
              <span>{settings.shopName || 'Pakistan Traders Corporation'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-text">
              Home Command Center
            </h1>

            <p className="text-xs font-semibold text-text-muted max-w-lg">
              Offline Instalment & Master Inventory System • PIN Protected Operations
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-surface-2 border border-border text-center min-w-[120px]">
              <div className="text-[10px] font-bold text-text-subtle uppercase">Today's Recovered</div>
              <div className="text-base font-extrabold font-mono-tabular text-success mt-0.5">
                {settings.currencySymbol} {todayCollectedTotal.toLocaleString()}
              </div>
            </div>

            <button
              onClick={() => runAction('business_report')}
              className="m3-btn-base m3-btn-filled text-xs py-3 px-4 shadow-2 active:scale-95 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Audit Report</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Active Agreements */}
        <div
          onClick={() => onNavigateTab('agreements')}
          className="p-4 rounded-2xl border border-border bg-surface text-text hover:border-primary transition-all cursor-pointer shadow-1 space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle uppercase">Active Sales</span>
            <div className="p-2 rounded-xl bg-primary-container text-on-primary-container">
              <FileSignature className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono-tabular text-text">
            {activeAgreementsCount}
          </div>
          <div className="text-[10px] text-text-subtle">
            Active customer contracts
          </div>
        </div>

        {/* KPI 2: Overdue Installments */}
        <div
          onClick={() => onNavigateTab('recovery')}
          className="p-4 rounded-2xl border border-border bg-surface text-text hover:border-danger transition-all cursor-pointer shadow-1 space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle uppercase">Overdue Dues</span>
            <div className="p-2 rounded-xl bg-danger-container text-on-danger-container">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono-tabular text-danger">
            {overdueCount}
          </div>
          <div className="text-[10px] text-danger font-semibold">
            {overdueCount > 0 ? 'Requires immediate recovery' : 'Zero overdue dues'}
          </div>
        </div>

        {/* KPI 3: Due Today */}
        <div
          onClick={() => onNavigateTab('recovery')}
          className="p-4 rounded-2xl border border-border bg-surface text-text hover:border-warning transition-all cursor-pointer shadow-1 space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle uppercase">Due Today</span>
            <div className="p-2 rounded-xl bg-warning-container text-on-warning-container">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono-tabular text-warning">
            {dueTodayCount}
          </div>
          <div className="text-[10px] text-text-subtle">
            Scheduled collections for today
          </div>
        </div>

        {/* KPI 4: Low Stock Warnings */}
        <div
          onClick={() => onNavigateTab('stock')}
          className="p-4 rounded-2xl border border-border bg-surface text-text hover:border-info transition-all cursor-pointer shadow-1 space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle uppercase">Low Stock</span>
            <div className="p-2 rounded-xl bg-info-container text-on-info-container">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono-tabular text-info">
            {lowStockCount}
          </div>
          <div className="text-[10px] text-text-subtle">
            {lowStockCount > 0 ? 'Models below safety threshold' : 'Stock levels adequate'}
          </div>
        </div>

      </div>

      {/* 3. Primary Module Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-text-subtle px-1">
          Primary Operations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mainModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <motion.button
                key={mod.id}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onNavigateTab(mod.id)}
                className="group relative p-5 rounded-3xl border border-border bg-surface text-text hover:border-primary transition-all text-left shadow-1 cursor-pointer overflow-hidden"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3.5 rounded-2xl bg-primary-container text-on-primary-container shrink-0">
                      <Icon className="w-6 h-6 stroke-[2.3]" />
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold font-heading text-text group-hover:text-primary transition-colors">
                        {mod.title}
                      </h4>
                      <p className="text-xs text-text-subtle mt-0.5">
                        {mod.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className={`px-3 py-1 rounded-full text-xs font-bold font-mono-tabular border shrink-0 ${mod.badgeColor}`}>
                    {mod.badge}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 4. Due Today Recovery List */}
      {dueTodaySlots.length > 0 && (
        <div className="m3-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-extrabold font-heading text-text flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                <span>Collections Scheduled For Today ({dueTodaySlots.length})</span>
              </h3>
              <p className="text-xs text-text-subtle">
                Customer installments due on {formatDateDDMMYYYY(todayStr)}
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('recovery')}
              className="m3-btn-base m3-btn-tonal text-xs py-1.5 px-3"
            >
              <span>View All Recovery</span>
            </button>
          </div>

          <div className="space-y-2">
            {dueTodaySlots.slice(0, 5).map(({ agreement, customer, slot }, idx) => {
              const dueAmt = slot.amount - slot.paidAmount;

              return (
                <div
                  key={`${agreement.id}-${slot.installmentNumber}-${idx}`}
                  className="p-3.5 rounded-2xl border border-border bg-surface-2/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-text">
                      {customer?.fullName || 'Customer'} ({customer?.phone || 'No Phone'})
                    </div>
                    <div className="text-[11px] text-text-subtle font-mono-tabular">
                      {agreement.itemName} | AGR: {agreement.agreementNumber} | Ins #{slot.installmentNumber}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-right">
                      <div className="text-[10px] text-text-subtle uppercase">Amount Due</div>
                      <div className="font-extrabold font-mono-tabular text-primary">
                        {settings.currencySymbol} {dueAmt.toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => runAction('collect_payment', { agreementId: agreement.id, installmentNum: slot.installmentNumber })}
                      className="m3-btn-base m3-btn-filled text-xs py-1.5 px-3"
                    >
                      Collect
                    </button>
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
