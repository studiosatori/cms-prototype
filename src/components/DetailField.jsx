export default function DetailField({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">{label}</label>
      {children}
    </div>
  );
}
