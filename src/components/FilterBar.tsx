'use client';

import { ReactNode } from 'react';

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

interface FilterBarProps {
    filters: FilterOption[];
    onFilterChange: (filterId: string, value: string | string[] | number) => void;
    onReset: () => void;
    children?: ReactNode;
}

export default function FilterBar({
    filters,
    onFilterChange,
    onReset,
    children,
}: FilterBarProps) {
    const hasActiveFilters = filters.some((f) => f.value);

    return (
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-6">
            <div className="space-y-4">
                {/* Filter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                    onChange={(e) => onFilterChange(filter.id, e.target.value)}
                                    placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}`}
                                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            )}

                            {/* Date Input */}
                            {filter.type === 'date' && (
                                <input
                                    type="date"
                                    value={new Date(filter.value as number).toISOString().slice(0, 10) || ''}
                                    onChange={(e) => onFilterChange(filter.id, e.target.value)}
                                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            )}

                            {/* Number Input */}
                            {filter.type === 'number' && (
                                <input
                                    type="number"
                                    value={(filter.value as number) || ''}
                                    onChange={(e) => onFilterChange(filter.id, e.target.value ? Number(e.target.value) : '')}
                                    min={filter.min}
                                    max={filter.max}
                                    placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}`}
                                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            )}

                            {/* Select Input */}
                            {filter.type === 'select' && (
                                <select
                                    value={(filter.value as string) || ''}
                                    onChange={(e) => onFilterChange(filter.id, e.target.value)}
                                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                    onFilterChange(filter.id, updated);
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
                </div>

                {/* Reset Button and Children */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    {hasActiveFilters && (
                        <button
                            onClick={onReset}
                            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors text-sm"
                        >
                            Reset Filters
                        </button>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
}
