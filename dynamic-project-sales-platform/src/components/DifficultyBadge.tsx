import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, type DifficultyLevel } from "../data";

export default function DifficultyBadge({ level }: { level: DifficultyLevel }) {
  const label = DIFFICULTY_LABELS[level];
  const color = DIFFICULTY_COLORS[level];

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono font-medium">
        {label}
      </span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`block w-1.5 h-1.5 rounded-full ${
              i < level ? color : "bg-neutral-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
