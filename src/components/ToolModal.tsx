import { useEffect, useRef } from "react";
import { X, Shield, HardDrive, FolderOpen, Download } from "lucide-react";
import type { ToolInfo } from "../backblaze";
import DifficultyBadge from "./DifficultyBadge";

interface Props {
  tool: ToolInfo | null;
  onClose: () => void;
}

export default function ToolModal({ tool, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (tool) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [tool]);

  if (!tool) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative bg-white border border-neutral-200 w-full sm:max-w-lg p-0 overflow-hidden
          rounded-t-2xl sm:rounded-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-300" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-0">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 font-sans">
              {tool.name}
            </h2>
            <span className="text-xs text-neutral-400 font-mono">.exe</span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 transition-colors p-1 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Kurze Info */}
          <p className="text-sm text-neutral-600 leading-relaxed">
            {tool.info}
          </p>

          {/* Erweiterte Info (info2) */}
          {tool.info2 && (
            <div className="bg-neutral-50 p-3 rounded-md">
              <p className="text-[13px] text-neutral-500 leading-relaxed">
                {tool.info2}
              </p>
            </div>
          )}

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Shield size={14} className="text-neutral-400 shrink-0" />
              <span className="text-neutral-500 w-28 shrink-0">Schwierigkeit</span>
              <DifficultyBadge level={tool.difficulty} />
            </div>
            <div className="flex items-center gap-3 text-sm">
              <HardDrive size={14} className="text-neutral-400 shrink-0" />
              <span className="text-neutral-500 w-28 shrink-0">Größe</span>
              <span className="text-neutral-800 font-mono text-xs">{tool.size}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <FolderOpen size={14} className="text-neutral-400 shrink-0" />
              <span className="text-neutral-500 w-28 shrink-0">Ordner</span>
              <span className="text-neutral-800 font-mono text-xs truncate">
                {tool.folder}
              </span>
            </div>
          </div>

          {/* Preis */}
          <div className="border-t border-neutral-100 pt-4 flex items-end justify-between">
            <div>
              <span className="text-[11px] text-neutral-400 uppercase tracking-wider block mb-0.5">
                Preis
              </span>
              <span className="text-2xl font-bold text-neutral-900 font-mono">
                {tool.price}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-mono">
              <Download size={13} />
              <span>Code einlösen ↑</span>
            </div>
          </div>
        </div>

        <div className="h-2 sm:h-0" />
      </div>
    </div>
  );
}
