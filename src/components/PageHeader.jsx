import { ArrowLeft } from "lucide-react";

export default function PageHeader({ crumbs, onBack, actions }) {
  const title = crumbs[crumbs.length - 1];
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-400">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className={i === crumbs.length - 1 ? "text-gray-600" : ""}>{c}</span>
            {i < crumbs.length - 1 && <span>/</span>}
          </span>
        ))}
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100">
              <ArrowLeft size={17} />
            </button>
          )}
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
