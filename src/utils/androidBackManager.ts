import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { NavTabId } from '../config/navigation';

interface BackManagerParams {
  activeTab: NavTabId;
  setActiveTabRaw: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showMoreSheet: boolean;
  setShowMoreSheet: (val: boolean) => void;
  showUserLoginModal: boolean;
  setShowUserLoginModal: (val: boolean) => void;
  closeAllModals: () => void;
  isAnyModalOpen: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function useAndroidBackManager({
  activeTab,
  setActiveTabRaw,
  searchQuery,
  setSearchQuery,
  showMoreSheet,
  setShowMoreSheet,
  showUserLoginModal,
  setShowUserLoginModal,
  closeAllModals,
  isAnyModalOpen,
  showToast,
}: BackManagerParams) {
  const lastBackPressTimeRef = useRef<number>(0);

  useEffect(() => {
    let handleBack = async () => {
      // 1. If any modal, drawer, or sheet is open, close it first
      if (showMoreSheet) {
        setShowMoreSheet(false);
        return;
      }
      if (showUserLoginModal) {
        setShowUserLoginModal(false);
        return;
      }
      if (isAnyModalOpen) {
        closeAllModals();
        return;
      }

      // Dispatch custom event for any component-level modals/drawers to intercept
      const customBackEvent = new CustomEvent('app:back', { cancelable: true });
      window.dispatchEvent(customBackEvent);
      if (customBackEvent.defaultPrevented) {
        return;
      }

      // 2. If search query is active, clear search query first
      if (searchQuery.trim().length > 0) {
        setSearchQuery('');
        return;
      }

      // 3. If on secondary screen, navigate back to home dashboard
      if (activeTab !== 'home') {
        setActiveTabRaw('home');
        return;
      }

      // 4. On home screen with no modals open -> Double-back-to-exit
      const now = Date.now();
      const DOUBLE_CLICK_TIME_MS = 2000;

      if (now - lastBackPressTimeRef.current < DOUBLE_CLICK_TIME_MS) {
        try {
          await App.exitApp();
        } catch {
          window.close();
        }
      } else {
        lastBackPressTimeRef.current = now;
        showToast('Press back again to exit', 'info');
      }
    };

    // Listen to Capacitor native app backButton
    const backButtonListener = App.addListener('backButton', () => {
      handleBack();
    });

    // Also support browser / standard popstate back button
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      handleBack();
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      backButtonListener.then((l) => l.remove()).catch(() => {});
      window.removeEventListener('popstate', handlePopState);
    };
  }, [
    activeTab,
    setActiveTabRaw,
    searchQuery,
    setSearchQuery,
    showMoreSheet,
    setShowMoreSheet,
    showUserLoginModal,
    setShowUserLoginModal,
    closeAllModals,
    isAnyModalOpen,
    showToast,
  ]);
}
