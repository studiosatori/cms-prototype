import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, Plus, ChevronDown, ArrowUpDown, X } from "lucide-react";

export function FilterBar({
  typeFacetLabel,
  typeLabel = "Any",
  search,
  onSearchChange,
  chips = [],
  sortLabel,
  onSortClick,
  filterFields = [],
  filterValues = {},
  onFilterChange,
  onClearFilters,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const activeCount = filterFields.filter((f) => filterValues[f.key]).length;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5">
        {typeFacetLabel && (
          <button className="flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200">
            {typeFacetLabel}
            <span className="rounded bg-white px-1.5 py-0.5 text-gray-900 ring-1 ring-gray-200">{typeLabel}</span>
          </button>
        )}
        <div className="flex flex-1 items-center gap-2 px-1">
          <Search size={14} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Type to search for entries"
            className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        {filterFields.length > 0 && (
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((v) => !v)}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                activeCount > 0 ? "bg-violet-50 text-violet-700" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <SlidersHorizontal size={13} />
              Filter
              {activeCount > 0 && (
                <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] text-white">
                  {activeCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Filters</p>
                  {activeCount > 0 && (
                    <button
                      onClick={() => onClearFilters?.()}
                      className="text-xs font-medium text-gray-400 hover:text-gray-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {filterFields.map((f) => (
                    <div key={f.key}>
                      <label className="mb-1 block text-xs font-medium text-gray-500">{f.label}</label>
                      <div className="relative">
                        <select
                          value={filterValues[f.key] ?? ""}
                          onChange={(e) => onFilterChange?.(f.key, e.target.value || null)}
                          className="w-full appearance-none rounded-md border border-gray-300 bg-white px-2.5 py-1.5 pr-7 text-sm focus:border-violet-400 focus:outline-none"
                        >
                          <option value="">Any</option>
                          {f.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        {filterValues[f.key] ? (
                          <button
                            onClick={() => onFilterChange?.(f.key, null)}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                          >
                            <X size={13} />
                          </button>
                        ) : (
                          <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip}
              className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700"
            >
              <Plus size={12} />
              {chip}
            </button>
          ))}
        </div>
      )}

      {sortLabel && (
        <button
          onClick={onSortClick}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
        >
          <ArrowUpDown size={13} />
          Sort by
          <span className="text-gray-900">{sortLabel}</span>
          <ChevronDown size={12} />
        </button>
      )}
    </div>
  );
}
