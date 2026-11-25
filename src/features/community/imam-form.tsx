"use client";

import Link from "next/link";
import { useState } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
import type { ImamQuestion } from "@/core/portal/types";
import { usePortal } from "@/lib/portal/store";
import { Field, Panel, btn, describedBy, inputCls } from "@/components/portal/kit";
import { ArrowRightIcon, LockIcon } from "@/components/ui/icons";
import { ChoiceGroup, FinePrint, SuccessHeading } from "./form-bits";
import {
  emailError,
  emailFormatError,
  firstInvalid,
  focusById,
  phoneError,
  phoneFormatError,
  requiredError,
  type Errors,
} from "./validation";

/**
 * « Poser une question à l’Imam » (§4.9, §6.7). The question is private by design: only
 * its author, authorised admins and the assigned imam ever see it. The follow-up channel
 * decides which contact field is required.
 */

type FollowUp = ImamQuestion["followUp"];

const FOLLOW_UP_OPTIONS = [
  { value: "portail", label: "Réponse dans le portail" },
  { value: "courriel", label: "Par courriel" },
  { value: "telephone", label: "Par téléphone" },
] as const satisfies readonly { value: FollowUp; label: string }[];

const MIN_CHARS = 20;
const MAX_CHARS = 2000;

interface Values {
  firstName: string;
  lastName: string;
  question: string;
  followUp: FollowUp;
  email: string;
  phone: string;
}

function fieldError(key: string, v: Values): string | undefined {
  switch (key) {
    case "imam-prenom":
      return requiredError(v.firstName, "Indiquez votre prénom.");
    case "imam-nom":
      return requiredError(v.lastName, "Indiquez votre nom de famille.");
    case "imam-question": {
      const len = v.question.trim().length;
      if (len === 0) return "Écrivez votre question.";
      if (len < MIN_CHARS) {
        const left = MIN_CHARS - len;
        return `Votre question est un peu courte : encore ${left} caractère${left > 1 ? "s" : ""} au moins, pour que l’imam comprenne bien votre situation.`;
      }
      return undefined;
    }
    case "imam-courriel":
      return v.followUp === "courriel"
        ? emailError(v.email, "Indiquez le courriel où recevoir la réponse.")
        : undefined;
    case "imam-telephone":
      return v.followUp === "telephone"
        ? phoneError(v.phone, "Indiquez le numéro où l’imam peut vous rappeler.")
        : undefined;
    default:
      return undefined;
  }
}

export function ImamQuestionForm() {
  const submitQuestion = usePortal((s) => s.submitQuestion);
  const [values, setValues] = useState<Values>({
    firstName: "",
    lastName: "",
    question: "",
    followUp: "portail",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState<FollowUp | null>(null);

  const update = (patch: Partial<Values>, key: string) => {
    const v = { ...values, ...patch };
    setValues(v);
    if (errors[key]) setErrors((e) => ({ ...e, [key]: fieldError(key, v) }));
  };

  const blurFormat = (key: string, message: string | undefined) => {
    if (message || errors[key])
      setErrors((e) => ({ ...e, [key]: message ?? fieldError(key, values) }));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const order: [string, string][] = [
      ["imam-prenom", "imam-prenom"],
      ["imam-nom", "imam-nom"],
      ["imam-question", "imam-question"],
      ...(values.followUp === "courriel"
        ? [["imam-courriel", "imam-courriel"] as [string, string]]
        : []),
      ...(values.followUp === "telephone"
        ? [["imam-telephone", "imam-telephone"] as [string, string]]
        : []),
    ];
    const next: Errors = {};
    for (const [key] of order) next[key] = fieldError(key, values);
    const focusId = firstInvalid(order, next);
    if (focusId) {
      flushSync(() => setErrors(next));
      focusById(focusId);
      return;
    }
    // In production the author comes from the signed-in session (§6.7), never from the form.
    submitQuestion({
      authorId: "p-visiteur",
      question: values.question.trim(),
      followUp: values.followUp,
    });
    setSent(values.followUp);
  };

  if (sent) return <QuestionSent followUp={sent} />;

  const len = values.question.trim().length;
  const reached = len >= MIN_CHARS;
  const qError = errors["imam-question"];

  return (
    <form noValidate onSubmit={onSubmit} aria-describedby="imam-obligatoire" className="space-y-6">
      <p id="imam-obligatoire" className="text-on-dark-muted text-[13.5px]">
        Les champs marqués d’un <span className="text-gold">*</span> sont obligatoires.
      </p>

      <Panel eyebrow="Vous" title="Qui pose la question">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="imam-prenom" label="Prénom" required error={errors["imam-prenom"]}>
            <input
              {...describedBy("imam-prenom", errors["imam-prenom"])}
              name="given-name"
              autoComplete="given-name"
              className={inputCls}
              value={values.firstName}
              onChange={(e) => update({ firstName: e.target.value }, "imam-prenom")}
            />
          </Field>
          <Field id="imam-nom" label="Nom" required error={errors["imam-nom"]}>
            <input
              {...describedBy("imam-nom", errors["imam-nom"])}
              name="family-name"
              autoComplete="family-name"
              className={inputCls}
              value={values.lastName}
              onChange={(e) => update({ lastName: e.target.value }, "imam-nom")}
            />
          </Field>
        </div>
      </Panel>

      <Panel eyebrow="Votre question" title="Ce que vous souhaitez demander">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="imam-question" className="text-on-dark text-[13.5px] font-medium">
            Votre question
            <span className="text-gold ml-1" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (obligatoire)</span>
          </label>
          <textarea
            id="imam-question"
            name="question"
            rows={7}
            maxLength={MAX_CHARS}
            aria-invalid={qError ? true : undefined}
            aria-describedby={`${qError ? "imam-question-error" : "imam-question-hint"} imam-question-count`}
            className={cn(inputCls, "min-h-40 resize-y leading-relaxed")}
            value={values.question}
            onChange={(e) => update({ question: e.target.value }, "imam-question")}
          />
          {!qError && (
            <p id="imam-question-hint" className="text-on-dark-faint text-[12.5px]">
              Décrivez votre situation simplement, en {MIN_CHARS} caractères au moins. Évitez de
              nommer d’autres personnes.
            </p>
          )}
          {qError && (
            <p id="imam-question-error" role="alert" className="text-[12.5px] text-[#ffb9a6]">
              {qError}
            </p>
          )}
          <p
            id="imam-question-count"
            className={cn("nums text-[12.5px]", reached ? "text-gold-light" : "text-on-dark-faint")}
          >
            {reached
              ? `${values.question.length} / ${MAX_CHARS} caractères — longueur minimale atteinte`
              : `${len} / ${MIN_CHARS} caractères minimum`}
          </p>
          {/* Announce only the threshold, never every keystroke. */}
          <span aria-live="polite" className="sr-only">
            {reached ? "Longueur minimale atteinte." : ""}
          </span>
        </div>
      </Panel>

      <Panel eyebrow="Suivi" title="Comment recevoir la réponse">
        <ChoiceGroup
          name="imam-suivi"
          legend="Suivi souhaité"
          required
          options={FOLLOW_UP_OPTIONS}
          value={values.followUp}
          onChange={(f) => update({ followUp: f }, "imam-suivi")}
          hint={
            values.followUp === "portail"
              ? "Vous serez averti dans le portail ; la réponse n’y est lisible que par vous."
              : values.followUp === "courriel"
                ? "Un courriel vous avertit ; la réponse reste lisible dans le portail."
                : "L’imam vous rappelle au numéro indiqué."
          }
        />
        {values.followUp === "courriel" && (
          <Field
            id="imam-courriel"
            label="Courriel pour la réponse"
            required
            error={errors["imam-courriel"]}
            className="mt-5 sm:max-w-[420px]"
          >
            <input
              {...describedBy("imam-courriel", errors["imam-courriel"])}
              type="email"
              name="email"
              autoComplete="email"
              spellCheck={false}
              className={inputCls}
              value={values.email}
              onChange={(e) => update({ email: e.target.value }, "imam-courriel")}
              onBlur={(e) => blurFormat("imam-courriel", emailFormatError(e.target.value))}
            />
          </Field>
        )}
        {values.followUp === "telephone" && (
          <Field
            id="imam-telephone"
            label="Téléphone pour être rappelé"
            required
            hint="Exemple : 514 555-0142."
            error={errors["imam-telephone"]}
            className="mt-5 sm:max-w-[420px]"
          >
            <input
              {...describedBy("imam-telephone", errors["imam-telephone"], true)}
              type="tel"
              name="tel"
              autoComplete="tel"
              className={inputCls}
              value={values.phone}
              onChange={(e) => update({ phone: e.target.value }, "imam-telephone")}
              onBlur={(e) => blurFormat("imam-telephone", phoneFormatError(e.target.value))}
            />
          </Field>
        )}
      </Panel>

      <div className="space-y-3">
        <button type="submit" className={btn("gold")}>
          Envoyer ma question
          <ArrowRightIcon width={16} height={16} />
        </button>
        <FinePrint className="flex items-start gap-2">
          <LockIcon width={14} height={14} className="text-gold mt-0.5 shrink-0" />
          <span>
            En service, ce formulaire demandera de vous connecter au portail : votre question sera
            liée à votre compte, et vous seul pourrez lire la réponse.
          </span>
        </FinePrint>
      </div>
    </form>
  );
}

const STEPS = [
  {
    label: "Reçue",
    text: "Votre question est arrivée au centre. Elle n’est visible par aucun autre membre.",
  },
  {
    label: "Attribuée",
    text: "Un administrateur habilité la confie à l’imam — sans la lire en public, ni la partager.",
  },
  {
    label: "Répondue",
    text: "L’imam vous répond en privé. S’il préfère en parler de vive voix, il demande à vous contacter.",
  },
];

function QuestionSent({ followUp }: { followUp: FollowUp }) {
  const how =
    followUp === "portail"
      ? "La réponse vous attendra dans votre espace du portail."
      : followUp === "courriel"
        ? "Vous recevrez un courriel dès que la réponse est prête ; elle restera lisible dans le portail."
        : "L’imam vous rappellera au numéro indiqué.";
  return (
    <div className="border-gold/20 rounded-[20px] border bg-white/[0.04] p-5 shadow-[0_30px_60px_-34px_rgba(0,0,0,0.85)] md:p-8">
      <SuccessHeading eyebrow="Question privée">Votre question est envoyée</SuccessHeading>
      <p className="text-on-dark-muted mt-4 text-[15px] leading-relaxed">
        {how} Elle ne sera jamais publiée.
      </p>

      <h3 className="font-display text-on-dark mt-8 text-[20px]">Où en est votre question</h3>
      <ol className="mt-4 space-y-4">
        {STEPS.map((s, i) => {
          const current = i === 0;
          return (
            <li key={s.label} className="flex gap-3" aria-current={current ? "step" : undefined}>
              <span
                aria-hidden="true"
                className={cn(
                  "nums flex size-8 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold",
                  current ? "border-gold bg-gold text-ink" : "border-on-dark/20 text-on-dark-faint",
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 pt-1">
                <p
                  className={cn(
                    "text-[15px] font-medium",
                    current ? "text-gold-light" : "text-on-dark",
                  )}
                >
                  {s.label}
                  {current && (
                    <span className="text-on-dark-muted ml-2 text-[12.5px] font-normal">
                      — étape actuelle
                    </span>
                  )}
                </p>
                <p className="text-on-dark-muted mt-0.5 text-[14px] leading-relaxed">{s.text}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/portail" className={btn("gold")}>
          Aller au portail
          <ArrowRightIcon width={16} height={16} />
        </Link>
        <Link href="/" className={btn("ghost")}>
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}
