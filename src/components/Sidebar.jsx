import { List, Clock, CalendarClock, Bookmark, Folder, FileText, Gem, Newspaper } from "lucide-react";

const TYPE_ICONS = { "file-text": FileText, gem: Gem, newspaper: Newspaper };

function Item({ icon: Icon, label, count, active, onClick, dim }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
        active ? "bg-gray-100 font-medium text-gray-900" : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      {Icon && <Icon size={15} className={dim ? "text-gray-400" : "text-gray-500"} />}
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && <span className="text-xs text-gray-400">{count}</span>}
    </button>
  );
}

export default function Sidebar({
  allLabel = "All content",
  statuses,
  typeGroupLabel = "Content type",
  typeItems,
  filter,
  onFilter,
}) {
  const isAll = !filter.status && !filter.typeId && filter.view === "all";

  return (
    <aside className="w-60 shrink-0 space-y-4 border-r border-gray-200 bg-white p-3">
      <div className="space-y-0.5">
        <Item icon={List} label={allLabel} active={isAll} onClick={() => onFilter({ view: "all", status: null, typeId: null })} />
        <Item icon={Clock} label="Recent" active={filter.view === "recent"} onClick={() => onFilter({ view: "recent", status: null, typeId: null })} />
        <Item icon={CalendarClock} label="Scheduled" active={filter.view === "scheduled"} onClick={() => onFilter({ view: "scheduled", status: null, typeId: null })} />
      </div>

      <div>
        <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Status</p>
        <div className="space-y-0.5">
          {statuses.map((s) => (
            <Item
              key={s.name}
              icon={Folder}
              label={s.name}
              count={s.count}
              active={filter.status === s.name}
              onClick={() => onFilter({ view: "status", status: s.name, typeId: null })}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">{typeGroupLabel}</p>
        <div className="space-y-0.5">
          {typeItems.map((t) => (
            <Item
              key={t.id}
              icon={t.icon ? TYPE_ICONS[t.icon] : Folder}
              label={t.name}
              count={t.count}
              active={filter.typeId === t.id}
              onClick={() => onFilter({ view: "type", status: null, typeId: t.id })}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Private views</p>
        <Item icon={Bookmark} label="Created by me" dim active={filter.view === "created-by-me"} onClick={() => onFilter({ view: "created-by-me", status: null, typeId: null })} />
        <Item icon={Bookmark} label="Updated by me" dim active={filter.view === "updated-by-me"} onClick={() => onFilter({ view: "updated-by-me", status: null, typeId: null })} />
      </div>
    </aside>
  );
}
