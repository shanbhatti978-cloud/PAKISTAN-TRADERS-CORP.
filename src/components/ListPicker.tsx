import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  X,
  Check,
  User,
  Package,
  FileSignature,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  Barcode,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Customer, StockItem, Agreement, CustomerRating } from '../types';
import { ExpandableSearch } from './ExpandableSearch';

export type PickerItemType = 'customer' | 'stock' | 'agreement' | 'generic';

export interface ListPickerProps<T> {
  type: PickerItemType;
  items: T[];
  selectedId?: string;
  onSelect: (item: T) => void;
  title?: string;
  placeholder?: string;
  currencySymbol?: string;
  onAddNew?: () => void;
  addNewLabel?: string;
  autoFocusSearch?: boolean;
  className?: string;
  maxHeight?: string;
  /** When true, shows compact selected summary card with a 'Change' button */
  showSelectedSummary?: boolean;
}

/** Highlights text substring matching queries */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim() || !text) return <span>{text}</span>;

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) return <span>{text}</span>;

  const regex = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-primary/25 text-primary font-bold rounded-xs px-1"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export function ListPicker<T extends { id: string }>({
  type,
  items,
  selectedId,
  onSelect,
  title,
  placeholder,
  currencySymbol = 'Rs',
  onAddNew,
  addNewLabel,
  autoFocusSearch = false,
  className = '',
  maxHeight = 'max-h-[380px]',
  showSelectedSummary = true,
}: ListPickerProps<T>) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [pageLimit, setPageLimit] = useState(25);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isChangingSelection, setIsChangingSelection] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounce search query by 200ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
      setPageLimit(25); // reset pagination on search
    }, 200);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Find currently selected item
  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    return items.find((i) => i.id === selectedId) || null;
  }, [items, selectedId]);

  // Precompute searchable lowercase haystack for multi-word search
  const indexedItems = useMemo(() => {
    return items.map((item) => {
      let haystack = '';
      if (type === 'customer') {
        const c = item as unknown as Customer;
        const cnicDigits = (c.cnic || '').replace(/\D/g, '');
        const phoneDigits = (c.phone || '').replace(/\D/g, '');
        haystack = `${c.fullName || ''} ${c.customerCode || ''} ${c.cnic || ''} ${cnicDigits} ${c.phone || ''} ${phoneDigits} ${c.city || ''} ${c.guarantor1?.name || ''}`.toLowerCase();
      } else if (type === 'stock') {
        const s = item as unknown as StockItem;
        haystack = `${s.name || ''} ${s.brand || ''} ${s.model || ''} ${s.serialNumber || ''} ${s.category || ''}`.toLowerCase();
      } else if (type === 'agreement') {
        const a = item as unknown as Agreement;
        const custName = (a as any).customerName || '';
        const custCnic = (a as any).customerCnic || '';
        const custPhone = (a as any).customerPhone || '';
        const cnicDigits = custCnic.replace(/\D/g, '');
        const phoneDigits = custPhone.replace(/\D/g, '');
        haystack = `${a.agreementNumber || ''} ${a.customerCode || ''} ${custName} ${custCnic} ${cnicDigits} ${custPhone} ${phoneDigits} ${a.itemName || ''}`.toLowerCase();
      } else {
        haystack = JSON.stringify(item).toLowerCase();
      }
      return { item, haystack };
    });
  }, [items, type]);

  // Available categories for Stock filter chips
  const stockCategories = useMemo(() => {
    if (type !== 'stock') return [];
    const set = new Set<string>();
    items.forEach((item) => {
      const s = item as unknown as StockItem;
      if (s.category) set.add(s.category);
    });
    return Array.from(set).slice(0, 6);
  }, [items, type]);

  // Filter items by search terms and chips
  const filteredItems = useMemo(() => {
    const terms = debouncedQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    return indexedItems
      .filter(({ item, haystack }) => {
        // Multi-word matching in any order
        if (terms.length > 0) {
          const matchesAllTerms = terms.every((term) => haystack.includes(term));
          if (!matchesAllTerms) return false;
        }

        // Filter chips logic
        if (activeFilter === 'all') return true;

        if (type === 'customer') {
          const c = item as unknown as Customer;
          if (activeFilter === 'good') return c.rating === 'good';
          if (activeFilter === 'watch') return c.rating === 'watch';
          if (activeFilter === 'defaulter') return c.rating === 'defaulter';
        } else if (type === 'stock') {
          const s = item as unknown as StockItem;
          if (activeFilter === 'in_stock') return s.inStock > 0;
          if (activeFilter === 'low_stock') return s.inStock > 0 && s.inStock <= 2;
          if (activeFilter === 'out_of_stock') return s.inStock <= 0;
          if (s.category === activeFilter) return true;
        } else if (type === 'agreement') {
          const a = item as unknown as Agreement;
          if (activeFilter === 'active') return a.status === 'active';
          if (activeFilter === 'completed') return a.status === 'completed';
          if (activeFilter === 'defaulted') return a.status === 'defaulter';
        }

        return true;
      })
      .map(({ item }) => item);
  }, [indexedItems, debouncedQuery, activeFilter, type]);

  // Slice paginated items
  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, pageLimit);
  }, [filteredItems, pageLimit]);

  // Keyboard navigation & exact match on Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, visibleItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // If user typed exact serial / IMEI, pick it immediately
      if (type === 'stock' && searchInput.trim()) {
        const queryClean = searchInput.trim().toLowerCase();
        const exactMatch = items.find((i) => {
          const s = i as unknown as StockItem;
          return s.serialNumber && s.serialNumber.toLowerCase() === queryClean;
        });
        if (exactMatch) {
          handleSelect(exactMatch);
          return;
        }
      }

      if (visibleItems[focusedIndex]) {
        handleSelect(visibleItems[focusedIndex]);
      }
    } else if (e.key === 'Escape') {
      setSearchInput('');
      setDebouncedQuery('');
    }
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    setIsChangingSelection(false);
  };

  // If a selection is made and summary is enabled, show compact summary
  if (selectedItem && showSelectedSummary && !isChangingSelection) {
    return (
      <div className="space-y-2 animate-in fade-in duration-150">
        {title && (
          <label className="block text-body-sm font-bold text-text">
            {title}
          </label>
        )}
        <div className="m3-card p-4 border border-primary/40 bg-primary/5 flex items-center justify-between gap-3 rounded-2xl">
          <div className="flex items-center gap-3 min-w-0">
            {type === 'customer' && (
              <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 border border-primary/20">
                {((selectedItem as unknown as Customer).fullName || 'C')[0].toUpperCase()}
              </div>
            )}
            {type === 'stock' && (
              <div className="w-11 h-11 rounded-xl bg-surface-2 text-primary font-bold flex items-center justify-center shrink-0 border border-border">
                <Package className="w-5 h-5" />
              </div>
            )}
            {type === 'agreement' && (
              <div className="w-11 h-11 rounded-xl bg-surface-2 text-primary font-bold flex items-center justify-center shrink-0 border border-border">
                <FileSignature className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0">
              {type === 'customer' && (() => {
                const c = selectedItem as unknown as Customer;
                return (
                  <>
                    <div className="font-extrabold text-base text-text truncate flex items-center gap-2">
                      <span>{c.fullName}</span>
                      <span className="text-caption font-mono-tabular px-2 py-0.5 rounded bg-surface border border-border text-text-muted">
                        {c.customerCode}
                      </span>
                    </div>
                    <div className="text-body-sm text-text-muted font-mono-tabular truncate font-medium">
                      CNIC: {c.cnic} · {c.phone} ({c.city})
                    </div>
                  </>
                );
              })()}

              {type === 'stock' && (() => {
                const s = selectedItem as unknown as StockItem;
                return (
                  <>
                    <div className="font-extrabold text-base text-text truncate">
                      {s.name}
                    </div>
                    <div className="text-body-sm text-text-muted font-mono-tabular truncate font-medium">
                      {s.brand} {s.model} · Serial: {s.serialNumber || 'N/A'} · In stock: {s.inStock}
                    </div>
                  </>
                );
              })()}

              {type === 'agreement' && (() => {
                const a = selectedItem as unknown as Agreement;
                const custLabel = (a as any).customerName || a.customerCode;
                return (
                  <>
                    <div className="font-extrabold text-base text-text truncate flex items-center gap-2">
                      <span>{a.agreementNumber}</span>
                      <span className="text-text-muted font-medium">({custLabel})</span>
                    </div>
                    <div className="text-body-sm text-text-muted font-mono-tabular truncate font-medium">
                      {a.itemName} · Balance: {currencySymbol} {a.remainingBalance.toLocaleString()}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsChangingSelection(true)}
            className="m3-btn-base m3-btn-outlined px-4 py-2 text-body-sm rounded-full shrink-0 min-h-[44px]"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Title & Search row */}
      <div className="flex items-center justify-between gap-3 min-h-[44px]">
        {title && (
          <label className="block text-body-sm font-bold text-text">
            {title} <span className="text-danger">*</span>
          </label>
        )}
        {selectedItem && (
          <button
            type="button"
            onClick={() => setIsChangingSelection(false)}
            className="text-caption font-bold text-primary hover:underline"
          >
            Cancel change
          </button>
        )}

        <div className="flex items-center gap-2 ms-auto shrink-0">
          {type === 'stock' && (
            <button
              type="button"
              onClick={() => {
                // Focus will be automatic on the expandable input
                const inp = document.querySelector('input[placeholder*="stock"]');
                if (inp) {
                  (inp as HTMLInputElement).focus();
                }
              }}
              className="p-1.5 rounded-full text-text-subtle hover:text-primary hover:bg-surface-2 transition-colors shrink-0"
              title="Scan Barcode / Serial"
            >
              <Barcode className="w-5 h-5" />
            </button>
          )}

          <ExpandableSearch
            value={searchInput}
            onChange={(val) => setSearchInput(val)}
            placeholder={
              placeholder ||
              (type === 'customer'
                ? 'Search customers'
                : type === 'stock'
                ? 'Search stock'
                : 'Search agreements')
            }
            align="end"
            recentKey={`picker_${type}`}
            shortcut=""
            debounceMs={200}
            showActiveChip={false}
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-caption font-semibold">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`m3-chip ${activeFilter === 'all' ? 'm3-chip-selected' : ''}`}
        >
          All ({items.length})
        </button>

        {type === 'customer' && (
          <>
            <button
              type="button"
              onClick={() => setActiveFilter('good')}
              className={`m3-chip ${activeFilter === 'good' ? 'm3-chip-selected' : ''}`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              Good Rating
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('watch')}
              className={`m3-chip ${activeFilter === 'watch' ? 'm3-chip-selected' : ''}`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              Watchlist
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('defaulter')}
              className={`m3-chip ${activeFilter === 'defaulter' ? 'm3-chip-selected' : ''}`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-danger" />
              Defaulter
            </button>
          </>
        )}

        {type === 'stock' && (
          <>
            <button
              type="button"
              onClick={() => setActiveFilter('in_stock')}
              className={`m3-chip ${activeFilter === 'in_stock' ? 'm3-chip-selected' : ''}`}
            >
              In Stock
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('low_stock')}
              className={`m3-chip ${activeFilter === 'low_stock' ? 'm3-chip-selected' : ''}`}
            >
              Low Stock
            </button>
            {stockCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveFilter(cat)}
                className={`m3-chip ${activeFilter === cat ? 'm3-chip-selected' : ''}`}
              >
                {cat}
              </button>
            ))}
          </>
        )}

        {type === 'agreement' && (
          <>
            <button
              type="button"
              onClick={() => setActiveFilter('active')}
              className={`m3-chip ${activeFilter === 'active' ? 'm3-chip-selected' : ''}`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('completed')}
              className={`m3-chip ${activeFilter === 'completed' ? 'm3-chip-selected' : ''}`}
            >
              Completed
            </button>
          </>
        )}
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-caption text-text-muted font-mono-tabular px-1 font-semibold">
        <span>
          Showing {visibleItems.length} of {filteredItems.length} records
        </span>
        {filteredItems.length < items.length && (
          <span>(Filtered from {items.length} total)</span>
        )}
      </div>

      {/* Visible Scrollable List */}
      <div
        ref={listRef}
        role="listbox"
        className={`${maxHeight} overflow-y-auto space-y-1.5 pr-1 focus:outline-none`}
      >
        {visibleItems.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-surface-2/40 space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface-2 text-text-muted flex items-center justify-center mx-auto">
              <Search className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <p className="font-bold text-body text-text">No matching records found</p>
              <p className="text-caption text-text-muted mt-0.5">
                Try searching by full name, phone number, CNIC, model or serial #.
              </p>
            </div>
            {onAddNew && (
              <button
                type="button"
                onClick={onAddNew}
                className="m3-btn-base m3-btn-filled text-body-sm py-2 px-4 inline-flex items-center gap-1.5 font-bold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{addNewLabel || 'Register New Record'}</span>
              </button>
            )}
          </div>
        ) : (
          visibleItems.map((item, index) => {
            const isSelected = item.id === selectedId;
            const isKeyboardFocused = index === focusedIndex;

            if (type === 'customer') {
              const c = item as unknown as Customer;
              const initials = (c.fullName || 'C')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              const ratingStyles: Record<CustomerRating, { label: string; badge: string; icon: any }> = {
                good: { label: 'Good', badge: 'bg-success/15 text-success border-success/30', icon: ShieldCheck },
                watch: { label: 'Watchlist', badge: 'bg-warning/15 text-warning border-warning/30', icon: AlertTriangle },
                defaulter: { label: 'Defaulter Warning', badge: 'bg-danger/20 text-danger border-danger/40 font-black', icon: ShieldAlert },
              };
              const rStyle = ratingStyles[c.rating] || ratingStyles.good;
              const RatingIcon = rStyle.icon;

              return (
                <div
                  key={c.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(item)}
                  className={`min-h-[64px] p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-xs'
                      : isKeyboardFocused
                      ? 'border-primary/50 bg-surface-2'
                      : 'border-border bg-surface hover:bg-surface-2 hover:border-border-strong'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                        c.rating === 'defaulter'
                          ? 'bg-danger/10 text-danger border-danger/30'
                          : 'bg-primary-container text-on-primary-container border-border'
                      }`}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-text truncate">
                          <HighlightMatch text={c.fullName} query={debouncedQuery} />
                        </span>
                        <span className="text-caption font-mono-tabular px-2 py-0.5 rounded bg-surface-2 border border-border text-text-muted">
                          {c.customerCode}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-caption px-2.5 py-0.5 rounded-full border font-bold ${rStyle.badge}`}
                        >
                          <RatingIcon className="w-3.5 h-3.5" />
                          <span>{rStyle.label}</span>
                        </span>
                      </div>

                      <div className="text-body-sm text-text-muted font-mono-tabular flex items-center gap-2 mt-0.5 flex-wrap font-medium">
                        <span>
                          CNIC: <HighlightMatch text={c.cnic} query={debouncedQuery} />
                        </span>
                        <span>·</span>
                        <span>
                          Phone: <HighlightMatch text={c.phone} query={debouncedQuery} />
                        </span>
                        <span>·</span>
                        <span className="text-text font-semibold">{c.city}</span>
                      </div>

                      {c.guarantor1?.name && (
                        <div className="text-caption text-text-muted truncate mt-0.5 font-medium">
                          Guarantor: {c.guarantor1.name} ({c.guarantor1.relation || 'Contact'})
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-border group-hover:border-primary/50" />
                    )}
                  </div>
                </div>
              );
            }

            if (type === 'stock') {
              const s = item as unknown as StockItem;
              const isOutOfStock = s.inStock <= 0;
              const isLowStock = s.inStock > 0 && s.inStock <= 2;

              return (
                <div
                  key={s.id}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isOutOfStock}
                  onClick={() => !isOutOfStock && handleSelect(item)}
                  className={`min-h-[64px] p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isOutOfStock
                      ? 'opacity-50 bg-surface-2/40 border-border cursor-not-allowed'
                      : isSelected
                      ? 'border-primary bg-primary/10 shadow-xs cursor-pointer'
                      : isKeyboardFocused
                      ? 'border-primary/50 bg-surface-2 cursor-pointer'
                      : 'border-border bg-surface hover:bg-surface-2 hover:border-border-strong cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-surface-2 text-primary flex items-center justify-center shrink-0 border border-border">
                      <Package className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-text truncate">
                          <HighlightMatch text={s.name} query={debouncedQuery} />
                        </span>
                        <span className="text-caption font-semibold px-2 py-0.5 rounded bg-surface-2 border border-border text-text-muted">
                          {s.category}
                        </span>
                        <span
                          className={`text-caption font-mono-tabular font-bold px-2.5 py-0.5 rounded-full border ${
                            isOutOfStock
                              ? 'bg-danger/15 text-danger border-danger/30'
                              : isLowStock
                              ? 'bg-warning/15 text-warning border-warning/30'
                              : 'bg-success/15 text-success border-success/30'
                          }`}
                        >
                          {isOutOfStock
                            ? 'Out of Stock'
                            : isLowStock
                            ? `Low: ${s.inStock} Left`
                            : `${s.inStock} Available`}
                        </span>
                      </div>

                      <div className="text-body-sm text-text-muted font-mono-tabular flex items-center gap-2 mt-0.5 flex-wrap font-medium">
                        <span>
                          {s.brand} {s.model}
                        </span>
                        {s.serialNumber && (
                          <>
                            <span>·</span>
                            <span>
                              Serial:{' '}
                              <HighlightMatch
                                text={s.serialNumber}
                                query={debouncedQuery}
                              />
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span className="text-text font-bold">
                          Cash: {currencySymbol} {s.cashPrice.toLocaleString()}
                        </span>
                        <span>·</span>
                        <span className="text-primary font-bold">
                          Instalment: {currencySymbol}{' '}
                          {s.instalmentPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isOutOfStock ? (
                      <span className="text-caption text-danger font-bold uppercase">
                        Unavailable
                      </span>
                    ) : isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-border" />
                    )}
                  </div>
                </div>
              );
            }

            if (type === 'agreement') {
              const a = item as unknown as Agreement;
              return (
                <div
                  key={a.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(item)}
                  className={`min-h-[64px] p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-xs'
                      : isKeyboardFocused
                      ? 'border-primary/50 bg-surface-2'
                      : 'border-border bg-surface hover:bg-surface-2 hover:border-border-strong'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-surface-2 text-primary flex items-center justify-center shrink-0 border border-border">
                      <FileSignature className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-text font-mono-tabular">
                          <HighlightMatch text={a.agreementNumber} query={debouncedQuery} />
                        </span>
                        <span className="text-body-sm font-bold text-text truncate">
                          <HighlightMatch text={(a as any).customerName || a.customerCode} query={debouncedQuery} />
                        </span>
                        <span className="text-caption px-2 py-0.5 rounded bg-surface-2 border border-border font-bold uppercase text-text-muted">
                          {a.status}
                        </span>
                      </div>

                      <div className="text-body-sm text-text-muted font-mono-tabular flex items-center gap-2 mt-0.5 flex-wrap font-medium">
                        <span>{a.itemName}</span>
                        <span>·</span>
                        <span className="text-primary font-bold">
                          Balance: {currencySymbol} {a.remainingBalance.toLocaleString()}
                        </span>
                        <span>·</span>
                        <span>Total: {currencySymbol} {(a.totalInstalmentPrice || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-border" />
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })
        )}

        {/* Load More Pagination */}
        {filteredItems.length > pageLimit && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setPageLimit((prev) => prev + 25)}
              className="m3-btn-base m3-btn-tonal text-body-sm py-2.5 px-5 inline-flex items-center gap-2 font-bold"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Load More (25 more of {filteredItems.length - pageLimit} remaining)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
