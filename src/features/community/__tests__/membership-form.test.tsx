import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { usePortal } from "@/lib/portal/store";
import { MembershipForm } from "../membership-form";
import { setupFormTests } from "./helpers";

setupFormTests();

/** A birth date that makes the child 8 today, whatever the day the test runs. */
const eightYearsAgo = `${new Date().getFullYear() - 8}-01-01`;

async function fillAdult(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Prénom/), "Yacine");
  await user.type(screen.getByLabelText(/^Nom/), "Belaid");
  await user.type(screen.getByLabelText(/^Courriel/), "yacine@example.org");
  await user.type(screen.getByLabelText(/^Téléphone/), "514 555-0123");
  await user.click(screen.getByRole("radio", { name: "Homme" }));
}

describe("Public — membership form", () => {
  it("never lets an adult man tick a women-only activity, and says why", async () => {
    const user = userEvent.setup();
    render(<MembershipForm />);
    await fillAdult(user);

    const forMe = within(screen.getByRole("group", { name: "Pour vous (Yacine)" }));
    const womenOnly = forMe.getByRole("checkbox", { name: /^Cours de Coran — femmes/ });
    expect(womenOnly).toHaveAttribute("aria-disabled", "true");
    expect(womenOnly).toHaveAccessibleDescription(
      /Non accessible : Cette activité est réservée aux femmes\./,
    );

    await user.click(womenOnly);
    expect(womenOnly).not.toBeChecked();
    // The men's circle, on the other hand, is open to him.
    const halaqa = forMe.getByRole("checkbox", { name: /^Halaqa des hommes/ });
    await user.click(halaqa);
    expect(halaqa).toBeChecked();
  });

  it("stores the application with each person's activities; once approved, the adult is active", async () => {
    const user = userEvent.setup();
    render(<MembershipForm />);
    await fillAdult(user);

    await user.click(screen.getByRole("button", { name: "Ajouter un enfant" }));
    await user.type(screen.getByLabelText(/^Prénom de l’enfant/), "Rayan");
    fireEvent.change(screen.getByLabelText(/^Date de naissance/), {
      target: { value: eightYearsAgo },
    });
    await user.click(screen.getByRole("radio", { name: "Garçon" }));

    const forMe = within(screen.getByRole("group", { name: "Pour vous (Yacine)" }));
    await user.click(forMe.getByRole("checkbox", { name: /^Halaqa des hommes/ }));
    await user.click(forMe.getByRole("checkbox", { name: /^Dars du dimanche/ }));
    const forRayan = within(screen.getByRole("group", { name: "Pour Rayan" }));
    await user.click(forRayan.getByRole("checkbox", { name: /^Coran et arabe — 6 à 9 ans/ }));
    // Too young for the 10–14 class: listed, refused, with the reason.
    expect(
      forRayan.getByRole("checkbox", { name: /^Coran et arabe — 10 à 14 ans/ }),
    ).toHaveAccessibleDescription(/Âge minimum : 10 ans\./);

    await user.click(screen.getByRole("checkbox", { name: /^J’accepte de recevoir/ }));
    await user.click(screen.getByRole("button", { name: "Envoyer ma demande" }));

    expect(screen.getByRole("heading", { name: "Demande envoyée" })).toHaveFocus();
    const { applications } = usePortal.getState();
    expect(applications).toHaveLength(1);
    const application = applications[0];
    expect(application).toMatchObject({
      firstName: "Yacine",
      lastName: "Belaid",
      email: "yacine@example.org",
      phone: "514 555-0123",
      gender: "homme",
      status: "pending",
      children: [{ firstName: "Rayan", birthDate: eightYearsAgo, gender: "homme" }],
      enrolments: [
        { person: "Vous", activityIds: ["a-halaqa-hommes", "a-dars"] },
        { person: "Rayan", activityIds: ["a-coran-6-9"] },
      ],
    });
    expect(application?.activityIds).toEqual(["a-halaqa-hommes", "a-dars", "a-coran-6-9"]);

    // The secretariat validates it (the admin space's « Valider l’adhésion »).
    usePortal.getState().approveApplication(application?.id ?? "");
    expect(usePortal.getState().applications).toHaveLength(0);
    expect(
      usePortal.getState().persons.find((p) => p.email === "yacine@example.org"),
    ).toMatchObject({
      firstName: "Yacine",
      lastName: "Belaid",
      role: "parent",
      membership: "active",
    });
  });

  it("sends nothing while a required field is missing", async () => {
    const user = userEvent.setup();
    render(<MembershipForm />);
    await fillAdult(user);
    await user.click(screen.getByRole("button", { name: "Envoyer ma demande" }));

    const consent = screen.getByRole("checkbox", { name: /^J’accepte de recevoir/ });
    expect(consent).toHaveFocus();
    expect(consent).toHaveAccessibleDescription(
      "Cochez cette case : sans votre accord, le centre ne peut pas vous joindre.",
    );
    expect(usePortal.getState().applications).toHaveLength(0);
  });
});
