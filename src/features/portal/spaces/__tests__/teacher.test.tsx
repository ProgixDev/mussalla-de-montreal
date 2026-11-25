import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { usePortal } from "@/lib/portal/store";
import { TeacherSpace } from "../teacher";
import { person, setupPortalTests } from "./helpers";

setupPortalTests();

async function openPointsFor(firstName: string) {
  const user = userEvent.setup();
  render(<TeacherSpace me={person("p-karim")} />);
  // The roster card reads « Yasmine · 21 points · 2 badge(s) ».
  await user.click(screen.getByRole("button", { name: new RegExp(`^${firstName}`) }));
  const dialog = screen.getByRole("dialog", { name: `Points de ${firstName}` });
  return { user, dialog };
}

describe("Teacher — points", () => {
  it("gives +10 Mémorisation with a justification", async () => {
    const before = usePortal.getState().points.length;
    const { user, dialog } = await openPointsFor("Yasmine");
    const box = within(dialog);

    await user.click(box.getByRole("radio", { name: "Mémorisation" }));
    await user.click(box.getByRole("button", { name: "+10" }));
    expect(box.getByRole("button", { name: "+10" })).toHaveAttribute("aria-pressed", "true");
    await user.type(box.getByLabelText(/Justification/), "Sourate Al-Mulk récitée sans faute");
    await user.click(box.getByRole("button", { name: "Enregistrer les points" }));

    expect(box.getByRole("status")).toHaveTextContent(
      "Enregistré : +10 en mémorisation pour Yasmine.",
    );
    const { points } = usePortal.getState();
    expect(points).toHaveLength(before + 1);
    expect(points[0]).toMatchObject({
      childId: "child-yasmine",
      classId: "c-fajr",
      category: "memorisation",
      points: 10,
      reason: "Sourate Al-Mulk récitée sans faute",
      teacherId: "p-karim",
    });
    // The new entry shows in the child's recent history right away.
    expect(box.getByText("Sourate Al-Mulk récitée sans faute")).toBeInTheDocument();
  });

  it("refuses an entry without a justification and records nothing", async () => {
    const before = usePortal.getState().points;
    const { user, dialog } = await openPointsFor("Yasmine");
    const box = within(dialog);

    await user.click(box.getByRole("radio", { name: "Mémorisation" }));
    await user.click(box.getByRole("button", { name: "+10" }));
    await user.click(box.getByRole("button", { name: "Enregistrer les points" }));

    const alert = box.getByRole("alert");
    expect(alert).toHaveTextContent(
      "Écrivez une courte justification (elle est visible par le parent).",
    );
    // Only the missing justification is reported — category and value were given.
    expect(within(alert).getAllByRole("listitem")).toHaveLength(1);
    expect(box.queryByRole("status")).not.toBeInTheDocument();
    expect(usePortal.getState().points).toBe(before);
  });
});
