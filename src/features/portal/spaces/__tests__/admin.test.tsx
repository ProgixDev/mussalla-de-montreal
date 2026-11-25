import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { isAlertActive } from "@/core/portal/derive";
import { usePortal } from "@/lib/portal/store";
import { AdminSpace } from "../admin";
import { person, setupPortalTests } from "./helpers";

setupPortalTests();

function renderAdmin() {
  const user = userEvent.setup();
  render(<AdminSpace me={person("p-mohammed")} />);
  // Tab names carry their badge (« Approbations2 »): match the start only.
  const openTab = (label: string) =>
    user.click(screen.getByRole("tab", { name: new RegExp(`^${label}`) }));
  return { user, openTab };
}

/** The list item holding `text` (a congratulation, an event, an application…). */
const itemWith = (text: string) => {
  const item = screen.getByText(text).closest("li");
  if (!item) throw new Error(`No list item for « ${text} »`);
  return within(item);
};

describe("Admin — emergency alert", () => {
  it("publishes through the confirmation dialog, with a delivery report", async () => {
    const { user, openTab } = renderAdmin();
    await openTab("Alerte urgente");

    await user.type(screen.getByLabelText(/^Titre/), "Centre fermé samedi — tempête");
    await user.type(
      screen.getByLabelText(/^Message/),
      "La tempête annoncée ferme le centre samedi. Les cours sont annulés.",
    );
    await user.click(screen.getByRole("button", { name: "Publier l’alerte…" }));

    // Nothing leaves before the explicit confirmation.
    expect(
      usePortal.getState().alerts.filter((a) => isAlertActive(a, new Date().toISOString())),
    ).toHaveLength(0);
    const dialog = screen.getByRole("dialog", { name: "Publier cette alerte ?" });
    expect(dialog).toHaveTextContent("tout le centre (≈ 236 personnes)");
    await user.click(within(dialog).getByRole("button", { name: "Publier maintenant" }));

    const active = usePortal
      .getState()
      .alerts.filter((a) => isAlertActive(a, new Date().toISOString()));
    expect(active).toHaveLength(1);
    expect(active[0]).toMatchObject({
      title: "Centre fermé samedi — tempête",
      instruction: "Gardez les enfants à la maison.",
      audience: "tout_le_centre",
      authorId: "p-mohammed",
      channels: ["portail", "courriel", "sms", "ecran"],
    });
    expect(active[0]?.deliveries).toEqual([
      { channel: "courriel", sent: 234, failed: 1 },
      { channel: "sms", sent: 227, failed: 3 },
    ]);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText(/« Centre fermé samedi — tempête » est publiée/)).toBeInTheDocument();
    const report = within(screen.getByRole("region", { name: "Alerte en cours" }));
    expect(report.getByRole("row", { name: /Courriel 234 1 — relance programmée/ })).toBeVisible();
    expect(report.getByRole("row", { name: /SMS 227 3 — relance programmée/ })).toBeVisible();
  });

  it("refuses to open the confirmation while the form is incomplete", async () => {
    const { user, openTab } = renderAdmin();
    await openTab("Alerte urgente");
    await user.click(screen.getByRole("button", { name: "Publier l’alerte…" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Titre/)).toHaveAccessibleDescription(
      "Un titre court et clair, par exemple « Centre fermé samedi — tempête ».",
    );
    expect(screen.getByLabelText(/^Message/)).toHaveAccessibleDescription(
      "Expliquez ce qui se passe en une ou deux phrases.",
    );
  });

  it("keeps its own title when another alert is already live", async () => {
    const { user, openTab } = renderAdmin();
    await openTab("Alerte urgente");
    const publish = async (title: string) => {
      await user.type(screen.getByLabelText(/^Titre/), title);
      await user.type(screen.getByLabelText(/^Message/), "Un message assez long pour partir.");
      await user.click(screen.getByRole("button", { name: "Publier l’alerte…" }));
      const dialog = screen.getByRole("dialog", { name: "Publier cette alerte ?" });
      await user.click(within(dialog).getByRole("button", { name: "Publier maintenant" }));
    };

    await publish("Panne de chauffage");
    // The live alert mounts its own « Mettre fin » dialog: both must stay distinct.
    await publish("Stationnement fermé");

    expect(screen.getAllByRole("region", { name: "Alerte en cours" })).toHaveLength(2);
  });
});

describe("Admin — congratulations", () => {
  it("approves a submitted congratulation", async () => {
    const { user, openTab } = renderAdmin();
    await openTab("Approbations");

    await user.click(itemWith("Bravo Adam !").getByRole("button", { name: "Approuver" }));

    expect(usePortal.getState().congratulations.find((c) => c.id === "cg-3")).toMatchObject({
      status: "approved",
      approvedBy: "p-mohammed",
    });
    expect(screen.queryByText("Bravo Adam !")).not.toBeInTheDocument();
  });

  it("cannot approve a congratulation for a child without screen consent", async () => {
    // Maryam's parent did not allow screen display (seed).
    usePortal.getState().proposeCongratulation({
      scope: "enfant_du_jour",
      childId: "child-maryam",
      title: "Bravo Maryam !",
      message: "Pour sa belle lecture.",
      proposedBy: "p-karim",
      displayFrom: "2026-11-01T00:00:00Z",
      displayUntil: "2027-06-30T23:59:00Z",
    });
    const id = usePortal.getState().congratulations[0]?.id ?? "";
    const { user, openTab } = renderAdmin();
    await openTab("Approbations");

    const item = itemWith("Bravo Maryam !");
    expect(
      item.getByText(
        "Le parent n’a pas autorisé l’affichage sur les écrans : approbation impossible.",
      ),
    ).toBeInTheDocument();
    const approve = item.getByRole("button", { name: "Approuver" });
    expect(approve).toBeDisabled();
    await user.click(approve);
    expect(usePortal.getState().congratulations.find((c) => c.id === id)?.status).toBe("submitted");

    // The rule holds at the action level too (as on the server), not only in the button.
    usePortal.getState().decideCongratulation(id, true, "p-mohammed");
    expect(usePortal.getState().congratulations.find((c) => c.id === id)?.status).toBe("submitted");
    // Refusing stays possible.
    await user.click(item.getByRole("button", { name: "Refuser" }));
    expect(usePortal.getState().congratulations.find((c) => c.id === id)?.status).toBe("rejected");
  });
});

describe("Admin — rubrics", () => {
  it("keeps « Activer cette version » disabled until the weights total 100 %", async () => {
    const { user, openTab } = renderAdmin();
    await openTab("Barèmes");
    const activate = screen.getByRole("button", { name: "Activer cette version" });
    const version = usePortal.getState().rubric.version;
    expect(activate).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Mémorisation"), { target: { value: "60" } });
    expect(screen.getByText(/il faut exactement 100 %/)).toHaveTextContent(
      "Total : 110 % — il faut exactement 100 % (retirez 10 points).",
    );
    expect(activate).toBeDisabled();
    await user.click(activate);
    expect(usePortal.getState().rubric.version).toBe(version);

    fireEvent.change(screen.getByLabelText("Lecture"), { target: { value: "5" } });
    expect(screen.getByText(/il faut exactement 100 %/)).toHaveTextContent("(ajoutez 5 points)");
    expect(activate).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Lecture"), { target: { value: "10" } });
    expect(screen.getByText(/Total :/)).toHaveTextContent("Total : 100 % — prêt à activer.");
    expect(activate).toBeEnabled();
    await user.click(activate);
    const rubric = usePortal.getState().rubric;
    expect(rubric.version).toBe(version + 1);
    expect(rubric.categories.map((c) => c.weight)).toEqual([60, 10, 15, 15]);
  });
});

describe("Admin — membership applications", () => {
  const apply = () =>
    usePortal.getState().applyMembership({
      firstName: "Salma",
      lastName: "Haddou",
      email: "salma@example.org",
      phone: "514 555-0123",
      gender: "femme",
      children: [{ firstName: "Rayan", birthDate: "2018-04-10", gender: "homme" }],
      enrolments: [
        { person: "Vous", activityIds: ["a-coran-femmes"] },
        { person: "Rayan", activityIds: ["a-coran-6-9", "a-soccer"] },
      ],
      activityIds: ["a-coran-femmes", "a-coran-6-9", "a-soccer"],
    });

  it("lists each person with the activities they asked for", async () => {
    apply();
    const { openTab } = renderAdmin();
    await openTab("Membres");

    const card = within(screen.getByRole("article", { name: "Salma Haddou" }));
    expect(card.getByRole("list", { name: "Activités de Salma Haddou" })).toHaveTextContent(
      "Cours de Coran — femmes",
    );
    const rayan = card.getByRole("list", { name: "Activités de Rayan" });
    expect(
      within(rayan)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["Coran et arabe — 6 à 9 ans", "Soccer jeunes"]);
    expect(card.getByText(/Garçon · \d+ ans/)).toBeInTheDocument();
  });

  it("validates an application: the adult becomes an active member", async () => {
    apply();
    const { user, openTab } = renderAdmin();
    await openTab("Membres");
    const before = usePortal.getState().persons.length;

    await user.click(screen.getByRole("button", { name: "Valider l’adhésion de Salma Haddou" }));

    const state = usePortal.getState();
    expect(state.applications).toHaveLength(0);
    expect(state.persons).toHaveLength(before + 1);
    expect(state.persons.at(-1)).toMatchObject({
      firstName: "Salma",
      lastName: "Haddou",
      gender: "femme",
      role: "parent",
      profiles: [],
      membership: "active",
      email: "salma@example.org",
      phone: "514 555-0123",
    });
    expect(new Set(state.persons.map((p) => p.id)).size).toBe(state.persons.length);

    const status = screen.getByText(/^Adhésion de Salma Haddou validée/);
    expect(status).toHaveTextContent(
      "Adhésion de Salma Haddou validée : elle figure maintenant parmi les membres actifs. Rayan doit encore être placé dans une classe par l’école.",
    );
    expect(status).toHaveFocus();
    expect(screen.queryByRole("article", { name: "Salma Haddou" })).not.toBeInTheDocument();
    const row = screen.getByRole("row", { name: /Salma Haddou/ });
    expect(within(row).getByText("Active")).toBeInTheDocument();
  });

  it("refuses an application only after confirmation", async () => {
    apply();
    const { user, openTab } = renderAdmin();
    await openTab("Membres");
    const persons = usePortal.getState().persons;

    await user.click(screen.getByRole("button", { name: "Refuser la demande de Salma Haddou" }));
    let dialog = screen.getByRole("dialog", { name: "Refuser cette demande ?" });
    expect(dialog).toHaveTextContent("de Salma Haddou (avec 1 enfant) sera retirée de la liste");
    await user.click(within(dialog).getByRole("button", { name: "Annuler" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(usePortal.getState().applications).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Refuser la demande de Salma Haddou" }));
    dialog = screen.getByRole("dialog", { name: "Refuser cette demande ?" });
    await user.click(within(dialog).getByRole("button", { name: "Refuser la demande" }));

    expect(usePortal.getState().applications).toHaveLength(0);
    expect(usePortal.getState().persons).toBe(persons);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByText("Demande de Salma Haddou refusée : elle est retirée de la liste."),
    ).toHaveFocus();
  });
});
