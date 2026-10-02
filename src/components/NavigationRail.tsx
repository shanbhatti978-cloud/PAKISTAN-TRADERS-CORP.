import React from 'react';
import { motion } from 'framer-motion';
import { Plus, LucideIcon } from 'lucide-react';
import { NavTabId, NAV_ITEMS, getVisibleNavItems } from '../config/navigation';
import { UserRole } from '../types';
import { PermissionManager } from '../utils/permissionManager';
import { useAppActions } from '../context/AppActionsContext';

interface NavigationRailProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  overdueCount: number;
  lowStockCount: number;
  currentUserRole?: UserRole;
  onOpenMoreSheet: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeTab,
  setActiveTab,
  overdueCount,
  lowStockCount,
  currentUserRole = 'ADMIN',
  onOpenMoreSheet,
}) => {
  const { runAction } = useAppActions();
  const visibleItems = getVisibleNavItems(currentUserRole);

  const canCreate = PermissionManager.can(currentUserRole, 'ADD_AGREEMENT');

  // Main items on rail
  const railItems = [
    { id: 'home' as NavTabId, label: 'Home', icon: NAV_ITEMS.find((n) => n.id === 'home')!.icon },
    { id: 'agreements' as NavTabId, label: 'Sales', icon: NAV_ITEMS.find((n) => n.id === 'agreements')!.icon },
    {
      id: 'recovery' as NavTabId,
      label: 'Recovery',
      icon: NAV_ITEMS.find((n) => n.id === 'recovery')!.icon,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-danger text-on-danger',
    },
    {
      id: 'stock' as NavTabId,
      label: 'Stock',
      icon: NAV_ITEMS.find((n) => n.id === 'stock')!.icon,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-warning text-on-warning',
    },
  ];

  return (
    <aside
      aria-label="Desktop Navigation Rail"
      className="hidden md:flex flex-col items-center w-20 shrink-0 min-h-screen py-4 border-r border-border bg-surface-2/60 backdrop-blur-md sticky top-0 left-0 z-30 justify-between select-none"
    >
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Extended Quick Action FAB at Top */}
        {canCreate && (
          <button
            onClick={() => runAction('new_agreement')}
            title="New Sale Agreement"
            className="w-12 h-12 rounded-2xl bg-primary text-on-primary hover:bg-primary-hover flex items-center justify-center shadow-2 active:scale-95 transition-all cursor-pointer group"
          >
            <Plus className="w-6 h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
          </button>
        )}

        {/* Rail Items */}
        <nav className="flex flex-col items-center gap-3 w-full px-2">
          {railItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className="relative w-full py-2.5 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {/* Active Indicator Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeRailPill"
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                    className="absolute inset-x-1.5 inset-y-1 bg-primary-container rounded-2xl z-0"
                  />
                )}

                <div className="relative z-10 flex flex-col items-center gap-1">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive
                        ? 'text-on-primary-container stroke-[2.5]'
                        : 'text-text-muted group-hover:text-text stroke-[2]'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-heading font-extrabold tracking-tight transition-colors ${
                      isActive ? 'text-on-primary-container' : 'text-text-subtle group-hover:text-text'
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Badges */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-mono-tabular font-extrabold flex items-center justify-center shadow-xs ${
                        item.badgeColor || 'bg-primary text-on-primary'
                      }`}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Secondary Apps "More" Sheet Trigger */}
      <div className="w-full px-2 pt-4 border-t border-border/50">
        <button
          onClick={onOpenMoreSheet}
          title="More Apps & Modules"
          className="w-full py-2.5 flex flex-col items-center justify-center gap-1 rounded-2xl hover:bg-surface transition-all text-text-muted hover:text-text cursor-pointer active:scale-95"
        >
          <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
            <span className="bg-text-subtle rounded-xs" />
            <span className="bg-text-subtle rounded-xs" />
            <span className="bg-text-subtle rounded-xs" />
            <span className="bg-text-subtle rounded-xs" />
          </div>
          <span className="text-[10px] font-heading font-extrabold">More</span>
        </button>
      </div>
    </aside>
  );
};
