"use client";

import { useRef, useState, type ComponentProps, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { usePortal } from "@/lib/portal/store";
import type { ImamQuestion, ImamQuestionStatus, Person } from "@/core/portal/types";
import {
  EmptyNote,
  Field,
  Pill,
  Segmented,
  btn,
  describedBy,
  inputCls,
} from "@/components/portal/kit";
import { CheckIcon, LockIcon } from "@/components/ui/icons";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DemoNote, SpaceHeading, ofName, usePersonName, type SpaceProps } from "../shared";

/**
 * Portail Imam (spec §4.9, §6.7) — private questions from members. Each question is seen
 * only by its author, authorised admins and the assigned imam; answers are private and
 * never published by default. The imam sees the question and the follow-up channel the
 * member chose — no family, school or financial record (§3.1).
 */

type Tone = NonNullable<ComponentProps<typeof Pill>["tone"]>;
type Gender = Person["gender"];
type Channel = ImamQuestion["followUp"];

const STATUS_META: Record<ImamQuestionStatus, { label: string; tone: Tone }> = {
  received: { label: "Reçue", tone: "gold" },
  triaged: { label: "Triée", tone: "neutral" },
  assigned: { label: "Attribuée", tone: "gold" },
  answered: { label: "Répondue", tone: "emerald" },
  contact_requested: { label: "Contact demandé", tone: "warn" },
  closed: { label: "Close", tone: "neutral" },
};

type Filter = "todo" | "answered" | "closed" | "all";
const FILTER_STATUSES: Record<Exclude<Filter, "all">, ImamQuestionStatus[]> = {
  todo: ["received", "triaged", "assigned"],
  answered: ["answered", "contact_requested"],
  closed: ["closed"],
};
const FILTER_LABELS: Record<Filter, string> = {
  todo: "À traiter",
  answered: "Répondues",
  closed: "Closes",
  all: "Toutes",
};
const FILTER_ORDER: Filter[] = ["todo", "answered", "closed", "all"];
const EMPTY: Record<Filter, string> = {
  todo: "Aucune question à traiter. Les nouvelles questions qui vous sont attribuées apparaîtront ici.",
  answered: "Aucune question répondue pour l’instant.",
  closed: "Aucune question close.",
  all: "Aucune question reçue pour l’instant.",
};

const matches = (filter: Filter, status: ImamQuestionStatus) =>
  filter === "all" || FILTER_STATUSES[filter].includes(status);

const CHANNEL_LABELS: Record<Channel, string> = {
  portail: "Portail",
  courriel: "Courriel",
  telephone: "Téléphone",
};
const CHANNEL_PHRASES: Record<Channel, string> = {
  portail: "par un message dans son espace du portail",
  courriel: "par courriel",
  telephone: "par téléphone",
};

/** Minimum length of a written answer — a real answer, not a placeholder. */
const MIN_ANSWER = 40;

const agree = (g: Gender, m: string, f: string) => (g === "femme" ? f : m);

/** When the author has no record (public form) and typed no name either. */
const UNKNOWN_AUTHOR = "un membre non identifié";

/** Closes a sentence that ends on a name, without doubling the period of « Fatima Zahra B. ». */
const endSentence = (s: string) => (s.endsWith(".") ? s : `${s}.`);

/**
 * Who will be contacted, and how. A member's gender is on record; a visitor's is not, so
 * their sentence is epicene rather than guessed.
 */
function contactSentence(author: string, g: Gender | null, channel: Channel): string {
  const how = CHANNEL_PHRASES[channel];
  return g
    ? `${author} sera ${agree(g, "contacté", "contactée")} ${how}, le canal ${agree(g, "qu’il", "qu’elle")} a choisi.`
    : `La prise de contact avec ${author} se fera ${how}, le canal choisi.`;
}

const CONTACT_HREF: Record<Channel, (contact: string) => string | null> = {
  portail: () => null,
  courriel: (c) => `mailto:${c}`,
  telephone: (c) => `tel:${c.replace(/[^\d+]/g, "")}`,
};

export function ImamSpace({ me }: SpaceProps) {
  const questions = usePortal((s) => s.imamQuestions);
  const [filter, setFilter] = useState<Filter>("todo");
  const [announce, setAnnounce] = useState("");
  const announceRef = useRef<HTMLParagraphElement>(null);

  const count = (f: Filter) => questions.filter((q) => matches(f, q.status)).length;
  // The waiting queue reads oldest first (first come, first served); history newest first.
  const list = questions
    .filter((q) => matches(filter, q.status))
    .sort((a, b) => (filter === "todo" ? a.at.localeCompare(b.at) : b.at.localeCompare(a.at)));

  /** Announces a change; returns true when the card left the current filter. */
  const onChanged = (next: ImamQuestionStatus, message: string) => {
    flushSync(() => setAnnounce(message));
    const left = !matches(filter, next);
    // The card is gone: keep the keyboard user somewhere meaningful.
    if (left) announceRef.current?.focus();
    return left;
  };

  return (
    <>
      <SpaceHeading eyebrow="Portail Imam" title={`Bienvenue, ${me.firstName}`}>
        Les questions que les membres vous adressent, et le suivi qu’ils ont choisi.
      </SpaceHeading>

      <div className="border-gold/20 bg-gold/[0.06] text-on-dark-muted mb-6 flex gap-3 rounded-[16px] border px-4 py-3.5 text-[14px] leading-relaxed md:px-5">
        <LockIcon width={20} height={20} className="text-gold mt-0.5 shrink-0" />
        <p>
          <strong className="text-on-dark font-semibold">Questions privées.</strong> Chaque question
          n’est visible que par son auteur, les administrateurs habilités et l’imam qui lui est
          attribué. Rien n’est jamais publié par défaut. Vous ne voyez ni dossier familial, ni
          scolaire, ni financier : seulement la question et le canal de suivi choisi.
        </p>
      </div>

      <Segmented
        name="imam-filter"
        label="Afficher les questions"
        options={FILTER_ORDER.map((f) => ({
          value: f,
          label: `${FILTER_LABELS[f]} (${count(f)})`,
        }))}
        value={filter}
        onChange={(f) => {
          setFilter(f);
          setAnnounce("");
        }}
      />
      {filter === "todo" && list.length > 1 && (
        <p className="text-on-dark-faint mt-2 text-[12.5px]">Les plus anciennes en premier.</p>
      )}

      <p
        ref={announceRef}
        tabIndex={-1}
        role="status"
        className={cn(
          "focus-visible:outline-gold-light focus-visible:outline-2 focus-visible:outline-offset-2",
          announce &&
            "mt-4 flex gap-2.5 rounded-[12px] border border-[#1c7d5b]/45 bg-[#1c7d5b]/15 px-3.5 py-3 text-[14px] leading-relaxed text-[#bfeedb]",
        )}
      >
        {announce && <CheckIcon width={18} height={18} className="mt-0.5 shrink-0" />}
        {announce}
      </p>

      <div className="mt-5">
        {list.length === 0 ? (
          <EmptyNote>{EMPTY[filter]}</EmptyNote>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {list.map((q) => (
              <li key={q.id} className="min-w-0">
                <QuestionCard question={q} onChanged={onChanged} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <DemoNote>
        Ici, « Prendre en charge » simule l’attribution qu’un administrateur habilité fera
        normalement (§6.7). Les notifications au membre (sans contenu sensible) et le journal
        d’audit — attribution, consultation, réponse, clôture — se brancheront avec le serveur.
      </DemoNote>
    </>
  );
}

function QuestionCard({
  question: q,
  onChanged,
}: {
  question: ImamQuestion;
  onChanged: (next: ImamQuestionStatus, message: string) => boolean;
}) {
  const setStatus = usePortal((s) => s.setQuestionStatus);
  const persons = usePortal((s) => s.persons);
  const name = usePersonName();
  const [answering, setAnswering] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const replyRef = useRef<HTMLButtonElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  // A known member is named from their record; a visitor by the name they typed (§4.9).
  const person = persons.find((p) => p.id === q.authorId);
  const author = person ? name(q.authorId) : q.authorName?.trim() || UNKNOWN_AUTHOR;
  const g: Gender | null = person?.gender ?? null;
  const contactHref = q.contact ? CONTACT_HREF[q.followUp](q.contact) : null;
  const status = STATUS_META[q.status];
  const titleId = `q-${q.id}-title`;
  const answerId = `q-${q.id}-answer`;

  const canTake = q.status === "received" || q.status === "triaged";
  const canAnswer = q.status === "assigned" || q.status === "contact_requested";
  const canContact = q.status === "assigned";
  const canClose = q.status !== "closed" && !canTake;

  /** Applies a status change, announces it, and keeps focus inside the card if it stays. */
  const change = (next: ImamQuestionStatus, message: string, answer?: string) => {
    flushSync(() => {
      setStatus(q.id, next, answer);
      setAnswering(false);
      setText("");
      setError("");
    });
    const left = onChanged(next, message);
    if (!left) (actionsRef.current?.querySelector("button") ?? articleRef.current)?.focus();
  };

  const take = () =>
    change("assigned", endSentence(`Vous avez pris en charge la question ${ofName(author)}`));
  const requestContact = () =>
    change("contact_requested", `Contact demandé. ${contactSentence(author, g, q.followUp)}`);
  const close = () =>
    change(
      "closed",
      `La question ${ofName(author)} est close. Elle reste conservée selon la politique de rétention du centre.`,
    );

  function submitAnswer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = text.trim();
    let message = "";
    if (!trimmed) message = "Écrivez votre réponse avant de l’envoyer.";
    else if (trimmed.length < MIN_ANSWER)
      message = `Votre réponse est trop courte : au moins ${MIN_ANSWER} caractères (${trimmed.length} pour l’instant). Pour un échange de vive voix, choisissez plutôt « Demander un contact ».`;
    if (message) {
      flushSync(() => setError(message));
      document.getElementById(answerId)?.focus();
      return;
    }
    change(
      "answered",
      `${endSentence(`Réponse envoyée à ${author}`)} ${g ? `${agree(g, "Il", "Elle")} recevra une notification` : "Une notification partira"} ${CHANNEL_PHRASES[q.followUp]}, sans le contenu de la réponse.`,
      trimmed,
    );
  }

  const cancel = () => {
    flushSync(() => {
      setAnswering(false);
      setError("");
    });
    replyRef.current?.focus();
  };

  return (
    <article
      ref={articleRef}
      tabIndex={-1}
      aria-labelledby={titleId}
      className="focus-visible:outline-gold-light border-gold/15 h-full rounded-[18px] border bg-white/[0.035] p-5 shadow-[0_30px_60px_-34px_rgba(0,0,0,0.85)] focus-visible:outline-2 focus-visible:outline-offset-2 md:p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={titleId} className="font-display text-on-dark text-[20px] leading-tight">
            Question {ofName(author)}
          </h2>
          <p className="text-on-dark-muted mt-1 text-[13px]">
            <time dateTime={q.at}>{formatDateTime(q.at)}</time> · Suivi :{" "}
            {CHANNEL_LABELS[q.followUp]}
            {q.contact && (
              <>
                {" · "}
                {contactHref ? (
                  <a
                    href={contactHref}
                    className="text-gold-light break-all underline-offset-4 hover:underline"
                  >
                    {q.contact}
                  </a>
                ) : (
                  <span className="text-on-dark break-all">{q.contact}</span>
                )}
              </>
            )}
          </p>
        </div>
        <Pill tone={status.tone}>{status.label}</Pill>
      </header>

      <blockquote className="border-gold/40 text-on-dark mt-4 border-l-2 pl-4 text-[16px] leading-relaxed">
        {q.question}
      </blockquote>

      {q.answer && (
        <div className="mt-4 rounded-[12px] border border-[#1c7d5b]/40 bg-[#1c7d5b]/10 px-4 py-3">
          <p className="eyebrow text-[#9fe0c2]">Réponse privée</p>
          <p className="text-on-dark-muted mt-1.5 text-[14.5px] leading-relaxed">{q.answer}</p>
        </div>
      )}

      {q.status === "contact_requested" && (
        <p className="text-on-dark-muted mt-4 rounded-[12px] border border-[#d9a23d]/35 bg-[#d9a23d]/10 px-4 py-3 text-[14px] leading-relaxed">
          {contactSentence(author, g, q.followUp)} Vous pourrez ensuite consigner une réponse
          écrite.
        </p>
      )}

      {answering ? (
        <form
          noValidate
          onSubmit={submitAnswer}
          className="border-gold/10 mt-5 grid gap-3 border-t pt-4"
        >
          <Field
            id={answerId}
            label="Votre réponse"
            required
            error={error}
            hint={`Réponse privée : ${g ? `${agree(g, "seul", "seule")} ${author} pourra la lire` : `elle ne sera lisible que par ${author}`}. Au moins ${MIN_ANSWER} caractères.`}
          >
            <textarea
              {...describedBy(answerId, error, true)}
              rows={6}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError("");
              }}
              className={cn(inputCls, "resize-y leading-relaxed")}
              autoFocus
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={btn("gold", "sm")}>
              Envoyer la réponse
            </button>
            <button type="button" onClick={cancel} className={btn("ghost", "sm")}>
              Annuler
            </button>
          </div>
        </form>
      ) : (
        (canTake || canAnswer || canContact || canClose) && (
          <div ref={actionsRef} className="border-gold/10 mt-5 flex flex-wrap gap-2 border-t pt-4">
            {canTake && (
              <button type="button" onClick={take} className={btn("gold", "sm")}>
                Prendre en charge
              </button>
            )}
            {canAnswer && (
              <button
                ref={replyRef}
                type="button"
                onClick={() => setAnswering(true)}
                className={btn("gold", "sm")}
              >
                Répondre
              </button>
            )}
            {canContact && (
              <button type="button" onClick={requestContact} className={btn("ghost", "sm")}>
                Demander un contact
              </button>
            )}
            {canClose && (
              <button type="button" onClick={close} className={btn("subtle", "sm")}>
                Clore
              </button>
            )}
          </div>
        )
      )}
    </article>
  );
}
