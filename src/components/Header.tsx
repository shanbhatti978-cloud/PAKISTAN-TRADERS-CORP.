import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Lock,
  Unlock,
  Store,
  Boxes,
  FileSpreadsheet,
  ArrowLeft,
  Users,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';
import { ShopSettings, StockItem, Agreement, Customer, Payment, User } from '../types';
import { NavTabId } from '../config/navigation';
import { GLASS_THEMES, migrateColorScheme } from '../theme/glassThemes';
import { PermissionManager } from '../utils/permissionManager';
import { ExpandableSearch } from './ExpandableSearch';

interface HeaderProps {
  settings: ShopSettings;
  currentUser?: User;
  onOpenUserLogin?: () => void;
  activeTab?: string;
  onBackToDashboard?: () => void;
  onOpenNewAgreement: () => void;
  onOpenNewPayment: () => void;
  onOpenReceiveStock: () => void;
  onOpenBusinessReport: () => void;
  onToggleDrawer: (side?: 'left' | 'right') => void;
  onToggleLock: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  todayCollectionTotal: number;
  stock?: StockItem[];
  agreements?: Agreement[];
  customers?: Customer[];
  payments?: Payment[];
  onNavigateTab?: (tab: NavTabId) => void;
  themeMode?: 'dark' | 'light';
  onToggleThemeMode?: () => void;
  colorScheme?: string;
  onSelectColorScheme?: (scheme: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  onOpenUserLogin,
  activeTab = 'dashboard',
  onBackToDashboard,
  onToggleDrawer,
  onToggleLock,
  searchQuery,
  setSearchQuery,
  stock = [],
  agreements = [],
  customers = [],
  onNavigateTab,
  themeMode = 'dark',
  onToggleThemeMode,
  colorScheme = 'aurora',
  onSelectColorScheme,
}) => {
  const isNotDashboard = activeTab !== 'dashboard';
  const isLight = themeMode === 'light';
  const [showPaletteMenu, setShowPaletteMenu] = useState(false);
  const paletteContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paletteContainerRef.current && !paletteContainerRef.current.contains(event.target as Node)) {
        setShowPaletteMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live search matches across all system databases
  const cleanQ = searchQuery.trim().toLowerCase();
  const hasQuery = cleanQ.length > 0;

  const matchingStock = hasQuery
    ? stock.filter(
        (s) =>
          s.name.toLowerCase().includes(cleanQ) ||
          s.brand.toLowerCase().includes(cleanQ) ||
          s.model.toLowerCase().includes(cleanQ) ||
          s.serialNumber.toLowerCase().includes(cleanQ) ||
          s.category.toLowerCase().includes(cleanQ) ||
          (s.counterLocation || '').toLowerCase().includes(cleanQ)
      ).slice(0, 4)
    : [];

  const matchingAgreements = hasQuery
    ? agreements.filter((a) => {
        const cust = customers.find((c) => c.id === a.customerId);
        return (
          a.agreementNumber.toLowerCase().includes(cleanQ) ||
          a.itemName.toLowerCase().includes(cleanQ) ||
          a.itemSerial.toLowerCase().includes(cleanQ) ||
          (cust?.fullName || '').toLowerCase().includes(cleanQ) ||
          (cust?.cnic || '').includes(cleanQ) ||
          (cust?.phone || '').includes(cleanQ)
        );
      }).slice(0, 4)
    : [];

  const matchingCustomers = hasQuery
    ? customers.filter(
        (c) =>
          c.fullName.toLowerCase().includes(cleanQ) ||
          c.phone.includes(cleanQ) ||
          (c.altPhone && c.altPhone.includes(cleanQ)) ||
          c.cnic.includes(cleanQ) ||
          c.city.toLowerCase().includes(cleanQ) ||
          c.guarantor1.name.toLowerCase().includes(cleanQ)
      ).slice(0, 4)
    : [];

  const totalResultsCount = matchingStock.length + matchingAgreements.length + matchingCustomers.length;

  const handleSelectResult = (tab: NavTabId, close: () => void) => {
    close();
    onNavigateTab?.(tab);
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md border-b px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 transition-colors duration-200" style={{ backgroundColor: 'var(--theme-appbar-bg)', borderColor: 'var(--theme-surface-border)' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left Zone: Menu Drawer Trigger + Brand Wordmark Title + Physical Back Button */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Drawer Menu Hamburger Button */}
          <button
            onClick={() => onToggleDrawer('left')}
            title="Open Navigation Menu Drawer"
            aria-label="Open Navigation Menu Drawer"
            className="p-2 sm:p-2.5 rounded-xl border transition-all duration-200 shadow-sm flex items-center justify-center active:scale-95 shrink-0 cursor-pointer"
            style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)', color: 'var(--theme-primary)' }}
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </button>

          {/* PHYSICAL BACK BUTTON: Visible when on any screen other than Dashboard */}
          {isNotDashboard && onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              title="Return to Home Dashboard"
              className="m3-btn-base m3-btn-filled text-xs py-1.5 px-2.5 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="font-heading hidden xs:inline">Dashboard</span>
            </button>
          )}

          {/* PAKISTAN TRADERS CORP. BRAND TITLE */}
          <div className="flex items-center gap-2 min-w-0">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onBackToDashboard?.(); }}
              className="flex flex-col hover:opacity-85 transition-opacity leading-none"
            >
              <span className="text-xs sm:text-sm font-black tracking-tight font-heading uppercase truncate" style={{ color: 'var(--theme-text-primary)' }}>
                PAKISTAN
              </span>
              <span className="text-xs sm:text-sm font-black tracking-tight font-heading uppercase truncate" style={{ color: 'var(--theme-primary)' }}>
                TRADERS CORP.
              </span>
            </a>
          </div>
        </div>

        {/* Right Zone: Global Expandable Search (Icon First) + User Badge + Theme Palette + Dark Mode + Lock */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Global Search Icon-First Expandable Component */}
          <ExpandableSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search all records..."
            recentKey="GLOBAL"
            shortcut="/"
            ariaLabel="Global Search"
            resultCount={hasQuery ? totalResultsCount : undefined}
            isGlobal={true}
            renderResultsPanel={(close) => (
              hasQuery ? (
                <div className="absolute top-full left-0 right-0 mt-2 m3-card overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[80vh] overflow-y-auto shadow-2xl border border-border bg-surface/98 backdrop-blur-xl">
                  <div className="px-3.5 py-2.5 border-b flex items-center justify-between text-caption" style={{ borderColor: 'var(--theme-surface-border)' }}>
                    <span className="font-bold text-text">
                      Results for: <span style={{ color: 'var(--theme-primary)' }}>"{searchQuery}"</span>
                    </span>
                    <span className="text-caption font-mono-tabular font-bold px-2 py-0.5 rounded-full border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                      {totalResultsCount} Matches Found
                    </span>
                  </div>

                  {totalResultsCount === 0 ? (
                    <div className="p-6 text-center text-body-sm space-y-2">
                      <p className="font-bold text-text">No records match "{searchQuery}"</p>
                      <p className="text-text-muted text-caption font-medium">
                        Try searching by Customer Name, Mobile #, CNIC, Product Model, or Agreement ID.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y text-body-sm" style={{ borderColor: 'var(--theme-surface-border)' }}>
                      {/* Category 1: Master Inventory */}
                      {matchingStock.length > 0 && (
                        <div className="p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between px-2 text-caption font-bold" style={{ color: 'var(--theme-primary)' }}>
                            <span className="flex items-center gap-1.5">
                              <Boxes className="w-4 h-4" />
                              <span>Master Inventory ({matchingStock.length})</span>
                            </span>
                            <button
                              onClick={() => handleSelectResult('stock', close)}
                              className="text-caption hover:underline font-semibold cursor-pointer"
                              style={{ color: 'var(--theme-primary)' }}
                            >
                              View in Inventory →
                            </button>
                          </div>
                          {matchingStock.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleSelectResult('stock', close)}
                              className="p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 border hover:border-primary/50 bg-surface-2"
                              style={{ borderColor: 'var(--theme-surface-border)' }}
                            >
                              <div>
                                <div className="font-bold flex items-center gap-2 text-body-sm text-text">
                                  <span>{item.name}</span>
                                  <span className="text-caption px-2 py-0.5 rounded font-mono-tabular border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                                    {item.serialNumber ? `S/N: ${item.serialNumber}` : item.category}
                                  </span>
                                </div>
                                <div className="text-caption text-text-muted mt-0.5 font-medium">
                                  Model: {item.model || 'Standard'} | Price: {settings.currencySymbol} {item.instalmentPrice.toLocaleString()}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-caption font-bold px-2 py-0.5 rounded-full border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                                  {item.inStock > 0 ? `${item.inStock} Available` : 'Sold'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Category 2: Dispatches & Agreements */}
                      {matchingAgreements.length > 0 && (
                        <div className="p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between px-2 text-caption font-bold" style={{ color: 'var(--theme-primary)' }}>
                            <span className="flex items-center gap-1.5">
                              <FileSpreadsheet className="w-4 h-4" />
                              <span>Dispatches & Agreements ({matchingAgreements.length})</span>
                            </span>
                            <button
                              onClick={() => handleSelectResult('agreements', close)}
                              className="text-caption hover:underline font-semibold cursor-pointer"
                              style={{ color: 'var(--theme-primary)' }}
                            >
                              View in Sales →
                            </button>
                          </div>
                          {matchingAgreements.map((agr) => {
                            const cust = customers.find((c) => c.id === agr.customerId);
                            return (
                              <div
                                key={agr.id}
                                onClick={() => handleSelectResult('agreements', close)}
                                className="p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 border hover:border-primary/50 bg-surface-2"
                                style={{ borderColor: 'var(--theme-surface-border)' }}
                              >
                                <div>
                                  <div className="font-bold flex items-center gap-2 text-body-sm text-text">
                                    <span className="font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>{agr.agreementNumber}</span>
                                    <span>{agr.itemName}</span>
                                  </div>
                                  <div className="text-caption text-text-muted mt-0.5 font-medium">
                                    Customer: <strong className="text-text">{cust?.fullName || 'N/A'}</strong> (Phone: {cust?.phone || 'N/A'})
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-body-sm font-extrabold font-mono-tabular block" style={{ color: 'var(--theme-primary)' }}>
                                    Bal: {settings.currencySymbol} {agr.remainingBalance.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Category 3: Customers Directory */}
                      {matchingCustomers.length > 0 && (
                        <div className="p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between px-2 text-caption font-bold" style={{ color: 'var(--theme-primary)' }}>
                            <span className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              <span>Customers & Guarantors ({matchingCustomers.length})</span>
                            </span>
                            <button
                              onClick={() => handleSelectResult('customers', close)}
                              className="text-caption hover:underline font-semibold cursor-pointer"
                              style={{ color: 'var(--theme-primary)' }}
                            >
                              View in Customers →
                            </button>
                          </div>
                          {matchingCustomers.map((cust) => (
                            <div
                              key={cust.id}
                              onClick={() => handleSelectResult('customers', close)}
                              className="p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 border hover:border-primary/50 bg-surface-2"
                              style={{ borderColor: 'var(--theme-surface-border)' }}
                            >
                              <div>
                                <div className="font-bold flex items-center gap-2 text-body-sm text-text">
                                  <span>{cust.fullName}</span>
                                  <span className="text-caption px-2 py-0.5 rounded font-mono-tabular border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                                    {cust.customerCode || 'CUST'}
                                  </span>
                                </div>
                                <div className="text-caption text-text-muted mt-0.5 font-medium">
                                  Phone: <strong className="text-text">{cust.phone}</strong> | CNIC: {cust.cnic}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null
            )}
          />

          {/* LOGGED-IN USER & ROLE BADGE BUTTON */}
          {currentUser && (
            <button
              onClick={onOpenUserLogin}
              title={`Logged in as ${currentUser.fullName} (${currentUser.role}). Click to switch user / role.`}
              className="p-1.5 sm:p-2 rounded-xl text-body-sm font-semibold transition-all border flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
              style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-caption uppercase hidden sm:inline text-text">
                  {currentUser.username}
                </span>
              </div>

              {(() => {
                const roleBadge = PermissionManager.getRoleBadgeStyle(currentUser.role);
                return (
                  <span className={`px-2 py-0.5 rounded-full text-caption font-black border uppercase tracking-wider font-mono-tabular ${roleBadge.badgeClass}`}>
                    {roleBadge.label}
                  </span>
                );
              })()}
            </button>
          )}

          {/* Theme Color Selector Button */}
          <div ref={paletteContainerRef} className="relative">
            <button
              onClick={() => setShowPaletteMenu(!showPaletteMenu)}
              title="Theme Color Selection"
              className="p-2 rounded-xl text-body-sm font-semibold transition-all border flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)', color: 'var(--theme-text-primary)' }}
            >
              <Palette className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
            </button>

            {/* Palette Dropdown Popover */}
            {showPaletteMenu && (
              <div className="absolute top-full right-0 mt-2 w-72 p-3 rounded-2xl shadow-2xl border z-50 glass-strong animate-in fade-in zoom-in-95 duration-150">
                <div className="text-caption font-bold uppercase tracking-wider text-text-muted px-2 pb-2 border-b border-border/80 mb-2 flex items-center justify-between">
                  <span>Glass Material Themes</span>
                  <span className="text-caption font-mono text-primary font-bold">8 Materials</span>
                </div>
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {Object.values(GLASS_THEMES).map((theme) => {
                    const isSelected = migrateColorScheme(colorScheme) === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => {
                          onSelectColorScheme?.(theme.id);
                          setShowPaletteMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-body-sm transition-colors text-left cursor-pointer ${
                          isSelected
                            ? 'bg-primary/15 text-primary font-bold border border-primary/30'
                            : 'text-text hover:bg-surface/80 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-5 h-5 rounded-full shadow-inner ring-1 ring-black/10 shrink-0"
                            style={{ background: theme.preview.primary }}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-caption leading-tight text-text truncate">
                              {theme.name}
                            </div>
                            <div className="text-caption text-text-muted font-medium leading-tight truncate">
                              {theme.subtitle}
                            </div>
                          </div>
                        </div>
                        {isSelected && <span className="text-caption font-bold shrink-0 ml-1 text-primary">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Material 3 Light / Dark Mode Toggle Button */}
          {onToggleThemeMode && (
            <button
              onClick={onToggleThemeMode}
              title={isLight ? 'Switch to Material 3 Dark Mode' : 'Switch to Material 3 Light Mode'}
              className="p-2 rounded-xl text-body-sm font-semibold transition-all border flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
              style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)', color: 'var(--theme-primary)' }}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          )}

          {/* Lock status button */}
          <button
            onClick={onToggleLock}
            className="p-2 rounded-xl text-body-sm font-semibold transition-all border flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
            style={{
              backgroundColor: settings.isLocked ? 'rgba(220, 38, 38, 0.15)' : 'var(--theme-surface-card)',
              borderColor: settings.isLocked ? 'rgba(220, 38, 38, 0.35)' : 'var(--theme-surface-border)',
              color: settings.isLocked ? '#DC2626' : 'var(--theme-text-primary)',
            }}
          >
            {settings.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </header>
  );
};
