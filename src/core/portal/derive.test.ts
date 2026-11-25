import { describe, expect, it } from "vitest";
import {
  absenceWarning,
  ageOn,
  checkEligibility,
  collectionReady,
  countTotals,
  isAlertActive,
  isOnScreen,
  isRubricValid,
  totalPoints,
  validatePointEntry,
  weightedScore,
} from "./derive";
import {
  activities,
  alertHistory,
  assessments,
  cashCount,
  congratulations,
  externalCollection,
  meetings,
  points,
  rubric,
} from "./seed";

const byId = (id: string) => activities.find((a) => a.id === id)!;

describe("eligibility (§4.1)", () => {
  it("never lets a man into a women's activity", () => {
    const r = checkEligibility(byId("a-coran-femmes"), {
      gender: "homme",
      age: 30,
      membership: "active",
    });
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain("Cette activité est réservée aux femmes.");
  });
  it("checks the age range and the active membership", () => {
    const r = checkEligibility(byId("a-coran-6-9"), {
      gender: "femme",
      age: 11,
      membership: "pending",
    });
    expect(r.reasons).toEqual(["Âge maximum : 9 ans.", "Une adhésion active est requise."]);
  });
  it("accepts an eligible child", () => {
    expect(
      checkEligibility(byId("a-coran-6-9"), { gender: "homme", age: 7, membership: "active" }).ok,
    ).toBe(true);
  });
  it("computes age on a given day", () => {
    expect(ageOn("2017-03-14", "2026-11-25")).toBe(9);
    expect(ageOn("2017-11-26", "2026-11-25")).toBe(8);
  });
});

describe("points and rubrics (§4.3)", () => {
  it("requires a category, a non-zero value and a reason", () => {
    expect(validatePointEntry({ category: "", points: 0, reason: "" })).toHaveLength(3);
    expect(validatePointEntry({ category: "attitude", points: -2, reason: "Bavardage" })).toEqual(
      [],
    );
  });
  it("adds positive and negative points", () => {
    expect(totalPoints(points, "child-yasmine")).toBe(10 + 2 + 5 - 1 + 5);
  });
  it("only validates a weighted rubric that totals 100 %", () => {
    expect(isRubricValid(rubric)).toBe(true);
    expect(
      isRubricValid({
        categories: [
          { key: "memorisation", label: "M", weight: 60 },
          { key: "attitude", label: "A", weight: 25 },
        ],
      }),
    ).toBe(false);
  });
  it("re-normalises weights over the categories actually assessed", () => {
    // Yasmine: memorisation 18/20 (w50), lecture 8/10 (w20) → (0.9*50 + 0.8*20) / 70
    expect(weightedScore(rubric, assessments, "child-yasmine")).toBe(
      Math.round(((0.9 * 50 + 0.8 * 20) / 70) * 100),
    );
    expect(weightedScore(rubric, assessments, "child-hiba")).toBeNull();
  });
});

describe("alerts and screens (§4.4, §4.5)", () => {
  it("never shows an expired alert", () => {
    expect(isAlertActive(alertHistory[0]!, "2026-11-25T12:00:00Z")).toBe(false);
    expect(isAlertActive(alertHistory[0]!, "2026-02-14T12:00:00Z")).toBe(true);
  });
  it("only screens approved congratulations inside their window", () => {
    const now = "2026-11-25T12:00:00Z";
    expect(congratulations.filter((c) => isOnScreen(c, now)).map((c) => c.id)).toEqual([
      "cg-1",
      "cg-2",
    ]);
  });
});

describe("cash count (§4.10)", () => {
  it("totals coins, bills, envelopes and cheques and flags an unexplained variance", () => {
    const t = countTotals(cashCount);
    expect(t.coinsAndBills).toBe(203050);
    expect(t.envelopes).toBe(81500);
    expect(t.checks).toBe(25000);
    expect(t.counted).toBe(309550);
    expect(t.variance).toBe(-450);
    expect(t.needsExplanation).toBe(true);
    expect(
      countTotals({ ...cashCount, varianceNote: "Pièce de 5 $ retrouvée sous le tapis." })
        .needsExplanation,
    ).toBe(false);
  });
  it("needs two attestations before an external collection is final", () => {
    expect(collectionReady(externalCollection)).toBe(false);
    expect(
      collectionReady({
        ...externalCollection,
        attestations: [...externalCollection.attestations, { personId: "p-rachid", at: "x" }],
      }),
    ).toBe(true);
  });
});

describe("governance (§4.6)", () => {
  it("flags — never excludes — a member over the absence threshold", () => {
    expect(absenceWarning(meetings, "p-rachid", 3, 4)).toEqual({
      absences: 3,
      window: 3,
      flagged: true,
    });
    expect(absenceWarning(meetings, "p-leila", 3, 4).flagged).toBe(false);
  });
});
