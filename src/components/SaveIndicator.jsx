import { Check, Loader2 } from "lucide-react";
import { useI18n } from "../lib/i18n";

export default function SaveIndicator({ status }) {
  const { t } = useI18n();
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
        <Loader2 size={12} className="animate-spin" />
        {t("Saving…")}
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <Check size={13} />
        {t("Saved")}
      </span>
    );
  }
  return null;
}
