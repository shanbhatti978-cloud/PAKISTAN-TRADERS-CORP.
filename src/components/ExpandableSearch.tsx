import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowLeft, Loader2, History, Trash2, CornerDownLeft } from 'lucide-react';

export interface ExpandableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: (value: string) => void;
  onClear?: () => void;
  autoFocusOnOpen?: boolean;
  resultCount?: { current: number; total: number } | string | number;
  isLoading?: boolean;
  align?: 'start' | 'end';
  recentKey?: string;
  shortcut?: string;
  className?: string;
  buttonClassName?: string;
  barClassName?: string;
  debounceMs?: number;
  chipLabelPrefix?: string;
  showActiveChip?: boolean;
  renderResultsPanel?: (close: () => void) => React.ReactNode;
  id?: string;
  ariaLabel?: string;
  isGlobal?: boolean;
}

export const ExpandableSearch: React.FC<ExpandableSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  onSubmit,
  onClear,
  autoFocusOnOpen = true,
  resultCount,
  isLoading = false,
  align = 'end',
  recentKey,
  shortcut = '/',
  className = '',
  buttonClassName = '',
  barClassName = '',
  debounceMs = 250,
  chipLabelPrefix = 'Search',
  showActiveChip = true,
  renderResultsPanel,
  id = 'expandable-search',
  ariaLabel = 'Search',
  isGlobal = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(() => Boolean(value && value.trim().length > 0));
  const [localInput, setLocalInput] = useState<string>(value || '');
  const [showRecentDropdown, setShowRecentDropdown] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external value changes into local input
  useEffect(() => {
    setLocalInput(value || '');
  }, [value]);

  // Load recent searches from localStorage
  useEffect(() => {
    if (!recentKey) return;
    try {
      const stored = localStorage.getItem(`PTC_RECENT_${recentKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 5));
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, [recentKey]);

  // Save query to recent searches
  const saveRecentSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!recentKey || !trimmed || trimmed.length < 2) return;
    try {
      setRecentSearches((prev) => {
        const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
        const updated = [trimmed, ...filtered].slice(0, 5);
        localStorage.setItem(`PTC_RECENT_${recentKey}`, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // Ignore storage errors
    }
  }, [recentKey]);

  // Clear recent searches
  const handleClearRecents = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!recentKey) return;
    try {
      localStorage.removeItem(`PTC_RECENT_${recentKey}`);
      setRecentSearches([]);
    } catch {
      // Ignore
    }
  };

  // Handle open
  const handleOpen = () => {
    setIsOpen(true);
    setShowRecentDropdown(Boolean(recentSearches.length > 0 && !localInput));
    if (autoFocusOnOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  };

  // Handle close
  const handleClose = () => {
    setIsOpen(false);
    setShowRecentDropdown(false);
    // If text was typed, commit it as a recent search
    if (localInput.trim()) {
      saveRecentSearch(localInput);
    }
    // Return focus to the trigger button for accessibility
    setTimeout(() => {
      triggerButtonRef.current?.focus();
    }, 50);
  };

  // Clear query and close if user clicks back/cancel
  const handleBackOrCancel = () => {
    if (localInput) {
      setLocalInput('');
      onChange('');
      onClear?.();
    }
    handleClose();
  };

  // Clear query only
  const handleClearQuery = () => {
    setLocalInput('');
    onChange('');
    onClear?.();
    inputRef.current?.focus();
    setShowRecentDropdown(Boolean(recentSearches.length > 0));
  };

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalInput(newValue);
    setShowRecentDropdown(Boolean(recentSearches.length > 0 && !newValue));

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue);
      if (newValue.trim().length >= 3) {
        saveRecentSearch(newValue);
      }
    }, debounceMs);
  };

  // Handle enter key submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onChange(localInput);
      saveRecentSearch(localInput);
      setShowRecentDropdown(false);
      onSubmit?.(localInput);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (showRecentDropdown) {
        setShowRecentDropdown(false);
      } else if (localInput) {
        handleClearQuery();
      } else {
        handleClose();
      }
    }
  };

  // Keyboard shortcut listener (e.g. '/' or Ctrl+K)
  useEffect(() => {
    if (!shortcut) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in another input / textarea / editable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const isSlash = shortcut === '/' && e.key === '/';
      const isCmdK =
        (shortcut === 'Ctrl+K' || shortcut === 'Cmd+K' || shortcut === 'k') &&
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === 'k';

      if (isSlash || isCmdK) {
        e.preventDefault();
        handleOpen();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [shortcut]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // If query is empty, close on outside click. If not empty, keep open or close based on preference
        if (!localInput.trim()) {
          handleClose();
        } else {
          setShowRecentDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, localInput]);

  // Format result count text
  const formatResultCount = () => {
    if (!resultCount) return null;
    if (typeof resultCount === 'object') {
      return `${resultCount.current} of ${resultCount.total}`;
    }
    return String(resultCount);
  };

  const hasActiveQuery = Boolean(value && value.trim().length > 0);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex flex-col items-${align === 'start' ? 'start' : 'end'} ${className}`}
      role="search"
    >
      <AnimatePresence initial={false} mode="wait">
        {!isOpen ? (
          /* COLLAPSED STATE: Round glass icon button */
          <motion.div
            key="search-collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex items-center"
          >
            <button
              ref={triggerButtonRef}
              type="button"
              onClick={handleOpen}
              aria-expanded={false}
              aria-controls={`${id}-input`}
              aria-label={ariaLabel}
              title={`${ariaLabel} (${shortcut === '/' ? 'Press /' : shortcut})`}
              className={`relative w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer shadow-xs active:scale-95 group focus:outline-none focus:ring-3 focus:ring-primary/40 ${
                hasActiveQuery
                  ? 'border-primary/50 bg-primary/10 text-primary shadow-sm'
                  : 'border-border bg-surface/80 hover:bg-surface text-text-muted hover:text-text hover:border-primary/40'
              } ${buttonClassName}`}
            >
              <Search className="w-5 h-5 transition-transform group-hover:scale-110" />

              {/* Active search indicator badge */}
              {hasActiveQuery && (
                <span
                  className="absolute top-1 right-1 w-3 h-3 rounded-full border-2 bg-primary animate-pulse"
                  style={{ borderColor: 'var(--theme-surface-card)' }}
                  aria-hidden="true"
                />
              )}
            </button>
          </motion.div>
        ) : (
          /* EXPANDED STATE: Full Liquid Glass Search Bar */
          <motion.div
            key="search-expanded"
            initial={{ opacity: 0, width: 48 }}
            animate={{ opacity: 1, width: '100%' }}
            exit={{ opacity: 0, width: 48 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className={`w-full ${isGlobal ? 'md:w-96 lg:w-[420px]' : 'sm:w-80 md:w-96 sm:max-w-[420px]'} ${barClassName}`}
          >
            <div
              className="relative flex items-center h-12 w-full rounded-2xl border transition-all shadow-md backdrop-blur-xl bg-surface/95 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/30"
              style={{
                borderColor: 'var(--theme-surface-border)',
              }}
            >
              {/* Back / Collapse Button */}
              <button
                type="button"
                onClick={handleBackOrCancel}
                title="Close search"
                aria-label="Close search"
                className="p-2.5 ms-1 rounded-xl text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </button>

              {/* Search Icon */}
              <Search className="w-4 h-4 text-text-muted ms-1 shrink-0 pointer-events-none" />

              {/* Text Input */}
              <input
                ref={inputRef}
                id={`${id}-input`}
                type="text"
                value={localInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (recentSearches.length > 0 && !localInput) {
                    setShowRecentDropdown(true);
                  }
                }}
                placeholder={placeholder}
                className="w-full h-full ps-2.5 pe-2 bg-transparent text-base text-text placeholder:text-text-muted/60 focus:outline-none font-medium min-w-0"
                aria-label={placeholder}
                autoComplete="off"
                spellCheck="false"
              />

              {/* Result Count Badge */}
              {resultCount !== undefined && localInput && !isLoading && (
                <span className="hidden sm:inline-block px-2 py-0.5 me-1 text-caption font-mono-tabular font-bold rounded-lg border bg-surface-2 text-text-muted border-border whitespace-nowrap shrink-0">
                  {formatResultCount()}
                </span>
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-primary me-2 shrink-0" />
              )}

              {/* Clear 'X' Button */}
              {localInput && !isLoading && (
                <button
                  type="button"
                  onClick={handleClearQuery}
                  title="Clear text"
                  aria-label="Clear search input"
                  className="p-1.5 rounded-full text-text-muted hover:text-text hover:bg-surface-2 transition-colors me-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Quick Submit button or Enter indicator */}
              <button
                type="button"
                onClick={() => {
                  if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                  }
                  onChange(localInput);
                  saveRecentSearch(localInput);
                  setShowRecentDropdown(false);
                  onSubmit?.(localInput);
                }}
                title="Search"
                aria-label="Execute search"
                className="p-2 me-1 rounded-xl text-primary hover:bg-primary/10 transition-colors cursor-pointer shrink-0"
              >
                <CornerDownLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Recent Searches Popover */}
            {showRecentDropdown && recentSearches.length > 0 && !localInput && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 right-0 mt-1.5 p-2 rounded-2xl border shadow-xl z-50 backdrop-blur-xl bg-surface/98 border-border"
              >
                <div className="flex items-center justify-between px-2 py-1 text-caption font-bold text-text-muted border-b border-border mb-1">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider">
                    <History className="w-3.5 h-3.5 text-primary" />
                    Recent Searches
                  </span>
                  <button
                    type="button"
                    onClick={handleClearRecents}
                    className="text-caption text-text-muted hover:text-danger flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                </div>

                <div className="space-y-0.5">
                  {recentSearches.map((item, idx) => (
                    <button
                      key={`${item}-${idx}`}
                      type="button"
                      onClick={() => {
                        setLocalInput(item);
                        onChange(item);
                        saveRecentSearch(item);
                        setShowRecentDropdown(false);
                        onSubmit?.(item);
                      }}
                      className="w-full text-start px-3 py-2 rounded-xl text-body-sm text-text hover:bg-surface-2 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                    >
                      <span className="font-medium truncate">{item}</span>
                      <span className="text-caption text-text-muted group-hover:text-primary transition-colors">
                        Apply ↵
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Custom Results Panel (e.g. Header Global Search Live Dropdown) */}
            {renderResultsPanel && renderResultsPanel(handleClose)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Removable Chip When Collapsed with Active Query */}
      {!isOpen && hasActiveQuery && showActiveChip && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-semibold border bg-primary/10 text-primary border-primary/30 shadow-2xs"
        >
          <span>
            {chipLabelPrefix}: <strong className="font-bold font-mono">"{value}"</strong>
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              onClear?.();
            }}
            title="Clear active filter"
            aria-label="Clear active filter"
            className="p-0.5 rounded-full hover:bg-primary/20 text-primary transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </div>
  );
};
