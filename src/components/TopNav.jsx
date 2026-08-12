import { NavLink } from "react-router-dom";
import { FileText, LayoutGrid, Layers, Image, Settings as SettingsIcon } from "lucide-react";
import Avatar from "./Avatar";
import { seedUsers } from "../lib/seed";

const TABS = [
  { to: "/content", label: "Content", icon: FileText },
  { to: "/catalogue", label: "Catalogue", icon: LayoutGrid },
  { to: "/content-types", label: "Content types", icon: Layers },
  { to: "/media", label: "Media", icon: Image },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function TopNav() {
  const me = seedUsers()[0];
  return (
    <header className="flex h-14 shrink-0 items-center gap-1 border-b border-gray-200 bg-white px-4">
      <div className="flex items-center gap-2 pr-4 mr-2 border-r border-gray-200">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-black font-serif text-lg leading-none text-white">
          P
        </div>
        <span className="text-sm font-semibold tracking-tight text-gray-900">PCT admin</span>
      </div>

      <nav className="flex items-center gap-1">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <tab.icon size={15} />
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1 text-gray-500">
        <Avatar user={me} size={28} />
      </div>
    </header>
  );
}
