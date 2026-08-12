import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Gem, Newspaper } from "lucide-react";
import { useLocalStorage } from "../lib/storage";
import { seedEntries, seedContentTypes, seedUsers, LOCALE_LIST, DEFAULT_WORKFLOW_STEPS, normalizeWorkflowSteps } from "../lib/seed";
import Sidebar from "../components/Sidebar";
import DataTable from "../components/DataTable";
import StatusPill from "../components/StatusPill";
import Avatar from "../components/Avatar";
import { FilterBar } from "../components/FilterBar";

const TYPE_ICONS = { "file-text": FileText, gem: Gem, newspaper: Newspaper };

function timeAgo(iso) {
  const diff = (new Date("2026-08-12T18:00:00") - new Date(iso)) / 36e5;
  if (diff < 24) return `Today at ${new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  if (diff < 48) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default function Content() {
  const navigate = useNavigate();
  const [entries, setEntries] = useLocalStorage("cms.entries", seedEntries);
  const [contentTypes] = useLocalStorage("cms.contentTypes", seedContentTypes);
  const [rawWorkflowSteps] = useLocalStorage("cms.settings.workflowSteps", DEFAULT_WORKFLOW_STEPS);
  const workflowSteps = useMemo(() => normalizeWorkflowSteps(rawWorkflowSteps), [rawWorkflowSteps]);
  const users = useMemo(() => seedUsers(), []);
  const usersById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);
  const typesById = useMemo(() => Object.fromEntries(contentTypes.map((t) => [t.id, t])), [contentTypes]);

  const [filter, setFilter] = useState({ view: "all", status: null, typeId: null });
  const [extraFilters, setExtraFilters] = useState({ locale: null, updatedBy: null });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [adding, setAdding] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftType, setDraftType] = useState(contentTypes[0]?.id);

  const statuses = workflowSteps.map((step) => ({
    name: step.name,
    color: step.color,
    count: entries.filter((e) => e.status === step.name).length,
  }));

  const filterValues = { status: filter.status, contentTypeId: filter.typeId, ...extraFilters };

  function handleFilterChange(key, value) {
    if (key === "status") return setFilter({ view: value ? "status" : "all", status: value, typeId: null });
    if (key === "contentTypeId") return setFilter({ view: value ? "type" : "all", status: null, typeId: value });
    setExtraFilters((v) => ({ ...v, [key]: value }));
  }

  function clearFilters() {
    setFilter({ view: "all", status: null, typeId: null });
    setExtraFilters({ locale: null, updatedBy: null });
  }

  const filterFields = [
    { key: "status", label: "Status", options: workflowSteps.map((s) => ({ value: s.name, label: s.name })) },
    { key: "contentTypeId", label: "Content type", options: contentTypes.map((t) => ({ value: t.id, label: t.name })) },
    { key: "locale", label: "Locale", options: LOCALE_LIST.map((l) => ({ value: l, label: l.toUpperCase() })) },
    { key: "updatedBy", label: "Updated by", options: users.map((u) => ({ value: u.id, label: u.name })) },
  ];

  const filtered = entries.filter((e) => {
    if (filter.status && e.status !== filter.status) return false;
    if (filter.typeId && e.contentTypeId !== filter.typeId) return false;
    if (extraFilters.locale && e.locale !== extraFilters.locale) return false;
    if (extraFilters.updatedBy && e.updatedBy !== extraFilters.updatedBy) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function addEntry() {
    if (!draftTitle.trim()) return;
    const id = `e${Date.now()}`;
    setEntries([
      { id, title: draftTitle.trim(), contentTypeId: draftType, status: workflowSteps[0]?.name, locale: "en", updatedAt: "2026-08-12T18:00:00", updatedBy: usersById && users[0].id },
      ...entries,
    ]);
    setDraftTitle("");
    setAdding(false);
  }

  const columns = [
    {
      key: "title",
      header: "Name",
      sortValue: (r) => r.title,
      render: (r) => <span className="font-medium text-gray-900">{r.title}</span>,
    },
    {
      key: "type",
      header: "Content Type",
      render: (r) => {
        const t = typesById[r.contentTypeId];
        const Icon = TYPE_ICONS[t?.icon] || FileText;
        return (
          <span className="inline-flex items-center gap-1.5 text-gray-600">
            <Icon size={14} style={{ color: t?.color }} />
            {t?.name}
          </span>
        );
      },
    },
    {
      key: "updatedAt",
      header: "Updated",
      sortValue: (r) => r.updatedAt,
      render: (r) => <span className="text-gray-500">{timeAgo(r.updatedAt)}</span>,
    },
    {
      key: "updatedBy",
      header: "Last updated by",
      render: (r) => {
        const u = usersById[r.updatedBy];
        return (
          <span className="inline-flex items-center gap-2">
            <Avatar user={u} size={20} />
            <span className="text-gray-600">{u?.name}</span>
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status,
      render: (r) => <StatusPill status={r.status} color={workflowSteps.find((s) => s.name === r.status)?.color} />,
    },
  ];

  return (
    <div className="flex h-full min-h-0">
      <Sidebar
        allLabel="All content"
        statuses={statuses}
        typeGroupLabel="Content type"
        typeItems={contentTypes.map((t) => ({ id: t.id, name: t.name, count: t.entryCount, icon: t.icon }))}
        filter={filter}
        onFilter={(f) => { setFilter(f); setSearch(""); }}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">All content</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAdding((v) => !v)}
              className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
            >
              <Plus size={15} /> Create new
            </button>
          </div>
        </div>

        <div className="mb-4">
          <FilterBar
            typeFacetLabel="Content type"
            typeLabel={typesById[filter.typeId]?.name ?? "Any"}
            search={search}
            onSearchChange={setSearch}
            filterFields={filterFields}
            filterValues={filterValues}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
          />
        </div>

        {adding && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3">
            <input
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEntry()}
              placeholder="Entry title…"
              className="flex-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm focus:border-violet-400 focus:outline-none"
            />
            <select
              value={draftType}
              onChange={(e) => setDraftType(e.target.value)}
              className="rounded-md border border-gray-200 px-2.5 py-1.5 text-sm"
            >
              {contentTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button onClick={addEntry} className="rounded-md bg-[#8a6d0d] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#6b5509]">
              Create
            </button>
            <button onClick={() => setAdding(false)} className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100">
              Cancel
            </button>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white">
          <DataTable
            columns={columns}
            rows={filtered}
            selected={selected}
            onSelectedChange={setSelected}
            onRowClick={(row) => navigate(`/content/${row.id}`)}
            defaultSort={{ key: "updatedAt", dir: "desc" }}
          />
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5 text-xs text-gray-400">
            <span>{selected.size} selected</span>
            <span>Showing {filtered.length} of {entries.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
