import React, { useState, useEffect } from 'react';
import { ArrowLeft, Home, Grid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQistStore } from './data/store';
import { getLowStockCategories } from './utils/stockThresholds';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { NavDrawer } from './components/NavDrawer';
import { M3BottomNavBar } from './components/M3BottomNavBar';
import { AppCenterView } from './components/AppCenterView';
import { ActivityLedgerView } from './components/ActivityLedgerView';
import { UserLoginModal } from './components/UserLoginModal';
import { FirstRunSetupScreen } from './components/FirstRunSetupScreen';
import { DashboardView } from './components/DashboardView';
import { AgreementsView } from './components/AgreementsView';
import { RecoveryView } from './components/RecoveryView';
import { CustomersView } from './components/CustomersView';
import { StockView } from './components/StockView';
import { CashbookView } from './components/CashbookView';
import { AiAssistantView } from './components/AiAssistantView';
import { SettingsView } from './components/SettingsView';
import { PaymentModal } from './components/PaymentModal';
import { NewAgreementModal } from './components/NewAgreementModal';
import { BusinessReportModal } from './components/BusinessReportModal';
import { ReceiveStockModal } from './components/ReceiveStockModal';
import { ReversePaymentModal } from './components/ReversePaymentModal';
import { PinLockScreen } from './components/PinLockScreen';
import { Customer, Agreement, Payment } from './types';
import { M3ColorSchemeName, M3_DARK_SCHEMES, M3_LIGHT_SCHEMES } from './theme/m3Theme';

export default function App() {
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
    logActivity,
    verifyPermission,
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
    reversals,
    stockReceipts,
    stockMovements,
    cashbook,
    addCashBookEntry,
    auditLogs,
    resetToDemoData,
    exportBackupJSON,
    importBackupJSON,
  } = useQistStore();

  const [activeTab, setActiveTab] = useState<TabType>('app_center');
  const [searchQuery, setSearchQuery] = useState('');
  const [permissionDeniedToast, setPermissionDeniedToast] = useState<string | null>(null);
  const [showUserLoginModal, setShowUserLoginModal] = useState<boolean>(false);

  const triggerPermissionToast = (msg?: string) => {
    setPermissionDeniedToast(msg || "You don't have permission");
    setTimeout(() => setPermissionDeniedToast(null), 3500);
  };

  // Material 3 Theme Mode & ColorScheme
  const themeMode = settings.themeMode || 'dark';
  const colorScheme: M3ColorSchemeName = (settings.colorScheme as M3ColorSchemeName) || 'blue';
  const isLight = themeMode === 'light';

  useEffect(() => {
    const isLightMode = themeMode === 'light';
    if (isLightMode) {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    }

    const schemeObj = isLightMode
      ? M3_LIGHT_SCHEMES[colorScheme] || M3_LIGHT_SCHEMES.expressive
      : M3_DARK_SCHEMES[colorScheme] || M3_DARK_SCHEMES.expressive;

    const root = document.documentElement;
    Object.entries(schemeObj).forEach(([token, val]) => {
      const kebab = token.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--theme-${kebab}`, val);
      root.style.setProperty(`--md-sys-color-${kebab}`, val);
    });
    if (schemeObj.appBarBg) {
      root.style.setProperty('--theme-appbar-bg', schemeObj.appBarBg);
    }
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

  // Modals state
  const [showDrawer, setShowDrawer] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [preselectedAgrId, setPreselectedAgrId] = useState<string | undefined>();
  const [preselectedSlotNum, setPreselectedSlotNum] = useState<number | undefined>();

  const [showNewAgrModal, setShowNewAgrModal] = useState(false);
  const [preselectedItemId, setPreselectedItemId] = useState<string | undefined>();
  const [showBusinessReportModal, setShowBusinessReportModal] = useState(false);
  const [showReceiveStockModal, setShowReceiveStockModal] = useState(false);
  const [paymentToReverse, setPaymentToReverse] = useState<Payment | null>(null);

  // Today Cash Calculation
  const todayStr = '2026-09-28';
  const todayCollectionTotal = payments
    .filter((p) => p.date === todayStr)
    .reduce((sum, p) => sum + p.amountPaid, 0);

  // Overdue count for badge
  const overdueCount = agreements.reduce((count, a) => {
    if (a.status === 'completed' || a.status === 'cancelled') return count;
    const isOverdue = a.schedule.some((s) => s.status === 'overdue');
    return isOverdue ? count + 1 : count;
  }, 0);

  // Category low stock threshold count
  const lowStockCategories = getLowStockCategories(categories, stock);
  const lowStockCount = lowStockCategories.length;

  // Handlers
  const handleOpenCollectPayment = (agrId?: string, slotNum?: number) => {
    setPreselectedAgrId(agrId);
    setPreselectedSlotNum(slotNum);
    setShowPaymentModal(true);
  };

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

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    } selection:bg-emerald-500 selection:text-white`}>
      
      {/* PIN Lock Protection Screen if Locked */}
      {settings.isLocked && (
        <PinLockScreen
          settings={settings}
          onUnlock={() => setSettings((prev) => ({ ...prev, isLocked: false }))}
        />
      )}

      {/* Main App Layout Header */}
      <Header
        settings={settings}
        currentUser={currentUser}
        onOpenUserLogin={() => setShowUserLoginModal(true)}
        activeTab={activeTab}
        onBackToDashboard={() => setActiveTab('app_center')}
        onOpenNewAgreement={() => {
          setPreselectedItemId(undefined);
          setShowNewAgrModal(true);
        }}
        onOpenNewPayment={() => handleOpenCollectPayment()}
        onOpenReceiveStock={() => setShowReceiveStockModal(true)}
        onToggleDrawer={() => setShowDrawer((prev) => !prev)}
        onToggleLock={() => setSettings((prev) => ({ ...prev, isLocked: !prev.isLocked }))}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        todayCollectionTotal={todayCollectionTotal}
        stock={stock}
        agreements={agreements}
        customers={customers}
        payments={payments}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenBusinessReport={() => setShowBusinessReportModal(true)}
        themeMode={themeMode}
        onToggleThemeMode={handleToggleThemeMode}
        colorScheme={colorScheme}
        onSelectColorScheme={handleSelectColorScheme}
      />

      {/* Side Navigation Drawer */}
      <NavDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        overdueCount={overdueCount}
        lowStockCount={lowStockCount}
        onOpenNewAgreement={() => {
          setPreselectedItemId(undefined);
          setShowNewAgrModal(true);
        }}
        onOpenNewPayment={() => handleOpenCollectPayment()}
        onOpenReceiveStock={() => setShowReceiveStockModal(true)}
        onOpenBusinessReport={() => setShowBusinessReportModal(true)}
      />

      {/* Material 3 Top Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        overdueCount={overdueCount}
        lowStockCount={lowStockCount}
        onOpenBusinessReport={() => setShowBusinessReportModal(true)}
        themeMode={themeMode}
      />

      {/* View Container - Responsive with safe padding for Mobile Bottom Navigation */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 pb-24 md:pb-8 space-y-6">
        
        {/* Top Navigation Bar with Back to App Center button when inside a module */}
        {activeTab !== 'app_center' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-2xl p-3 sm:p-4 shadow-sm transition-colors duration-200 ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800'
                : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('app_center')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                title="Return to App Center Main Hub"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                <span>← Back to App Center</span>
              </button>

              <span className={`text-xs hidden sm:inline font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Native Enterprise APK Hub
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setActiveTab('app_center')}
                className={`font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                  isLight ? 'text-slate-700 hover:text-blue-600' : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-blue-500" />
                <span>App Center</span>
              </button>
              <span className="text-slate-400">/</span>
              <span className={`font-bold uppercase tracking-wider text-[11px] px-2.5 py-0.5 rounded-lg border font-mono-tabular ${
                isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-950/80 text-blue-300 border-blue-800/60'
              }`}>
                {activeTab.replace('_', ' ')}
              </span>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'app_center' && (
            <motion.div
              key="app_center"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <AppCenterView
                onSelectModule={(tab) => setActiveTab(tab)}
                agreements={agreements}
                stock={stock}
                payments={payments}
                settings={settings}
                onOpenBusinessReport={() => setShowBusinessReportModal(true)}
                onToggleLock={() => setSettings((prev) => ({ ...prev, isLocked: !prev.isLocked }))}
                isLight={isLight}
              />
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <DashboardView
                agreements={agreements}
                customers={customers}
                stock={stock}
                payments={payments}
                settings={settings}
                categories={categories}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
                onExportBackupJSON={exportBackupJSON}
                onUpdateCategory={updateCategory}
                onOpenNewAgreement={() => {
                  setPreselectedItemId(undefined);
                  setShowNewAgrModal(true);
                }}
                onOpenCollectPayment={handleOpenCollectPayment}
                onSendWhatsApp={handleSendWhatsAppReminder}
                onNavigateTab={setActiveTab}
                onOpenBusinessReport={() => setShowBusinessReportModal(true)}
                onToggleDrawer={() => setShowDrawer(true)}
                onOpenReceiveStock={() => setShowReceiveStockModal(true)}
              />
            </motion.div>
          )}

          {activeTab === 'agreements' && (
            <motion.div
              key="agreements"
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <AgreementsView
                agreements={agreements}
                customers={customers}
                stock={stock}
                settings={settings}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onOpenNewAgreement={() => {
                  setPreselectedItemId(undefined);
                  setShowNewAgrModal(true);
                }}
                onOpenCollectPayment={handleOpenCollectPayment}
              />
            </motion.div>
          )}

          {activeTab === 'recovery' && (
            <motion.div
              key="recovery"
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <RecoveryView
                agreements={agreements}
                customers={customers}
                payments={payments}
                currentUser={currentUser}
                settings={settings}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onOpenCollectPayment={handleOpenCollectPayment}
                onOpenReversePayment={(p) => setPaymentToReverse(p)}
                onAttemptRestrictedAction={(msg) => triggerPermissionToast(msg)}
                onSendWhatsApp={handleSendWhatsAppReminder}
              />
            </motion.div>
          )}

          {activeTab === 'customers' && (
            <motion.div
              key="customers"
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <CustomersView
                customers={customers}
                agreements={agreements}
                payments={payments}
                settings={settings}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onAddCustomer={addCustomer}
                onUpdateCustomer={updateCustomer}
                onDeleteCustomer={deleteCustomer}
                onOpenNewAgreement={() => {
                  setPreselectedItemId(undefined);
                  setShowNewAgrModal(true);
                }}
              />
            </motion.div>
          )}

          {activeTab === 'stock' && (
            <motion.div
              key="stock"
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
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
                onOpenReceiveStock={() => setShowReceiveStockModal(true)}
                onOpenNewBooking={(itemId) => {
                  setPreselectedItemId(itemId);
                  setShowNewAgrModal(true);
                }}
                onAddCategory={addCategory}
                onUpdateCategory={updateCategory}
                onDeleteCategory={deleteCategory}
              />
            </motion.div>
          )}

          {activeTab === 'cashbook' && (
            <motion.div
              key="cashbook"
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <CashbookView
                cashbook={cashbook}
                settings={settings}
                onAddCashEntry={addCashBookEntry}
                onOpenBusinessReport={() => setShowBusinessReportModal(true)}
              />
            </motion.div>
          )}

          {activeTab === 'activity_ledger' && (
            <motion.div
              key="activity_ledger"
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <ActivityLedgerView entries={activityLedger} isLight={isLight} />
            </motion.div>
          )}

          {activeTab === 'ai_assistant' && (
            <motion.div
              key="ai_assistant"
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <AiAssistantView settings={settings} />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Collect Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          agreements={agreements}
          customers={customers}
          settings={settings}
          preselectedAgreementId={preselectedAgrId}
          preselectedInstallmentNum={preselectedSlotNum}
          onClose={() => {
            setShowPaymentModal(false);
            setPreselectedAgrId(undefined);
            setPreselectedSlotNum(undefined);
          }}
          onRecordPayment={recordPayment}
        />
      )}

      {/* New Sale Agreement Wizard Modal */}
      {showNewAgrModal && (
        <NewAgreementModal
          customers={customers}
          stock={stock}
          settings={settings}
          preselectedItemId={preselectedItemId}
          onClose={() => {
            setShowNewAgrModal(false);
            setPreselectedItemId(undefined);
          }}
          onCreateAgreement={createAgreement}
        />
      )}

      {/* Business Report Modal */}
      {showBusinessReportModal && (
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
          onClose={() => setShowBusinessReportModal(false)}
          onLogReportView={logReportView}
        />
      )}

      {/* User Login & Role Switcher Modal */}
      <UserLoginModal
        users={users}
        currentUser={currentUser}
        hasRealAdmin={hasRealAdmin}
        isOpen={showUserLoginModal}
        onClose={() => setShowUserLoginModal(false)}
        onLogin={loginUser}
        onChangeOwnPassword={changeOwnPassword}
        isLight={isLight}
      />

      {/* Permission Denied Toast Snackbar */}
      <AnimatePresence>
        {permissionDeniedToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-rose-600 text-white font-bold text-xs shadow-2xl border border-rose-400 flex items-center gap-3 animate-in shake"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
            <span>You don't have permission</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receive Stock Modal (Maal Entry) */}
      {showReceiveStockModal && (
        <ReceiveStockModal
          stock={stock}
          categories={categories}
          settings={settings}
          onClose={() => setShowReceiveStockModal(false)}
          onAddCategory={addCategory}
          onReceiveStock={receiveStock}
        />
      )}

      {/* Reverse Payment Modal */}
      {paymentToReverse && (
        <ReversePaymentModal
          payment={paymentToReverse}
          settings={settings}
          onClose={() => setPaymentToReverse(null)}
          onConfirmReversal={(paymentId, reason) => {
            reversePayment(paymentId, reason);
            setPaymentToReverse(null);
          }}
        />
      )}

      {/* Footer */}
      <footer className={`border-t py-4 text-center text-xs transition-colors duration-200 hidden md:block ${
        isLight ? 'bg-white border-slate-200 text-slate-500' : 'border-slate-900 bg-slate-950 text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} {settings.shopName} — Standalone Instalment Management System
          </span>
          <span className={`font-mono-tabular text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Material 3 Engine · Offline Storage Active
          </span>
        </div>
      </footer>

      {/* Material 3 Android Mobile Bottom Navigation Bar & FAB */}
      <M3BottomNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        overdueCount={overdueCount}
        lowStockCount={lowStockCount}
        onOpenNewAgreement={() => {
          setPreselectedItemId(undefined);
          setShowNewAgrModal(true);
        }}
        onToggleDrawer={() => setShowDrawer((prev) => !prev)}
        themeMode={themeMode}
      />

    </div>
  );
}
