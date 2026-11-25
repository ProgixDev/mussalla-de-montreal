import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { usePortal } from "@/lib/portal/store";
import { ImamQuestionForm } from "../imam-form";
import { setupFormTests } from "./helpers";

setupFormTests();

const QUESTION = "Comment organiser la prière en voyage quand on est en famille ?";

async function fillQuestion(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Prénom/), "Amina");
  await user.type(screen.getByLabelText(/^Nom/), "Diallo");
  await user.type(screen.getByLabelText(/^Votre question/), `  ${QUESTION}  `);
}

describe("Public — question to the Imam", () => {
  it("requires the e-mail for an e-mail follow-up, then stores the name and contact", async () => {
    const user = userEvent.setup();
    render(<ImamQuestionForm />);
    const before = usePortal.getState().imamQuestions.length;
    await fillQuestion(user);

    await user.click(screen.getByRole("radio", { name: "Par courriel" }));
    await user.click(screen.getByRole("button", { name: /^Envoyer ma question/ }));

    const email = screen.getByLabelText(/^Courriel pour la réponse/);
    expect(email).toHaveFocus();
    expect(email).toHaveAccessibleDescription("Indiquez le courriel où recevoir la réponse.");
    expect(usePortal.getState().imamQuestions).toHaveLength(before);

    await user.type(email, "amina@example.org");
    await user.click(screen.getByRole("button", { name: /^Envoyer ma question/ }));

    expect(screen.getByRole("heading", { name: "Votre question est envoyée" })).toHaveFocus();
    const { imamQuestions } = usePortal.getState();
    expect(imamQuestions).toHaveLength(before + 1);
    expect(imamQuestions[0]).toMatchObject({
      authorId: "p-visiteur",
      authorName: "Amina Diallo",
      question: QUESTION,
      followUp: "courriel",
      contact: "amina@example.org",
      status: "received",
    });
  });

  it("requires the phone number for a phone follow-up", async () => {
    const user = userEvent.setup();
    render(<ImamQuestionForm />);
    await fillQuestion(user);

    await user.click(screen.getByRole("radio", { name: "Par téléphone" }));
    expect(screen.queryByLabelText(/^Courriel pour la réponse/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Envoyer ma question/ }));
    const phone = screen.getByLabelText(/^Téléphone pour être rappelé/);
    expect(phone).toHaveAccessibleDescription("Indiquez le numéro où l’imam peut vous rappeler.");

    await user.type(phone, "514 555-0199");
    await user.click(screen.getByRole("button", { name: /^Envoyer ma question/ }));
    expect(usePortal.getState().imamQuestions[0]).toMatchObject({
      authorName: "Amina Diallo",
      followUp: "telephone",
      contact: "514 555-0199",
    });
  });

  it("keeps no contact for a follow-up in the portal", async () => {
    const user = userEvent.setup();
    render(<ImamQuestionForm />);
    await fillQuestion(user);
    await user.click(screen.getByRole("button", { name: /^Envoyer ma question/ }));

    const stored = usePortal.getState().imamQuestions[0];
    expect(stored).toMatchObject({ authorName: "Amina Diallo", followUp: "portail" });
    expect(stored).not.toHaveProperty("contact");
  });
});
