import React from 'react';
import {
  X,
  Sun,
  Moon,
  Lock,
  Unlock,
  LogOut,
  Shield,
  Palette,
  ChevronRight,
  Users,
  BookOpen,
  FileSpreadsheet,
  Activity,
  Sparkles,
  Settings,
  LucideIcon,
} from 'lucide-react';
import { NavTabId, getVisibleNavItems } from '../config/navigation';
import { User, ShopSettings } from '../types';
import { PermissionManager } from '../utils/permissionManager';
import { GLASS_THEMES, GlassThemeId, migrateColorScheme } from '../theme/glassThemes';
import { useAppActions } from '../context/AppActionsContext';
import { SideDrawer } from './SideDrawer';

interface MoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  currentUser?: User;
  settings: ShopSettings;
  side?: 'left' | 'right';
  themeMode?: 'dark' | 'light';
  onToggleThemeMode?: () => void;
  colorScheme?: string;
  onSelectColorScheme?: (scheme: string) => void;
  onOpenUserLogin?: () => void;
  onLogout?: () => void;
  onOpenAppearance?: () => void;
  onToggleLock?: () => void;
}

/** Mapping of navigation destination ids to fixed theme icon-tile tokens */
const DESTINATION_ICON_TOKENS: Record<string, string> = {
  customers: 'var(--drawer-icon-1, var(--primary))',
  cashbook: 'var(--drawer-icon-2, var(--accent))',
  reports: 'var(--drawer-icon-3, var(--chart-a))',
  business_report: 'var(--drawer-icon-4, var(--chart-b))',
  ledger: 'var(--drawer-icon-5, var(--chart-c))',
  ai: 'var(--drawer-icon-6, var(--chart-d))',
  settings: 'var(--drawer-icon-neutral, var(--text-muted))',
};

export const MoreSheet: React.FC<MoreSheetProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  currentUser,
  settings,
  side = 'left',
  themeMode = 'dark',
  onToggleThemeMode,
  colorScheme = 'aurora',
  onSelectColorScheme,
  onOpenUserLogin,
  onLogout,
  onToggleLock,
}) => {
  const { runAction } = useAppActions();
  const isLight = themeMode === 'light';

  const role = currentUser?.role || 'VIEWER';
  const roleBadge = PermissionManager.getRoleBadgeStyle(role);
  const secondaryItems = getVisibleNavItems(role).filter((item) => item.inMoreSheet);
  const currentGlassId = migrateColorScheme(colorScheme);

  // Determine drawer side: respect setting preference if set, otherwise auto (trigger side)
  const resolvedSide: 'left' | 'right' =
    settings.drawerSide === 'left' || settings.drawerSide === 'right'
      ? settings.drawerSide
      : side;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      side={resolvedSide}
      title="Navigation & System Tools"
    >
      <div className="space-y-4">
        {/* Profile Card with Primary-to-Accent Gradient Avatar Ring */}
        <div
          className="p-4 rounded-2xl border transition-colors duration-250 flex items-center justify-between"
          style={{
            backgroundColor: 'var(--drawer-group, rgba(255, 255, 255, 0.05))',
            borderColor: 'var(--drawer-divider, var(--border))',
          }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar with Conic/Linear Gradient Ring */}
            <div
              className="p-0.5 rounded-2xl shrink-0 shadow-sm transition-all duration-250"
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              }}
            >
              <div
                className="w-11 h-11 rounded-[14px] flex items-center justify-center font-black font-heading text-base text-on-primary transition-colors duration-250"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {currentUser?.fullName?.[0] || 'U'}
              </div>
            </div>

            <div className="min-w-0">
              <h3 className="font-extrabold text-base font-heading text-text truncate">
                {currentUser?.fullName || 'User Profile'}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-caption font-black border uppercase tracking-wider font-mono-tabular ${roleBadge.badgeClass}`}
                >
                  {roleBadge.label}
                </span>
                <span className="text-caption text-text-muted font-mono truncate font-medium">
                  @{currentUser?.username || 'user'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close menu drawer"
            className="p-2 rounded-full border transition-all duration-250 hover:opacity-80 active:scale-95 shrink-0"
            style={{
              backgroundColor: 'var(--drawer-group, var(--surface))',
              borderColor: 'var(--drawer-divider, var(--border))',
              color: 'var(--text-muted)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Account Switch Button */}
        {onOpenUserLogin && (
          <button
            onClick={() => {
              onClose();
              onOpenUserLogin();
            }}
            className="w-full p-3.5 rounded-2xl border transition-all duration-250 flex items-center justify-between text-body-sm font-bold active:scale-98 cursor-pointer"
            style={{
              backgroundColor: 'var(--drawer-group, rgba(255, 255, 255, 0.05))',
              borderColor: 'var(--drawer-divider, var(--border))',
              color: 'var(--text)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-primary shrink-0" />
              <span>Switch Account / Credentials</span>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
          </button>
        )}

        {/* Inset Grouped Modules List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-caption font-heading font-extrabold uppercase tracking-wider text-text-muted">
              System Modules
            </h4>
            <span className="text-caption font-mono text-text-muted">
              {secondaryItems.length} destinations
            </span>
          </div>

          <div
            className="rounded-2xl border overflow-hidden transition-colors duration-250 divide-y"
            style={{
              backgroundColor: 'var(--drawer-group, rgba(255, 255, 255, 0.05))',
              borderColor: 'var(--drawer-divider, var(--border))',
            }}
          >
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const tileToken = DESTINATION_ICON_TOKENS[item.id] || 'var(--primary)';

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`w-full p-3 flex items-center justify-between text-left cursor-pointer transition-colors duration-200 active:bg-[var(--drawer-row-press)] min-h-[52px] ${
                    isActive ? 'font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: isActive
                      ? 'var(--drawer-row-press, rgba(91, 75, 196, 0.14))'
                      : undefined,
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Icon Tile with Theme-derived Soft Gradient */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-all duration-250 text-white"
                      style={{
                        background: `linear-gradient(145deg, color-mix(in srgb, ${tileToken} 88%, white), ${tileToken})`,
                      }}
                    >
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-body font-semibold font-heading truncate text-text">
                        {item.label}
                      </div>
                      <div className="text-caption text-text-muted truncate font-medium">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className="w-4 h-4 shrink-0 transition-colors duration-250 text-text-muted"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Glass Material Themes Preview & Live Swatches */}
        <div className="space-y-2 pt-2 border-t border-border/70">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-caption font-heading font-extrabold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-primary" />
              <span>Glass Materials</span>
            </h4>
            <button
              onClick={() => {
                setActiveTab('settings');
                onClose();
              }}
              className="text-caption text-primary hover:underline font-bold transition-colors"
            >
              All Options →
            </button>
          </div>

          {/* 8 Theme Swatches Grid with Cross-Fade */}
          <div className="grid grid-cols-4 gap-2">
            {Object.values(GLASS_THEMES).map((theme) => {
              const isSelected = currentGlassId === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => onSelectColorScheme?.(theme.id)}
                  title={`${theme.name} - ${theme.description}`}
                  className="p-2 rounded-xl border transition-all duration-200 text-center flex flex-col items-center gap-1 active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--drawer-group, var(--surface))'
                      : 'transparent',
                    borderColor: isSelected
                      ? 'var(--primary)'
                      : 'var(--drawer-divider, var(--border))',
                    boxShadow: isSelected
                      ? '0 0 0 2px var(--primary)'
                      : 'none',
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full shadow-inner ring-1 ring-black/10 flex items-center justify-center text-caption text-white font-black"
                    style={{ background: theme.preview.primary }}
                  >
                    {isSelected && '✓'}
                  </div>
                  <span className="text-caption text-text truncate max-w-full leading-tight font-semibold">
                    {theme.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Controls: Segmented Dark/Light Toggle, Lock PIN, Sign Out */}
      <div className="pt-3 border-t border-border/70 space-y-2.5 mt-4">
        {/* Segmented Control for Mode Switch */}
        {onToggleThemeMode && (
          <div
            className="p-1 rounded-2xl border flex items-center transition-colors duration-250"
            style={{
              backgroundColor: 'var(--drawer-group, rgba(255, 255, 255, 0.05))',
              borderColor: 'var(--drawer-divider, var(--border))',
            }}
          >
            <button
              type="button"
              onClick={onToggleThemeMode}
              className={`flex-1 py-2 px-3 rounded-xl text-body-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer min-h-[44px] ${
                isLight ? 'shadow-xs' : 'text-text-muted hover:text-text'
              }`}
              style={{
                backgroundColor: isLight ? 'var(--drawer-segmented-thumb, var(--surface))' : 'transparent',
                color: isLight ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              <Sun className="w-4 h-4 text-warning" />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={onToggleThemeMode}
              className={`flex-1 py-2 px-3 rounded-xl text-body-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer min-h-[44px] ${
                !isLight ? 'shadow-xs' : 'text-text-muted hover:text-text'
              }`}
              style={{
                backgroundColor: !isLight ? 'var(--drawer-segmented-thumb, var(--surface))' : 'transparent',
                color: !isLight ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              <Moon className="w-4 h-4 text-primary" />
              <span>Dark</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onToggleLock?.();
            }}
            className="p-3 rounded-2xl border text-body-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-98 min-h-[48px]"
            style={{
              backgroundColor: settings.isLocked ? 'rgba(220, 38, 38, 0.15)' : 'var(--drawer-group, var(--surface))',
              borderColor: settings.isLocked ? 'rgba(220, 38, 38, 0.35)' : 'var(--drawer-divider, var(--border))',
              color: settings.isLocked ? '#DC2626' : 'var(--text)',
            }}
          >
            {settings.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span>{settings.isLocked ? 'Locked' : 'Unlock / Lock'}</span>
          </button>

          {onLogout && (
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="p-3 rounded-2xl border border-danger/30 bg-danger-container/40 text-on-danger-container text-body-sm font-bold flex items-center justify-center gap-2 hover:bg-danger-container/60 cursor-pointer transition-all duration-200 active:scale-98 min-h-[48px]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </SideDrawer>
  );
};
