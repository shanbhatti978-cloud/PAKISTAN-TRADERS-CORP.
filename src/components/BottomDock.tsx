import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Sparkles, Calendar, Package } from 'lucide-react';
import { NavTabId } from '../config/navigation';
import { UserRole } from '../types';

interface BottomDockProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  overdueCount?: number;
  lowStockCount?: number;
  currentUserRole?: UserRole;
  isModalOpen?: boolean;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  activeTab,
  setActiveTab,
  overdueCount = 0,
  lowStockCount = 0,
  isModalOpen = false,
}) => {
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
      if (currentScrollY > lastScrollY.current + 12 && currentScrollY > 60) {
        setIsScrollingDown(true);
      } else if (currentScrollY < lastScrollY.current - 12) {
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

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch (e) {}
    }
  };

  // 4 Icon-only dock buttons
  const dockButtons = [
    {
      id: 'home' as NavTabId,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'ai_assistant' as NavTabId,
      label: 'AI & Sales Report',
      icon: Sparkles,
    },
    {
      id: 'agreements' as NavTabId,
      label: 'Items & Agreements',
      icon: Calendar,
      badge: overdueCount > 0 ? overdueCount : undefined,
    },
    {
      id: 'stock' as NavTabId,
      label: 'Warehouse Stock',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
  ];

  if (isModalOpen || isInputFocused) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: isScrollingDown ? 80 : 0, opacity: isScrollingDown ? 0 : 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 500, damping: 32 }
          }
          className="pointer-events-auto glass-pill-dock rounded-full px-2 py-1.5 flex items-center justify-between gap-1 shadow-[0_12px_36px_rgba(91,75,196,0.12)] min-w-[240px] max-w-[270px]"
        >
          {dockButtons.map((btn) => {
            const Icon = btn.icon;
            const isActive = activeTab === btn.id;

            return (
              <button
                key={btn.id}
                role="navigation"
                aria-label={btn.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  triggerHaptic();
                  setActiveTab(btn.id);
                }}
                className="relative w-11 h-11 flex items-center justify-center rounded-full transition-transform active:scale-90 outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                {/* Active solid white circle with spring animation */}
                {isActive && (
                  <motion.div
                    layoutId="activeDockCircle"
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 500, damping: 30 }
                    }
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.1)] z-0"
                  />
                )}

                <div className="relative z-10 flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive
                        ? 'text-[#5B4BC4] dark:text-[#BDB4F2] stroke-[2.4]'
                        : 'text-[#6B6B7B] hover:text-[#1A1A22] dark:hover:text-white stroke-[2]'
                    }`}
                  />

                  {/* Badge */}
                  {btn.badge !== undefined && btn.badge > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#F4A3A0] text-white text-[8px] font-black font-mono-tabular flex items-center justify-center shadow-xs">
                      {btn.badge > 9 ? '•' : btn.badge}
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
