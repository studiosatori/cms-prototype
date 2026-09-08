import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eye } from "lucide-react";

export default function PreviewButton({ entryId, channels, defaultChannelId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  function openPreview(channelId) {
    window.open(`/preview/${channelId}/${entryId}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return (
    <div className="relative inline-flex" ref={ref}>
      <div className="inline-flex overflow-hidden rounded-md ring-1 ring-inset ring-gray-300">
        <button
          onClick={() => openPreview(defaultChannelId)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          <Eye size={14} /> Preview
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center border-l border-gray-300 px-1.5 py-1.5 text-gray-500 hover:bg-gray-100"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-md border border-gray-200 bg-white p-1 shadow-lg">
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => openPreview(c.id)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
