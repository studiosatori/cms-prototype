import { useI18n } from "../lib/i18n";

export default function DetailField({ label, children }) {
  const { t } = useI18n();
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">{t(label)}</label>
      {children}
    </div>
  );
}
