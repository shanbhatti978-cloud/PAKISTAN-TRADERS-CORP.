import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Shield,
  Plus,
  Lock,
  Unlock,
  Search,
  TrendingUp,
  Store,
  Boxes,
  FileSpreadsheet,
  ArrowLeft,
  X,
  FileText,
  Users,
  BadgeDollarSign,
  ChevronRight,
  Package,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';
import { ShopSettings, StockItem, Agreement, Customer, Payment, User } from '../types';
import { TabType } from './Navigation';
import { M3_PALETTES, M3_THEME_COLORS, normalizeThemeColor, M3ColorSchemeName } from '../theme/m3Theme';
import { PermissionManager } from '../utils/permissionManager';

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
  onToggleDrawer: () => void;
  onToggleLock: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  todayCollectionTotal: number;
  stock?: StockItem[];
  agreements?: Agreement[];
  customers?: Customer[];
  payments?: Payment[];
  onNavigateTab?: (tab: TabType) => void;
  themeMode?: 'dark' | 'light';
  onToggleThemeMode?: () => void;
  colorScheme?: M3ColorSchemeName;
  onSelectColorScheme?: (scheme: M3ColorSchemeName) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  onOpenUserLogin,
  activeTab = 'dashboard',
  onBackToDashboard,
  onOpenNewAgreement,
  onOpenNewPayment,
  onOpenReceiveStock,
  onOpenBusinessReport,
  onToggleDrawer,
  onToggleLock,
  searchQuery,
  setSearchQuery,
  todayCollectionTotal,
  stock = [],
  agreements = [],
  customers = [],
  onNavigateTab,
  themeMode = 'dark',
  onToggleThemeMode,
  colorScheme = 'expressive',
  onSelectColorScheme,
}) => {
  const isNotDashboard = activeTab !== 'dashboard';
  const isLight = themeMode === 'light';
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showPaletteMenu, setShowPaletteMenu] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const paletteContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
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

  const handleSelectResult = (tab: TabType) => {
    setShowSearchDropdown(false);
    onNavigateTab?.(tab);
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md border-b px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 transition-colors duration-200" style={{ backgroundColor: 'var(--theme-appbar-bg)', borderColor: 'var(--theme-surface-border)' }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Zone 1: Menu Drawer Trigger + Brand Wordmark Title + Physical Back Button */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2.5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Drawer Menu Hamburger Button */}
            <button
              onClick={onToggleDrawer}
              title="Open Navigation Menu Drawer"
              aria-label="Open Navigation Menu Drawer"
              className="p-2 sm:p-2.5 rounded-xl border transition-all duration-200 shadow-sm flex items-center justify-center active:scale-95 shrink-0"
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
            <div className="flex items-center gap-2">
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); onBackToDashboard?.(); }}
                className="flex flex-col hover:opacity-85 transition-opacity leading-none"
              >
                <span className="text-xs sm:text-sm font-black tracking-tight font-heading uppercase" style={{ color: 'var(--theme-text-primary)' }}>
                  PAKISTAN
                </span>
                <span className="text-xs sm:text-sm font-black tracking-tight font-heading uppercase" style={{ color: 'var(--theme-primary)' }}>
                  TRADERS CORP.
                </span>
              </a>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* LOGGED-IN USER & ROLE BADGE BUTTON */}
            {currentUser && (
              <button
                onClick={onOpenUserLogin}
                title={`Logged in as ${currentUser.fullName} (${currentUser.role}). Click to switch user / role.`}
                className="p-1.5 sm:p-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 active:scale-95 cursor-pointer shadow-xs"
                style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-xs uppercase hidden sm:inline text-slate-900 dark:text-white">
                    {currentUser.username}
                  </span>
                </div>

                {(() => {
                  const roleBadge = PermissionManager.getRoleBadgeStyle(currentUser.role);
                  return (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider font-mono-tabular ${roleBadge.badgeClass}`}>
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
                className="p-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)', color: 'var(--theme-text-primary)' }}
              >
                <Palette className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                <span className="hidden sm:inline text-[11px] font-semibold">Theme</span>
              </button>

              {/* Palette Dropdown Popover */}
              {showPaletteMenu && (
                <div className="absolute top-full right-0 mt-2 w-64 p-2.5 rounded-2xl shadow-2xl border z-50 animate-in fade-in zoom-in-95 duration-150" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 pb-1.5 border-b mb-1.5" style={{ borderColor: 'var(--theme-surface-border)' }}>
                    Select Theme Color
                  </div>
                  <div className="space-y-1">
                    {M3_THEME_COLORS.map((col) => {
                      const isSelected = normalizeThemeColor(colorScheme) === col.id;
                      return (
                        <button
                          key={col.id}
                          onClick={() => {
                            onSelectColorScheme?.(col.id);
                            setShowPaletteMenu(false);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors text-left"
                          style={{
                            backgroundColor: isSelected ? 'var(--theme-tonal-bg)' : 'transparent',
                            color: isSelected ? 'var(--theme-primary)' : 'var(--theme-text-primary)',
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-4 h-4 rounded-full shadow-sm ring-1 ring-black/10 shrink-0" style={{ backgroundColor: col.hex }} />
                            <div>
                              <div className="font-semibold text-[11px] leading-tight" style={{ color: isSelected ? 'var(--theme-primary)' : 'var(--theme-text-primary)' }}>{col.name}</div>
                              <div className="text-[9px] text-slate-400 font-normal leading-tight">{col.description}</div>
                            </div>
                          </div>
                          {isSelected && <span className="text-[11px] font-bold shrink-0 ml-1">✓</span>}
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
                className="p-2 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center"
                style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)', color: 'var(--theme-primary)' }}
              >
                {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            )}

            {/* Lock status button */}
            <button
              onClick={onToggleLock}
              className="p-2 rounded-xl text-xs font-semibold transition-all border"
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

        {/* Zone 2: Global Instant Search Bar & Dropdown Results Popover */}
        <div ref={searchContainerRef} className="w-full md:w-96 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Customer, Mobile, CNIC, Stock, Serial or AGR #..."
            value={searchQuery}
            onFocus={() => {
              if (hasQuery) setShowSearchDropdown(true);
            }}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            className="m3-input pl-9 pr-8"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchDropdown(false);
              }}
              title="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Instant Live Search Results Popover */}
          {showSearchDropdown && hasQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 m3-card overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[80vh] overflow-y-auto">
              <div className="px-3.5 py-2 border-b flex items-center justify-between text-xs" style={{ borderColor: 'var(--theme-surface-border)' }}>
                <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  Search Results for: <span style={{ color: 'var(--theme-primary)' }}>"{searchQuery}"</span>
                </span>
                <span className="text-[10px] font-mono-tabular font-bold px-2 py-0.5 rounded-full border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                  {totalResultsCount} Matches Found
                </span>
              </div>

              {totalResultsCount === 0 ? (
                <div className="p-6 text-center text-xs space-y-2">
                  <p className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>No records match "{searchQuery}"</p>
                  <p className="text-slate-400 text-[11px]">
                    Try searching by Customer Name, Mobile #, CNIC, Product Model, or Agreement ID.
                  </p>
                </div>
              ) : (
                <div className="divide-y text-xs" style={{ borderColor: 'var(--theme-surface-border)' }}>
                  {/* Category 1: Master Inventory */}
                  {matchingStock.length > 0 && (
                    <div className="p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>
                        <span className="flex items-center gap-1.5">
                          <Boxes className="w-3.5 h-3.5" />
                          <span>Master Inventory ({matchingStock.length})</span>
                        </span>
                        <button
                          onClick={() => handleSelectResult('stock')}
                          className="text-[10px] hover:underline font-semibold"
                          style={{ color: 'var(--theme-primary)' }}
                        >
                          View in Inventory →
                        </button>
                      </div>
                      {matchingStock.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectResult('stock')}
                          className="p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 border hover:border-current"
                          style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}
                        >
                          <div>
                            <div className="font-bold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                              <span>{item.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono-tabular border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                                {item.serialNumber ? `S/N: ${item.serialNumber}` : item.category}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Model: {item.model || 'Standard'} | Price: {settings.currencySymbol} {item.instalmentPrice.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
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
                      <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>
                        <span className="flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Dispatches & Agreements ({matchingAgreements.length})</span>
                        </span>
                        <button
                          onClick={() => handleSelectResult('agreements')}
                          className="text-[10px] hover:underline font-semibold"
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
                            onClick={() => handleSelectResult('agreements')}
                            className="p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 border hover:border-current"
                            style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}
                          >
                            <div>
                              <div className="font-bold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                                <span className="font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>{agr.agreementNumber}</span>
                                <span>{agr.itemName}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Customer: <strong>{cust?.fullName || 'N/A'}</strong> (Phone: {cust?.phone || 'N/A'})
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[11px] font-extrabold font-mono-tabular block" style={{ color: 'var(--theme-primary)' }}>
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
                      <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>Customers & Guarantors ({matchingCustomers.length})</span>
                        </span>
                        <button
                          onClick={() => handleSelectResult('customers')}
                          className="text-[10px] hover:underline font-semibold"
                          style={{ color: 'var(--theme-primary)' }}
                        >
                          View in Customers →
                        </button>
                      </div>
                      {matchingCustomers.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => handleSelectResult('customers')}
                          className="p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 border hover:border-current"
                          style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}
                        >
                          <div>
                            <div className="font-bold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                              <span>{cust.fullName}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono-tabular border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                                {cust.customerCode || 'CUST'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Phone: <strong>{cust.phone}</strong> | CNIC: {cust.cnic}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
