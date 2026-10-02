import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  FileSpreadsheet,
  BadgeDollarSign,
  Menu,
  Plus,
} from 'lucide-react';
import { TabType } from './Navigation';

interface M3BottomNavBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  overdueCount: number;
  lowStockCount?: number;
  onOpenNewAgreement: () => void;
  onToggleDrawer: () => void;
  themeMode?: 'dark' | 'light';
}

export const M3BottomNavBar: React.FC<M3BottomNavBarProps> = ({
  activeTab,
  setActiveTab,
  overdueCount,
  lowStockCount = 0,
  onOpenNewAgreement,
  onToggleDrawer,
  themeMode = 'dark',
}) => {
  const isLight = themeMode === 'light';

  const navItems = [
    {
      id: 'app_center' as TabType,
      label: 'App Center',
      icon: LayoutDashboard,
    },
    {
      id: 'dashboard' as TabType,
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'stock' as TabType,
      label: 'Inventory',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'amber' as const,
    },
    {
      id: 'agreements' as TabType,
      label: 'Sales',
      icon: FileSpreadsheet,
    },
    {
      id: 'recovery' as TabType,
      label: 'Recovery',
      icon: BadgeDollarSign,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'rose' as const,
    },
  ];

  return (
    <>
      {/* Material 3 Floating Action Button (FAB) on Android Mobile */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onOpenNewAgreement}
          aria-label="New Sale Agreement"
          className="m3-fab flex items-center gap-2 px-4 py-3 active:scale-95 font-bold text-xs rounded-2xl shadow-xl transition-all duration-200 border border-white/20"
          style={{
            backgroundColor: 'var(--theme-primary)',
            color: 'var(--theme-primary-foreground)',
          }}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="font-heading tracking-wide">New Sale</span>
        </button>
      </div>

      {/* Material 3 Android Mobile NavigationBar */}
      <nav
        aria-label="Material 3 Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden border-t transition-colors duration-200 backdrop-blur-lg shadow-lg"
        style={{
          backgroundColor: 'var(--theme-appbar-bg)',
          borderColor: 'var(--theme-surface-border)',
        }}
      >
        <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center py-1 group relative transition-transform active:scale-90"
              >
                {/* M3 Active Indicator Pill */}
                <div
                  className={`w-12 h-7 rounded-full flex items-center justify-center transition-all duration-200 relative ${
                    isActive
                      ? 'border shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:bg-slate-200/50'
                      : 'text-slate-400 hover:bg-slate-850/60'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: 'var(--theme-tonal-bg)',
                          borderColor: 'var(--theme-tonal-border)',
                          color: 'var(--theme-primary)',
                        }
                      : undefined
                  }
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />

                  {/* Badge */}
                  {item.badge !== undefined && (
                    <span
                      className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-black rounded-full font-mono-tabular shadow-sm"
                      style={{
                        backgroundColor: 'var(--theme-primary)',
                        color: 'var(--theme-primary-foreground)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] mt-0.5 tracking-tight transition-colors ${
                    isActive
                      ? 'font-bold'
                      : isLight
                      ? 'text-slate-600 font-medium'
                      : 'text-slate-400 font-medium'
                  }`}
                  style={
                    isActive
                      ? {
                          color: 'var(--theme-primary)',
                        }
                      : undefined
                  }
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* 5th slot: Menu Drawer Trigger */}
          <button
            onClick={onToggleDrawer}
            className="flex flex-col items-center justify-center py-1 group relative transition-transform active:scale-90"
          >
            <div
              className={`w-12 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                isLight
                  ? 'text-slate-600 hover:bg-slate-200/50'
                  : 'text-slate-400 hover:bg-slate-850/60'
              }`}
            >
              <Menu className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className={`text-[10px] mt-0.5 tracking-tight font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
