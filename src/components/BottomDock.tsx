import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, FileSignature, Wallet, Package, Plus, Receipt, PackageCheck, LucideIcon } from 'lucide-react';
import { NavTabId } from '../config/navigation';
import { UserRole } from '../types';
import { PermissionManager } from '../utils/permissionManager';
import { useAppActions } from '../context/AppActionsContext';

interface BottomDockProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  overdueCount: number;
  lowStockCount: number;
  currentUserRole?: UserRole;
  isModalOpen?: boolean;
}

interface DockItem {
  id: NavTabId;
  label: string;
  icon: LucideIcon;
  badge?: number;
  badgeColor?: string;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  activeTab,
  setActiveTab,
  overdueCount,
  lowStockCount,
  currentUserRole = 'ADMIN',
  isModalOpen = false,
}) => {
  const { runAction } = useAppActions();
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const lastScrollY = useRef(0);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);

  // Check reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Track scroll direction & input focus to auto-hide dock
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current + 10 && currentScrollY > 60) {
        setIsScrollingDown(true);
      } else if (currentScrollY < lastScrollY.current - 10) {
        setIsScrollingDown(false);
      }
      lastScrollY.current = currentScrollY;

      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        setIsScrollingDown(false);
      }, 600);
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        setIsInputFocused(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  // 4 Dock items
  const dockItems: DockItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
    },
    {
      id: 'agreements',
      label: 'Sales',
      icon: FileSignature,
    },
    {
      id: 'recovery',
      label: 'Recovery',
      icon: Wallet,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-danger text-on-danger',
    },
    {
      id: 'stock',
      label: 'Stock',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-warning text-on-warning',
    },
  ];

  // Contextual Quick Action Button specs per active tab
  const getContextualAction = () => {
    if (activeTab === 'agreements' && PermissionManager.can(currentUserRole, 'ADD_AGREEMENT')) {
      return {
        label: 'New Sale',
        icon: Plus,
        action: () => runAction('new_agreement'),
      };
    }
    if (activeTab === 'recovery' && PermissionManager.can(currentUserRole, 'ADD_RECOVERY')) {
      return {
        label: 'Collect',
        icon: Receipt,
        action: () => runAction('collect_payment'),
      };
    }
    if (activeTab === 'stock' && PermissionManager.can(currentUserRole, 'ADD_ITEM')) {
      return {
        label: 'Receive Stock',
        icon: PackageCheck,
        action: () => runAction('receive_stock'),
      };
    }
    return null;
  };

  const quickAction = getContextualAction();
  const shouldHideDock = isModalOpen || isInputFocused;

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch (e) {}
    }
  };

  if (shouldHideDock) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none flex flex-col items-center">
        
        {/* Contextual Quick Action FAB (Floats above dock) */}
        {quickAction && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{
              opacity: isScrollingDown ? 0.7 : 1,
              y: isScrollingDown ? 60 : 0,
              scale: isScrollingDown ? 0.85 : 1,
            }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 450, damping: 28 }
            }
            className="pointer-events-auto mb-3 self-end mr-6"
          >
            <button
              onClick={() => {
                triggerHaptic();
                quickAction.action();
              }}
              className="m3-btn-base m3-btn-filled px-4 py-3 shadow-3 flex items-center gap-2 rounded-full cursor-pointer active:scale-95 transition-transform"
            >
              <quickAction.icon className="w-5 h-5 stroke-[2.5]" />
              <span className="font-heading font-extrabold text-xs">
                {quickAction.label}
              </span>
            </button>
          </motion.div>
        )}

        {/* Floating Bottom Dock Pill */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: isScrollingDown ? 100 : 0, opacity: isScrollingDown ? 0 : 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.1 }
              : { type: 'spring', stiffness: 500, damping: 32 }
          }
          style={{ bottom: 'calc(14px + env(safe-area-inset-bottom))' }}
          className="relative pointer-events-auto mb-3 w-[92vw] max-w-[360px] h-[70px] rounded-[36px] bg-surface-2/90 backdrop-blur-xl border border-border/60 shadow-3 px-2 flex items-center justify-around overflow-hidden"
        >
          {dockItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                role="navigation"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  triggerHaptic();
                  setActiveTab(item.id);
                }}
                className="relative min-w-[56px] min-h-[48px] flex flex-col items-center justify-center rounded-full transition-transform active:scale-94 focus-visible:ring-2 focus-visible:ring-focus-ring outline-none"
              >
                {/* Active Indicator Sliding Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeDockPill"
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 500, damping: 32 }
                    }
                    className="absolute inset-x-1 inset-y-1 bg-primary-container rounded-full z-0"
                  />
                )}

                <div className="relative z-10 flex flex-col items-center justify-center gap-0.5 px-2">
                  <motion.div
                    animate={
                      isActive && !prefersReducedMotion
                        ? { scale: [1, 1.18, 1] }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.22 }}
                  >
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        isActive
                          ? 'text-on-primary-container stroke-[2.5]'
                          : 'text-text-muted stroke-[2]'
                      }`}
                    />
                  </motion.div>

                  <span
                    className={`text-[10px] font-bold tracking-tight transition-colors ${
                      isActive
                        ? 'text-on-primary-container font-heading font-extrabold'
                        : 'text-text-subtle font-medium'
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Badges */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-mono-tabular font-extrabold flex items-center justify-center shadow-xs animate-in zoom-in-50 ${
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
