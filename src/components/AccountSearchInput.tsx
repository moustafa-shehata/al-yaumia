import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, BookOpen, ChevronDown, Check, User } from 'lucide-react';
import { Account } from '../types';

interface AccountSearchInputProps {
  accounts: Account[];
  selectedAccountName: string;
  onSelectAccount: (account: Account) => void;
  onClear?: () => void;
  id?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export const AccountSearchInput: React.FC<AccountSearchInputProps> = ({
  accounts = [],
  selectedAccountName,
  onSelectAccount,
  onClear,
  id = 'account-search-input',
  placeholder = 'ابحث بالاسم أو الكود من دليل الحسابات...',
  autoFocus = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(selectedAccountName || '');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input text with selectedAccountName when it changes externally
  useEffect(() => {
    setQuery(selectedAccountName || '');
  }, [selectedAccountName]);

  // Auto-focus when autoFocus prop is enabled
  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // If query was cleared to empty, trigger onClear
        if (!query.trim()) {
          if (onClear) onClear();
          return;
        }

        // If query doesn't match an account, revert to currently selected
        if (selectedAccountName && query !== selectedAccountName) {
          const match = accounts.find((a) => a.name.trim() === query.trim());
          if (!match) {
            setQuery(selectedAccountName);
          }
        } else if (!selectedAccountName && query) {
          const match = accounts.find((a) => a.name.trim().toLowerCase() === query.trim().toLowerCase());
          if (match) {
            onSelectAccount(match);
          }
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [accounts, query, selectedAccountName, onSelectAccount, onClear]);

  // Filter accounts strictly from دليل الحسابات (NO "جميع الحسابات")
  const filteredAccounts = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return accounts;
    }
    return accounts.filter((acc) => {
      const matchName = acc.name.toLowerCase().includes(trimmed);
      const matchCode = acc.code ? acc.code.toLowerCase().includes(trimmed) : false;
      const matchType = acc.type ? acc.type.toLowerCase().includes(trimmed) : false;
      const matchMain = acc.mainAccount ? acc.mainAccount.toLowerCase().includes(trimmed) : false;
      return matchName || matchCode || matchType || matchMain;
    });
  }, [accounts, query]);

  // When query changes, reset highlighted index
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredAccounts]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);

    if (!val.trim()) {
      if (onClear) onClear();
      return;
    }

    // Instant check: if user typed an exact matching account name or code, apply it in real time
    const exactMatch = accounts.find(
      (a) => a.name.trim().toLowerCase() === val.trim().toLowerCase() ||
             (a.code && a.code.trim().toLowerCase() === val.trim().toLowerCase())
    );
    if (exactMatch) {
      onSelectAccount(exactMatch);
    }
  };

  const handleSelect = (account: Account) => {
    setQuery(account.name);
    setIsOpen(false);
    onSelectAccount(account);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredAccounts.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredAccounts.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredAccounts[highlightedIndex]) {
        handleSelect(filteredAccounts[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(true);
    if (onClear) {
      onClear();
    }
    inputRef.current?.focus();
  };

  // Find currently selected account meta
  const currentAccount = accounts.find((a) => a.name === selectedAccountName);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Search className="w-4 h-4 text-blue-600" />
        </div>

        {/* The Text Input - Fully Typeable with Instant Live Results */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full h-9 pr-8 pl-16 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />

        {/* Right side controls inside input: Clear (X) + Dropdown toggle */}
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="مسح حقل البحث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
            title="استعراض دليل الحسابات"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Instant Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-300 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 text-right">
          {/* Header of dropdown */}
          <div className="px-3 py-1.5 bg-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-500 sticky top-0 border-b border-slate-200">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-blue-600" />
              <span>دليل الحسابات ({filteredAccounts.length} حساب)</span>
            </span>
            <span className="text-[10px] text-slate-400">انقر للاختيار الفوري</span>
          </div>

          {filteredAccounts.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              لا يوجد حساب يطابق &quot;{query}&quot; في دليل الحسابات
            </div>
          ) : (
            filteredAccounts.map((acc, idx) => {
              const isSelected = acc.name === selectedAccountName;
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={acc.id}
                  onClick={() => handleSelect(acc)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-900 font-bold'
                      : isHighlighted
                      ? 'bg-slate-100 text-slate-900'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {/* Account Code Badge */}
                    {acc.code && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono font-mono-numbers text-[11px] shrink-0">
                        {acc.code}
                      </span>
                    )}
                    <div className="truncate">
                      <div className="text-xs sm:text-sm font-semibold truncate flex items-center gap-1.5">
                        <span>{acc.name}</span>
                        {isSelected && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-blue-600 text-white rounded font-medium">
                            المحدد حالياً
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {acc.type} {acc.mainAccount ? `• رئيسي: ${acc.mainAccount}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 mr-2">
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
