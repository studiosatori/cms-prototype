const STYLES = {
  Published: "bg-white text-black ring-black before:bg-black",
  Draft: "bg-white text-black ring-black before:bg-gray-400",
  Changed: "bg-white text-black ring-black before:bg-gray-700",
  Archived: "bg-white text-gray-500 ring-gray-400 before:bg-gray-300",
};

export default function StatusPill({ status, color }) {
  if (color) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-black ring-1 ring-inset ring-black"
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
