import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQistStore } from './data/store';
import { getLowStockCategories } from './utils/stockThresholds';
import { Header } from './components/Header';
import { NavigationRail } from './components/NavigationRail';
import { BottomDock } from './components/BottomDock';
import { MoreSheet } from './components/MoreSheet';
import { ToastContainer } from './components/ToastContainer';
import { ScreenSkeleton, ModalSkeleton } from './components/Skeletons';
import { UserLoginModal } from './components/UserLoginModal';
import { FirstRunSetupScreen } from './components/FirstRunSetupScreen';
import { PinLockScreen } from './components/PinLockScreen';
import { PaymentModal } from './components/PaymentModal';
import { NewAgreementModal } from './components/NewAgreementModal';
import { ReceiveStockModal } from './components/ReceiveStockModal';
import { ReversePaymentModal } from './components/ReversePaymentModal';
import { Customer, Agreement, Payment } from './types';
import { M3ColorSchemeName, applyThemeToDocument } from './theme/m3Theme';
import { NavTabId, normalizeTabId } from './config/navigation';
import { AppActionsProvider, useAppActions } from './context/AppActionsContext';

// Lazy-loaded Views & Modals for bundle optimization
const HomeView = lazy(() => import('./components/HomeView').then((m) => ({ default: m.HomeView })));
const AgreementsView = lazy(() => import('./components/AgreementsView').then((m) => ({ default: m.AgreementsView })));
const RecoveryView = lazy(() => import('./components/RecoveryView').then((m) => ({ default: m.RecoveryView })));
const StockView = lazy(() => import('./components/StockView').then((m) => ({ default: m.StockView })));
const CustomersView = lazy(() => import('./components/CustomersView').then((m) => ({ default: m.CustomersView })));
const CashbookView = lazy(() => import('./components/CashbookView').then((m) => ({ default: m.CashbookView })));
const SettingsView = lazy(() => import('./components/SettingsView').then((m) => ({ default: m.SettingsView })));
const ActivityLedgerView = lazy(() => import('./components/ActivityLedgerView').then((m) => ({ default: m.ActivityLedgerView })));
const AiAssistantView = lazy(() => import('./components/AiAssistantView').then((m) => ({ default: m.AiAssistantView })));
const BusinessReportModal = lazy(() => import('./components/BusinessReportModal').then((m) => ({ default: m.BusinessReportModal })));

function MainAppLayout() {
  const {
    settings,
    setSettings,
    users,
    hasRealAdmin,
    createInitialRealAdmin,
    createUserAccount,
    editUserAccount,
    resetUserPassword,
    setUserActiveStatus,
    unlockUserAccount,
    changeOwnPassword,
    changeOwnDisplayName,
    currentUser,
    loginUser,
    logoutUser,
    activityLedger,
    logReportView,
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    stock,
    receiveStock,
    addStockItem,
    updateStockItem,
    deleteStockItem,
    agreements,
    createAgreement,
    payments,
    recordPayment,
    reversePayment,
    stockReceipts,
    stockMovements,
    cashbook,
    addCashBookEntry,
    auditLogs,
    resetToDemoData,
    exportBackupJSON,
    importBackupJSON,
  } = useQistStore();

  const actions = useAppActions();
  const [activeTabRaw, setActiveTabRaw] = useState<string>('home');
  const activeTab: NavTabId = normalizeTabId(activeTabRaw);

  const [searchQuery, setSearchQuery] = useState('');
  const [showUserLoginModal, setShowUserLoginModal] = useState<boolean>(false);
  const [showMoreSheet, setShowMoreSheet] = useState<boolean>(false);

  // Material 3 Theme Mode & ColorScheme
  const themeMode = settings.themeMode || 'dark';
  const colorScheme: M3ColorSchemeName = (settings.colorScheme as M3ColorSchemeName) || 'blue';
  const isLight = themeMode === 'light';

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    applyThemeToDocument(colorScheme, themeMode);
    const timer = setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 250);
    return () => clearTimeout(timer);
  }, [themeMode, colorScheme]);

  const handleToggleThemeMode = () => {
    setSettings((prev) => ({
      ...prev,
      themeMode: prev.themeMode === 'light' ? 'dark' : 'light',
    }));
  };

  const handleSelectColorScheme = (scheme: M3ColorSchemeName) => {
    setSettings((prev) => ({
      ...prev,
      colorScheme: scheme,
    }));
  };

  // Overdue count for badge
  const overdueCount = agreements.reduce((count, a) => {
    if (a.status === 'completed' || a.status === 'cancelled') return count;
    const isOverdue = a.schedule.some((s) => s.status === 'overdue');
    return isOverdue ? count + 1 : count;
  }, 0);

  // Low stock count
  const lowStockCategories = getLowStockCategories(categories, stock);
  const lowStockCount = lowStockCategories.length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCollectionTotal = payments
    .filter((p) => p.date === todayStr)
    .reduce((sum, p) => sum + p.amountPaid, 0);

  const handleSendWhatsAppReminder = (
    customer: Customer,
    agreement: Agreement,
    amount: number,
    dueDate: string
  ) => {
    const text = `Assalam-o-Alaikum ${customer.fullName} Sahib,\nReminder from ${settings.shopName}:\nYour monthly installment of Rs. ${amount.toLocaleString()} for ${agreement.itemName} was due on ${dueDate}.\nPlease clear payment at shop or via JazzCash/EasyPaisa to avoid late fees. Thank you!`;
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `92${cleanPhone.slice(1)}` : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // If no real Admin exists yet, block with First-Run Owner Setup Screen
  if (!hasRealAdmin) {
    return (
      <FirstRunSetupScreen
        onSetupRealAdmin={createInitialRealAdmin}
        isLight={isLight}
      />
    );
  }

  const isModalOpen =
    actions.showNewAgrModal ||
    actions.showPaymentModal ||
    actions.showReceiveStockModal ||
    actions.showBusinessReportModal ||
    !!actions.paymentToReverse ||
    showUserLoginModal;

  return (
    <div className="min-h-screen flex font-sans transition-colors duration-200 bg-bg text-text selection:bg-primary selection:text-on-primary">
      
      {/* PIN Lock Protection Screen if Locked */}
      {settings.isLocked && (
        <PinLockScreen
          settings={settings}
          onUnlock={() => setSettings((prev) => ({ ...prev, isLocked: false }))}
        />
      )}

      {/* Desktop Navigation Rail (Screen >= 768px) */}
      <NavigationRail
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTabRaw(t)}
        overdueCount={overdueCount}
        lowStockCount={lowStockCount}
        currentUserRole={currentUser?.role}
        onOpenMoreSheet={() => setShowMoreSheet(true)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-6">
        
        {/* Sticky App Bar Header */}
        <Header
          settings={settings}
          currentUser={currentUser}
          onOpenUserLogin={() => setShowUserLoginModal(true)}
          activeTab={activeTab}
          onBackToDashboard={() => setActiveTabRaw('home')}
          onOpenNewAgreement={() => actions.runAction('new_agreement')}
          onOpenNewPayment={() => actions.runAction('collect_payment')}
          onOpenReceiveStock={() => actions.runAction('receive_stock')}
          onOpenBusinessReport={() => actions.runAction('business_report')}
          onToggleDrawer={() => setShowMoreSheet(true)}
          onToggleLock={() => setSettings((prev) => ({ ...prev, isLocked: !prev.isLocked }))}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          todayCollectionTotal={todayCollectionTotal}
          stock={stock}
          agreements={agreements}
          customers={customers}
          payments={payments}
          onNavigateTab={(t) => setActiveTabRaw(t)}
          themeMode={themeMode}
          onToggleThemeMode={handleToggleThemeMode}
          colorScheme={colorScheme}
          onSelectColorScheme={handleSelectColorScheme}
        />

        {/* View Surface Container with Suspense Fallback Skeleton */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-7xl w-full mx-auto">
          <Suspense fallback={<ScreenSkeleton />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
              >
                {activeTab === 'home' && (
                  <HomeView
                    agreements={agreements}
                    customers={customers}
                    stock={stock}
                    payments={payments}
                    settings={settings}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onNavigateTab={(t) => setActiveTabRaw(t)}
                  />
                )}

                {activeTab === 'agreements' && (
                  <AgreementsView
                    agreements={agreements}
                    customers={customers}
                    stock={stock}
                    settings={settings}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onOpenNewAgreement={() => actions.runAction('new_agreement')}
                    onOpenCollectPayment={(agrId, slotNum) =>
                      actions.runAction('collect_payment', { agreementId: agrId, installmentNum: slotNum })
                    }
                  />
                )}

                {activeTab === 'recovery' && (
                  <RecoveryView
                    agreements={agreements}
                    customers={customers}
                    payments={payments}
                    currentUser={currentUser}
                    settings={settings}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onOpenCollectPayment={(agrId, slotNum) =>
                      actions.runAction('collect_payment', { agreementId: agrId, installmentNum: slotNum })
                    }
                    onOpenReversePayment={(p) => actions.setPaymentToReverse(p)}
                    onAttemptRestrictedAction={(msg) => actions.showToast(msg || "Admin authority required", 'error')}
                    onSendWhatsApp={handleSendWhatsAppReminder}
                  />
                )}

                {activeTab === 'stock' && (
                  <StockView
                    stock={stock}
                    categories={categories}
                    stockMovements={stockMovements}
                    settings={settings}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onAddStockItem={addStockItem}
                    onUpdateStockItem={updateStockItem}
                    onDeleteStockItem={deleteStockItem}
                    onOpenReceiveStock={() => actions.runAction('receive_stock')}
                    onOpenNewBooking={(itemId) => actions.runAction('new_agreement', { itemId })}
                    onAddCategory={addCategory}
                    onUpdateCategory={updateCategory}
                    onDeleteCategory={deleteCategory}
                  />
                )}

                {activeTab === 'customers' && (
                  <CustomersView
                    customers={customers}
                    agreements={agreements}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onAddCustomer={addCustomer}
                    onUpdateCustomer={updateCustomer}
                    onDeleteCustomer={deleteCustomer}
                    onOpenNewAgreementForCustomer={(cust) =>
                      actions.runAction('new_agreement', { customerId: cust.id })
                    }
                  />
                )}

                {activeTab === 'cashbook' && (
                  <CashbookView
                    cashbook={cashbook}
                    settings={settings}
                    onAddCashEntry={addCashBookEntry}
                    onOpenBusinessReport={() => actions.runAction('business_report')}
                  />
                )}

                {activeTab === 'reports' && (
                  <div className="m3-card p-6 text-center space-y-4">
                    <h2 className="text-xl font-black font-heading text-text">
                      Business Financial Audit & PnL Reports
                    </h2>
                    <p className="text-xs text-text-muted max-w-md mx-auto">
                      Click below to open the comprehensive FIFO Profit & Loss Ledger and PDF/Excel Audit Export Terminal.
                    </p>
                    <button
                      onClick={() => actions.runAction('business_report')}
                      className="m3-btn-base m3-btn-filled px-6 py-3"
                    >
                      Open Executive Audit Terminal
                    </button>
                  </div>
                )}

                {activeTab === 'activity_ledger' && (
                  <ActivityLedgerView
                    entries={activityLedger}
                    isLight={isLight}
                  />
                )}

                {activeTab === 'ai_assistant' && (
                  <AiAssistantView
                    settings={settings}
                  />
                )}

                {activeTab === 'settings' && (
                  <SettingsView
                    settings={settings}
                    setSettings={setSettings}
                    auditLogs={auditLogs}
                    users={users}
                    currentUser={currentUser}
                    onCreateUser={createUserAccount}
                    onEditUser={editUserAccount}
                    onResetPassword={resetUserPassword}
                    onToggleUserActive={setUserActiveStatus}
                    onUnlockUser={unlockUserAccount}
                    onChangeOwnPassword={changeOwnPassword}
                    onUpdateOwnDisplayName={changeOwnDisplayName}
                    onExportJSON={exportBackupJSON}
                    onImportJSON={importBackupJSON}
                    onResetDemoData={resetToDemoData}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>

      {/* Floating Bottom Dock (Screen < 768px) */}
      <BottomDock
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTabRaw(t)}
        overdueCount={overdueCount}
        lowStockCount={lowStockCount}
        currentUserRole={currentUser?.role}
        isModalOpen={isModalOpen}
      />

      {/* More Apps & Utilities Sheet */}
      <MoreSheet
        isOpen={showMoreSheet}
        onClose={() => setShowMoreSheet(false)}
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTabRaw(t)}
        currentUser={currentUser}
        settings={settings}
        themeMode={themeMode}
        onToggleThemeMode={handleToggleThemeMode}
        colorScheme={colorScheme}
        onSelectColorScheme={handleSelectColorScheme}
        onOpenUserLogin={() => setShowUserLoginModal(true)}
        onLogout={logoutUser}
      />

      {/* Global Snackbar Toasts */}
      <ToastContainer />

      {/* MODALS */}
      {/* 1. Account Login / Switch Modal */}
      <UserLoginModal
        users={users}
        currentUser={currentUser || users[0]}
        hasRealAdmin={hasRealAdmin}
        isOpen={showUserLoginModal}
        onClose={() => setShowUserLoginModal(false)}
        onLogin={loginUser}
        onChangeOwnPassword={changeOwnPassword}
        isLight={isLight}
      />

      {/* 2. New Sale Agreement Modal */}
      {actions.showNewAgrModal && (
        <NewAgreementModal
          customers={customers}
          stock={stock}
          categories={categories}
          settings={settings}
          preselectedCustomerId={actions.preselectedCustomerId}
          preselectedItemId={actions.preselectedItemId}
          onClose={() => actions.setShowNewAgrModal(false)}
          onAddCustomer={addCustomer}
          onCreateAgreement={(agreementData) => {
            const newAgr = createAgreement(agreementData);
            actions.showToast(`Agreement #${newAgr.agreementNumber} created!`, 'success');
            return newAgr;
          }}
        />
      )}

      {/* 3. Collect Installment Payment Modal */}
      {actions.showPaymentModal && (
        <PaymentModal
          agreements={agreements}
          customers={customers}
          settings={settings}
          preselectedAgreementId={actions.preselectedAgrId}
          preselectedInstallmentNum={actions.preselectedInstallmentNum}
          onClose={() => actions.setShowPaymentModal(false)}
          onRecordPayment={(params) => {
            const p = recordPayment(params);
            actions.showToast(`Payment collected against Receipt #${p.receiptNumber}!`, 'success');
            return p;
          }}
        />
      )}

      {/* 4. Receive Stock Delivery Modal */}
      {actions.showReceiveStockModal && (
        <ReceiveStockModal
          stock={stock}
          categories={categories}
          settings={settings}
          onClose={() => actions.setShowReceiveStockModal(false)}
          onAddCategory={addCategory}
          onReceiveStock={(params) => {
            receiveStock(params);
            actions.showToast(`Stock delivery logged successfully!`, 'success');
          }}
        />
      )}

      {/* 5. Reverse / Change Payment Modal */}
      {actions.paymentToReverse && (
        <ReversePaymentModal
          payment={actions.paymentToReverse}
          settings={settings}
          onClose={() => actions.setPaymentToReverse(null)}
          onConfirmReversal={(paymentId, reason) => {
            const res = reversePayment(paymentId, reason);
            if (res.success) {
              actions.showToast('Payment transaction reversed & ledger updated.', 'success');
            } else {
              actions.showToast(res.message || 'Reversal failed.', 'error');
            }
          }}
        />
      )}

      {/* 6. Business Financial Audit & PnL Report Modal */}
      {actions.showBusinessReportModal && (
        <Suspense fallback={<ModalSkeleton />}>
          <BusinessReportModal
            payments={payments}
            agreements={agreements}
            customers={customers}
            stock={stock}
            stockReceipts={stockReceipts}
            stockMovements={stockMovements}
            cashbook={cashbook}
            auditLogs={auditLogs}
            settings={settings}
            onClose={() => actions.setShowBusinessReportModal(false)}
            onLogReportView={logReportView}
          />
        </Suspense>
      )}

    </div>
  );
}

export default function App() {
  return (
    <AppActionsProvider>
      <MainAppLayout />
    </AppActionsProvider>
  );
}
