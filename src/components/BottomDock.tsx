import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Home, FileSignature, Wallet, Package, LucideIcon } from 'lucide-react';
import { NavTabId } from '../config/navigation';
import { UserRole } from '../types';

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
  showDot: boolean;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  activeTab,
  setActiveTab,
  overdueCount,
  lowStockCount,
  isModalOpen = false,
}) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hide the dock while the on-screen keyboard is open
  useEffect(() => {
    const vv = window.visualViewport;
    const check = () => {
      const target = document.activeElement as HTMLElement | null;
      const isTyping =
        !!target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const viewportShrunk = vv ? vv.height < window.innerHeight * 0.75 : false;
      setIsKeyboardOpen(isTyping && viewportShrunk);
    };
    vv?.addEventListener('resize', check);
    document.addEventListener('focusin', check);
    document.addEventListener('focusout', check);
    return () => {
      vv?.removeEventListener('resize', check);
      document.removeEventListener('focusin', check);
      document.removeEventListener('focusout', check);
    };
  }, []);

  const items: DockItem[] = [
    { id: 'home', label: 'Home', icon: Home, showDot: false },
    { id: 'agreements', label: 'Sales', icon: FileSignature, showDot: false },
    { id: 'recovery', label: 'Recovery', icon: Wallet, showDot: overdueCount > 0 },
    { id: 'stock', label: 'Stock', icon: Package, showDot: lowStockCount > 0 },
  ];

  const haptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {
        /* ignore */
      }
    }
  };

  if (isModalOpen || isKeyboardOpen) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
    >
      <motion.nav
        aria-label="Main navigation"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 500, damping: 34 }
        }
        className="dock-pill pointer-events-auto flex items-center justify-between rounded-full p-2"
        style={{ width: 'clamp(208px, 58vw, 264px)', height: 60 }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              title={item.label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                haptic();
                setActiveTab(item.id);
              }}
              className="group relative flex items-center justify-center w-12 h-12 -my-1 rounded-full outline-none active:scale-90 transition-transform focus-visible:ring-2 focus-visible:ring-[var(--focus-ring,#5B4BC4)]"
            >
              {/* Visible Hover/Focus Tooltip (14px) */}
              <span
                role="tooltip"
                className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-surface border border-border shadow-md text-[14px] font-bold text-text whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 z-30"
              >
                {item.label}
              </span>

              {isActive && (
                <motion.span
                  layoutId="dock-active-circle"
                  className="dock-active absolute w-11 h-11 rounded-full"
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 520, damping: 34 }
                  }
                />
              )}

              <motion.span
                className="relative z-10 flex"
                animate={
                  isActive && !prefersReducedMotion
                    ? { scale: [1, 1.12, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.22 }}
              >
                <Icon
                  className={isActive ? 'dock-icon-active' : 'dock-icon'}
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  fill={isActive ? 'currentColor' : 'none'}
                  fillOpacity={isActive ? 0.15 : 0}
                />
              </motion.span>

              {item.showDot && (
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 right-1.5 z-20 w-2.5 h-2.5 rounded-full ring-2 ring-surface shadow-xs"
                  style={{ backgroundColor: 'var(--accent, #F4A3A0)' }}
                />
              )}
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
};
