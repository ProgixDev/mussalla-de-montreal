import { describe, expect, it } from "vitest";
import { getCaisseData } from "./seed";
import { computeTotals, goalPercent, goalRemainingCents } from "./derive";

describe("caisse derivations", () => {
  const data = getCaisseData();

  it("matches the figures in the design reference renders", () => {
    const totals = computeTotals(data);
    // 2 395 $ entrées, 4 035 $ sorties, 18 360 $ solde (from the prototype).
    expect(totals.monthInCents).toBe(239_500);
    expect(totals.monthOutCents).toBe(403_500);
    expect(totals.balanceCents).toBe(1_836_000);
    expect(totals.contributionCount).toBe(10);
    expect(totals.activeGoals).toBe(3);
  });

  it("computes goal progress the way the TV shows it", () => {
    const ablution = data.goals[0]!;
    expect(goalPercent(ablution)).toBe(62); // 9 250 / 15 000
    expect(goalRemainingCents(ablution)).toBe(575_000); // 5 750 $ restant
  });

  it("never exposes a real name through the public contribution shape’s name field", () => {
    const anon = data.contributions.filter((c) => c.anon);
    expect(anon.length).toBeGreaterThan(0);
    for (const c of anon) expect(c.name).toBe("Anonyme");
  });
});
