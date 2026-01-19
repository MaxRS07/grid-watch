'use client';

import { useState, useRef, useEffect, JSX, ReactNode } from 'react';
import './SearchBar.css';

interface SearchResult {
  id: string;
  name: string;
}

export interface FilterOption {
  id: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'number' | 'multiselect';
  value?: string | string[] | number;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  placeholder?: string;
}

interface SearchBarProps {
  placeholder?: string;
  filters?: FilterOption[];
  onSearch?: (query: string) => void;
  onFilterChange?: (filterId: string, value: string | string[] | number) => void;
  onReset?: () => void;
  results?: SearchResult[];
  showFilters?: boolean;
}

export default function SearchBar({
  placeholder = 'Search...',
  filters = [],
  onSearch,
  onFilterChange,
  onReset,
  results = [],
  showFilters = true,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFiltersPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowDropdown(value.length > 0);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleFilterChange = (filterId: string, value: string | string[] | number) => {
    if (onFilterChange) {
      onFilterChange(filterId, value);
    }
  };

  const handleReset = () => {
    setQuery('');
    if (onReset) {
      onReset();
    }
  };

  const hasActiveFilters = filters.some((f) => f.value);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <div className="search-bar">
        <div className="search-input-wrapper" ref={dropdownRef}>
          <svg
            className="search-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.length > 0 && setShowDropdown(true)}
          />
          {showDropdown && results.length > 0 && (
            <div className="search-dropdown">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="search-dropdown-item"
                  onClick={() => {
                    setQuery(result.name);
                    setShowDropdown(false);
                  }}
                >
                  <div className="search-dropdown-avatar">{getInitials(result.name)}</div>
                  <div className="search-dropdown-info">
                    <div className="search-dropdown-name">{result.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showFilters && filters.length > 0 && (
          <div className="relative" ref={filtersRef}>
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="search-filter-button"
              title="Toggle filters"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {hasActiveFilters && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </button>

            {showFiltersPanel && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg z-50 p-4">
                <div className="space-y-4">
                  {filters.map((filter, i) => (
                    <div key={i}>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        {filter.label}
                      </label>

                      {/* Text Input */}
                      {filter.type === 'text' && (
                        <input
                          type="text"
                          value={(filter.value as string) || ''}
                          onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                          placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}`}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      )}

                      {/* Date Input */}
                      {filter.type === 'date' && (
                        <input
                          type="date"
                          value={new Date(filter.value as number).toISOString().slice(0, 10)}
                          onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      )}

                      {/* Number Input */}
                      {filter.type === 'number' && (
                        <input
                          type="number"
                          value={(filter.value as number) || ''}
                          onChange={(e) => handleFilterChange(filter.id, e.target.value ? Number(e.target.value) : '')}
                          min={filter.min}
                          max={filter.max}
                          placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}`}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      )}

                      {/* Select Input */}
                      {filter.type === 'select' && (
                        <select
                          value={(filter.value as string) || ''}
                          onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">All</option>
                          {filter.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Multi-Select Input */}
                      {filter.type === 'multiselect' && (
                        <div className="flex flex-wrap gap-2">
                          {filter.options?.map((opt) => {
                            const isSelected = (filter.value as string[])?.includes(opt.value);
                            return (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  const current = (filter.value as string[]) || [];
                                  const updated = isSelected
                                    ? current.filter((v) => v !== opt.value)
                                    : [...current, opt.value];
                                  handleFilterChange(filter.id, updated);
                                }}
                                className={`px-3 py-1 text-sm rounded-lg transition-colors ${isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-600'
                                  }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}

                  {hasActiveFilters && (
                    <button
                      onClick={handleReset}
                      className="w-full px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors text-sm mt-4 border-t border-zinc-200 dark:border-zinc-700 pt-4"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
