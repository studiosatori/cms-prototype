const STYLES = {
  Published: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 before:bg-emerald-500",
  Draft: "bg-amber-50 text-amber-700 ring-amber-600/20 before:bg-amber-500",
  Changed: "bg-blue-50 text-blue-700 ring-blue-600/20 before:bg-blue-500",
  Archived: "bg-gray-100 text-gray-600 ring-gray-500/20 before:bg-gray-400",
};

export default function StatusPill({ status, color }) {
  if (color) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
        style={{ backgroundColor: color + "1a", color, "--tw-ring-color": color + "40" }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        {status}
      </span>
    );
  }
  const cls = STYLES[status] || STYLES.Archived;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset before:h-1.5 before:w-1.5 before:rounded-full ${cls}`}
    >
      {status}
    </span>
  );
}
