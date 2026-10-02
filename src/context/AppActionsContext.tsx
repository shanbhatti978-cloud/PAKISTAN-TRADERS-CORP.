import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, Payment } from '../types';
import { PermissionManager } from '../utils/permissionManager';
import { ActionId, APP_ACTIONS } from '../config/actions';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ActionRunParams {
  agreementId?: string;
  installmentNum?: number;
  customerId?: string;
  itemId?: string;
  paymentToReverse?: Payment;
}

interface AppActionsContextType {
  // Modal states
  showNewAgrModal: boolean;
  setShowNewAgrModal: (val: boolean) => void;
  preselectedAgrId?: string;
  preselectedInstallmentNum?: number;
  preselectedCustomerId?: string;
  preselectedItemId?: string;

  showPaymentModal: boolean;
  setShowPaymentModal: (val: boolean) => void;

  showReceiveStockModal: boolean;
  setShowReceiveStockModal: (val: boolean) => void;

  showBusinessReportModal: boolean;
  setShowBusinessReportModal: (val: boolean) => void;

  paymentToReverse: Payment | null;
  setPaymentToReverse: (p: Payment | null) => void;

  // Toast / Snackbar state
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Centralized action runner
  runAction: (actionId: ActionId, params?: ActionRunParams) => boolean;

  // Modal closers
  closeAllModals: () => void;
}

const AppActionsContext = createContext<AppActionsContextType | undefined>(undefined);

interface AppActionsProviderProps {
  children: ReactNode;
  currentUser?: User;
  onToggleLock?: () => void;
  onExportBackup?: () => void;
}

export const AppActionsProvider: React.FC<AppActionsProviderProps> = ({
  children,
  currentUser,
  onToggleLock,
  onExportBackup,
}) => {
  const [showNewAgrModal, setShowNewAgrModal] = useState(false);
  const [preselectedAgrId, setPreselectedAgrId] = useState<string | undefined>();
  const [preselectedInstallmentNum, setPreselectedInstallmentNum] = useState<number | undefined>();
  const [preselectedCustomerId, setPreselectedCustomerId] = useState<string | undefined>();
  const [preselectedItemId, setPreselectedItemId] = useState<string | undefined>();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiveStockModal, setShowReceiveStockModal] = useState(false);
  const [showBusinessReportModal, setShowBusinessReportModal] = useState(false);
  const [paymentToReverse, setPaymentToReverse] = useState<Payment | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const closeAllModals = useCallback(() => {
    setShowNewAgrModal(false);
    setShowPaymentModal(false);
    setShowReceiveStockModal(false);
    setShowBusinessReportModal(false);
    setPaymentToReverse(null);
  }, []);

  const runAction = useCallback(
    (actionId: ActionId, params?: ActionRunParams): boolean => {
      const cfg = APP_ACTIONS.find((a) => a.id === actionId);
      if (cfg && cfg.permission && currentUser) {
        if (!PermissionManager.can(currentUser.role, cfg.permission)) {
          showToast(`Access Denied: ${currentUser.role} role does not have permission.`, 'error');
          return false;
        }
      }

      switch (actionId) {
        case 'new_agreement':
          setPreselectedCustomerId(params?.customerId);
          setPreselectedItemId(params?.itemId);
          setShowNewAgrModal(true);
          return true;

        case 'collect_payment':
          setPreselectedAgrId(params?.agreementId);
          setPreselectedInstallmentNum(params?.installmentNum);
          setShowPaymentModal(true);
          return true;

        case 'receive_stock':
          setShowReceiveStockModal(true);
          return true;

        case 'business_report':
          setShowBusinessReportModal(true);
          return true;

        case 'lock_app':
          if (onToggleLock) onToggleLock();
          return true;

        case 'export_backup':
          if (onExportBackup) onExportBackup();
          return true;

        default:
          return true;
      }
    },
    [currentUser, onToggleLock, onExportBackup, showToast]
  );

  return (
    <AppActionsContext.Provider
      value={{
        showNewAgrModal,
        setShowNewAgrModal,
        preselectedAgrId,
        preselectedInstallmentNum,
        preselectedCustomerId,
        preselectedItemId,
        showPaymentModal,
        setShowPaymentModal,
        showReceiveStockModal,
        setShowReceiveStockModal,
        showBusinessReportModal,
        setShowBusinessReportModal,
        paymentToReverse,
        setPaymentToReverse,
        toasts,
        showToast,
        removeToast,
        runAction,
        closeAllModals,
      }}
    >
      {children}
    </AppActionsContext.Provider>
  );
};

export const useAppActions = () => {
  const context = useContext(AppActionsContext);
  if (!context) {
    throw new Error('useAppActions must be used within an AppActionsProvider');
  }
  return context;
};
