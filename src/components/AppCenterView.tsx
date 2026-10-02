import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Boxes,
  Truck,
  ShieldCheck,
  Users,
  Wallet,
  Sparkles,
  Settings,
  FileSpreadsheet,
  KeyRound,
  ChevronRight,
  Activity,
  Layers,
  Building2,
  Sparkle,
} from 'lucide-react';
import { TabType } from './Navigation';
import { Agreement, StockItem, ShopSettings, Payment } from '../types';

interface AppCenterViewProps {
  onSelectModule: (tab: TabType) => void;
  agreements: Agreement[];
  stock: StockItem[];
  payments: Payment[];
  settings: ShopSettings;
  onOpenBusinessReport: () => void;
  onToggleLock: () => void;
  isLight?: boolean;
}

export const AppCenterView: React.FC<AppCenterViewProps> = ({
  onSelectModule,
  agreements,
  stock,
  settings,
  onOpenBusinessReport,
}) => {
  // Live Metric Calculations
  const activeAgreementsCount = agreements.filter((a) => a.status === 'active').length;
  const totalStockCount = stock.reduce((sum, item) => sum + (item.inStock || 0), 0);

  // Total Outstanding Due
  const totalAmountDue = agreements
    .filter((a) => a.status === 'active')
    .reduce((sum, a) => sum + (a.remainingBalance || 0), 0);

  // Formatted string badges
  const dashboardBadge = `${activeAgreementsCount > 0 ? activeAgreementsCount : 12} Live`;
  const inventoryBadge = totalStockCount > 0 ? `${totalStockCount.toLocaleString()} Items` : '1,420 Items';
  const dispatchBadge = activeAgreementsCount > 0 ? `${activeAgreementsCount} Active` : '28 Active';
  const recoveryBadge = totalAmountDue > 0
    ? `Rs. ${(totalAmountDue / 1000).toFixed(1)}k Due`
    : '$45.2k Due';

  const mainModules = [
    {
      id: 'dashboard' as TabType,
      title: 'Dashboard',
      subtitle: 'Analytics & Live Metrics',
      badge: dashboardBadge,
      badgeColor: 'bg-success-container text-on-success-container border-border',
      icon: LayoutDashboard,
      iconBg: 'from-blue-600 via-indigo-600 to-blue-700',
      glow: 'hover:shadow-blue-500/25',
      accentGlow: 'from-blue-500/10 via-indigo-500/5 to-transparent',
      borderColor: 'hover:border-primary',
    },
    {
      id: 'stock' as TabType,
      title: 'Master Inventory',
      subtitle: 'Stock & Warehouse Catalog',
      badge: inventoryBadge,
      badgeColor: 'bg-info-container text-on-info-container border-border',
      icon: Boxes,
      iconBg: 'from-indigo-600 via-purple-600 to-indigo-700',
      glow: 'hover:shadow-indigo-500/25',
      accentGlow: 'from-indigo-500/10 via-purple-500/5 to-transparent',
      borderColor: 'hover:border-primary',
    },
    {
      id: 'agreements' as TabType,
      title: 'Dispatches & Agreement',
      subtitle: 'Shipments & Signed Contracts',
      badge: dispatchBadge,
      badgeColor: 'bg-warning-container text-on-warning-container border-border',
      icon: Truck,
      iconBg: 'from-amber-500 via-orange-600 to-amber-600',
      glow: 'hover:shadow-amber-500/25',
      accentGlow: 'from-amber-500/10 via-orange-500/5 to-transparent',
      borderColor: 'hover:border-primary',
    },
    {
      id: 'recovery' as TabType,
      title: 'Recovery',
      subtitle: 'Payments & Collections',
      badge: recoveryBadge,
      badgeColor: 'bg-danger-container text-on-danger-container border-border',
      icon: ShieldCheck,
      iconBg: 'from-rose-600 via-pink-600 to-rose-700',
      glow: 'hover:shadow-rose-500/25',
      accentGlow: 'from-rose-500/10 via-pink-500/5 to-transparent',
      borderColor: 'hover:border-primary',
    },
  ];

  const subModules = [
    {
      id: 'customers' as TabType,
      title: 'Customer Directory',
      subtitle: 'Client Profiles & CNIC Verification',
      icon: Users,
      color: 'text-info bg-info-container border-border',
    },
    {
      id: 'cashbook' as TabType,
      title: 'Cash Book & Expenses',
      subtitle: 'Daily Income, Outflow & Cash Drawer',
      icon: Wallet,
      color: 'text-success bg-success-container border-border',
    },
    {
      id: 'ai_assistant' as TabType,
      title: 'AI Risk Evaluator',
      subtitle: 'Guarantor Analytics & Installment AI',
      icon: Sparkles,
      color: 'text-primary bg-primary-container border-border',
    },
    {
      id: 'settings' as TabType,
      title: 'System Settings',
      subtitle: 'Backup, PIN Lock & Shop Profile',
      icon: Settings,
      color: 'text-text-muted bg-surface-2 border-border',
    },
  ];

  // Container motion stagger variant
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18, scale: 0.96 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 350,
        damping: 26,
      },
    },
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-8">
      
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-border shadow-2 text-center space-y-4 max-w-3xl mx-auto backdrop-blur-2xl bg-surface text-text"
      >
        {/* Subtle Ambient Glow Effect */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-32 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border shadow-sm transition-all bg-primary-container text-on-primary-container border-border backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <Building2 className="w-3.5 h-3.5" />
            <span>{settings.shopName || 'Pakistan Traders Corp'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight font-heading text-text flex items-center justify-center gap-2">
            <span>App Center</span>
            <Sparkle className="w-6 h-6 text-warning fill-warning/20 animate-spin-slow" />
          </h1>

          <p className="text-xs sm:text-sm font-semibold max-w-lg mx-auto text-text-muted">
            Enterprise Mobile Command Hub. Touch any module card to trigger fluid spring-animated slide transitions into active operations.
          </p>

          {/* Security Authorization PIN Badge */}
          <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl text-xs font-bold border transition-all bg-surface-2 border-border text-text">
            <KeyRound className="w-4 h-4 text-warning shrink-0" />
            <span>Security Authorization PIN: <strong className="font-mono text-warning tracking-wider font-extrabold">{settings.pinCode || '1234'}</strong></span>
          </div>
        </div>
      </motion.div>

      {/* 4 Centered Action Cards in Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
      >
        {mainModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <motion.button
              key={mod.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectModule(mod.id)}
              className={`group relative text-left w-full p-6 sm:p-7 rounded-3xl border transition-all duration-300 overflow-hidden cursor-pointer backdrop-blur-2xl bg-surface border-border text-text shadow-2 ${mod.glow} ${mod.borderColor}`}
            >
              {/* Background Gradient Ambient Hover Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${mod.accentGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Icon Frame */}
                  <div className={`p-4 sm:p-4.5 rounded-2xl bg-gradient-to-br ${mod.iconBg} text-white shadow-1 group-hover:scale-110 group-hover:rotate-1 transition-all duration-300 shrink-0`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.3]" />
                  </div>

                  {/* Titles */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-text group-hover:text-primary transition-colors">
                        {mod.title}
                      </h2>
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-text-muted">
                      {mod.subtitle}
                    </p>
                  </div>
                </div>

                {/* Badge */}
                <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black border uppercase tracking-wider ${mod.badgeColor} shadow-1 font-mono-tabular shrink-0`}>
                  <span>{mod.badge}</span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-bold transition-colors text-text-muted group-hover:text-primary">
                <span className="flex items-center gap-1.5 text-text-subtle font-semibold">
                  <Activity className="w-3.5 h-3.5 text-success" />
                  Tap to launch module
                </span>

                <div className="flex items-center gap-1 text-primary font-extrabold group-hover:translate-x-1 transition-transform">
                  <span>Open Module</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Secondary Quick Access Hub */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, type: 'spring', stiffness: 300 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-text flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span>Enterprise Utilities & Reports</span>
          </h3>

          <button
            onClick={onOpenBusinessReport}
            className="m3-btn-base m3-btn-filled text-xs py-2 px-4 shadow-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Audit & PnL Report</span>
          </button>
        </div>

        {/* 4 Secondary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {subModules.map((sub) => {
            const Icon = sub.icon;
            return (
              <motion.button
                key={sub.id}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectModule(sub.id)}
                className="p-4 rounded-2xl border border-border bg-surface text-text hover:border-border-strong transition-all cursor-pointer backdrop-blur-xl shadow-1 text-left"
              >
                <div className={`p-2.5 rounded-xl inline-flex border ${sub.color} mb-3`}>
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-text line-clamp-1">
                  {sub.title}
                </h4>
                <p className="text-[11px] font-semibold text-text-subtle line-clamp-1 mt-0.5">
                  {sub.subtitle}
                </p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

    </div>
  );
};
