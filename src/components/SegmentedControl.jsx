export default function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="inline-flex items-center rounded-md border border-gray-300 bg-white p-0.5">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.label}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-sm font-medium transition-colors ${
              active ? "bg-[#8a6d0d] text-white" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {Icon && <Icon size={14} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
