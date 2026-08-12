import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown, MoreHorizontal } from "lucide-react";

export default function DataTable({
  columns,
  rows,
  rowKey = (r) => r.id,
  selectable = true,
  selected,
  onSelectedChange,
  onRowClick,
  defaultSort,
}) {
  const [sort, setSort] = useState(defaultSort || null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const copy = [...rows].sort((a, b) => {
      const av = col.sortValue(a);
      const bv = col.sortValue(b);
      if (av < bv) return -1;
      if (av > bv) return 1;
      return 0;
    });
    if (sort.dir === "desc") copy.reverse();
    return copy;
  }, [rows, sort, columns]);

  const allChecked = selectable && rows.length > 0 && rows.every((r) => selected?.has(rowKey(r)));
  const someChecked = selectable && !allChecked && rows.some((r) => selected?.has(rowKey(r)));

  function toggleAll() {
    const next = new Set(selected);
    if (allChecked) {
      rows.forEach((r) => next.delete(rowKey(r)));
    } else {
      rows.forEach((r) => next.add(rowKey(r)));
    }
    onSelectedChange(next);
  }

  function toggleOne(id) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    onSelectedChange(next);
  }

  function toggleSort(col) {
    if (!col.sortValue) return;
    setSort((prev) => {
      if (!prev || prev.key !== col.key) return { key: col.key, dir: "asc" };
      if (prev.dir === "asc") return { key: col.key, dir: "desc" };
      return null;
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
            {selectable && (
              <th className="w-10 py-2.5 pl-4 pr-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 accent-gray-900"
                  checked={allChecked}
                  ref={(el) => el && (el.indeterminate = someChecked)}
                  onChange={toggleAll}
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-2.5 px-3 font-medium select-none ${col.sortValue ? "cursor-pointer hover:text-gray-800" : ""}`}
                style={{ width: col.width }}
                onClick={() => toggleSort(col)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {sort?.key === col.key &&
                    (sort.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </span>
              </th>
            ))}
            <th className="w-10 py-2.5 pr-4" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const id = rowKey(row);
            const isSelected = selected?.has(id);
            return (
              <tr
                key={id}
                className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 ${
                  isSelected ? "bg-violet-50/40" : ""
                } ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td className="py-2.5 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 accent-gray-900"
                      checked={!!isSelected}
                      onChange={() => toggleOne(id)}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className="py-2.5 px-3 text-gray-700">
                    {col.render(row)}
                  </td>
                ))}
                <td className="py-2.5 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={columns.length + 2} className="py-12 text-center text-sm text-gray-400">
                No items to show.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
