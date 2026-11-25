/**
 * Children's levels — the child-facing reading of their points (« étoiles »). Celestial
 * names only (no creatures), matching the site's motifs. Pure, so the TV, the parent
 * space and the backend can all agree on what level a child is at.
 */
export interface Level {
  name: string;
  /** Minimum stars to reach this level. */
  min: number;
}

export const LEVELS: readonly Level[] = [
  { name: "Petite étincelle", min: 0 },
  { name: "Étoile filante", min: 10 },
  { name: "Étoile brillante", min: 20 },
  { name: "Croissant de lune", min: 35 },
  { name: "Pleine lune", min: 55 },
  { name: "Ciel étoilé", min: 80 },
];

export interface LevelProgress {
  index: number;
  level: Level;
  next: Level | null;
  /** Stars still needed for the next level (0 at the top level). */
  toNext: number;
  /** 0–1 progress inside the current level (1 at the top level). */
  progress: number;
}

/** Negative totals count as 0 stars: a child never "loses a level" below the start. */
export function levelFor(points: number): LevelProgress {
  const stars = Math.max(0, points);
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (stars >= (LEVELS[i]?.min ?? Infinity)) index = i;
  const level = LEVELS[index] ?? LEVELS[0]!;
  const next = LEVELS[index + 1] ?? null;
  if (!next) return { index, level, next: null, toNext: 0, progress: 1 };
  return {
    index,
    level,
    next,
    toNext: next.min - stars,
    progress: (stars - level.min) / (next.min - level.min),
  };
}
