import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X, Check, CalendarDays } from 'lucide-react';

export interface ComboboxOption {
  id: string;
  code?: string;
  label: string;
  subLabel?: string;
  statusBadge?: string;
}

interface SearchableComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Tìm kiếm và chọn sự kiện...',
  emptyMessage = 'Không tìm thấy sự kiện phù hợp',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.id === value),
    [options, value]
  );

  // Lọc danh sách theo nội dung tìm kiếm
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(query);
      const matchCode = opt.code ? opt.code.toLowerCase().includes(query) : false;
      const matchSub = opt.subLabel ? opt.subLabel.toLowerCase().includes(query) : false;
      return matchLabel || matchCode || matchSub;
    });
  }, [options, searchQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listboxRef.current) {
      const activeEl = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.id);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions.length > 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchQuery('');
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full text-xs">
      {/* Combobox Trigger / Input */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
        className={`flex items-center justify-between w-full min-h-[42px] px-3.5 py-1.5 bg-white border rounded-xl transition-all cursor-pointer ${
          isOpen
            ? 'border-[#005FAF] ring-2 ring-[#005FAF]/20 bg-white'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <CalendarDays className="w-4 h-4 text-[#005FAF] shrink-0" />

          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedOption ? `${selectedOption.code ? selectedOption.code + ' — ' : ''}${selectedOption.label}` : placeholder}
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              autoFocus
            />
          ) : selectedOption ? (
            <div className="flex items-center gap-2 truncate min-w-0">
              {selectedOption.code && (
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#005FAF] font-bold text-[11px] border border-blue-200 shrink-0 font-mono">
                  {selectedOption.code}
                </span>
              )}
              <span className="font-semibold text-slate-900 truncate">
                {selectedOption.label}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Xóa lựa chọn"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#005FAF]' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Listbox */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn">
          <ul
            ref={listboxRef}
            role="listbox"
            className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-50"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-slate-400 font-medium">
                {emptyMessage}
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.id === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={opt.id}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(opt)}
                    className={`px-3.5 py-2.5 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                      isHighlighted
                        ? 'bg-blue-50/80 text-blue-900'
                        : isSelected
                        ? 'bg-slate-50 text-slate-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {opt.code && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100/70 text-[#005FAF] font-bold text-[10px] font-mono shrink-0">
                            {opt.code}
                          </span>
                        )}
                        <span className="font-semibold text-xs text-slate-900 leading-tight">
                          {opt.label}
                        </span>
                      </div>
                      {opt.subLabel && (
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {opt.subLabel}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#005FAF] shrink-0" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
