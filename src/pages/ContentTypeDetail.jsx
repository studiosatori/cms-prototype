import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useLocalStorage } from "../lib/storage";
import { useI18n } from "../lib/i18n";
import { seedContentTypes, seedTaxonomies, FIELD_TYPE_LIST } from "../lib/seed";
import { TYPE_ICON_KEYS, typeIcon } from "../lib/typeIcons";
import PageHeader from "../components/PageHeader";
import DetailField from "../components/DetailField";

export default function ContentTypeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [contentTypes, setContentTypes] = useLocalStorage("cms.contentTypes", seedContentTypes);
  const [taxonomies] = useLocalStorage("cms.taxonomies", seedTaxonomies);

  const type = contentTypes.find((ct) => ct.id === id);
  const [name, setName] = useState(type?.name ?? "");
  const [saveStatus, setSaveStatus] = useState("saved");
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(saveTimeoutRef.current), []);

  if (!type) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">{t("Content type not found.")}</p>
        <button onClick={() => navigate("/content-types")} className="mt-2 text-sm font-medium text-violet-600 hover:text-violet-700">
          {t("Back to Content types")}
        </button>
      </div>
    );
  }

  function update(patch) {
    setContentTypes(contentTypes.map((ct) => (ct.id === id ? { ...ct, ...patch } : ct)));
    setSaveStatus("saving");
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setSaveStatus("saved"), 600);
  }

  function addField() {
    update({ fields: [...type.fields, { name: `field${type.fields.length + 1}`, label: "New field", type: "Text" }] });
  }

  function removeField(i) {
    update({ fields: type.fields.filter((_, idx) => idx !== i) });
  }

  // Dropping a field card onto another moves it to that position; the editor
  // renders a type's fields in this order.
  function moveField(from, to) {
    if (from !== null && from !== to) {
      const next = [...type.fields];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      update({ fields: next });
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  function updateField(i, patch) {
    update({ fields: type.fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) });
  }

  
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <PageHeader crumbs={["Content types", name || type.name]} onBack={() => navigate(-1)} saveStatus={saveStatus} />

      <div className="flex gap-6">
        <div className="flex-1 space-y-5 rounded-lg border border-gray-300 bg-white p-5">
          <DetailField label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => update({ name: name.trim() || type.name })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
            />
          </DetailField>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-400">{t("Fields")}</label>
              <button onClick={addField} className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700">
                <Plus size={13} /> {t("Add field")}
              </button>
            </div>
            <div className="space-y-2">
              {type.fields.map((f, i) => (
                <div
                  key={i}
                  onDragOver={(e) => { if (dragIndex !== null) { e.preventDefault(); if (overIndex !== i) setOverIndex(i); } }}
                  onDrop={(e) => { e.preventDefault(); moveField(dragIndex, i); }}
                  className={`space-y-2 rounded-md border bg-white p-2 ${dragIndex === i ? "opacity-40" : ""} ${
                    overIndex === i && dragIndex !== null && dragIndex !== i ? "border-gray-800 ring-2 ring-gray-800" : "border-gray-300"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      draggable
                      title={t("Drag to reorder")}
                      aria-label={t("Drag to reorder")}
                      onDragStart={(e) => {
                        setDragIndex(i);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setDragImage(e.currentTarget.closest("[class*=rounded-md]"), 12, 12);
                      }}
                      onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                      className="flex h-7 w-5 shrink-0 cursor-grab items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing"
                    >
                      <GripVertical size={15} />
                    </span>
                    <input
                      value={f.label ?? f.name}
                      onChange={(e) => updateField(i, { label: e.target.value })}
                      aria-label={t("Label")}
                      className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                    />
                    <select
                      value={f.type}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        updateField(i, {
                          type: nextType,
                          taxonomyId: nextType === "Taxonomy" ? (f.taxonomyId ?? taxonomies[0]?.id) : undefined,
                        });
                      }}
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                    >
                      {FIELD_TYPE_LIST.map((ft) => (
                        <option key={ft} value={ft}>{t(ft)}</option>
                      ))}
                    </select>
                    {f.type === "Taxonomy" && (
                      <select
                        value={f.taxonomyId ?? ""}
                        onChange={(e) => updateField(i, { taxonomyId: e.target.value })}
                        className="rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-sm text-violet-700"
                      >
                        <option value="" disabled>{t("Choose taxonomy…")}</option>
                        {taxonomies.map((tx) => (
                          <option key={tx.id} value={tx.id}>{tx.name}</option>
                        ))}
                      </select>
                    )}
                    <button onClick={() => removeField(i)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">{f.name}</code>
                    {f.group && <span>{t(f.group)}</span>}
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={Boolean(f.required)}
                        onChange={(e) => updateField(i, { required: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-gray-300 accent-violet-600"
                      />
                      {f.required === "conditional" ? t("Required in some cases") : t("Required")}
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={Boolean(f.localized)}
                        onChange={(e) => updateField(i, { localized: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-gray-300 accent-violet-600"
                      />
                      {f.localized === "partly" ? t("Partly localized") : t("Localized")}
                    </label>
                    {f.type === "Taxonomy" && (
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={f.multiple !== false}
                          onChange={(e) => updateField(i, { multiple: e.target.checked })}
                          className="h-3.5 w-3.5 rounded border-gray-300 accent-violet-600"
                        />
                        {t("Allow several terms")}
                      </label>
                    )}
                  </div>
                </div>
              ))}
              {type.fields.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400">{t("No fields yet.")}</p>
              )}
            </div>
          </div>
        </div>

        <div className="w-72 shrink-0 space-y-5 rounded-lg border border-gray-300 bg-white p-5">
          <DetailField label="Icon">
            <div className="grid grid-cols-6 gap-1.5">
              {TYPE_ICON_KEYS.map((key) => {
                const Icon = typeIcon(key);
                const active = (type.icon ?? "file-text") === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => update({ icon: key })}
                    aria-label={key}
                    aria-pressed={active}
                    title={key}
                    className={`flex h-9 items-center justify-center rounded-md border ${
                      active ? "border-gray-700 bg-gray-100 text-gray-900" : "border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          </DetailField>
          <DetailField label="Entries using this type">
            <span className="text-sm text-gray-700">{type.entryCount}</span>
          </DetailField>
        </div>
      </div>
    </div>
  );
}
