import type { ToolInfo } from "../backblaze";
import DifficultyBadge from "./DifficultyBadge";

interface Props {
  tool: ToolInfo;
  index: number;
  onClick: () => void;
}

export default function ToolCard({ tool, index, onClick }: Props) {
  const offsets = ["sm:mt-0", "sm:mt-3", "sm:mt-1", "sm:mt-5", "sm:mt-2", "sm:mt-4"];
  const offset = offsets[index % offsets.length];

  return (
    <button
      onClick={onClick}
      className={`${offset} group text-left w-full border border-neutral-200 bg-white 
        hover:border-neutral-400 hover:shadow-sm transition-all duration-200 
        p-4 sm:p-5 cursor-pointer relative overflow-hidden`}
      style={{ borderRadius: `${4 + (index % 3) * 4}px` }}
    >
      {/* Akzent-Strich oben */}
      <div
        className="absolute top-0 left-4 h-[2px] bg-neutral-300 group-hover:bg-neutral-900 transition-colors duration-300"
        style={{ width: `${30 + (index % 4) * 15}px` }}
      />

      <div className="flex items-start justify-between mb-2.5 mt-1.5">
        <h3 className="text-[15px] font-semibold text-neutral-900 font-sans">
          {tool.name}
        </h3>
        <span className="text-[10px] text-neutral-400 font-mono shrink-0 ml-2 mt-0.5">
          .exe
        </span>
      </div>

      <p className="text-[13px] text-neutral-500 leading-relaxed mb-4 line-clamp-2">
        {tool.info}
      </p>

      <div className="flex items-end justify-between">
        <DifficultyBadge level={tool.difficulty} />
        <span className="text-sm font-bold text-neutral-900 font-mono">
          {tool.price}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-neutral-100">
        <span className="text-[11px] text-neutral-400 font-mono">{tool.size}</span>
        <span className="text-[11px] text-neutral-300">•</span>
        <span className="text-[11px] text-neutral-400 font-mono uppercase tracking-wide group-hover:text-neutral-700 transition-colors">
          Details →
        </span>
      </div>
    </button>
  );
}
