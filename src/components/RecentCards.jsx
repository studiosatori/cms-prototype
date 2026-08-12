import Avatar from "./Avatar";
import { getUser } from "../lib/seed";

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function RecentCards({ items }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-gray-400">Recently modified</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex min-w-[220px] items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 hover:border-gray-300 hover:shadow-sm"
          >
            <Avatar user={getUser(item.authorId ?? item.updatedBy)} size={28} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800">{item.name || item.title}</p>
              <p className="text-xs text-gray-400">{formatDate(item.updatedAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
