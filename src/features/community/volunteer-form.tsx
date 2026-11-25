"use client";

import Link from "next/link";
import { useState } from "react";
import { flushSync } from "react-dom";
import { VOLUNTEER_AVAILABILITY, VOLUNTEER_INTERESTS } from "@/core/portal/seed";
import { usePortal } from "@/lib/portal/store";
import { Field, Panel, Pill, btn, describedBy, inputCls } from "@/components/portal/kit";
import { ArrowRightIcon } from "@/components/ui/icons";
import { ChipGroup, ConsentCheckbox, FinePrint, SuccessHeading } from "./form-bits";
import {
  emailError,
  emailFormatError,
  firstInvalid,
  focusById,
  phoneFormatError,
  requiredError,
  type Errors,
} from "./validation";

/**
 * « Devenir bénévole » (§4.7): contact details, areas of interest, availability and an
 * explicit consent to be contacted — the coordinators later search by skill and
 * availability, so both lists need at least one choice.
 */

const INTEREST_OPTIONS = VOLUNTEER_INTERESTS.map((v) => ({ value: v, label: v }));
const AVAILABILITY_OPTIONS = VOLUNTEER_AVAILABILITY.map((v) => ({ value: v, label: v }));

interface Values {
  name: string;
  email: string;
  phone: string;
  interests: string[];
  availability: string[];
  consent: boolean;
}

const ORDER: [string, string][] = [
  ["ben-nom", "ben-nom"],
  ["ben-courriel", "ben-courriel"],
  ["ben-telephone", "ben-telephone"],
  ["ben-interets", "ben-interets-0"],
  ["ben-disponibilites", "ben-disponibilites-0"],
  ["ben-consentement", "ben-consentement"],
];

function fieldError(key: string, v: Values): string | undefined {
  switch (key) {
    case "ben-nom":
      return requiredError(v.name, "Indiquez votre nom complet.");
    case "ben-courriel":
      return emailError(v.email);
    case "ben-telephone":
      return phoneFormatError(v.phone);
    case "ben-interets":
      return v.interests.length
        ? undefined
        : "Choisissez au moins un domaine où vous aimeriez aider.";
    case "ben-disponibilites":
      return v.availability.length
        ? undefined
        : "Choisissez au moins un moment où vous êtes disponible.";
    case "ben-consentement":
      return v.consent
        ? undefined
        : "Cochez cette case : sans votre accord, la coordination ne peut pas vous contacter.";
    default:
      return undefined;
  }
}

const toggleIn = (list: string[], v: string) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

export function VolunteerForm() {
  const applyVolunteer = usePortal((s) => s.applyVolunteer);
  const [values, setValues] = useState<Values>({
    name: "",
    email: "",
    phone: "",
    interests: [],
    availability: [],
    consent: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [sent, setSent] = useState<Values | null>(null);

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
    setTriedSubmit(true);
    const next: Errors = {};
    for (const [key] of ORDER) next[key] = fieldError(key, values);
    const focusId = firstInvalid(ORDER, next);
    if (focusId) {
      flushSync(() => setErrors(next));
      focusById(focusId);
      return;
    }
    const clean = {
      ...values,
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
    };
    applyVolunteer({
      name: clean.name,
      email: clean.email,
      phone: clean.phone,
      interests: clean.interests,
      availability: clean.availability,
    });
    setSent(clean);
  };

  if (sent) return <VolunteerSent sent={sent} />;

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <form noValidate onSubmit={onSubmit} aria-describedby="ben-obligatoire" className="space-y-6">
      <p id="ben-obligatoire" className="text-on-dark-muted text-[13.5px]">
        Les champs marqués d’un <span className="text-gold">*</span> sont obligatoires.
      </p>

      <Panel eyebrow="Vous" title="Vos coordonnées">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="ben-nom"
            label="Nom complet"
            required
            error={errors["ben-nom"]}
            className="sm:col-span-2"
          >
            <input
              {...describedBy("ben-nom", errors["ben-nom"])}
              name="name"
              autoComplete="name"
              className={inputCls}
              value={values.name}
              onChange={(e) => update({ name: e.target.value }, "ben-nom")}
            />
          </Field>
          <Field id="ben-courriel" label="Courriel" required error={errors["ben-courriel"]}>
            <input
              {...describedBy("ben-courriel", errors["ben-courriel"])}
              type="email"
              name="email"
              autoComplete="email"
              spellCheck={false}
              className={inputCls}
              value={values.email}
              onChange={(e) => update({ email: e.target.value }, "ben-courriel")}
              onBlur={(e) => blurFormat("ben-courriel", emailFormatError(e.target.value))}
            />
          </Field>
          <Field
            id="ben-telephone"
            label="Téléphone (facultatif)"
            hint="Exemple : 514 555-0142."
            error={errors["ben-telephone"]}
          >
            <input
              {...describedBy("ben-telephone", errors["ben-telephone"], true)}
              type="tel"
              name="tel"
              autoComplete="tel"
              className={inputCls}
              value={values.phone}
              onChange={(e) => update({ phone: e.target.value }, "ben-telephone")}
              onBlur={(e) => blurFormat("ben-telephone", phoneFormatError(e.target.value))}
            />
          </Field>
        </div>
      </Panel>

      <Panel eyebrow="Votre aide" title="Où et quand ?">
        <div className="space-y-6">
          <ChipGroup
            name="ben-interets"
            legend="Domaines d’intérêt"
            required
            options={INTEREST_OPTIONS}
            values={values.interests}
            onToggle={(v) => update({ interests: toggleIn(values.interests, v) }, "ben-interets")}
            hint="Cochez tout ce qui vous tente."
            error={errors["ben-interets"]}
          />
          <ChipGroup
            name="ben-disponibilites"
            legend="Disponibilités"
            required
            options={AVAILABILITY_OPTIONS}
            values={values.availability}
            onToggle={(v) =>
              update({ availability: toggleIn(values.availability, v) }, "ben-disponibilites")
            }
            error={errors["ben-disponibilites"]}
          />
        </div>
      </Panel>

      <Panel eyebrow="Accord" title="Être contacté">
        <ConsentCheckbox
          id="ben-consentement"
          checked={values.consent}
          onChange={(c) => update({ consent: c }, "ben-consentement")}
          error={errors["ben-consentement"]}
        >
          J’accepte d’être contacté par la coordination des bénévoles.
        </ConsentCheckbox>
        <FinePrint className="mt-3">
          Vos coordonnées ne servent qu’à la coordination des bénévoles. Elles ne sont ni publiées
          ni transmises.
        </FinePrint>
      </Panel>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <button type="submit" className={btn("gold")}>
          Proposer mon aide
          <ArrowRightIcon width={16} height={16} />
        </button>
        {triedSubmit && errorCount > 0 && (
          <p className="text-[13.5px] text-[#ffb9a6]">
            {errorCount === 1 ? "Un champ est à corriger" : `${errorCount} champs sont à corriger`}{" "}
            — rien n’a été effacé.
          </p>
        )}
      </div>
    </form>
  );
}

function VolunteerSent({ sent }: { sent: Values }) {
  return (
    <div className="border-gold/20 rounded-[20px] border bg-white/[0.04] p-5 shadow-[0_30px_60px_-34px_rgba(0,0,0,0.85)] md:p-8">
      <SuccessHeading eyebrow="Bénévolat">Merci, votre proposition est envoyée</SuccessHeading>
      <p className="text-on-dark-muted mt-4 flex flex-wrap items-center gap-2 text-[14.5px]">
        Statut :<Pill tone="warn">Reçue — la coordination vous contactera</Pill>
      </p>

      <dl className="mt-6 grid gap-x-6 gap-y-2 text-[14.5px] sm:grid-cols-[auto_1fr]">
        <dt className="text-on-dark-faint">Nom</dt>
        <dd className="text-on-dark">{sent.name}</dd>
        <dt className="text-on-dark-faint">Courriel</dt>
        <dd className="text-on-dark break-all">{sent.email}</dd>
        {sent.phone && (
          <>
            <dt className="text-on-dark-faint">Téléphone</dt>
            <dd className="nums text-on-dark">{sent.phone}</dd>
          </>
        )}
        <dt className="text-on-dark-faint">Intérêts</dt>
        <dd className="text-on-dark">{sent.interests.join(", ")}</dd>
        <dt className="text-on-dark-faint">Disponibilités</dt>
        <dd className="text-on-dark">{sent.availability.join(", ")}</dd>
      </dl>

      <p className="text-on-dark-muted mt-6 text-[14.5px] leading-relaxed">
        La coordination des bénévoles vous écrira à{" "}
        <span className="text-on-dark">{sent.email}</span> pour vous proposer une première mission
        selon vos intérêts et vos disponibilités. Vous pourrez les modifier à tout moment depuis le
        portail.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/evenements" className={btn("gold")}>
          Voir les prochains événements
          <ArrowRightIcon width={16} height={16} />
        </Link>
        <Link href="/" className={btn("ghost")}>
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}
