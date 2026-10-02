import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sun,
  Moon,
  Lock,
  LogOut,
  Shield,
  Palette,
  ChevronRight,
  Download,
  Users,
  BookOpen,
  FileSpreadsheet,
  Activity,
  Sparkles,
  Settings,
} from 'lucide-react';
import { NavTabId, NAV_ITEMS, getVisibleNavItems } from '../config/navigation';
import { User, ShopSettings } from '../types';
import { PermissionManager } from '../utils/permissionManager';
import { M3_THEME_COLORS, normalizeThemeColor, M3ColorSchemeName } from '../theme/m3Theme';
import { useAppActions } from '../context/AppActionsContext';

interface MoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  currentUser?: User;
  settings: ShopSettings;
  themeMode?: 'dark' | 'light';
  onToggleThemeMode?: () => void;
  colorScheme?: M3ColorSchemeName;
  onSelectColorScheme?: (scheme: M3ColorSchemeName) => void;
  onOpenUserLogin?: () => void;
  onLogout?: () => void;
}

export const MoreSheet: React.FC<MoreSheetProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  currentUser,
  settings,
  themeMode = 'dark',
  onToggleThemeMode,
  colorScheme = 'blue',
  onSelectColorScheme,
  onOpenUserLogin,
  onLogout,
}) => {
  const { runAction } = useAppActions();
  const isLight = themeMode === 'light';

  if (!isOpen) return null;

  const role = currentUser?.role || 'VIEWER';
  const roleBadge = PermissionManager.getRoleBadgeStyle(role);
  const secondaryItems = getVisibleNavItems(role).filter((item) => item.inMoreSheet);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-scrim backdrop-blur-md flex justify-end animate-in fade-in duration-150">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative z-10 w-full max-w-sm h-full bg-surface border-l border-border shadow-3 p-5 sm:p-6 overflow-y-auto flex flex-col justify-between text-text select-none"
        >
          <div className="space-y-6">
            {/* Header & Close */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center font-black font-heading">
                  {currentUser?.fullName?.[0] || 'U'}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm font-heading text-text">
                    {currentUser?.fullName || 'User Profile'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider font-mono-tabular ${roleBadge.badgeClass}`}>
                      {roleBadge.label}
                    </span>
                    <span className="text-[11px] text-text-subtle font-mono">
                      @{currentUser?.username || 'user'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full border border-border bg-surface-2 text-text-subtle hover:text-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Switch Action */}
            {onOpenUserLogin && (
              <button
                onClick={() => {
                  onClose();
                  onOpenUserLogin();
                }}
                className="w-full p-3 rounded-2xl border border-border bg-surface-2 hover:border-primary transition-all flex items-center justify-between text-xs font-bold text-text active:scale-98 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Switch Role / Account Credentials</span>
                </div>
                <ChevronRight className="w-4 h-4 text-text-subtle" />
              </button>
            )}

            {/* Secondary Modules Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-heading font-extrabold uppercase tracking-wider text-text-subtle px-1">
                More Modules & Utilities
              </h4>

              <div className="grid grid-cols-1 gap-2">
                {secondaryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        onClose();
                      }}
                      className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer active:scale-98 ${
                        isActive
                          ? 'bg-primary-container text-on-primary-container border-primary font-bold'
                          : 'bg-surface-2/60 border-border text-text hover:bg-surface-2'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${isActive ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-border text-text-muted'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold font-heading">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-text-subtle">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-on-primary-container' : 'text-text-subtle'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Scheme Picker */}
            <div className="space-y-2 pt-2 border-t border-border">
              <h4 className="text-xs font-heading font-extrabold uppercase tracking-wider text-text-subtle px-1 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-primary" />
                <span>Expressive Color Palette</span>
              </h4>

              <div className="grid grid-cols-7 gap-1.5">
                {M3_THEME_COLORS.map((col) => {
                  const isSelected = normalizeThemeColor(colorScheme) === col.id;
                  return (
                    <button
                      key={col.id}
                      onClick={() => onSelectColorScheme?.(col.id)}
                      title={col.name}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform active:scale-90 border cursor-pointer ${
                        isSelected ? 'ring-2 ring-primary border-white shadow-md scale-105' : 'border-border'
                      }`}
                      style={{ backgroundColor: col.hex }}
                    >
                      {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions: Dark Mode, Lock, Backup, Logout */}
          <div className="pt-4 border-t border-border space-y-2 mt-6">
            <div className="grid grid-cols-2 gap-2">
              {onToggleThemeMode && (
                <button
                  onClick={onToggleThemeMode}
                  className="p-3 rounded-2xl border border-border bg-surface-2 hover:bg-border text-text text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {isLight ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-warning" />}
                  <span>{isLight ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  runAction('lock_app');
                }}
                className="p-3 rounded-2xl border border-border bg-surface-2 hover:bg-border text-text text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Lock className="w-4 h-4 text-danger" />
                <span>Lock PIN</span>
              </button>
            </div>

            {onLogout && (
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full p-3 rounded-2xl border border-danger/30 bg-danger-container/40 text-on-danger-container text-xs font-bold flex items-center justify-center gap-2 hover:bg-danger-container cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({currentUser?.username})</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
