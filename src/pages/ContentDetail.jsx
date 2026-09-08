import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Smartphone, Globe, Radio, Tv, Mail, MessageSquare, Clock, History, ArrowLeft, MessageCircle, X, Languages } from "lucide-react";
import { useLocalStorage } from "../lib/storage";
import {
  seedEntries, seedContentTypes, seedUsers, seedTaxonomies, seedMedia, LOCALE_LIST, LOCALE_LABELS, LOCALE_NAMES, normalizeEntryGroupId,
  DEFAULT_WORKFLOW_STEPS, normalizeWorkflowSteps, normalizeEntryStatus,
  DEFAULT_CHANNELS, normalizeChannels, ALL_CHANNELS, isAllChannels, resolvePublishedChannelIds, flattenTerms,
} from "../lib/seed";
import PageHeader from "../components/PageHeader";
import DetailField from "../components/DetailField";
import StatusPill from "../components/StatusPill";
import Avatar from "../components/Avatar";
import Modal from "../components/Modal";
import PreviewButton from "../components/PreviewButton";

const CHANNEL_ICONS = { smartphone: Smartphone, globe: Globe, radio: Radio, tv: Tv, mail: Mail, "message-square": MessageSquare };

function defaultScheduleValue() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatScheduled(iso) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Turns one key of an update() patch into a human-readable history line, or
// null if that key's new value doesn't actually differ from what's on the
// entry already (so blur-without-editing doesn't log a no-op change).
function describeChange(key, value, prevEntry, { workflowSteps, channels }) {
  switch (key) {
    case "title":
      return value !== prevEntry.title ? `Title changed to "${value}"` : null;
    case "body":
      return value !== (prevEntry.body ?? "") ? "Body updated" : null;
    case "status": {
      if (value === prevEntry.status) return null;
      const step = workflowSteps.find((s) => s.id === value);
      return `Status changed to "${step?.name ?? value}"`;
    }
    case "channels": {
      if (value === prevEntry.channels) return null;
      if (isAllChannels(value)) return "Channels set to All channels";
      const c = channels.find((c) => c.id === value);
      return `Channels set to "${c?.name ?? value}" only`;
    }
    case "scheduledPublishAt": {
      const prevValue = prevEntry.scheduledPublishAt ?? null;
      if (value === prevValue) return null;
      return value ? `Scheduled to publish on ${formatScheduled(value)}` : "Publish schedule cancelled";
    }
    case "fieldValues": {
      const prevValues = prevEntry.fieldValues ?? {};
      const changed = Object.keys(value).filter((k) => JSON.stringify(value[k]) !== JSON.stringify(prevValues[k]));
      return changed.length > 0 ? `Field "${changed[0]}" updated` : null;
    }
    default:
      return null;
  }
}

function fieldValueText(f, value, taxonomies, media) {
  if (f.type === "Taxonomy") {
    const taxonomy = taxonomies.find((t) => t.id === f.taxonomyId);
    const ids = value ?? [];
    if (!taxonomy || ids.length === 0) return "—";
    const flat = flattenTerms(taxonomy.terms);
    const names = ids.map((tid) => flat.find((t) => t.id === tid)?.name).filter(Boolean);
    return names.length > 0 ? names.join(", ") : "—";
  }
  if (f.type === "Boolean") return value ? "Yes" : "No";
  if (f.type === "Media") {
    const m = media.find((m) => m.id === value);
    return m?.name ?? "—";
  }
  return value || "—";
}

export default function ContentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useLocalStorage("cms.entries", seedEntries);
  const [defaultLocale] = useLocalStorage("cms.settings.defaultLocale", "en");
  const [contentTypes] = useLocalStorage("cms.contentTypes", seedContentTypes);
  const [rawWorkflowSteps] = useLocalStorage("cms.settings.workflowSteps", DEFAULT_WORKFLOW_STEPS);
  const workflowSteps = useMemo(() => normalizeWorkflowSteps(rawWorkflowSteps), [rawWorkflowSteps]);
  const [rawChannels] = useLocalStorage("cms.settings.channels", DEFAULT_CHANNELS);
  const channels = useMemo(() => normalizeChannels(rawChannels), [rawChannels]);
  const [taxonomies] = useLocalStorage("cms.taxonomies", seedTaxonomies);
  const [media] = useLocalStorage("cms.media", seedMedia);
  const users = seedUsers();

  const entry = entries.find((e) => e.id === id);
  const [title, setTitle] = useState(entry?.title ?? "");
  const [saveStatus, setSaveStatus] = useState("saved");
  const saveTimeoutRef = useRef(null);
  const [pendingPublish, setPendingPublish] = useState(false);
  const [publishMode, setPublishMode] = useState("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [historyMode, setHistoryMode] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState(null); // null = current live version
  const [commentDraft, setCommentDraft] = useState("");
  const [langDialogOpen, setLangDialogOpen] = useState(false);

  useEffect(() => () => clearTimeout(saveTimeoutRef.current), []);

  // Self-heal entries whose status predates the Workflow feature (or names a
  // step that no longer exists), same as the Content list page.
  useEffect(() => {
    if (!entry) return;
    const normalized = normalizeEntryStatus(entry.status, workflowSteps);
    if (normalized !== entry.status) {
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status: normalized } : e)));
    }
  }, [entry, workflowSteps, id]);

  // Self-heal entries that predate groupId (language versions were a single
  // field back then) so sibling lookups below always have something to key on.
  useEffect(() => {
    const needsFix = entries.some((e) => !e.groupId);
    if (needsFix) setEntries((prev) => prev.map((e) => ({ ...e, groupId: normalizeEntryGroupId(e) })));
  }, [entries]);

  const publishStepId = workflowSteps[workflowSteps.length - 1]?.id;

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
    const changeSummaries = Object.keys(patch)
      .map((key) => describeChange(key, patch[key], entry, { workflowSteps, channels }))
      .filter(Boolean);

    const merged = { ...entry, ...patch };
    const { history: _omit, ...snapshot } = merged;
    const newHistoryEntry = changeSummaries.length > 0
      ? [{ id: `h${Date.now()}`, timestamp: new Date().toISOString(), userId: users[0]?.id, summary: changeSummaries.join(", "), snapshot }]
      : [];

    setEntries(entries.map((e) =>
      e.id === id ? { ...merged, history: [...(e.history ?? []), ...newHistoryEntry] } : e
    ));
    setSaveStatus("saving");
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setSaveStatus("saved"), 600);
  }

  function setFieldValue(fieldName, value) {
    update({ fieldValues: { ...(entry.fieldValues ?? {}), [fieldName]: value } });
  }

  function toggleTaxonomyTerm(fieldName, termId) {
    const current = entry.fieldValues?.[fieldName] ?? [];
    const next = current.includes(termId) ? current.filter((t) => t !== termId) : [...current, termId];
    setFieldValue(fieldName, next);
  }

  function selectChannel(channelId) {
    update({ channels: channelId });
  }

  function setAllChannels() {
    update({ channels: ALL_CHANNELS });
  }

  function handleStatusChange(value) {
    if (value === publishStepId && value !== displayStatus) {
      setPublishMode("now");
      setScheduledAt(defaultScheduleValue());
      setPendingPublish(true);
      return;
    }
    update({ status: value });
  }

  function confirmPublish() {
    if (publishMode === "schedule" && scheduledAt) {
      update({ scheduledPublishAt: new Date(scheduledAt).toISOString() });
    } else {
      update({ status: publishStepId, scheduledPublishAt: null });
    }
    setPendingPublish(false);
  }

  function addComment() {
    const text = commentDraft.trim();
    if (!text) return;
    const comment = { id: `cm${Date.now()}`, userId: users[0]?.id, text, timestamp: new Date().toISOString() };
    update({ comments: [...(entry.comments ?? []), comment] });
    setCommentDraft("");
  }

  function deleteComment(commentId) {
    update({ comments: (entry.comments ?? []).filter((c) => c.id !== commentId) });
  }

  // A language version is a fully independent entry (own workflow, history,
  // comments), linked to its siblings only by groupId.
  function createTranslation(locale) {
    const newId = `e${Date.now()}`;
    const newEntry = {
      id: newId,
      groupId,
      title: entry.title,
      contentTypeId: entry.contentTypeId,
      status: workflowSteps[0]?.id,
      locale,
      channels: entry.channels,
      updatedAt: new Date().toISOString(),
      updatedBy: users[0]?.id,
    };
    setEntries([
      {
        ...newEntry,
        history: [{ id: `h${Date.now()}`, timestamp: new Date().toISOString(), userId: users[0]?.id, summary: "Entry created", snapshot: newEntry }],
      },
      ...entries,
    ]);
    setLangDialogOpen(false);
    navigate(`/content/${newId}`);
  }

  function openHistory() {
    setHistoryMode(true);
    setSelectedVersionId(null);
  }

  function exitHistory() {
    setHistoryMode(false);
    setSelectedVersionId(null);
  }

  const type = contentTypes.find((t) => t.id === entry.contentTypeId);
  const extraFields = (type?.fields ?? []).filter((f) => !["title", "slug", "body"].includes(f.name));
  const author = users.find((u) => u.id === entry.updatedBy);
  const displayStatus = normalizeEntryStatus(entry.status, workflowSteps);
  const currentStep = workflowSteps.find((s) => s.id === displayStatus);
  const publishedChannelIds = resolvePublishedChannelIds(entry.channels, channels);
  const entryIsAllChannels = isAllChannels(entry.channels);

  const groupId = normalizeEntryGroupId(entry);
  const siblings = entries.filter((e) => e.id !== entry.id && normalizeEntryGroupId(e) === groupId);

  const history = entry.history ?? [];
  const comments = entry.comments ?? [];
  const selectedVersion = selectedVersionId ? history.find((h) => h.id === selectedVersionId) : null;
  const viewEntry = selectedVersion ? selectedVersion.snapshot : entry;
  const viewStep = workflowSteps.find((s) => s.id === normalizeEntryStatus(viewEntry.status, workflowSteps));
  const viewChannelIds = resolvePublishedChannelIds(viewEntry.channels, channels);
  const viewIsAllChannels = isAllChannels(viewEntry.channels);
  const viewAuthor = users.find((u) => u.id === viewEntry.updatedBy);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <PageHeader
        crumbs={["Content", title || entry.title]}
        onBack={() => navigate(-1)}
        saveStatus={saveStatus}
        actions={
          <PreviewButton
            entryId={entry.id}
            channels={channels}
            defaultChannelId={channels.find((c) => c.icon === "globe")?.id ?? channels[0]?.id}
          />
        }
      />

      <div className="flex gap-6">
        {historyMode ? (
          <div className="flex-1 space-y-5 rounded-lg border border-gray-200 bg-white p-5">
            <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-200">
              Viewing a read-only {selectedVersion ? "past version" : "snapshot of the current version"}. Use Back to resume editing.
            </div>
            <DetailField label="Title">
              <p className="text-sm text-gray-900">{viewEntry.title}</p>
            </DetailField>
            <DetailField label="Slug">
              <p className="text-sm text-gray-500">/{viewEntry.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}</p>
            </DetailField>
            <DetailField label="Body">
              <p className="whitespace-pre-wrap text-sm text-gray-700">{viewEntry.body || "—"}</p>
            </DetailField>
            {extraFields.map((f) => (
              <DetailField key={f.name} label={f.name}>
                <p className="text-sm text-gray-700">{fieldValueText(f, viewEntry.fieldValues?.[f.name], taxonomies, media)}</p>
              </DetailField>
            ))}
            <DetailField label="Status">
              <StatusPill status={viewStep?.name ?? viewEntry.status} color={viewStep?.color} />
            </DetailField>
            <DetailField label="Channels">
              {viewIsAllChannels ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-300">
                  All channels
                </span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {channels
                    .filter((c) => viewChannelIds.includes(c.id))
                    .map((c) => (
                      <StatusPill key={c.id} status={c.name} color={c.color} />
                    ))}
                </div>
              )}
            </DetailField>
            <DetailField label="Locale">
              <p className="text-sm uppercase text-gray-700">{viewEntry.locale}</p>
            </DetailField>
            <DetailField label="Last updated by">
              <span className="inline-flex items-center gap-2">
                <Avatar user={viewAuthor} size={20} />
                <span className="text-sm text-gray-700">{viewAuthor?.name}</span>
              </span>
            </DetailField>
          </div>
        ) : (
          <div className="flex-1 space-y-5 rounded-lg border border-gray-200 bg-white p-5">
            <DetailField label="Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => update({ title: title.trim() || entry.title })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
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
                className="w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
              />
            </DetailField>

            {extraFields.map((f) => {
              const value = entry.fieldValues?.[f.name];

              if (f.type === "Taxonomy") {
                const taxonomy = taxonomies.find((t) => t.id === f.taxonomyId);
                const selected = value ?? [];
                return (
                  <DetailField key={f.name} label={f.name}>
                    {taxonomy ? (
                      <div className="max-h-48 space-y-0.5 overflow-y-auto rounded-md border border-gray-200 bg-white p-2">
                        {flattenTerms(taxonomy.terms).map((t) => (
                          <label
                            key={t.id}
                            className="flex items-center gap-2 rounded px-1.5 py-1 text-sm text-gray-700 hover:bg-gray-50"
                            style={{ paddingLeft: 6 + t.depth * 16 }}
                          >
                            <input
                              type="checkbox"
                              checked={selected.includes(t.id)}
                              onChange={() => toggleTaxonomyTerm(f.name, t.id)}
                              className="h-3.5 w-3.5 rounded border-gray-300 accent-violet-600"
                            />
                            {t.name}
                          </label>
                        ))}
                        {taxonomy.terms.length === 0 && (
                          <p className="px-1.5 py-1 text-sm text-gray-400">This taxonomy has no terms yet.</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No taxonomy selected for this field.</p>
                    )}
                  </DetailField>
                );
              }

              if (f.type === "Rich text") {
                return (
                  <DetailField key={f.name} label={f.name}>
                    <textarea
                      rows={4}
                      defaultValue={value ?? ""}
                      onBlur={(e) => setFieldValue(f.name, e.target.value)}
                      className="w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                    />
                  </DetailField>
                );
              }

              if (f.type === "Number") {
                return (
                  <DetailField key={f.name} label={f.name}>
                    <input
                      type="number"
                      value={value ?? ""}
                      onChange={(e) => setFieldValue(f.name, e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                    />
                  </DetailField>
                );
              }

              if (f.type === "Boolean") {
                return (
                  <DetailField key={f.name} label={f.name}>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={value ?? false}
                        onChange={(e) => setFieldValue(f.name, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 accent-violet-600"
                      />
                      {value ? "Yes" : "No"}
                    </label>
                  </DetailField>
                );
              }

              if (f.type === "Media") {
                return (
                  <DetailField key={f.name} label={f.name}>
                    <select
                      value={value ?? ""}
                      onChange={(e) => setFieldValue(f.name, e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm"
                    >
                      <option value="">None</option>
                      {media.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </DetailField>
                );
              }

              return (
                <DetailField key={f.name} label={f.name}>
                  <input
                    defaultValue={value ?? ""}
                    onBlur={(e) => setFieldValue(f.name, e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                  />
                </DetailField>
              );
            })}
          </div>
        )}

        {historyMode ? (
          <div className="w-72 shrink-0 space-y-3 rounded-lg border border-gray-200 bg-white p-5">
            <button
              onClick={exitHistory}
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-gray-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              <ArrowLeft size={15} /> Back
            </button>

            <p className="pt-1 text-xs font-medium uppercase tracking-wide text-gray-400">Versions</p>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedVersionId(null)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left ${
                  selectedVersionId === null ? "bg-violet-50 ring-1 ring-inset ring-violet-200" : "hover:bg-gray-50"
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Clock size={12} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900">Current version</span>
                  <span className="block text-xs text-gray-400">{author?.name}</span>
                </span>
              </button>

              {[...history].reverse().map((h) => {
                const changedBy = users.find((u) => u.id === h.userId);
                const active = selectedVersionId === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => setSelectedVersionId(h.id)}
                    className={`flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left ${
                      active ? "bg-violet-50 ring-1 ring-inset ring-violet-200" : "hover:bg-gray-50"
                    }`}
                  >
                    <Avatar user={changedBy} size={22} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900">{formatScheduled(h.timestamp)}</span>
                      <span className="block truncate text-xs text-gray-400">{changedBy?.name}</span>
                    </span>
                  </button>
                );
              })}

              {history.length === 0 && (
                <p className="px-2.5 py-4 text-center text-sm text-gray-400">No earlier versions yet.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="w-72 shrink-0 space-y-5 rounded-lg border border-gray-200 bg-white p-5">
            <DetailField label="Status">
              <select
                value={displayStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm"
              >
                {workflowSteps.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <div className="mt-2">
                <StatusPill status={currentStep?.name ?? entry.status} color={currentStep?.color} />
              </div>
              {entry.scheduledPublishAt && (
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                  <Clock size={12} />
                  Scheduled for {formatScheduled(entry.scheduledPublishAt)}
                  <button
                    onClick={() => update({ scheduledPublishAt: null })}
                    className="font-medium text-violet-600 hover:underline"
                  >
                    Cancel
                  </button>
                </p>
              )}
            </DetailField>
            <DetailField label="Content type">
              <span className="text-sm text-gray-700">{type?.name}</span>
            </DetailField>
            <DetailField label="Channels">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={setAllChannels}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors"
                  style={
                    entryIsAllChannels
                      ? { backgroundColor: "#111827", color: "#fff", "--tw-ring-color": "#111827" }
                      : { backgroundColor: "transparent", color: "#9ca3af", "--tw-ring-color": "#d1d5db" }
                  }
                >
                  All channels
                </button>
                {channels.map((c) => {
                  const Icon = CHANNEL_ICONS[c.icon] || Radio;
                  const active = publishedChannelIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => selectChannel(c.id)}
                      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors"
                      style={
                        active
                          ? { backgroundColor: c.color, color: "#fff", "--tw-ring-color": c.color }
                          : { backgroundColor: "transparent", color: "#9ca3af", "--tw-ring-color": "#d1d5db" }
                      }
                    >
                      <Icon size={12} />
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </DetailField>
            <DetailField label="Locale">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium uppercase text-gray-600">
                {entry.locale}
              </span>
              {entry.locale === defaultLocale && (
                <span className="ml-1.5 text-xs text-gray-400">Default language</span>
              )}
            </DetailField>
            <button
              onClick={() => setLangDialogOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Languages size={14} /> Languages
              <span className="rounded-full bg-gray-100 px-1.5 text-xs font-normal text-gray-500">
                {siblings.length + 1}/{LOCALE_LIST.length}
              </span>
            </button>
            <DetailField label="Last updated by">
              <span className="inline-flex items-center gap-2">
                <Avatar user={author} size={20} />
                <span className="text-sm text-gray-700">{author?.name}</span>
              </span>
            </DetailField>
            <button
              onClick={openHistory}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <History size={14} /> Version history
              {history.length > 0 && (
                <span className="rounded-full bg-gray-100 px-1.5 text-xs font-normal text-gray-500">
                  {history.length}
                </span>
              )}
            </button>

            <div className="border-t border-gray-100 pt-5">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
                <MessageCircle size={13} /> Comments
                {comments.length > 0 && (
                  <span className="rounded-full bg-gray-100 px-1.5 text-[11px] font-normal normal-case text-gray-500">
                    {comments.length}
                  </span>
                )}
              </p>

              <div className="space-y-3">
                {[...comments].reverse().map((c) => {
                  const commenter = users.find((u) => u.id === c.userId);
                  return (
                    <div key={c.id} className="group flex items-start gap-2">
                      <Avatar user={commenter} size={22} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="truncate text-sm font-medium text-gray-900">{commenter?.name}</span>
                          <span className="shrink-0 text-xs text-gray-400">{formatScheduled(c.timestamp)}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-gray-700">{c.text}</p>
                      </div>
                      <button
                        onClick={() => deleteComment(c.id)}
                        className="shrink-0 text-gray-300 opacity-0 hover:text-gray-600 group-hover:opacity-100"
                        title="Delete comment"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
                {comments.length === 0 && <p className="text-sm text-gray-400">No comments yet.</p>}
              </div>

              <div className="mt-3 flex items-start gap-2">
                <Avatar user={users[0]} size={22} />
                <div className="min-w-0 flex-1">
                  <textarea
                    rows={2}
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        addComment();
                      }
                    }}
                    placeholder="Leave a comment…"
                    className="w-full resize-none rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:border-violet-400 focus:outline-none"
                  />
                  <div className="mt-1.5 flex justify-end">
                    <button
                      onClick={addComment}
                      disabled={!commentDraft.trim()}
                      className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={langDialogOpen}
        onClose={() => setLangDialogOpen(false)}
        title="Languages"
        footer={
          <button
            onClick={() => setLangDialogOpen(false)}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
        }
      >
        <div className="space-y-2">
          {LOCALE_LIST.map((l) => {
            const isCurrent = l === entry.locale;
            const sibling = isCurrent ? entry : siblings.find((s) => s.locale === l);
            const step = sibling ? workflowSteps.find((s) => s.id === normalizeEntryStatus(sibling.status, workflowSteps)) : null;
            return (
              <div
                key={l}
                className={`flex items-center justify-between rounded-md border px-3 py-2.5 ${
                  isCurrent ? "border-violet-200 bg-violet-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 shrink-0 text-sm font-semibold text-gray-500">{LOCALE_LABELS[l]}</span>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                      {LOCALE_NAMES[l] ?? l}
                      {l === defaultLocale && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-500">Default</span>
                      )}
                    </p>
                    {sibling ? (
                      <div className="mt-0.5">
                        <StatusPill status={step?.name ?? sibling.status} color={step?.color} />
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No version in this language yet</p>
                    )}
                  </div>
                </div>
                {isCurrent ? (
                  <span className="text-xs font-medium text-violet-600">Current</span>
                ) : sibling ? (
                  <button
                    onClick={() => { setLangDialogOpen(false); navigate(`/content/${sibling.id}`); }}
                    className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Open
                  </button>
                ) : (
                  <button
                    onClick={() => createTranslation(l)}
                    className="rounded-md bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
                  >
                    Create
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Modal>

      <Modal
        open={pendingPublish}
        onClose={() => setPendingPublish(false)}
        title={`Publish "${entry.title}"?`}
        footer={
          <>
            <button
              onClick={() => setPendingPublish(false)}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={confirmPublish}
              className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
            >
              OK
            </button>
          </>
        }
      >
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setPublishMode("now")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors ${
              publishMode === "now" ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-gray-600 ring-gray-300 hover:bg-gray-50"
            }`}
          >
            Publish now
          </button>
          <button
            onClick={() => setPublishMode("schedule")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors ${
              publishMode === "schedule" ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-gray-600 ring-gray-300 hover:bg-gray-50"
            }`}
          >
            Schedule
          </button>
        </div>

        {publishMode === "schedule" && (
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Publish date &amp; time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:border-violet-400 focus:outline-none"
            />
          </div>
        )}

        <p className="mb-3">
          {publishMode === "schedule"
            ? "At the scheduled time, this entry will go live on:"
            : "This entry will go live now on:"}
        </p>
        <div className="mb-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">Channels</p>
          {entryIsAllChannels ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-300">
              All channels
            </span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {channels
                .filter((c) => publishedChannelIds.includes(c.id))
                .map((c) => (
                  <StatusPill key={c.id} status={c.name} color={c.color} />
                ))}
              {publishedChannelIds.length === 0 && (
                <span className="text-xs text-gray-400">No channels selected</span>
              )}
            </div>
          )}
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">Locale</p>
          <span className="text-sm font-medium uppercase text-gray-700">{entry.locale}</span>
        </div>
      </Modal>
    </div>
  );
}
