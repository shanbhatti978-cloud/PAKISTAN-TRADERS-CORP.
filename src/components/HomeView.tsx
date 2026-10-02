import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Plus,
  Search,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Package,
  FileSignature,
  Wallet,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Agreement, Customer, StockItem, ShopSettings, Payment } from '../types';
import { NavTabId } from '../config/navigation';
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
  const [selectedBarIndex, setSelectedBarIndex] = useState<number>(3); // 15th
  const [activeLegend, setActiveLegend] = useState<'all' | 'installment' | 'downpayment'>('all');

  const activeAgreements = agreements.filter((a) => a.status === 'active');
  const totalStockCount = stock.reduce((sum, item) => sum + (item.inStock || 0), 0);

  // Today calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPayments = payments.filter((p) => !p.isReversed && p.date === todayStr);
  const todayCollectedTotal = todayPayments.reduce((sum, p) => sum + p.amountPaid, 0);

  // Bar chart sample data points matching screen A: 01, 05, 10, 15, 20
  const barData = [
    { label: '01', height: 48, color: '#F4A3A0', value: 24500 },
    { label: '05', height: 72, color: '#BDB4F2', value: 36200 },
    { label: '10', height: 58, color: '#F4A3A0', value: 29000 },
    { label: '15', height: 92, color: '#BDB4F2', value: 45462, isSelected: true },
    { label: '20', height: 68, color: '#F4A3A0', value: 34100 },
  ];

  return (
    <div className="w-full max-w-md mx-auto space-y-5 pb-20 select-none">
      
      {/* 1. Top Row Profile Pill & Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {/* Profile Pill */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full glass-card border border-white/80 dark:border-white/10 shadow-xs">
          <div className="w-9 h-9 rounded-full bg-[#BDB4F2] text-[#1A1A22] font-black text-xs flex items-center justify-center shadow-xs">
            {settings.proprietorName?.[0] || 'B'}
          </div>
          <div className="pr-2 leading-tight">
            <div className="font-heading font-extrabold text-xs text-[#1A1A22] dark:text-white">
              {settings.proprietorName || 'Brooklyn Simmons'}
            </div>
            <div className="text-[10px] text-[#6B6B7B] font-mono">
              {settings.shopName || 'brooklyn.simmons@pos.com'}
            </div>
          </div>
        </div>

        {/* Right Circle Buttons: Bell & Plus */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('activity_ledger')}
            title="Activity Notifications"
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-[#1A1A22] dark:text-white shadow-xs border border-black/5 dark:border-white/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <Bell className="w-4 h-4 stroke-[2.2]" />
          </button>

          <button
            onClick={() => runAction('new_agreement')}
            title="New Sale Agreement"
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-[#1A1A22] dark:text-white shadow-xs border border-black/5 dark:border-white/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 2. Big Light-Weight Heading (Two Lines) */}
      <div className="space-y-0.5 pt-1 px-1">
        <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1A1A22] dark:text-white leading-tight font-heading">
          Track and Manage Sales <br />
          <span className="font-normal text-[#5B4BC4] dark:text-[#BDB4F2]">with Point of Sales</span>
        </h1>
      </div>

      {/* 3. Full-Width Pill Search Field */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B7B]" />
        <input
          type="text"
          placeholder="Search.."
          value={searchQuery}
          onChange={(e) => setSearchQuery?.(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-full glass-card border border-white/90 dark:border-white/10 text-xs font-medium text-[#1A1A22] dark:text-white placeholder:text-[#6B6B7B] shadow-xs outline-none focus:ring-2 focus:ring-[#BDB4F2]"
        />
      </div>

      {/* 4. Large Glass Card: Earnings & Bar Chart */}
      <div className="glass-card p-5 sm:p-6 space-y-4 relative">
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-semibold text-[#6B6B7B] uppercase tracking-wider">
              Earnings
            </div>
            <h2 className="text-base sm:text-lg font-normal text-[#1A1A22] dark:text-white font-heading mt-0.5">
              Tracking our sales
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigateTab('recovery')}
              title="Calendar dues"
              className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-[#1A1A22] dark:text-white shadow-xs border border-black/5 dark:border-white/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 stroke-[2]" />
            </button>
            <button
              onClick={() => runAction('business_report')}
              title="Full Audit Report"
              className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-[#1A1A22] dark:text-white shadow-xs border border-black/5 dark:border-white/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-[#6B6B7B]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F4A3A0]" />
            <span>Down Payment</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#BDB4F2]" />
            <span>Installments</span>
          </div>
        </div>

        {/* Bar Chart Area with Selected Bar Tooltip */}
        <div className="pt-8 pb-2 relative">
          
          {/* Floating White Tooltip above selected bar */}
          <div className="absolute top-0 left-1/2 -translate-x-3 pointer-events-none z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl px-3 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.08)] border border-black/5 dark:border-white/10 text-center leading-tight">
              <div className="text-[10px] text-[#6B6B7B] font-medium">Total sales</div>
              <div className="text-xs font-black font-mono-tabular text-[#1A1A22] dark:text-white mt-0.5">
                $45,462
              </div>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <span className="bg-[#BDF2C6] text-[#14532D] text-[9px] font-extrabold px-1 rounded-full font-mono">
                  +2.5%
                </span>
                <span className="text-[8px] text-[#6B6B7B]">vs last month</span>
              </div>
            </div>
          </div>

          {/* Chart Columns & Y-Axis */}
          <div className="flex items-end justify-between gap-3 h-44 border-b border-black/5 dark:border-white/10 pb-1">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between h-full text-[9px] text-[#6B6B7B] font-mono-tabular pr-1 pb-1">
              <span>$50k</span>
              <span>$40k</span>
              <span>$30k</span>
              <span>$20k</span>
              <span>$10k</span>
            </div>

            {/* 5 Vertical Bars with fully rounded tops */}
            <div className="flex-1 flex items-end justify-around h-full px-2">
              {barData.map((bar, idx) => {
                const isSelected = selectedBarIndex === idx;

                return (
                  <div
                    key={bar.label}
                    onClick={() => setSelectedBarIndex(idx)}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group h-full justify-end"
                  >
                    <div
                      style={{
                        height: `${bar.height}%`,
                        backgroundColor: bar.color,
                      }}
                      className={`w-7 sm:w-8 rounded-t-full transition-all duration-300 group-hover:opacity-90 ${
                        isSelected ? 'ring-4 ring-[#BDB4F2]/30 shadow-md' : 'opacity-80'
                      }`}
                    />
                    <span className="text-[10px] font-mono font-medium text-[#6B6B7B] group-hover:text-[#1A1A22]">
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Second Glass Card: Market items / Market demand */}
      <div
        onClick={() => onNavigateTab('stock')}
        className="glass-card p-5 flex items-center justify-between cursor-pointer hover:border-white transition-all shadow-xs group"
      >
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-[#6B6B7B] uppercase tracking-wider">
            Market items
          </div>
          <h3 className="text-sm font-normal text-[#1A1A22] dark:text-white font-heading">
            Market demand
          </h3>
          <div className="text-2xl sm:text-3xl font-normal font-mono-tabular text-[#1A1A22] dark:text-white pt-1">
            {String(totalStockCount > 0 ? totalStockCount : 50).padStart(3, '0')} items
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigateTab('stock');
          }}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-[#1A1A22] dark:text-white shadow-xs border border-black/5 dark:border-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform cursor-pointer"
        >
          <ChevronRight className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

    </div>
  );
};
