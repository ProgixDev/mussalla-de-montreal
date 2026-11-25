import { describe, expect, it } from "vitest";
import { APPLICANT_SELF, usePortal, type PortalState } from "./store";

describe("portal store — saved demo state", () => {
  it("gives applications saved before v2 one enrolment line per person", async () => {
    const migrate = usePortal.persist.getOptions().migrate;
    if (!migrate) throw new Error("the persisted store must declare a migration");
    const v1 = {
      applications: [
        {
          id: "ad-old",
          firstName: "Salma",
          lastName: "Haddou",
          email: "salma@example.org",
          phone: "514 555-0123",
          gender: "femme",
          children: [{ firstName: "Rayan", birthDate: "2018-04-10", gender: "homme" }],
          activityIds: ["a-dars"],
          status: "pending",
          at: "2026-11-20T18:00:00Z",
        },
      ],
    };

    const migrated = (await migrate(v1, 1)) as Partial<PortalState>;

    expect(migrated.applications?.[0]?.enrolments).toEqual([
      { person: APPLICANT_SELF, activityIds: ["a-dars"] },
      { person: "Rayan", activityIds: [] },
    ]);
    expect(migrated.applications?.[0]?.activityIds).toEqual(["a-dars"]);
  });
});
