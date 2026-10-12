import { NavLink } from "react-router-dom";
import { FileText, Layers, ListTree, Image, Settings as SettingsIcon, Globe, ChevronDown } from "lucide-react";
import Avatar from "./Avatar";
import { seedUsers } from "../lib/seed";
import { useI18n, UI_LANGUAGES } from "../lib/i18n";

const TABS = [
  { to: "/content", label: "Content", icon: FileText },
  // Hidden for now — out of scope. Re-add to bring Catalogue back into the nav.
  // { to: "/catalogue", label: "Catalogue", icon: LayoutGrid },
  { to: "/content-types", label: "Content types", icon: Layers },
  { to: "/taxonomies", label: "Taxonomies", icon: ListTree },
  { to: "/media", label: "Media", icon: Image },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function TopNav() {
  const me = seedUsers()[0];
  const { t, lang, setLang } = useI18n();
  return (
    <header className="flex h-16 shrink-0 items-center gap-1 border-b border-gray-300 bg-white px-4">
      <div className="flex items-center gap-2.5 pr-4 mr-2 border-r border-gray-300">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-800 font-mono text-xl leading-none text-white">
          P
        </div>
        <span className="whitespace-nowrap font-mono text-xl font-semibold tracking-tight text-gray-900">Prague CMS</span>
      </div>

      <nav className="flex items-center gap-1">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-200 font-semibold text-gray-900"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <tab.icon size={15} />
            {t(tab.label)}
          </NavLink>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3 text-gray-500">
        <label className="relative flex items-center" title={t("Interface language")}>
          <Globe size={14} className="pointer-events-none absolute left-2.5 text-gray-400" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            aria-label={t("Interface language")}
            className="appearance-none rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-7 text-sm font-medium text-gray-700 focus:border-violet-400 focus:outline-none"
          >
            {UI_LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 text-gray-400" />
        </label>
        <Avatar user={me} size={28} />
      </div>
    </header>
  );
}
