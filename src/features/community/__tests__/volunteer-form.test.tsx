import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { usePortal } from "@/lib/portal/store";
import { VolunteerForm } from "../volunteer-form";
import { setupFormTests } from "./helpers";

setupFormTests();

describe("Public — volunteer form", () => {
  it("requires the consent to be contacted before sending anything", async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.type(screen.getByLabelText(/^Nom complet/), "Leïla Haddad");
    await user.type(screen.getByLabelText(/^Courriel/), "leila.h@example.org");
    await user.click(screen.getByRole("checkbox", { name: "Accueil" }));
    await user.click(screen.getByRole("checkbox", { name: "Cuisine" }));
    await user.click(screen.getByRole("checkbox", { name: "Samedi" }));
    await user.click(screen.getByRole("button", { name: /^Proposer mon aide/ }));

    const consent = screen.getByRole("checkbox", { name: /^J’accepte d’être contacté/ });
    expect(consent).toHaveFocus();
    expect(consent).toHaveAccessibleDescription(
      "Cochez cette case : sans votre accord, la coordination ne peut pas vous contacter.",
    );
    expect(screen.getByText(/^Un champ est à corriger/)).toBeInTheDocument();
    expect(usePortal.getState().volunteerApplications).toHaveLength(0);

    await user.click(consent);
    await user.click(screen.getByRole("button", { name: /^Proposer mon aide/ }));

    expect(
      screen.getByRole("heading", { name: "Merci, votre proposition est envoyée" }),
    ).toHaveFocus();
    expect(usePortal.getState().volunteerApplications).toEqual([
      expect.objectContaining({
        name: "Leïla Haddad",
        email: "leila.h@example.org",
        phone: "",
        interests: ["Accueil", "Cuisine"],
        availability: ["Samedi"],
      }),
    ]);
  });
});
