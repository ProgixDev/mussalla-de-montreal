import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { usePortal } from "@/lib/portal/store";
import { GovernanceSpace } from "../governance";
import { inDays, person, setupPortalTests } from "./helpers";

setupPortalTests();

describe("Governance — plan a Shura meeting", () => {
  it("reports each missing field, then plans the meeting with its invitations", async () => {
    const user = userEvent.setup();
    render(<GovernanceSpace me={person("p-amina")} />);
    const meetingsBefore = usePortal.getState().meetings.length;

    await user.click(screen.getByRole("button", { name: "Planifier une réunion" }));
    const form = within(screen.getByRole("form", { name: "Planifier une réunion" }));
    const title = form.getByLabelText(/^Titre/);
    const date = form.getByLabelText(/^Date/);

    // 1. Nothing filled in, nobody invited.
    await user.click(form.getByRole("button", { name: "Tout décocher" }));
    await user.click(form.getByRole("button", { name: "Planifier la réunion" }));
    expect(title).toHaveAccessibleDescription("Indiquez le titre de la réunion.");
    expect(date).toHaveAccessibleDescription("Choisissez la date de la réunion.");
    expect(form.getByText("Cochez au moins un membre de la Shura à inviter.")).toBeInTheDocument();
    expect(title).toHaveFocus();
    expect(usePortal.getState().meetings).toHaveLength(meetingsBefore);

    // 2. A past date, and an exact-time slot without its time.
    await user.type(title, "Réunion extraordinaire — budget");
    fireEvent.change(date, { target: { value: "2020-01-15" } });
    await user.selectOptions(form.getByLabelText(/^Créneau/), "Heure précise");
    await user.click(form.getByRole("button", { name: "Planifier la réunion" }));
    expect(date).toHaveAccessibleDescription(
      "Cette date est passée : choisissez aujourd’hui ou une date à venir.",
    );
    expect(form.getByLabelText(/^Heure de début/)).toHaveAccessibleDescription(
      "Indiquez l’heure de début, ou choisissez un créneau lié à une prière.",
    );
    expect(usePortal.getState().meetings).toHaveLength(meetingsBefore);

    // 3. Everything right: four of the five Shura members invited.
    const day = inDays(45);
    fireEvent.change(date, { target: { value: day } });
    fireEvent.change(form.getByLabelText(/^Heure de début/), { target: { value: "19:30" } });
    await user.type(form.getByLabelText(/^Lieu/), "Salle de réunion");
    await user.type(form.getByLabelText(/^Ordre du jour/), "Budget d’hiver{Enter}Achat de tapis");
    await user.click(form.getByRole("button", { name: "Tout cocher" }));
    await user.click(form.getByRole("checkbox", { name: "Rachid Mekki" }));
    await user.click(form.getByRole("button", { name: "Planifier la réunion" }));

    const meetings = usePortal.getState().meetings;
    expect(meetings).toHaveLength(meetingsBefore + 1);
    expect(meetings.at(-1)).toMatchObject({
      title: "Réunion extraordinaire — budget",
      date: day,
      slot: "19 h 30",
      mode: "sur_place",
      location: "Salle de réunion",
      agenda: ["Budget d’hiver", "Achat de tapis"],
      status: "planned",
      attendance: [],
      invitations: [
        { personId: "p-mohammed", rsvp: "no_response" },
        { personId: "p-hassan", rsvp: "no_response" },
        { personId: "p-amina", rsvp: "no_response" },
        { personId: "p-leila", rsvp: "no_response" },
      ],
    });

    // The form closes on a focused confirmation, and the meeting is listed.
    expect(screen.queryByRole("form", { name: "Planifier une réunion" })).not.toBeInTheDocument();
    const confirmation = screen.getByText(
      /^Réunion planifiée : « Réunion extraordinaire — budget »/,
    );
    expect(confirmation).toHaveTextContent("19 h 30. 4 invitations préparées");
    expect(confirmation).toHaveFocus();
    const section = screen
      .getByRole("heading", { name: "Réunion extraordinaire — budget" })
      .closest("section");
    if (!section) throw new Error("meeting panel not found");
    const panel = within(section);
    for (const invited of ["Mohammed Amrani", "Nabil Idrissi", "Amina Cherif", "Leïla Toumi"]) {
      expect(panel.getByText(invited)).toBeInTheDocument();
    }
    expect(panel.queryByText("Rachid Mekki")).not.toBeInTheDocument();
    expect(panel.getByText("sans réponse").nextElementSibling).toHaveTextContent("4");
  });
});
