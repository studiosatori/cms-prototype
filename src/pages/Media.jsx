import { useState } from "react";
import { Upload, Image as ImageIcon, FileType, List, LayoutGrid } from "lucide-react";
import { useLocalStorage } from "../lib/storage";
import { seedMedia, seedUsers, getUser } from "../lib/seed";
import DataTable from "../components/DataTable";
import Avatar from "../components/Avatar";
import { FilterBar } from "../components/FilterBar";
import SegmentedControl from "../components/SegmentedControl";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatSize(kb) {
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export default function Media() {
  const [media] = useLocalStorage("cms.media", seedMedia);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [view, setView] = useState("list");
  const [filterValues, setFilterValues] = useState({ kind: null, uploadedBy: null });

  const kindOptions = [...new Set(media.map((m) => m.kind))].map((k) => ({ value: k, label: k }));
  const filterFields = [
    { key: "kind", label: "Type", options: kindOptions },
    { key: "uploadedBy", label: "Uploaded by", options: seedUsers().map((u) => ({ value: u.id, label: u.name })) },
  ];

  const filtered = media.filter((m) => {
    if (filterValues.kind && m.kind !== filterValues.kind) return false;
    if (filterValues.uploadedBy && m.uploadedBy !== filterValues.uploadedBy) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns = [
    {
      key: "name",
      header: "Name",
      sortValue: (r) => r.name,
      render: (r) => (
        <span className="inline-flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ backgroundColor: r.color + "40" }}
          >
            {r.kind === "vector" ? (
              <FileType size={15} style={{ color: r.color }} />
            ) : (
              <ImageIcon size={15} style={{ color: r.color }} />
            )}
          </span>
          <span className="font-medium text-gray-900">{r.name}</span>
        </span>
      ),
    },
    { key: "kind", header: "Type", render: (r) => <span className="text-gray-500">{r.kind}</span> },
    { key: "sizeKb", header: "Size", sortValue: (r) => r.sizeKb, render: (r) => <span className="text-gray-500">{formatSize(r.sizeKb)}</span> },
    { key: "updatedAt", header: "Uploaded", sortValue: (r) => r.updatedAt, render: (r) => <span className="text-gray-500">{formatDate(r.updatedAt)}</span> },
    {
      key: "uploadedBy",
      header: "Uploaded by",
      render: (r) => {
        const u = getUser(r.uploadedBy);
        return (
          <span className="inline-flex items-center gap-2">
            <Avatar user={u} size={20} />
            <span className="text-gray-600">{u.name}</span>
          </span>
        );
      },
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Media library</h1>
        <div className="flex items-center gap-2">
          <SegmentedControl
            value={view}
            onChange={setView}
            options={[
              { value: "list", label: "List", icon: List },
              { value: "grid", label: "Icons", icon: LayoutGrid },
            ]}
          />
          <button className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700">
            <Upload size={15} /> Upload
          </button>
        </div>
      </div>

      <div className="mb-4 max-w-md">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          filterFields={filterFields}
          filterValues={filterValues}
          onFilterChange={(key, value) => setFilterValues((v) => ({ ...v, [key]: value }))}
          onClearFilters={() => setFilterValues({ kind: null, uploadedBy: null })}
        />
      </div>

      {view === "list" ? (
        <div className="rounded-lg border border-gray-200 bg-white">
          <DataTable columns={columns} rows={filtered} selected={selected} onSelectedChange={setSelected} defaultSort={{ key: "updatedAt", dir: "desc" }} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((r) => {
            const u = getUser(r.uploadedBy);
            return (
              <div
                key={r.id}
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              >
                <div
                  className="flex aspect-square items-center justify-center"
                  style={{ backgroundColor: r.color + "30" }}
                >
                  {r.kind === "vector" ? (
                    <FileType size={32} style={{ color: r.color }} />
                  ) : (
                    <ImageIcon size={32} style={{ color: r.color }} />
                  )}
                </div>
                <div className="p-2.5">
                  <p className="truncate text-sm font-medium text-gray-900" title={r.name}>{r.name}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                    <span>{formatSize(r.sizeKb)}</span>
                    <Avatar user={u} size={16} />
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full py-12 text-center text-sm text-gray-400">No items to show.</p>
          )}
        </div>
      )}
    </div>
  );
}
