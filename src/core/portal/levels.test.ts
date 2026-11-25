import { describe, expect, it } from "vitest";
import { LEVELS, levelFor } from "./levels";

describe("children's levels", () => {
  it("starts at the first level, even with a negative total", () => {
    expect(levelFor(-3).level.name).toBe("Petite étincelle");
    expect(levelFor(-3).toNext).toBe(10);
  });
  it("places a child and says how many stars are left", () => {
    const l = levelFor(21); // Yasmine in the seed
    expect(l.level.name).toBe("Étoile brillante");
    expect(l.next?.name).toBe("Croissant de lune");
    expect(l.toNext).toBe(14);
    expect(l.progress).toBeCloseTo(1 / 15);
  });
  it("reaches a level exactly at its threshold", () => {
    expect(levelFor(35).level.name).toBe("Croissant de lune");
  });
  it("tops out at the last level", () => {
    const top = levelFor(500);
    expect(top.level).toEqual(LEVELS[LEVELS.length - 1]);
    expect(top.next).toBeNull();
    expect(top.progress).toBe(1);
  });
});
