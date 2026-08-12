import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Trash2, FileText, Gem, Newspaper } from "lucide-react";
import { useLocalStorage } from "../lib/storage";
import { seedContentTypes, FIELD_TYPE_LIST } from "../lib/seed";
import PageHeader from "../components/PageHeader";
import DetailField from "../components/DetailField";

const TYPE_ICONS = { "file-text": FileText, gem: Gem, newspaper: Newspaper };

export default function ContentTypeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contentTypes, setContentTypes] = useLocalStorage("cms.contentTypes", seedContentTypes);

  const type = contentTypes.find((t) => t.id === id);
  const [name, setName] = useState(type?.name ?? "");

  if (!type) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Content type not found.</p>
        <button onClick={() => navigate("/content-types")} className="mt-2 text-sm font-medium text-violet-600 hover:text-violet-700">
          Back to Content types
        </button>
      </div>
    );
  }

  function update(patch) {
    setContentTypes(contentTypes.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function addField() {
    update({ fields: [...type.fields, { name: "newField", type: "Text" }] });
  }

  function removeField(i) {
    update({ fields: type.fields.filter((_, idx) => idx !== i) });
  }

  function updateField(i, patch) {
    update({ fields: type.fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) });
  }

  const Icon = TYPE_ICONS[type.icon] || FileText;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <PageHeader crumbs={["Content types", name || type.name]} onBack={() => navigate(-1)} />

      <div className="flex gap-6">
        <div className="flex-1 space-y-5 rounded-lg border border-gray-200 bg-white p-5">
          <DetailField label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => update({ name: name.trim() || type.name })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
            />
          </DetailField>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-400">Fields</label>
              <button onClick={addField} className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700">
                <Plus size={13} /> Add field
              </button>
            </div>
            <div className="space-y-2">
              {type.fields.map((f, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md border border-gray-200 p-2">
                  <input
                    value={f.name}
                    onChange={(e) => updateField(i, { name: e.target.value })}
                    className="flex-1 rounded-md border border-gray-200 px-2 py-1 text-sm"
                  />
                  <select
                    value={f.type}
                    onChange={(e) => updateField(i, { type: e.target.value })}
                    className="rounded-md border border-gray-200 px-2 py-1 text-sm"
                  >
                    {FIELD_TYPE_LIST.map((ft) => (
                      <option key={ft} value={ft}>{ft}</option>
                    ))}
                  </select>
                  <button onClick={() => removeField(i)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {type.fields.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400">No fields yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="w-72 shrink-0 space-y-5 rounded-lg border border-gray-200 bg-white p-5">
          <DetailField label="Icon">
            <Icon size={20} style={{ color: type.color }} />
          </DetailField>
          <DetailField label="Entries using this type">
            <span className="text-sm text-gray-700">{type.entryCount}</span>
          </DetailField>
        </div>
      </div>
    </div>
  );
}
