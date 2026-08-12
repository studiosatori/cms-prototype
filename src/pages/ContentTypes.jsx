import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Gem, Newspaper } from "lucide-react";
import { useLocalStorage } from "../lib/storage";
import { seedContentTypes, FIELD_TYPE_LIST } from "../lib/seed";
import DataTable from "../components/DataTable";
import { FilterBar } from "../components/FilterBar";

const TYPE_ICONS = { "file-text": FileText, gem: Gem, newspaper: Newspaper };

export default function ContentTypes() {
  const navigate = useNavigate();
  const [contentTypes] = useLocalStorage("cms.contentTypes", seedContentTypes);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [filterValues, setFilterValues] = useState({ fieldType: null });

  const filterFields = [
    { key: "fieldType", label: "Has field type", options: FIELD_TYPE_LIST.map((t) => ({ value: t, label: t })) },
  ];

  const filtered = contentTypes.filter((t) => {
    if (filterValues.fieldType && !t.fields.some((f) => f.type === filterValues.fieldType)) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns = [
    {
      key: "name",
      header: "Name",
      sortValue: (r) => r.name,
      render: (r) => {
        const Icon = TYPE_ICONS[r.icon] || FileText;
        return (
          <span className="inline-flex items-center gap-2 font-medium text-gray-900">
            <Icon size={15} style={{ color: r.color }} />
            {r.name}
          </span>
        );
      },
    },
    {
      key: "fields",
      header: "Fields",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.fields.map((f) => (
            <span key={f.name} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {f.name}
              <span className="text-gray-400"> · {f.type}</span>
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "entryCount",
      header: "Entries",
      sortValue: (r) => r.entryCount,
      render: (r) => <span className="text-gray-500">{r.entryCount}</span>,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Content types</h1>
        <button className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700">
          <Plus size={15} /> Create new
        </button>
      </div>

      <div className="mb-4 max-w-md">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          filterFields={filterFields}
          filterValues={filterValues}
          onFilterChange={(key, value) => setFilterValues((v) => ({ ...v, [key]: value }))}
          onClearFilters={() => setFilterValues({ fieldType: null })}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <DataTable
          columns={columns}
          rows={filtered}
          selected={selected}
          onSelectedChange={setSelected}
          onRowClick={(row) => navigate(`/content-types/${row.id}`)}
        />
      </div>
    </div>
  );
}
