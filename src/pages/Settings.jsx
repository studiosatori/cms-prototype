import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUp, ArrowDown, Trash2, Plus, Check } from "lucide-react";
import { useLocalStorage } from "../lib/storage";
import { seedUsers, DEFAULT_WORKFLOW_STEPS, normalizeWorkflowSteps, WORKFLOW_COLOR_PALETTE } from "../lib/seed";
import DataTable from "../components/DataTable";
import Avatar from "../components/Avatar";

const TABS = [
  { id: "general", label: "General" },
  { id: "workflow", label: "Workflow" },
  { id: "users", label: "Users & roles" },
  { id: "api", label: "API keys" },
];

const ROLES = ["Admin", "Editor", "Viewer"];

const API_KEYS = [
  { id: "k1", name: "Production", prefix: "sk_live_4f2a…", createdAt: "2026-06-02", lastUsed: "2026-08-11" },
  { id: "k2", name: "Staging", prefix: "sk_test_91bd…", createdAt: "2026-05-14", lastUsed: "2026-08-09" },
  { id: "k3", name: "Local dev", prefix: "sk_test_02ee…", createdAt: "2026-07-30", lastUsed: "2026-08-12" },
];

function GeneralPanel() {
  const [name, setName] = useLocalStorage("cms.settings.workspaceName", "Cargo Workspace");
  const [locale, setLocale] = useLocalStorage("cms.settings.defaultLocale", "en");

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Workspace name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Default locale</label>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
        >
          <option value="en">English (en)</option>
          <option value="cs">Czech (cs)</option>
          <option value="de">German (de)</option>
        </select>
      </div>
      <button className="rounded-md bg-[#8a6d0d] px-4 py-2 text-sm font-medium text-white hover:bg-[#6b5509]">
        Save changes
      </button>
    </div>
  );
}

function WorkflowPanel() {
  const [rawSteps, setSteps] = useLocalStorage("cms.settings.workflowSteps", DEFAULT_WORKFLOW_STEPS);
  const steps = useMemo(() => normalizeWorkflowSteps(rawSteps), [rawSteps]);

  useEffect(() => {
    if (rawSteps.some((s) => typeof s === "string" || !s.color)) setSteps(steps);
  }, [rawSteps, steps]);

  function updateStep(i, patch) {
    setSteps(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function moveStep(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    setSteps(next);
  }

  function removeStep(i) {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, idx) => idx !== i));
  }

  function addStep() {
    setSteps([...steps, { id: `step-${Date.now()}`, name: `Step ${steps.length + 1}`, color: WORKFLOW_COLOR_PALETTE[steps.length % WORKFLOW_COLOR_PALETTE.length] }]);
  }

  return (
    <div className="max-w-lg">
      <p className="mb-4 text-sm text-gray-500">
        Define the stages content moves through from draft to published, in order, with a color for each.
      </p>

      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        {steps.map((s, i) => (
          <span key={s.id} className="flex items-center gap-1.5">
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset"
              style={{ backgroundColor: s.color + "1a", color: s.color, "--tw-ring-color": s.color + "40" }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name || `Step ${i + 1}`}
            </span>
            {i < steps.length - 1 && <ArrowRight size={12} className="text-gray-300" />}
          </span>
        ))}
      </div>

      <div className="space-y-2">
        {steps.map((s, i) => (
          <div key={s.id} className="space-y-2 rounded-md border border-gray-200 p-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                {i + 1}
              </span>
              <input
                value={s.name}
                onChange={(e) => updateStep(i, { name: e.target.value })}
                className="flex-1 rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-violet-400 focus:outline-none"
              />
              <button
                onClick={() => moveStep(i, -1)}
                disabled={i === 0}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
              >
                <ArrowUp size={14} />
              </button>
              <button
                onClick={() => moveStep(i, 1)}
                disabled={i === steps.length - 1}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
              >
                <ArrowDown size={14} />
              </button>
              <button
                onClick={() => removeStep(i)}
                disabled={steps.length <= 1}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-30"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex items-center gap-1.5 pl-8">
              {WORKFLOW_COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => updateStep(i, { color: c })}
                  title={c}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-black/10"
                  style={{ backgroundColor: c }}
                >
                  {s.color === c && <Check size={12} className="text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={addStep} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700">
        <Plus size={14} /> Add step
      </button>
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useLocalStorage("cms.settings.users", () =>
    seedUsers().map((u, i) => ({ ...u, role: ROLES[i % ROLES.length] }))
  );
  const [selected, setSelected] = useState(new Set());

  function setRole(id, role) {
    setUsers(users.map((u) => (u.id === id ? { ...u, role } : u)));
  }

  const columns = [
    {
      key: "name",
      header: "Name",
      sortValue: (r) => r.name,
      render: (r) => (
        <span className="inline-flex items-center gap-2.5">
          <Avatar user={r} size={24} />
          <span>
            <div className="font-medium text-gray-900">{r.name}</div>
            <div className="text-xs text-gray-400">{r.email}</div>
          </span>
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (r) => (
        <select
          value={r.role}
          onChange={(e) => setRole(r.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="rounded-md border border-gray-200 px-2 py-1 text-sm"
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <DataTable columns={columns} rows={users} selected={selected} onSelectedChange={setSelected} />
    </div>
  );
}

function ApiKeysPanel() {
  const columns = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
    { key: "prefix", header: "Key", render: (r) => <code className="text-xs text-gray-500">{r.prefix}</code> },
    { key: "createdAt", header: "Created", render: (r) => <span className="text-gray-500">{r.createdAt}</span> },
    { key: "lastUsed", header: "Last used", render: (r) => <span className="text-gray-500">{r.lastUsed}</span> },
  ];
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <DataTable columns={columns} rows={API_KEYS} selectable={false} />
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState("general");

  return (
    <div className="flex h-full min-h-0">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white p-3">
        <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Settings</p>
        <div className="space-y-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm ${
                tab === t.id ? "bg-gray-100 font-medium text-gray-900" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="mb-4 text-xl font-semibold text-gray-900">{TABS.find((t) => t.id === tab)?.label}</h1>
        {tab === "general" && <GeneralPanel />}
        {tab === "workflow" && <WorkflowPanel />}
        {tab === "users" && <UsersPanel />}
        {tab === "api" && <ApiKeysPanel />}
      </div>
    </div>
  );
}
