import { FolderInput, Flag, Copy, Trash2 } from "lucide-react";

export default function BulkActionBar({ count, total, onClear, onDelete }) {
  return (
    <div className="flex items-center gap-4 border-b border-gray-100 px-4 py-2 text-sm">
      <span className="text-gray-500">{count} selected</span>
      <div className="h-4 w-px bg-gray-200" />
      <button className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 disabled:opacity-40" disabled={count === 0}>
        <FolderInput size={14} /> Move
      </button>
      <button className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 disabled:opacity-40" disabled={count === 0}>
        <Flag size={14} /> Status
      </button>
      <button className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 disabled:opacity-40" disabled={count === 0}>
        <Copy size={14} /> Duplicate
      </button>
      <button
        className="flex items-center gap-1.5 text-red-600 hover:text-red-700 disabled:opacity-40 disabled:text-gray-600"
        disabled={count === 0}
        onClick={onDelete}
      >
        <Trash2 size={14} /> Delete
      </button>
      <span className="ml-auto text-gray-400">
        Showing {total} of {total}
      </span>
    </div>
  );
}
