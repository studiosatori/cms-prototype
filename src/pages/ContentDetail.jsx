import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Smartphone, Globe, Radio, Tv, Mail, MessageSquare, Clock } from "lucide-react";
import { useLocalStorage } from "../lib/storage";
import {
  seedEntries, seedContentTypes, seedUsers, LOCALE_LIST, DEFAULT_WORKFLOW_STEPS, normalizeWorkflowSteps, normalizeEntryStatus,
  DEFAULT_CHANNELS, normalizeChannels, ALL_CHANNELS, isAllChannels, resolvePublishedChannelIds,
} from "../lib/seed";
import PageHeader from "../components/PageHeader";
import DetailField from "../components/DetailField";
import StatusPill from "../components/StatusPill";
import Avatar from "../components/Avatar";
import Modal from "../components/Modal";

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

export default function ContentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useLocalStorage("cms.entries", seedEntries);
  const [contentTypes] = useLocalStorage("cms.contentTypes", seedContentTypes);
  const [rawWorkflowSteps] = useLocalStorage("cms.settings.workflowSteps", DEFAULT_WORKFLOW_STEPS);
  const workflowSteps = useMemo(() => normalizeWorkflowSteps(rawWorkflowSteps), [rawWorkflowSteps]);
  const [rawChannels] = useLocalStorage("cms.settings.channels", DEFAULT_CHANNELS);
  const channels = useMemo(() => normalizeChannels(rawChannels), [rawChannels]);
  const users = seedUsers();

  const entry = entries.find((e) => e.id === id);
  const [title, setTitle] = useState(entry?.title ?? "");
  const [saveStatus, setSaveStatus] = useState("saved");
  const saveTimeoutRef = useRef(null);
  const [pendingPublish, setPendingPublish] = useState(false);
  const [publishMode, setPublishMode] = useState("now");
  const [scheduledAt, setScheduledAt] = useState("");

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
    setEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    setSaveStatus("saving");
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setSaveStatus("saved"), 600);
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

  const type = contentTypes.find((t) => t.id === entry.contentTypeId);
  const author = users.find((u) => u.id === entry.updatedBy);
  const displayStatus = normalizeEntryStatus(entry.status, workflowSteps);
  const currentStep = workflowSteps.find((s) => s.id === displayStatus);
  const publishedChannelIds = resolvePublishedChannelIds(entry.channels, channels);
  const entryIsAllChannels = isAllChannels(entry.channels);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <PageHeader crumbs={["Content", title || entry.title]} onBack={() => navigate(-1)} saveStatus={saveStatus} />

      <div className="flex gap-6">
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
        </div>

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
            <select
              value={entry.locale}
              onChange={(e) => update({ locale: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm uppercase"
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
