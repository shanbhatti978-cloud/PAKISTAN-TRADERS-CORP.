import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  FileSpreadsheet,
  BadgeDollarSign,
  Users,
  BookOpen,
  Settings,
  FileText,
  Activity,
} from 'lucide-react';

export type TabType =
  | 'app_center'
  | 'dashboard'
  | 'stock'
  | 'agreements'
  | 'recovery'
  | 'reports'
  | 'customers'
  | 'cashbook'
  | 'activity_ledger'
  | 'ai_assistant'
  | 'settings';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  overdueCount: number;
  lowStockCount?: number;
  onOpenBusinessReport?: () => void;
  themeMode?: 'dark' | 'light';
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  overdueCount,
  lowStockCount = 0,
  onOpenBusinessReport,
  themeMode = 'dark',
}) => {
  const isLight = themeMode === 'light';

  // Navigation tabs structured for daily dealership operations:
  const navItems = [
    {
      id: 'app_center',
      label: 'App Center',
      subtitle: 'Native Hub',
      icon: LayoutDashboard,
      accentColor: 'blue',
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      subtitle: 'Overview',
      icon: LayoutDashboard,
      accentColor: 'blue',
    },
    {
      id: 'stock',
      label: 'Master Inventory',
      subtitle: 'Stock & Models',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
      badgeColor: 'amber' as const,
      accentColor: 'golden',
    },
    {
      id: 'agreements',
      label: 'Dispatches & Agreements',
      subtitle: 'Customer Sales',
      icon: FileSpreadsheet,
      accentColor: 'green',
    },
    {
      id: 'recovery',
      label: 'Recovery & Collections',
      subtitle: 'Installment Dues',
      icon: BadgeDollarSign,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'rose' as const,
      accentColor: 'golden',
    },
    {
      id: 'reports',
      label: 'Audit Reports & Ledgers',
      subtitle: 'Financial Audit',
      icon: FileText,
      accentColor: 'blue',
    },
    {
      id: 'customers',
      label: 'Customers & Guarantors',
      subtitle: 'Client Records',
      icon: Users,
      accentColor: 'blue',
    },
    {
      id: 'cashbook',
      label: 'Daily Cashbook',
      subtitle: 'Inflows & Expenses',
      icon: BookOpen,
      accentColor: 'green',
    },
    {
      id: 'activity_ledger',
      label: 'Activity Ledger',
      subtitle: 'Audit Chain & Hash Verification',
      icon: Activity,
      accentColor: 'golden',
    },
    {
      id: 'settings',
      label: 'Settings',
      subtitle: 'Store & Lock',
      icon: Settings,
      accentColor: 'white',
    },
  ];

  return (
    <nav className={`backdrop-blur-md border-b px-3 sm:px-4 py-2 overflow-x-auto no-scrollbar sticky top-[57px] sm:top-[61px] z-20 transition-colors duration-200 ${
      isLight ? 'bg-slate-50/95 border-slate-200' : 'bg-slate-900/95 border-slate-800/80'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 min-w-max">
        
        {/* Navigation Items (Material 3 Expressive Pill Chips) */}
        <div className="flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'reports' && onOpenBusinessReport) {
                    onOpenBusinessReport();
                  } else {
                    setActiveTab(item.id as TabType);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 whitespace-nowrap active:scale-95 ${
                  isActive
                    ? 'shadow-sm border'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--theme-tonal-bg)',
                        borderColor: 'var(--theme-primary)',
                        color: 'var(--theme-primary)',
                      }
                    : undefined
                }
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
                  style={
                    isActive
                      ? {
                          backgroundColor: 'var(--theme-primary)',
                          color: 'var(--theme-primary-foreground)',
                        }
                      : undefined
                  }
                >
                  <Icon className="w-3 h-3 stroke-[2.2]" />
                </div>
                <span className="font-heading">{item.label}</span>

                {item.badge !== undefined && (
                  <span
                    className="flex items-center justify-center px-1.5 py-0.2 text-[9px] font-bold rounded-full font-mono-tabular"
                    style={{
                      backgroundColor: 'var(--theme-tonal-bg)',
                      color: 'var(--theme-primary)',
                      border: '1px solid var(--theme-tonal-border)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </nav>
  );
};

