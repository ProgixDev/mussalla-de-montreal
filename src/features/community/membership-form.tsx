"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
import { ageOn, checkEligibility, isWaitlisted } from "@/core/portal/derive";
import type { Activity, Gender } from "@/core/portal/types";
import { APPLICANT_SELF, usePortal } from "@/lib/portal/store";
import { Field, Panel, Pill, btn, describedBy, inputCls } from "@/components/portal/kit";
import { ArrowRightIcon, LockIcon, PlusIcon, XIcon } from "@/components/ui/icons";
import { ChoiceGroup, ConsentCheckbox, FinePrint, SuccessHeading, checkboxCls } from "./form-bits";
import { usePublicActivities, useToday } from "./hooks";
import { isChildActivity, priceLabel } from "./labels";
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
 * « Devenir membre » (§4.1 « Adhésion » + « Inscription », §4.2). One request covers the
 * adult and, optionally, their children, plus the activities each person would join.
 *
 * Eligibility is shown live with the very rule the server will enforce (checkEligibility):
 * declared gender, age, membership — the membership being approved together with this
 * request, it is evaluated as "active". An activity someone can't join stays listed with
 * its reason (aria-disabled, still focusable, so a screen reader hears why), never hidden.
 */

const ADULT = "adulte";
/** The applicant is the adult of the household (the form says so). */
const ADULT_AGE = 18;
const MAX_CHILDREN = 10;

const GENDER_OPTIONS = [
  { value: "femme", label: "Femme" },
  { value: "homme", label: "Homme" },
] as const satisfies readonly { value: Gender; label: string }[];

const CHILD_GENDER_OPTIONS = [
  { value: "femme", label: "Fille" },
  { value: "homme", label: "Garçon" },
] as const satisfies readonly { value: Gender; label: string }[];

interface ChildRow {
  rid: string;
  firstName: string;
  birthDate: string;
  gender: Gender | "";
}

interface Values {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender | "";
  consent: boolean;
}

type Access =
  | { kind: "ok" }
  | { kind: "pending"; note: string }
  | { kind: "blocked"; reasons: string[] };

/**
 * What we can say now about one person and one activity. Unknown facts (gender not chosen,
 * birth date not entered) are filled with a value that can't produce a refusal, so any
 * reason returned comes from what IS known; then "pending" if an unknown fact matters.
 */
function accessFor(
  a: Activity,
  gender: Gender | "",
  age: number | null,
  who: "adult" | "child",
): Access {
  const res = checkEligibility(a, {
    gender: gender || (a.audience === "hommes" ? "homme" : "femme"),
    age: age ?? a.ageMin ?? a.ageMax ?? 0,
    membership: "active",
  });
  if (!res.ok) return { kind: "blocked", reasons: res.reasons };
  if (!gender && (a.audience === "femmes" || a.audience === "hommes")) {
    return {
      kind: "pending",
      note:
        who === "adult"
          ? "Choisissez votre genre déclaré (étape 1) pour vérifier l’accès."
          : "Choisissez le genre de l’enfant pour vérifier l’accès.",
    };
  }
  if (age === null && (a.ageMin !== null || a.ageMax !== null)) {
    return { kind: "pending", note: "Indiquez la date de naissance pour vérifier l’âge." };
  }
  return { kind: "ok" };
}

function birthDateError(v: string, today: string | null): string | undefined {
  if (!v) return "Indiquez la date de naissance de l’enfant.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v))
    return "Date incomplète — choisissez le jour, le mois et l’année.";
  if (today && v > today) return "La date de naissance ne peut pas être dans le futur.";
  if (today && ageOn(v, today) >= 18) {
    return "Un enfant doit avoir moins de 18 ans — une personne majeure remplit sa propre demande.";
  }
  return undefined;
}

const kidId = (rid: string, field: "prenom" | "naissance" | "genre") =>
  `adh-enfant-${rid}-${field}`;

interface SentSummary {
  name: string;
  email: string;
  phone: string;
  gender: Gender;
  lines: { key: string; who: string; items: { id: string; title: string; waitlist: boolean }[] }[];
}

export function MembershipForm({ initialActivityId }: { initialActivityId?: string }) {
  const activities = usePublicActivities();
  const today = useToday();
  const applyMembership = usePortal((s) => s.applyMembership);

  // The activity chosen in the catalogue (?activite=…) — pre-checked for the adult, or for
  // a first child row when it is a children's activity.
  const [requested] = useState(() => activities.find((a) => a.id === initialActivityId) ?? null);
  const requestedForChild = requested !== null && isChildActivity(requested);

  const [values, setValues] = useState<Values>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    consent: false,
  });
  const [kids, setKids] = useState<ChildRow[]>(() =>
    requestedForChild ? [{ rid: "1", firstName: "", birthDate: "", gender: "" }] : [],
  );
  const [selected, setSelected] = useState<Record<string, string[]>>(() =>
    requested ? { [requestedForChild ? "1" : ADULT]: [requested.id] } : {},
  );
  const [errors, setErrors] = useState<Errors>({});
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [sent, setSent] = useState<SentSummary | null>(null);
  const nextRid = useRef(2);
  const addKidRef = useRef<HTMLButtonElement>(null);

  // ── field-level validation ────────────────────────────────────────────
  const fieldError = (key: string, v: Values, rows: ChildRow[]): string | undefined => {
    switch (key) {
      case "adh-prenom":
        return requiredError(v.firstName, "Indiquez votre prénom.");
      case "adh-nom":
        return requiredError(v.lastName, "Indiquez votre nom de famille.");
      case "adh-courriel":
        return emailError(v.email);
      case "adh-telephone":
        return phoneError(
          v.phone,
          "Indiquez un numéro de téléphone — il sert aussi aux alertes urgentes.",
        );
      case "adh-genre":
        return v.gender
          ? undefined
          : "Choisissez le genre déclaré : il détermine l’accès à certaines activités.";
      case "adh-consentement":
        return v.consent
          ? undefined
          : "Cochez cette case : sans votre accord, le centre ne peut pas vous joindre.";
    }
    const kid = rows.find((k) => key.startsWith(`adh-enfant-${k.rid}-`));
    if (!kid) return undefined;
    if (key === kidId(kid.rid, "prenom"))
      return requiredError(kid.firstName, "Indiquez le prénom de l’enfant.");
    if (key === kidId(kid.rid, "naissance")) return birthDateError(kid.birthDate, today);
    if (key === kidId(kid.rid, "genre"))
      return kid.gender ? undefined : "Choisissez le genre de l’enfant.";
    return undefined;
  };

  /** Once a field shows an error, re-check it as it changes so the message clears when fixed. */
  const recheck = (keys: string[], v: Values, rows: ChildRow[]) => {
    const stale = keys.filter((k) => errors[k]);
    if (stale.length === 0) return;
    setErrors((e) => {
      const next = { ...e };
      for (const k of stale) next[k] = fieldError(k, v, rows);
      return next;
    });
  };

  const set = <K extends keyof Values>(key: K, value: Values[K], errorKey: string) => {
    const v = { ...values, [key]: value };
    setValues(v);
    recheck([errorKey], v, kids);
  };

  const setKid = (rid: string, patch: Partial<Omit<ChildRow, "rid">>, errorKey: string) => {
    const rows = kids.map((k) => (k.rid === rid ? { ...k, ...patch } : k));
    setKids(rows);
    recheck([errorKey], values, rows);
  };

  const blurFormat = (key: string, message: string | undefined) => {
    if (message || errors[key])
      setErrors((e) => ({ ...e, [key]: message ?? fieldError(key, values, kids) }));
  };

  // ── children rows ─────────────────────────────────────────────────────
  const addKid = () => {
    const rid = String(nextRid.current++);
    flushSync(() =>
      setKids((rows) => [...rows, { rid, firstName: "", birthDate: "", gender: "" }]),
    );
    document.getElementById(kidId(rid, "prenom"))?.focus();
  };

  const removeKid = (rid: string) => {
    flushSync(() => {
      setKids((rows) => rows.filter((k) => k.rid !== rid));
      setSelected((s) => {
        const next = { ...s };
        delete next[rid];
        return next;
      });
      setErrors((e) =>
        Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith(`adh-enfant-${rid}-`))),
      );
    });
    // The row (and its button) is gone: land on "Ajouter un enfant" rather than on <body>.
    addKidRef.current?.focus();
  };

  const toggle = (personKey: string, activityId: string) =>
    setSelected((s) => {
      const cur = s[personKey] ?? [];
      return {
        ...s,
        [personKey]: cur.includes(activityId)
          ? cur.filter((x) => x !== activityId)
          : [...cur, activityId],
      };
    });

  // ── eligibility, per person ───────────────────────────────────────────
  const kidAge = (k: ChildRow): number | null =>
    today && /^\d{4}-\d{2}-\d{2}$/.test(k.birthDate) && k.birthDate <= today
      ? ageOn(k.birthDate, today)
      : null;

  const people = [
    {
      key: ADULT,
      who: "adult" as const,
      label: values.firstName.trim() ? `Pour vous (${values.firstName.trim()})` : "Pour vous",
      shortName: values.firstName.trim() || "Vous",
      access: (a: Activity) => accessFor(a, values.gender, ADULT_AGE, "adult"),
    },
    ...kids.map((k, i) => ({
      key: k.rid,
      who: "child" as const,
      label: `Pour ${k.firstName.trim() || `l’enfant ${i + 1}`}`,
      shortName: k.firstName.trim() || `Enfant ${i + 1}`,
      access: (a: Activity) => accessFor(a, k.gender, kidAge(k), "child"),
    })),
  ];

  // ── submit ────────────────────────────────────────────────────────────
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTriedSubmit(true);

    const order: [string, string][] = [
      ["adh-prenom", "adh-prenom"],
      ["adh-nom", "adh-nom"],
      ["adh-courriel", "adh-courriel"],
      ["adh-telephone", "adh-telephone"],
      ["adh-genre", "adh-genre-0"],
      ...kids.flatMap((k): [string, string][] => [
        [kidId(k.rid, "prenom"), kidId(k.rid, "prenom")],
        [kidId(k.rid, "naissance"), kidId(k.rid, "naissance")],
        [kidId(k.rid, "genre"), `${kidId(k.rid, "genre")}-0`],
      ]),
      ["adh-consentement", "adh-consentement"],
    ];
    const next: Errors = {};
    for (const [key] of order) next[key] = fieldError(key, values, kids);

    const focusId = firstInvalid(order, next);
    if (focusId || !values.gender) {
      flushSync(() => setErrors(next));
      focusById(focusId);
      return;
    }

    const gender = values.gender;
    const children = kids.flatMap((k) =>
      k.gender ? [{ firstName: k.firstName.trim(), birthDate: k.birthDate, gender: k.gender }] : [],
    );
    const lines = people.map((p) => ({
      key: p.key,
      who: p.who === "adult" ? `${values.firstName.trim()} (vous)` : p.shortName,
      items: activities
        .filter((a) => (selected[p.key] ?? []).includes(a.id) && p.access(a).kind === "ok")
        .map((a) => ({ id: a.id, title: a.title, waitlist: isWaitlisted(a) })),
    }));
    const activityIds = [...new Set(lines.flatMap((l) => l.items.map((i) => i.id)))];
    // One line per person — the adult first, then each child in the order of `children`
    // (a child's first name is required, so shortName IS that name) — so the secretariat
    // sees who asked for what.
    const enrolments = people.map((p, i) => ({
      person: p.who === "adult" ? APPLICANT_SELF : p.shortName,
      activityIds: lines[i]?.items.map((item) => item.id) ?? [],
    }));

    applyMembership({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      gender,
      children,
      enrolments,
      activityIds,
    });
    setSent({
      name: `${values.firstName.trim()} ${values.lastName.trim()}`,
      email: values.email.trim(),
      phone: values.phone.trim(),
      gender,
      lines,
    });
  };

  if (sent) return <MembershipSent sent={sent} />;

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <form noValidate onSubmit={onSubmit} aria-describedby="adh-obligatoire" className="space-y-6">
      <p id="adh-obligatoire" className="text-on-dark-muted text-[13.5px]">
        Les champs marqués d’un <span className="text-gold">*</span> sont obligatoires.
      </p>

      {requested && (
        <p className="border-gold/25 bg-gold/[0.07] text-on-dark flex items-start gap-3 rounded-[14px] border px-4 py-3 text-[14.5px] leading-relaxed">
          <ArrowRightIcon width={18} height={18} className="text-gold mt-0.5 shrink-0" />
          <span>
            Vous avez choisi{" "}
            <strong className="text-gold-light font-semibold">{requested.title}</strong>
            {requestedForChild
              ? " : elle est pré-cochée pour votre enfant à l’étape 3. Indiquez d’abord ses informations à l’étape 2."
              : " : elle est pré-cochée pour vous à l’étape 3."}
            {isWaitlisted(requested) &&
              " Elle est complète : votre demande ira sur la liste d’attente."}
          </span>
        </p>
      )}

      {/* ── (a) coordonnées ─────────────────────────────────────────── */}
      <Panel eyebrow="Étape 1 sur 4" title="Vos coordonnées">
        <p className="text-on-dark-muted -mt-2 mb-5 text-[14px] leading-relaxed">
          Cette demande est remplie par une personne majeure, pour elle-même et, si elle le
          souhaite, pour ses enfants.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="adh-prenom" label="Prénom" required error={errors["adh-prenom"]}>
            <input
              {...describedBy("adh-prenom", errors["adh-prenom"])}
              name="given-name"
              autoComplete="given-name"
              className={inputCls}
              value={values.firstName}
              onChange={(e) => set("firstName", e.target.value, "adh-prenom")}
            />
          </Field>
          <Field id="adh-nom" label="Nom" required error={errors["adh-nom"]}>
            <input
              {...describedBy("adh-nom", errors["adh-nom"])}
              name="family-name"
              autoComplete="family-name"
              className={inputCls}
              value={values.lastName}
              onChange={(e) => set("lastName", e.target.value, "adh-nom")}
            />
          </Field>
          <Field
            id="adh-courriel"
            label="Courriel"
            required
            hint="Pour la confirmation et les nouvelles du centre."
            error={errors["adh-courriel"]}
          >
            <input
              {...describedBy("adh-courriel", errors["adh-courriel"], true)}
              type="email"
              name="email"
              autoComplete="email"
              spellCheck={false}
              className={inputCls}
              value={values.email}
              onChange={(e) => set("email", e.target.value, "adh-courriel")}
              onBlur={(e) => blurFormat("adh-courriel", emailFormatError(e.target.value))}
            />
          </Field>
          <Field
            id="adh-telephone"
            label="Téléphone"
            required
            hint="Exemple : 514 555-0142. Utilisé pour les alertes urgentes."
            error={errors["adh-telephone"]}
          >
            <input
              {...describedBy("adh-telephone", errors["adh-telephone"], true)}
              type="tel"
              name="tel"
              autoComplete="tel"
              className={inputCls}
              value={values.phone}
              onChange={(e) => set("phone", e.target.value, "adh-telephone")}
              onBlur={(e) => blurFormat("adh-telephone", phoneFormatError(e.target.value))}
            />
          </Field>
          <ChoiceGroup
            name="adh-genre"
            legend="Genre déclaré"
            required
            className="sm:col-span-2"
            options={GENDER_OPTIONS}
            value={values.gender}
            onChange={(g) => set("gender", g, "adh-genre")}
            hint="Il détermine l’accès aux activités réservées aux femmes ou aux hommes."
            error={errors["adh-genre"]}
          />
        </div>
      </Panel>

      {/* ── (b) enfants ─────────────────────────────────────────────── */}
      <Panel eyebrow="Étape 2 sur 4 · facultatif" title="Vos enfants">
        <p className="text-on-dark-muted -mt-2 text-[14px] leading-relaxed">
          Ajoutez vos enfants pour les inscrire aux activités. Nous ne demandons que l’essentiel :
          prénom, date de naissance et genre.
        </p>

        {kids.length > 0 && (
          <ul className="mt-5 space-y-4">
            {kids.map((k, i) => {
              const title = k.firstName.trim()
                ? `Enfant ${i + 1} · ${k.firstName.trim()}`
                : `Enfant ${i + 1}`;
              return (
                <li key={k.rid}>
                  <fieldset className="border-on-dark/12 bg-night/40 rounded-[14px] border p-4">
                    <legend className="sr-only">{title}</legend>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p aria-hidden="true" className="font-display text-on-dark text-[18px]">
                        {title}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeKid(k.rid)}
                        className={btn("subtle", "sm")}
                      >
                        <XIcon width={14} height={14} />
                        Retirer<span className="sr-only"> {title}</span>
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        id={kidId(k.rid, "prenom")}
                        label="Prénom de l’enfant"
                        required
                        error={errors[kidId(k.rid, "prenom")]}
                      >
                        <input
                          {...describedBy(kidId(k.rid, "prenom"), errors[kidId(k.rid, "prenom")])}
                          autoComplete="off"
                          className={inputCls}
                          value={k.firstName}
                          onChange={(e) =>
                            setKid(k.rid, { firstName: e.target.value }, kidId(k.rid, "prenom"))
                          }
                        />
                      </Field>
                      <Field
                        id={kidId(k.rid, "naissance")}
                        label="Date de naissance"
                        required
                        hint="Sert à vérifier l’âge demandé par chaque activité."
                        error={errors[kidId(k.rid, "naissance")]}
                      >
                        <input
                          {...describedBy(
                            kidId(k.rid, "naissance"),
                            errors[kidId(k.rid, "naissance")],
                            true,
                          )}
                          type="date"
                          autoComplete="off"
                          max={today ?? undefined}
                          className={cn(inputCls, "[color-scheme:dark]")}
                          value={k.birthDate}
                          onChange={(e) =>
                            setKid(k.rid, { birthDate: e.target.value }, kidId(k.rid, "naissance"))
                          }
                          onBlur={(e) =>
                            e.target.value &&
                            blurFormat(
                              kidId(k.rid, "naissance"),
                              birthDateError(e.target.value, today),
                            )
                          }
                        />
                      </Field>
                      <ChoiceGroup
                        name={kidId(k.rid, "genre")}
                        legend="Genre"
                        required
                        className="sm:col-span-2"
                        options={CHILD_GENDER_OPTIONS}
                        value={k.gender}
                        onChange={(g) => setKid(k.rid, { gender: g }, kidId(k.rid, "genre"))}
                        error={errors[kidId(k.rid, "genre")]}
                      />
                    </div>
                  </fieldset>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-5">
          {kids.length < MAX_CHILDREN ? (
            <button ref={addKidRef} type="button" onClick={addKid} className={btn("ghost")}>
              <PlusIcon width={16} height={16} />
              {kids.length === 0 ? "Ajouter un enfant" : "Ajouter un autre enfant"}
            </button>
          ) : (
            <p className="text-on-dark-muted text-[13.5px]">
              {MAX_CHILDREN} enfants au plus par demande — le secrétariat ajoutera les autres avec
              vous.
            </p>
          )}
        </div>
      </Panel>

      {/* ── (c) activités ───────────────────────────────────────────── */}
      <Panel eyebrow="Étape 3 sur 4 · facultatif" title="Activités">
        <p className="text-on-dark-muted -mt-2 text-[14px] leading-relaxed">
          Cochez les activités souhaitées pour chaque personne. L’accès se vérifie au fur et à
          mesure : les activités des femmes sont réservées aux femmes, celles des hommes aux hommes,
          et l’âge doit correspondre. Une activité complète vous place sur la liste d’attente.
        </p>
        <div className="mt-5 space-y-6">
          {people.map((p) => (
            <PersonActivities
              key={p.key}
              personKey={p.key}
              legend={p.label}
              activities={activities}
              access={p.access}
              selected={selected[p.key] ?? []}
              onToggle={(id) => toggle(p.key, id)}
            />
          ))}
        </div>
      </Panel>

      {/* ── (d) consentement ────────────────────────────────────────── */}
      <Panel eyebrow="Étape 4 sur 4" title="Communications et vie privée">
        <ConsentCheckbox
          id="adh-consentement"
          checked={values.consent}
          onChange={(c) => set("consent", c, "adh-consentement")}
          error={errors["adh-consentement"]}
        >
          J’accepte de recevoir les communications du centre — courriels, SMS et notifications du
          portail, y compris les alertes urgentes (fermeture, tempête, changement d’horaire).
        </ConsentCheckbox>

        <div className="border-gold/12 mt-5 flex items-start gap-3 rounded-[14px] border bg-white/[0.025] p-4">
          <LockIcon width={18} height={18} className="text-gold mt-0.5 shrink-0" />
          <div className="text-on-dark-muted space-y-2 text-[13.5px] leading-relaxed">
            <p>
              <strong className="text-on-dark font-semibold">Vos données restent au centre.</strong>{" "}
              Pour les enfants, nous ne gardons que le prénom, la date de naissance et le genre.
            </p>
            <p>
              Les photos de devoirs et l’affichage d’une félicitation sur les écrans du centre
              demandent chacun un consentement parental distinct, que vous donnerez — ou non — plus
              tard dans le portail. Vous pourrez le retirer à tout moment.
            </p>
          </div>
        </div>
      </Panel>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <button type="submit" className={btn("gold")}>
          Envoyer ma demande
          <ArrowRightIcon width={16} height={16} />
        </button>
        {triedSubmit && errorCount > 0 && (
          <p className="text-[13.5px] text-[#ffb9a6]">
            {errorCount === 1 ? "Un champ est à corriger" : `${errorCount} champs sont à corriger`}{" "}
            — rien n’a été effacé.
          </p>
        )}
      </div>
      <FinePrint>
        Aucun paiement sur ce site : si une activité est payante, le centre vous indiquera comment
        régler après la validation. Aucune donnée de carte n’est demandée ici.
      </FinePrint>
    </form>
  );
}

/** One person's activity checklist, accessible ones first, then the others with their reason. */
function PersonActivities({
  personKey,
  legend,
  activities,
  access,
  selected,
  onToggle,
}: {
  personKey: string;
  legend: string;
  activities: Activity[];
  access: (a: Activity) => Access;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const rows = activities.map((a) => ({ a, acc: access(a) }));
  const open = rows.filter((r) => r.acc.kind !== "blocked");
  const closed = rows.filter((r) => r.acc.kind === "blocked");

  const renderRow = ({ a, acc }: { a: Activity; acc: Access }) => {
    const id = `adh-act-${personKey}-${a.id}`;
    const ok = acc.kind === "ok";
    const checked = ok && selected.includes(a.id);
    const full = isWaitlisted(a);
    return (
      <li key={a.id}>
        <label
          htmlFor={id}
          className={cn(
            "flex gap-3 rounded-[12px] border px-3.5 py-3 transition",
            ok ? "cursor-pointer hover:bg-white/[0.04]" : "cursor-not-allowed",
            checked ? "border-gold/60 bg-gold/[0.07]" : "border-on-dark/12",
          )}
        >
          <input
            id={id}
            type="checkbox"
            checked={checked}
            aria-disabled={ok ? undefined : true}
            aria-describedby={`${id}-info`}
            onChange={() => ok && onToggle(a.id)}
            className={cn(checkboxCls, !ok && "opacity-40")}
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={cn("font-medium", ok ? "text-on-dark" : "text-on-dark-muted")}>
                {a.title}
              </span>
              {full && <Pill tone="warn">Complet — liste d’attente</Pill>}
            </span>
            <span
              id={`${id}-info`}
              className="text-on-dark-faint mt-0.5 block text-[13px] leading-snug"
            >
              {a.schedule} · {priceLabel(a)}
              {a.membershipRequired && " · Adhésion requise"}
              {acc.kind === "blocked" && (
                <span className="mt-1 block text-[#ffb9a6]">
                  Non accessible : {acc.reasons.join(" ")}
                </span>
              )}
              {acc.kind === "pending" && (
                <span className="text-on-dark-muted mt-1 block">{acc.note}</span>
              )}
              {checked && full && (
                <span className="mt-1 block text-[#ffd98a]">Demande sur la liste d’attente.</span>
              )}
            </span>
          </span>
        </label>
      </li>
    );
  };

  return (
    <fieldset className="min-w-0">
      <legend className="font-display text-on-dark text-[19px]">{legend}</legend>
      {open.length > 0 ? (
        <ul className="mt-3 space-y-2">{open.map(renderRow)}</ul>
      ) : (
        <p className="text-on-dark-muted mt-3 text-[13.5px]">
          Aucune activité accessible pour ce profil pour le moment.
        </p>
      )}
      {closed.length > 0 && (
        <>
          <p className="eyebrow text-on-dark-faint mt-4">Non accessibles ({closed.length})</p>
          <ul className="mt-2 space-y-2">{closed.map(renderRow)}</ul>
        </>
      )}
    </fieldset>
  );
}

function MembershipSent({ sent }: { sent: SentSummary }) {
  const anyWaitlist = sent.lines.some((l) => l.items.some((i) => i.waitlist));
  const anyActivity = sent.lines.some((l) => l.items.length > 0);
  return (
    <div className="border-gold/20 rounded-[20px] border bg-white/[0.04] p-5 shadow-[0_30px_60px_-34px_rgba(0,0,0,0.85)] md:p-8">
      <SuccessHeading eyebrow="Adhésion">Demande envoyée</SuccessHeading>
      <p className="text-on-dark-muted mt-4 flex flex-wrap items-center gap-2 text-[14.5px]">
        Statut :<Pill tone="warn">En attente de validation</Pill>
      </p>

      <h3 className="font-display text-on-dark mt-8 text-[20px]">Ce que vous avez demandé</h3>
      <dl className="mt-3 grid gap-x-6 gap-y-2 text-[14.5px] sm:grid-cols-[auto_1fr]">
        <dt className="text-on-dark-faint">Nom</dt>
        <dd className="text-on-dark">{sent.name}</dd>
        <dt className="text-on-dark-faint">Courriel</dt>
        <dd className="text-on-dark break-all">{sent.email}</dd>
        <dt className="text-on-dark-faint">Téléphone</dt>
        <dd className="nums text-on-dark">{sent.phone}</dd>
        <dt className="text-on-dark-faint">Genre déclaré</dt>
        <dd className="text-on-dark">{sent.gender === "femme" ? "Femme" : "Homme"}</dd>
      </dl>

      {anyActivity ? (
        <ul className="mt-5 space-y-4">
          {sent.lines
            .filter((l) => l.items.length > 0)
            .map((l) => (
              <li key={l.key}>
                <p className="text-gold-light text-[14px] font-medium">{l.who}</p>
                <ul className="mt-1.5 space-y-1.5">
                  {l.items.map((i) => (
                    <li
                      key={i.id}
                      className="text-on-dark flex flex-wrap items-center gap-2 text-[14.5px]"
                    >
                      {i.title}
                      {i.waitlist ? (
                        <Pill tone="warn">Liste d’attente</Pill>
                      ) : (
                        <Pill tone="gold">Inscription demandée</Pill>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
        </ul>
      ) : (
        <p className="text-on-dark-muted mt-5 text-[14.5px]">
          Aucune activité pour l’instant — vous pourrez vous inscrire depuis le portail une fois
          membre.
        </p>
      )}
      {sent.lines.length > 1 && (
        <p className="text-on-dark-faint mt-3 text-[13.5px]">
          {sent.lines.length - 1 === 1
            ? "1 enfant ajouté"
            : `${sent.lines.length - 1} enfants ajoutés`}{" "}
          à la demande.
        </p>
      )}

      <h3 className="font-display text-on-dark mt-8 text-[20px]">La suite</h3>
      <ol className="text-on-dark-muted mt-3 space-y-3 text-[14.5px] leading-relaxed">
        {[
          "Le secrétariat vérifie votre demande : genre déclaré, âge des enfants et places disponibles.",
          `Vous recevez un courriel à ${sent.email} dès que votre adhésion est validée.`,
          "Vous accédez au portail familial : profils des enfants, consentements, inscriptions et messages du centre.",
          ...(anyWaitlist
            ? ["Pour une activité complète, le centre vous écrit dès qu’une place se libère."]
            : []),
        ].map((step, i) => (
          <li key={step} className="flex gap-3">
            <span
              aria-hidden="true"
              className="nums bg-gold/15 text-gold-light flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
            >
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/portail" className={btn("gold")}>
          Découvrir le portail
          <ArrowRightIcon width={16} height={16} />
        </Link>
        <Link href="/activites" className={btn("ghost")}>
          Retour aux activités
        </Link>
      </div>
      <FinePrint className="mt-6">
        Aucun paiement n’est demandé sur ce site. Si une activité est payante, le centre vous
        indiquera comment régler — aucune donnée de carte n’est saisie ici.
      </FinePrint>
    </div>
  );
}
