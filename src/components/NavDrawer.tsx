import React from 'react';
import {
  X,
  LayoutDashboard,
  Boxes,
  FileSpreadsheet,
  BadgeDollarSign,
  Users,
  BookOpen,
  Sparkles,
  Settings,
  Plus,
  ShieldCheck,
  Building2,
  Lock,
  Download,
  MapPin,
  TrendingUp,
  ArrowLeft,
  Home,
  Calculator,
  Shield,
  Receipt,
  FileText,
  PackagePlus,
  HelpCircle,
  Activity,
} from 'lucide-react';
import { TabType } from './Navigation';
import { ShopSettings } from '../types';

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  settings: ShopSettings;
  overdueCount: number;
  lowStockCount?: number;
  onOpenNewAgreement: () => void;
  onOpenNewPayment: () => void;
  onOpenReceiveStock: () => void;
  onOpenBusinessReport: () => void;
}

export const NavDrawer: React.FC<NavDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  settings,
  overdueCount,
  lowStockCount = 0,
  onOpenNewAgreement,
  onOpenNewPayment,
  onOpenReceiveStock,
  onOpenBusinessReport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-start animate-in fade-in duration-150">
      <div className="w-full max-w-sm sm:max-w-md h-full flex flex-col justify-between shadow-2xl relative animate-in slide-in-from-left duration-200 overflow-hidden border-r" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
        
        {/* Top Bar with Physical Back Button & Close Button */}
        <div className="p-4 border-b flex items-center justify-between gap-2 shrink-0" style={{ borderColor: 'var(--theme-surface-border)' }}>
          <button
            onClick={() => {
              setActiveTab('dashboard');
              onClose();
            }}
            className="m3-btn-base m3-btn-filled text-xs py-1.5 px-3"
            title="Return to Home Dashboard"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>← Back to Dashboard</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-all border"
            style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {/* Shop Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0" style={{ backgroundColor: 'var(--theme-primary)' }}>
              P
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight font-heading leading-tight uppercase" style={{ color: 'var(--theme-text-primary)' }}>
                {settings.shopName}
              </h2>
              <p className="text-[11px] font-semibold flex items-center gap-1 mt-0.5" style={{ color: 'var(--theme-primary)' }}>
                <Building2 className="w-3.5 h-3.5" />
                <span>Instalment & Inventory Control</span>
              </p>
            </div>
          </div>

          {/* HOME SCREEN CARD */}
          <button
            onClick={() => {
              setActiveTab('dashboard');
              onClose();
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all duration-200 active:scale-[0.98] border"
            style={{
              backgroundColor: activeTab === 'dashboard' ? 'var(--theme-tonal-bg)' : 'var(--theme-surface-input)',
              borderColor: activeTab === 'dashboard' ? 'var(--theme-primary)' : 'var(--theme-surface-border)',
              color: activeTab === 'dashboard' ? 'var(--theme-primary)' : 'var(--theme-text-primary)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all" style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }}>
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold" style={{ color: 'var(--theme-text-primary)' }}>Home Screen (Dashboard)</div>
                <div className="text-[10px] text-slate-400">
                  Overview, today's cash & live alerts
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase font-mono-tabular border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
              HOME
            </span>
          </button>

          {/* QUICK ACTION BUTTONS */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Quick Actions
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenNewAgreement();
                }}
                className="m3-btn-base m3-btn-filled text-xs py-2.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Booking</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenReceiveStock();
                }}
                className="m3-btn-base m3-btn-tonal text-xs py-2.5"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>Receive Stock</span>
              </button>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenNewPayment();
              }}
              className="m3-btn-base m3-btn-outlined w-full py-2.5 text-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Collect Payment</span>
            </button>
          </div>

          {/* MAIN WORKFLOW */}
          <div className="space-y-1.5 pt-3 border-t" style={{ borderColor: 'var(--theme-surface-border)' }}>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1">
              Main Workflow
            </div>

            <button
              onClick={() => {
                setActiveTab('stock');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border"
              style={{
                backgroundColor: activeTab === 'stock' ? 'var(--theme-tonal-bg)' : 'transparent',
                borderColor: activeTab === 'stock' ? 'var(--theme-primary)' : 'transparent',
                color: activeTab === 'stock' ? 'var(--theme-primary)' : 'var(--theme-text-primary)',
              }}
            >
              <div className="flex items-center gap-3">
                <Boxes className="w-4 h-4" style={{ color: activeTab === 'stock' ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }} />
                <div className="text-left">
                  <div className="font-bold">Master Inventory</div>
                  <div className="text-[10px] text-slate-400">Stock models, counts & booking</div>
                </div>
              </div>
              {lowStockCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono-tabular" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                  {lowStockCount} Low
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('agreements');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border"
              style={{
                backgroundColor: activeTab === 'agreements' ? 'var(--theme-tonal-bg)' : 'transparent',
                borderColor: activeTab === 'agreements' ? 'var(--theme-primary)' : 'transparent',
                color: activeTab === 'agreements' ? 'var(--theme-primary)' : 'var(--theme-text-primary)',
              }}
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-4 h-4" style={{ color: activeTab === 'agreements' ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }} />
                <div className="text-left">
                  <div className="font-bold">Dispatches & Agreements</div>
                  <div className="text-[10px] text-slate-400">Customer contracts & delivery</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('recovery');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border"
              style={{
                backgroundColor: activeTab === 'recovery' ? 'var(--theme-tonal-bg)' : 'transparent',
                borderColor: activeTab === 'recovery' ? 'var(--theme-primary)' : 'transparent',
                color: activeTab === 'recovery' ? 'var(--theme-primary)' : 'var(--theme-text-primary)',
              }}
            >
              <div className="flex items-center gap-3">
                <BadgeDollarSign className="w-4 h-4" style={{ color: activeTab === 'recovery' ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }} />
                <div className="text-left">
                  <div className="font-bold">Recovery Hub</div>
                  <div className="text-[10px] text-slate-400">Installment collection & overdue dues</div>
                </div>
              </div>
              {overdueCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono-tabular border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                  {overdueCount} Overdue
                </span>
              )}
            </button>
          </div>

          {/* REPORTS & LEDGERS */}
          <div className="space-y-1.5 pt-3 border-t" style={{ borderColor: 'var(--theme-surface-border)' }}>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1">
              Reports & Ledgers
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenBusinessReport();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all"
              style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)', color: 'var(--theme-text-primary)' }}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                <div className="text-left">
                  <div className="font-bold">Audit & Profit Reports</div>
                  <div className="text-[10px] text-slate-400">Profit & loss, margins, Excel & PDF</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('customers');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border"
              style={{
                backgroundColor: activeTab === 'customers' ? 'var(--theme-tonal-bg)' : 'transparent',
                borderColor: activeTab === 'customers' ? 'var(--theme-primary)' : 'transparent',
                color: activeTab === 'customers' ? 'var(--theme-primary)' : 'var(--theme-text-primary)',
              }}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" style={{ color: activeTab === 'customers' ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }} />
                <div className="text-left">
                  <div className="font-bold">Customer Directory</div>
                  <div className="text-[10px] text-slate-400">CNIC, phone & guarantor profiles</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('activity_ledger');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border"
              style={{
                backgroundColor: activeTab === 'activity_ledger' ? 'var(--theme-tonal-bg)' : 'transparent',
                borderColor: activeTab === 'activity_ledger' ? 'var(--theme-primary)' : 'transparent',
                color: activeTab === 'activity_ledger' ? 'var(--theme-primary)' : 'var(--theme-text-primary)',
              }}
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4" style={{ color: activeTab === 'activity_ledger' ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }} />
                <div className="text-left">
                  <div className="font-bold">Activity Ledger</div>
                  <div className="text-[10px] text-slate-400">Cryptographic audit chain & history</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('cashbook');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border"
              style={{
                backgroundColor: activeTab === 'cashbook' ? 'var(--theme-tonal-bg)' : 'transparent',
                borderColor: activeTab === 'cashbook' ? 'var(--theme-primary)' : 'transparent',
                color: activeTab === 'cashbook' ? 'var(--theme-primary)' : 'var(--theme-text-primary)',
              }}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4" style={{ color: activeTab === 'cashbook' ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }} />
                <div className="text-left">
                  <div className="font-bold">Daily Cashbook & Expenses</div>
                  <div className="text-[10px] text-slate-400">Rent, utility bills, salaries</div>
                </div>
              </div>
            </button>
          </div>

          {/* ADMIN & SETTINGS */}
          <div className="space-y-1.5 pt-3 border-t" style={{ borderColor: 'var(--theme-surface-border)' }}>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1">
              Administration & Settings
            </div>

            <button
              onClick={() => {
                setActiveTab('ai_assistant');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border"
              style={{
                backgroundColor: activeTab === 'ai_assistant' ? 'var(--theme-tonal-bg)' : 'transparent',
                borderColor: activeTab === 'ai_assistant' ? 'var(--theme-primary)' : 'transparent',
                color: activeTab === 'ai_assistant' ? 'var(--theme-primary)' : 'var(--theme-text-primary)',
              }}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4" style={{ color: activeTab === 'ai_assistant' ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }} />
                <span>AI Risk & Defaulter Detection</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('settings');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border"
              style={{
                backgroundColor: activeTab === 'settings' ? 'var(--theme-tonal-bg)' : 'transparent',
                borderColor: activeTab === 'settings' ? 'var(--theme-primary)' : 'transparent',
                color: activeTab === 'settings' ? 'var(--theme-primary)' : 'var(--theme-text-primary)',
              }}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4" style={{ color: activeTab === 'settings' ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }} />
                <span>Shop Settings & Theme Selector</span>
              </div>
            </button>
          </div>

        </div>

        {/* Drawer Bottom Bar */}
        <div className="p-4 border-t space-y-2 shrink-0" style={{ borderColor: 'var(--theme-surface-border)' }}>
          <button
            onClick={() => {
              setActiveTab('dashboard');
              onClose();
            }}
            className="m3-btn-base m3-btn-filled w-full text-xs py-2.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Dashboard (Home Screen)</span>
          </button>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 font-mono-tabular">
            <span>{settings.proprietorName}</span>
            <span style={{ color: 'var(--theme-primary)' }}>✓ Universal Theme System</span>
          </div>
        </div>

      </div>
    </div>
  );
};
