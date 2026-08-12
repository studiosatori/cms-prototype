import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLocalStorage } from "../lib/storage";
import { seedEntries, seedContentTypes, seedUsers, LOCALE_LIST, DEFAULT_WORKFLOW_STEPS, normalizeWorkflowSteps } from "../lib/seed";
import PageHeader from "../components/PageHeader";
import DetailField from "../components/DetailField";
import StatusPill from "../components/StatusPill";
import Avatar from "../components/Avatar";

export default function ContentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useLocalStorage("cms.entries", seedEntries);
  const [contentTypes] = useLocalStorage("cms.contentTypes", seedContentTypes);
  const [rawWorkflowSteps] = useLocalStorage("cms.settings.workflowSteps", DEFAULT_WORKFLOW_STEPS);
  const workflowSteps = useMemo(() => normalizeWorkflowSteps(rawWorkflowSteps), [rawWorkflowSteps]);
  const users = seedUsers();

  const entry = entries.find((e) => e.id === id);
  const [title, setTitle] = useState(entry?.title ?? "");

  if (!entry) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Entry not found.</p>
        <button onClick={() => navigate("/content")} className="mt-2 text-sm font-medium text-violet-600 hover:text-violet-700">
          Back to All content
        </button>
      </div>
    );
  }

  function update(patch) {
    setEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  const type = contentTypes.find((t) => t.id === entry.contentTypeId);
  const author = users.find((u) => u.id === entry.updatedBy);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <PageHeader crumbs={["Content", title || entry.title]} onBack={() => navigate(-1)} />

      <div className="flex gap-6">
        <div className="flex-1 space-y-5 rounded-lg border border-gray-200 bg-white p-5">
          <DetailField label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => update({ title: title.trim() || entry.title })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
            />
          </DetailField>
          <DetailField label="Slug">
            <input
              disabled
              value={`/${entry.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
          </DetailField>
          <DetailField label="Body">
            <textarea
              rows={10}
              placeholder="Rich text content goes here…"
              defaultValue={entry.body ?? ""}
              onBlur={(e) => update({ body: e.target.value })}
              className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
            />
          </DetailField>
        </div>

        <div className="w-72 shrink-0 space-y-5 rounded-lg border border-gray-200 bg-white p-5">
          <DetailField label="Status">
            <select
              value={entry.status}
              onChange={(e) => update({ status: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
            >
              {workflowSteps.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
            <div className="mt-2">
              <StatusPill status={entry.status} color={workflowSteps.find((s) => s.name === entry.status)?.color} />
            </div>
          </DetailField>
          <DetailField label="Content type">
            <span className="text-sm text-gray-700">{type?.name}</span>
          </DetailField>
          <DetailField label="Locale">
            <select
              value={entry.locale}
              onChange={(e) => update({ locale: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm uppercase"
            >
              {LOCALE_LIST.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </DetailField>
          <DetailField label="Last updated by">
            <span className="inline-flex items-center gap-2">
              <Avatar user={author} size={20} />
              <span className="text-sm text-gray-700">{author?.name}</span>
            </span>
          </DetailField>
        </div>
      </div>
    </div>
  );
}
