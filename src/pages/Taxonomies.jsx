import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ListTree } from "lucide-react";
import { useLocalStorage } from "../lib/storage";
import { seedTaxonomies, countTerms } from "../lib/seed";
import DataTable from "../components/DataTable";
import { FilterBar } from "../components/FilterBar";

export default function Taxonomies() {
  const navigate = useNavigate();
  const [taxonomies, setTaxonomies] = useLocalStorage("cms.taxonomies", seedTaxonomies);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());

  const filtered = taxonomies.filter((t) => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  function createTaxonomy() {
    const id = `tax-${Date.now()}`;
    setTaxonomies([...taxonomies, { id, name: "New taxonomy", description: "", terms: [] }]);
    navigate(`/taxonomies/${id}`);
  }

  const columns = [
    {
      key: "name",
      header: "Name",
      sortValue: (r) => r.name,
      render: (r) => (
        <span className="inline-flex items-center gap-2 font-medium text-gray-900">
          <ListTree size={15} className="text-violet-600" />
          {r.name}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (r) => <span className="text-gray-500">{r.description || "—"}</span>,
    },
    {
      key: "terms",
      header: "Terms",
      sortValue: (r) => countTerms(r.terms),
      render: (r) => <span className="text-gray-500">{countTerms(r.terms)}</span>,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Taxonomies</h1>
        <button
          onClick={createTaxonomy}
          className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Plus size={15} /> Create new
        </button>
      </div>

      <div className="mb-4 max-w-md">
        <FilterBar search={search} onSearchChange={setSearch} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <DataTable
          columns={columns}
          rows={filtered}
          selected={selected}
          onSelectedChange={setSelected}
          onRowClick={(row) => navigate(`/taxonomies/${row.id}`)}
        />
      </div>
    </div>
  );
}
