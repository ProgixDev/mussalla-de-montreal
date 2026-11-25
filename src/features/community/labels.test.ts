import { describe, expect, it } from "vitest";
import { activities } from "@/core/portal/seed";
import { addDaysIso, ageRangeLabel, isChildActivity, priceLabel, seatsLabel } from "./labels";
import { emailFormatError, phoneFormatError } from "./validation";

const byId = (id: string) => {
  const a = activities.find((x) => x.id === id);
  if (!a) throw new Error(`missing seed activity ${id}`);
  return a;
};

describe("activity wording", () => {
  it("states the age range in plain French", () => {
    expect(ageRangeLabel({ ageMin: 6, ageMax: 9 })).toBe("6 à 9 ans");
    expect(ageRangeLabel({ ageMin: 16, ageMax: null })).toBe("16 ans et plus");
    expect(ageRangeLabel({ ageMin: null, ageMax: 12 })).toBe("Jusqu’à 12 ans");
    expect(ageRangeLabel({ ageMin: null, ageMax: null })).toBe("Tous âges");
  });

  it("says free or monthly price", () => {
    expect(priceLabel({ monthlyPriceCents: 0 })).toBe("Gratuit");
    expect(priceLabel({ monthlyPriceCents: 4000 })).toMatch(/^40\s\$ \/ mois$/u);
  });

  it("counts seats and turns a full activity into a waiting list", () => {
    expect(seatsLabel(byId("a-coran-6-9"))).toBe("2 places restantes");
    expect(seatsLabel(byId("a-coran-10-14"))).toBe("Complet — liste d’attente");
    expect(seatsLabel({ ...byId("a-coran-6-9"), enrolled: 19 })).toBe("1 place restante");
  });

  it("knows which activities are for children", () => {
    expect(isChildActivity(byId("a-soccer"))).toBe(true);
    expect(isChildActivity(byId("a-dars"))).toBe(false);
    expect(isChildActivity(byId("a-coran-femmes"))).toBe(false);
  });
});

describe("day arithmetic", () => {
  it("crosses month and year boundaries without a time zone", () => {
    expect(addDaysIso("2026-11-25", -30)).toBe("2026-10-26");
    expect(addDaysIso("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("field formats", () => {
  it("accepts real e-mails and explains bad ones", () => {
    expect(emailFormatError("fatima@example.org")).toBeUndefined();
    expect(emailFormatError("")).toBeUndefined();
    expect(emailFormatError("fatima@example")).toMatch(/exemple/);
    expect(emailFormatError("fatima example.org")).toBeDefined();
  });

  it("accepts North-American phone numbers", () => {
    expect(phoneFormatError("514 555-0142")).toBeUndefined();
    expect(phoneFormatError("+1 (514) 555-0142")).toBeUndefined();
    expect(phoneFormatError("555-0142")).toMatch(/10 chiffres/);
  });
});
