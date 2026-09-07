import { Check, Loader2 } from "lucide-react";

export default function SaveIndicator({ status }) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
        <Loader2 size={12} className="animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <Check size={13} />
        Saved
      </span>
    );
  }
  return null;
}
