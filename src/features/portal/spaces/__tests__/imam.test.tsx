import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { usePortal } from "@/lib/portal/store";
import { ImamSpace } from "../imam";
import { person, setupPortalTests } from "./helpers";

setupPortalTests();

const question = (id: string) => usePortal.getState().imamQuestions.find((q) => q.id === id);

describe("Imam — private questions", () => {
  it("takes a question, enforces the minimum answer length, then answers it", async () => {
    const user = userEvent.setup();
    render(<ImamSpace me={person("p-youssef")} />);
    const card = within(screen.getByRole("article", { name: "Question de Fatima Zahra B." }));

    await user.click(card.getByRole("button", { name: "Prendre en charge" }));
    expect(question("q-1")?.status).toBe("assigned");
    // « B. » closes the sentence: no doubled period.
    expect(screen.getByRole("status")).toHaveTextContent(
      /^Vous avez pris en charge la question de Fatima Zahra B\.$/,
    );

    await user.click(card.getByRole("button", { name: "Répondre" }));
    const answer = card.getByLabelText(/^Votre réponse/);
    expect(answer).toHaveFocus();
    expect(answer).toHaveAccessibleDescription(
      "Réponse privée : seule Fatima Zahra B. pourra la lire. Au moins 40 caractères.",
    );

    // Too short: refused, nothing recorded.
    await user.type(answer, "Voyez avec un savant.");
    await user.click(card.getByRole("button", { name: "Envoyer la réponse" }));
    expect(answer).toHaveAccessibleDescription(
      /^Votre réponse est trop courte : au moins 40 caractères \(21 pour l’instant\)\./,
    );
    expect(answer).toHaveFocus();
    expect(question("q-1")).toMatchObject({ status: "assigned" });
    expect(question("q-1")?.answer).toBeUndefined();

    const text =
      "Les prières manquées pendant la maladie se rattrapent peu à peu, sans vous épuiser. Je reste disponible.";
    await user.clear(answer);
    await user.type(answer, text);
    await user.click(card.getByRole("button", { name: "Envoyer la réponse" }));

    expect(question("q-1")).toMatchObject({ status: "answered", answer: text });
    // The card leaves « À traiter »; focus lands on the announcement.
    expect(
      screen.queryByRole("article", { name: "Question de Fatima Zahra B." }),
    ).not.toBeInTheDocument();
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(
      "Réponse envoyée à Fatima Zahra B. Elle recevra une notification par un message dans son espace du portail, sans le contenu de la réponse.",
    );
    expect(status).toHaveFocus();

    await user.click(screen.getByRole("radio", { name: /^Répondues/ }));
    const answered = within(screen.getByRole("article", { name: "Question de Fatima Zahra B." }));
    expect(answered.getByText(text)).toBeInTheDocument();
    expect(answered.getByText("Répondue")).toBeInTheDocument();
  });

  it("shows a visitor's name and contact instead of « — »", async () => {
    usePortal.getState().submitQuestion({
      authorId: "p-visiteur",
      authorName: "Amina Diallo",
      question: "Comment organiser la prière en voyage, pour une famille ?",
      followUp: "telephone",
      contact: "514 555-0199",
    });
    usePortal.getState().submitQuestion({
      authorId: "p-visiteur",
      authorName: "Moussa Traoré",
      question: "Quelles sont les heures d’ouverture pendant le Ramadan ?",
      followUp: "courriel",
      contact: "moussa@example.org",
    });
    const user = userEvent.setup();
    render(<ImamSpace me={person("p-youssef")} />);

    expect(screen.queryByText(/Question de —/)).not.toBeInTheDocument();
    const amina = within(screen.getByRole("article", { name: "Question d’Amina Diallo" }));
    expect(amina.getByRole("link", { name: "514 555-0199" })).toHaveAttribute(
      "href",
      "tel:5145550199",
    );
    expect(amina.getByText(/Suivi : Téléphone/)).toBeInTheDocument();
    const moussa = within(screen.getByRole("article", { name: "Question de Moussa Traoré" }));
    expect(moussa.getByRole("link", { name: "moussa@example.org" })).toHaveAttribute(
      "href",
      "mailto:moussa@example.org",
    );

    // Gender is unknown for a visitor: the wording stays epicene.
    await user.click(amina.getByRole("button", { name: "Prendre en charge" }));
    await user.click(amina.getByRole("button", { name: "Demander un contact" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Contact demandé. La prise de contact avec Amina Diallo se fera par téléphone, le canal choisi.",
    );
  });
});
