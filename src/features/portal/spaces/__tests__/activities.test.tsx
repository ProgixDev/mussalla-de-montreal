import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { usePortal } from "@/lib/portal/store";
import { ActivitiesSpace } from "../activities";
import { AdminSpace } from "../admin";
import { inDays, person, setupPortalTests } from "./helpers";

setupPortalTests();

const eventTitled = (title: string) => usePortal.getState().events.find((e) => e.title === title);

/** The calendar card of an event (its <li>). */
const card = (title: string) => {
  const item = screen.getByRole("heading", { name: title }).closest("li");
  if (!item) throw new Error(`No calendar card for « ${title} »`);
  return within(item);
};

/** Decides on a proposed event from the admin space, then leaves it. */
async function decideAsAdmin(title: string, publish: boolean) {
  const user = userEvent.setup();
  const { unmount } = render(<AdminSpace me={person("p-mohammed")} />);
  await user.click(screen.getByRole("tab", { name: /^Approbations/ }));
  const item = screen.getByText(title).closest("li");
  if (!item) throw new Error(`« ${title} » is not awaiting approval`);
  await user.click(
    within(item).getByRole("button", { name: publish ? "Publier" : "Renvoyer en brouillon" }),
  );
  unmount();
}

describe("Activities — propose, approve, resubmit", () => {
  it("proposes an event (with validation), then the administration publishes it", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ActivitiesSpace me={person("p-samira")} />);
    const before = usePortal.getState().events.length;

    await user.click(screen.getByRole("button", { name: "Envoyer pour approbation" }));
    expect(screen.getByLabelText(/^Titre/)).toHaveAccessibleDescription("Indiquez le titre.");
    expect(screen.getByLabelText(/^Date/)).toHaveAccessibleDescription("Choisissez la date.");
    expect(screen.getByLabelText(/^Créneau/)).toHaveAccessibleDescription(
      "Indiquez le créneau, par exemple « 19 h 30 » ou « après la prière de Maghrib ».",
    );
    expect(screen.getByLabelText(/^Lieu/)).toHaveAccessibleDescription(
      "Indiquez le lieu : une salle, une adresse ou un lien.",
    );
    expect(screen.getByLabelText(/^Titre/)).toHaveFocus();
    expect(usePortal.getState().events).toHaveLength(before);

    const day = inDays(20);
    await user.type(screen.getByLabelText(/^Titre/), "Atelier de calligraphie");
    await user.click(screen.getByRole("radio", { name: "Enfants" }));
    fireEvent.change(screen.getByLabelText(/^Date/), { target: { value: day } });
    await user.type(screen.getByLabelText(/^Créneau/), "après la prière d’Asr");
    await user.type(screen.getByLabelText(/^Lieu/), "Salle polyvalente");
    await user.click(screen.getByRole("button", { name: "Envoyer pour approbation" }));

    expect(usePortal.getState().events).toHaveLength(before + 1);
    expect(eventTitled("Atelier de calligraphie")).toMatchObject({
      kind: "evenement",
      audience: "enfants",
      date: day,
      slot: "après la prière d’Asr",
      location: "Salle polyvalente",
      status: "submitted",
    });
    expect(
      screen.getByText(/^« Atelier de calligraphie » est envoyé pour approbation/),
    ).toHaveFocus();
    expect(
      card("Atelier de calligraphie").getByText("En attente d’approbation"),
    ).toBeInTheDocument();
    unmount();

    await decideAsAdmin("Atelier de calligraphie", true);
    expect(eventTitled("Atelier de calligraphie")?.status).toBe("published");
  });

  it("resubmits an event the administration sent back to draft", async () => {
    const title = "Souper communautaire de fin d’année";
    await decideAsAdmin(title, false);
    expect(eventTitled(title)?.status).toBe("draft");

    const user = userEvent.setup();
    render(<ActivitiesSpace me={person("p-samira")} />);
    const draft = card(title);
    expect(draft.getByText("Brouillon")).toBeInTheDocument();

    await user.click(draft.getByRole("button", { name: `Soumettre de nouveau « ${title} »` }));

    expect(eventTitled(title)?.status).toBe("submitted");
    expect(card(title).getByText("En attente d’approbation")).toBeInTheDocument();
    expect(card(title).queryByRole("button", { name: /Soumettre de nouveau/ })).toBeNull();
    expect(
      screen.getByText(
        `« ${title} » est de nouveau envoyé pour approbation. L’administration décidera de sa publication.`,
      ),
    ).toHaveFocus();
  });

  it("only offers « Soumettre de nouveau » on drafts", () => {
    render(<ActivitiesSpace me={person("p-samira")} />);
    expect(screen.queryByRole("button", { name: /Soumettre de nouveau/ })).toBeNull();
    // The store refuses to "resubmit" anything that isn't a draft.
    usePortal.getState().resubmitEvent("ev-jumua");
    expect(eventTitled("Prière du vendredi (Jumu’a)")?.status).toBe("published");
  });
});
