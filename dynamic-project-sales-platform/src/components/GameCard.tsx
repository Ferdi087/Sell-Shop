import { Gamepad2 } from "lucide-react";
import type { GameInfo } from "../backblaze";

interface Props {
  game: GameInfo;
  index: number;
  onClick: () => void;
}

export default function GameCard({ game, index, onClick }: Props) {
  const offsets = ["sm:mt-0", "sm:mt-2", "sm:mt-4", "sm:mt-1", "sm:mt-3"];
  const offset = offsets[index % offsets.length];

  return (
    <button
      onClick={onClick}
      className={`${offset} group text-left w-full border border-neutral-200 bg-white 
        hover:border-neutral-400 hover:shadow-sm transition-all duration-200 
        p-4 sm:p-5 cursor-pointer relative overflow-hidden`}
      style={{ borderRadius: `${6 + (index % 2) * 4}px` }}
    >
      {/* Akzent-Strich oben — andere Farbe für Spiele */}
      <div
        className="absolute top-0 left-4 h-[2px] bg-indigo-200 group-hover:bg-indigo-500 transition-colors duration-300"
        style={{ width: `${35 + (index % 3) * 12}px` }}
      />

      <div className="flex items-start justify-between mb-2.5 mt-1.5">
        <div className="flex items-center gap-2">
          <Gamepad2 size={14} className="text-indigo-400" />
          <h3 className="text-[15px] font-semibold text-neutral-900 font-sans">
            {game.name}
          </h3>
        </div>
        <span className="text-[10px] text-neutral-400 font-mono shrink-0 ml-2 mt-0.5">
          .zip
        </span>
      </div>

      <div className="flex items-end justify-between mt-4">
        <span className="text-[11px] text-neutral-400 font-mono">{game.size}</span>
        <span className="text-sm font-bold text-neutral-900 font-mono">
          {game.price}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-neutral-100">
        <span className="text-[11px] text-indigo-400 font-mono uppercase tracking-wide group-hover:text-indigo-600 transition-colors">
          Download →
        </span>
      </div>
    </button>
  );
}
