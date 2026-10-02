import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Primary side from which the drawer slides: 'left' or 'right' (default: 'left') */
  side?: 'left' | 'right';
  /** Title for accessible screen readers */
  title?: string;
  children: React.ReactNode;
  /** Optional callback for mobile edge-swipe to open */
  onEdgeSwipeOpen?: () => void;
  className?: string;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  side = 'left',
  title = 'Navigation Menu Drawer',
  children,
  onEdgeSwipeOpen,
  className = '',
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Check RTL direction
  const isRtl =
    typeof document !== 'undefined' &&
    (document.dir === 'rtl' || document.documentElement.dir === 'rtl');

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // In RTL, logical 'start' is physical right, and logical 'end' is physical left.
  // Effective physical slide direction:
  const isLeftPhysical = isRtl ? side === 'right' : side === 'left';

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Keyboard Escape & Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus into drawer
    const timer = setTimeout(() => {
      if (drawerRef.current) {
        const first = drawerRef.current.querySelector<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        first?.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  // Browser Back button navigation listener (history popstate)
  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = () => {
      onClose();
    };

    window.history.pushState({ sideDrawerOpen: true }, '');
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Clean up our pushed state if still present
      if (window.history.state?.sideDrawerOpen) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);

  // Edge-swipe open listener (when drawer is closed on mobile)
  useEffect(() => {
    if (isOpen || !onEdgeSwipeOpen) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const screenWidth = window.innerWidth;
      const isStartEdge = isLeftPhysical
        ? touch.clientX <= 28
        : touch.clientX >= screenWidth - 28;

      if (isStartEdge) {
        touchStartXRef.current = touch.clientX;
        touchStartYRef.current = touch.clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartXRef.current === null || touchStartYRef.current === null) return;
      const touch = e.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartXRef.current;
      const deltaY = Math.abs(touch.clientY - touchStartYRef.current);

      // Only trigger if horizontal swipe is dominant and moves inward >= 45px
      if (deltaY < 50) {
        const movedInward = isLeftPhysical ? deltaX >= 45 : deltaX <= -45;
        if (movedInward) {
          touchStartXRef.current = null;
          touchStartYRef.current = null;
          onEdgeSwipeOpen();
        }
      }
    };

    const handleTouchEnd = () => {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, isLeftPhysical, onEdgeSwipeOpen]);

  // Animation values derived strictly from side & physical direction
  const slideInitial = { x: isLeftPhysical ? '-100%' : '100%', opacity: 0.95 };
  const slideAnimate = { x: 0, opacity: 1 };
  const slideExit = { x: isLeftPhysical ? '-100%' : '100%', opacity: 0.95 };

  // Alignment classes derived from side
  const containerAlignClass = isLeftPhysical ? 'justify-start' : 'justify-end';

  // Rounded corners on the inner side (away from screen edge)
  const radiusClass = isLeftPhysical
    ? 'rounded-e-[32px]'
    : 'rounded-s-[32px]';

  // Border on inner side
  const borderClass = isLeftPhysical ? 'border-e' : 'border-s';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={`fixed inset-0 z-50 flex ${containerAlignClass} pointer-events-auto select-none`}
        >
          {/* Backdrop Scrim with Theme-Mixed Tint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 backdrop-blur-md cursor-pointer transition-colors duration-250"
            style={{
              backgroundColor: 'var(--drawer-scrim, color-mix(in srgb, var(--bg) 40%, rgba(0, 0, 0, 0.6)))',
            }}
          />

          {/* Sliding Liquid Glass Drawer Panel */}
          <motion.div
            ref={drawerRef}
            initial={prefersReducedMotion ? { opacity: 0 } : slideInitial}
            animate={prefersReducedMotion ? { opacity: 1 } : slideAnimate}
            exit={prefersReducedMotion ? { opacity: 0 } : slideExit}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 420, damping: 34 }
            }
            drag="x"
            dragConstraints={
              isLeftPhysical ? { left: -360, right: 0 } : { left: 0, right: 360 }
            }
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              // Swipe towards edge to close
              const swipeToClose = isLeftPhysical
                ? info.offset.x < -60 || info.velocity.x < -300
                : info.offset.x > 60 || info.velocity.x > 300;

              if (swipeToClose) {
                onClose();
              }
            }}
            className={`relative z-10 w-[min(88vw,360px)] h-full ${radiusClass} ${borderClass} overflow-hidden p-5 sm:p-6 flex flex-col justify-between transition-colors duration-250 ${className}`}
            style={{
              backgroundColor: 'var(--drawer-tint, var(--glass-fill-strong))',
              borderColor: 'var(--drawer-edge, var(--glass-border))',
              boxShadow: 'var(--drawer-glow, var(--glass-shadow))',
              color: 'var(--drawer-text, var(--text))',
              backdropFilter: 'blur(28px) saturate(140%)',
              WebkitBackdropFilter: 'blur(28px) saturate(140%)',
              paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
              paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
            }}
          >
            {/* Top-Down Specular Liquid Sheen Overlay */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-250"
              style={{
                background: 'var(--drawer-sheen)',
                opacity: 0.35,
              }}
              aria-hidden="true"
            />

            {/* Inner Content (Scrollable Container) */}
            <div className="relative z-10 h-full flex flex-col justify-between overflow-y-auto pr-0.5">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
