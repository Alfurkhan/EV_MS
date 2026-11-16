import { useState, type ReactNode } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

export interface AcademicActiveFilter {
    key: string;
    label: string;
    onRemove: () => void;
}

interface AcademicFilterToolbarProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    placeholder: string;
    activeFilters?: AcademicActiveFilter[];
    onReset: () => void;
    children?: ReactNode;
}

export default function AcademicFilterToolbar({
    searchValue,
    onSearchChange,
    placeholder,
    activeFilters = [],
    onReset,
    children,
}: AcademicFilterToolbarProps) {
    const [filtersOpen, setFiltersOpen] = useState(false);

    return (
        <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        value={searchValue}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder={placeholder}
                        aria-label={placeholder}
                        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>
                <button
                    type="button"
                    onClick={() => setFiltersOpen((open) => !open)}
                    aria-expanded={filtersOpen}
                    aria-label={filtersOpen ? "Hide filters" : "Show filters"}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                        filtersOpen || activeFilters.length > 0
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                >
                    <SlidersHorizontal size={16} />
                    <span className="hidden sm:inline">Filters</span>
                    {activeFilters.length > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white">
                            {activeFilters.length}
                        </span>
                    )}
                </button>
            </div>
            {filtersOpen && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    <div className="flex flex-wrap items-end gap-3">
                        {children}
                        <button
                            type="button"
                            onClick={onReset}
                            disabled={searchValue.trim() === "" && activeFilters.length === 0}
                            className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Reset filters
                        </button>
                    </div>
                </div>
            )}
            {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {activeFilters.map((filter) => (
                        <button
                            key={filter.key}
                            type="button"
                            onClick={filter.onRemove}
                            className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                            aria-label={`Remove ${filter.label} filter`}
                        >
                            {filter.label}
                            <X size={12} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
