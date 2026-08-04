// ╔══════════════════════════════════════════════════════════════╗
// ║  KONFIGURATION — Admin-Code & Kategorie-Namen               ║
// ╚══════════════════════════════════════════════════════════════╝

// ─── ADMIN CODE ─────────────────────────────────────────────────
export const ADMIN_CODE = "43214312";

// ─── KATEGORIE-NAMEN ────────────────────────────────────────────
export const CATEGORY_TOOLS_NAME = "Tools";
export const CATEGORY_GAMES_NAME = "Spiele";

// ─── GEFÄHRLICHKEITSSTUFEN (1-5 mapping) ────────────────────────
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  1: "Harmlos",
  2: "Niedrig", 
  3: "Mittel",
  4: "Hoch",
  5: "Kritisch",
};

export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  1: "bg-emerald-500",
  2: "bg-lime-500",
  3: "bg-amber-500",
  4: "bg-orange-500",
  5: "bg-red-500",
};
