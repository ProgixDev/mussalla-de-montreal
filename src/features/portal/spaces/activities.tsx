"use client";

import { useRef, useState, type ComponentProps, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { usePortal } from "@/lib/portal/store";
import { VOLUNTEER_AVAILABILITY, VOLUNTEER_INTERESTS } from "@/core/portal/seed";
import type {
  Audience,
  CentreEvent,
  EventKind,
  Person,
  VolunteerProfile,
} from "@/core/portal/types";
import {
  EmptyNote,
  Field,
  Panel,
  Pill,
  Segmented,
  btn,
  describedBy,
  inputCls,
} from "@/components/portal/kit";
import { CheckIcon, LockIcon } from "@/components/ui/icons";
import { formatDateTime, formatDayLong } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DemoNote, SpaceHeading, SpaceTabs, usePersonName, type SpaceProps } from "../shared";

/**
 * Activités & bénévoles (spec §4.7, §4.8) — an activity manager PREPARES events, dars,
 * halaqas, prayer-time changes and announcements; the administration validates before
 * anything reaches the portal or the screens. The volunteer coordinator searches the
 * volunteer base; contact details only show for people who consented to be contacted.
 */

type Tone = NonNullable<ComponentProps<typeof Pill>["tone"]>;
type Gender = Person["gender"];

const KIND_ORDER: EventKind[] = ["evenement", "dars", "halaqa", "priere", "annonce"];
const KIND_LABELS: Record<EventKind, string> = {
  dars: "Dars",
  halaqa: "Halaqa",
  evenement: "Événement",
  priere: "Changement de prière",
  annonce: "Annonce",
};

const AUDIENCE_ORDER: Audience[] = ["tous", "femmes", "hommes", "enfants"];
const AUDIENCE_LABELS: Record<Audience, string> = {
  tous: "Tous",
  femmes: "Femmes",
  hommes: "Hommes",
  enfants: "Enfants",
};

const EVENT_STATUS: Record<CentreEvent["status"], { label: string; tone: Tone }> = {
  draft: { label: "Brouillon", tone: "neutral" },
  submitted: { label: "En attente d’approbation", tone: "warn" },
  published: { label: "Publié", tone: "emerald" },
};

const agree = (g: Gender, m: string, f: string) => (g === "femme" ? f : m);
const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** Today as a LOCAL bare day — only ever called from event handlers. */
function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Case- and accent-insensitive comparison key (« Leïla » matches « leila »). */
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const statusMessageCls =
  "mt-4 flex gap-2.5 rounded-[12px] border border-[#1c7d5b]/45 bg-[#1c7d5b]/15 px-3.5 py-3 text-[14px] leading-relaxed text-[#bfeedb]";

// ── space ────────────────────────────────────────────────────────────────
type Tab = "evenements" | "benevoles";

export function ActivitiesSpace({ me }: SpaceProps) {
  const [tab, setTab] = useState<Tab>("evenements");
  const events = usePortal((s) => s.events);
  const applications = usePortal((s) => s.volunteerApplications);
  const pending = events.filter((e) => e.status === "submitted").length;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "evenements", label: "Événements", badge: pending },
    { id: "benevoles", label: "Bénévoles", badge: applications.length },
  ];

  return (
    <>
      <SpaceHeading eyebrow="Activités & bénévoles" title={`Bienvenue, ${me.firstName}`}>
        Préparez les événements, dars, halaqas et annonces de votre périmètre, et trouvez les
        bénévoles qui peuvent aider.
      </SpaceHeading>
      <SpaceTabs
        label="Sections activités et bénévoles"
        tabs={tabs}
        value={tab}
        onChange={setTab}
      />
      <div role="tabpanel" aria-label={tabs.find((t) => t.id === tab)?.label ?? ""}>
        {tab === "evenements" ? <EventsTab /> : <VolunteersTab />}
      </div>
    </>
  );
}

// ── Événements ───────────────────────────────────────────────────────────
function EventsTab() {
  const events = usePortal((s) => s.events);
  const sorted = [...events].sort(
    (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, "fr"),
  );
  const pending = events.filter((e) => e.status === "submitted").length;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <Panel
        eyebrow={`${plural(events.length, "élément", "éléments")} · ${plural(pending, "en attente", "en attente")}`}
        title="Calendrier du centre"
      >
        {sorted.length === 0 ? (
          <EmptyNote>
            Aucun événement pour l’instant. Proposez le premier avec le formulaire.
          </EmptyNote>
        ) : (
          <ul className="grid gap-3">
            {sorted.map((e) => (
              <EventItem key={e.id} event={e} />
            ))}
          </ul>
        )}
      </Panel>
      <ProposeEventForm />
    </div>
  );
}

function EventItem({ event: e }: { event: CentreEvent }) {
  const status = EVENT_STATUS[e.status];
  return (
    <li className="border-gold/12 rounded-[14px] border bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="gold">{KIND_LABELS[e.kind]}</Pill>
        <Pill tone={status.tone}>{status.label}</Pill>
      </div>
      <h3 className="font-display text-on-dark mt-2.5 text-[19px] leading-tight">{e.title}</h3>
      <p className="text-on-dark-muted mt-1 text-[14px]">
        <time dateTime={e.date}>{formatDayLong(e.date)}</time>
        {e.kind === "priere" && e.previousSlot ? (
          <>
            {" · "}
            <span className="sr-only">ancien horaire : </span>
            <s className="text-on-dark-faint">{e.previousSlot}</s>
            <span aria-hidden="true" className="text-gold px-1.5">
              →
            </span>
            <span className="sr-only">, nouvel horaire : </span>
            <span className="text-gold-light font-medium">{e.slot}</span>
          </>
        ) : (
          <> · {e.slot}</>
        )}
      </p>
      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
        <div className="flex gap-1.5">
          <dt className="text-on-dark-faint">Public :</dt>
          <dd className="text-on-dark">{AUDIENCE_LABELS[e.audience]}</dd>
        </div>
        <div className="flex min-w-0 gap-1.5">
          <dt className="text-on-dark-faint">Lieu :</dt>
          <dd className="text-on-dark min-w-0 [overflow-wrap:anywhere]">{e.location}</dd>
        </div>
      </dl>
      {e.description && (
        <p className="text-on-dark-muted mt-2 text-[14px] leading-relaxed">{e.description}</p>
      )}
    </li>
  );
}

type EventField = "title" | "date" | "previousSlot" | "slot" | "location";
const EVENT_IDS: Record<EventField, string> = {
  title: "ev-new-title",
  date: "ev-new-date",
  previousSlot: "ev-new-previous",
  slot: "ev-new-slot",
  location: "ev-new-location",
};

function ProposeEventForm() {
  const addEvent = usePortal((s) => s.addEvent);
  const [kind, setKind] = useState<EventKind>("evenement");
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState<Audience>("tous");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [previousSlot, setPreviousSlot] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Partial<Record<EventField, string>>>({});
  const [sent, setSent] = useState("");
  const sentRef = useRef<HTMLParagraphElement>(null);

  const isPrayer = kind === "priere";
  const clear = (field: EventField) => {
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
    setSent("");
  };

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Partial<Record<EventField, string>> = {};
    const t = title.trim();
    const s = slot.trim();
    const prev = previousSlot.trim();
    if (!t) next.title = "Indiquez le titre.";
    else if (t.length < 3) next.title = "Le titre doit compter au moins 3 caractères.";
    if (!date) next.date = "Choisissez la date.";
    else if (date < todayIso())
      next.date = "Cette date est passée : choisissez aujourd’hui ou une date à venir.";
    if (isPrayer && !prev)
      next.previousSlot = "Indiquez l’ancien horaire, pour que chacun voie ce qui change.";
    if (!s)
      next.slot = isPrayer
        ? "Indiquez le nouvel horaire de la prière."
        : "Indiquez le créneau, par exemple « 19 h 30 » ou « après la prière de Maghrib ».";
    else if (isPrayer && prev && fold(prev) === fold(s))
      next.slot = "Le nouvel horaire doit être différent de l’ancien.";
    if (!location.trim()) next.location = "Indiquez le lieu : une salle, une adresse ou un lien.";

    const firstInvalid = (Object.keys(EVENT_IDS) as EventField[]).find((k) => next[k]);
    if (firstInvalid) {
      flushSync(() => {
        setErrors(next);
        setSent("");
      });
      document.getElementById(EVENT_IDS[firstInvalid])?.focus();
      return;
    }

    addEvent({
      kind,
      title: t,
      audience,
      date,
      slot: s,
      location: location.trim(),
      description: description.trim(),
      status: "submitted",
      ...(isPrayer ? { previousSlot: prev } : {}),
    });
    flushSync(() => {
      setTitle("");
      setDate("");
      setSlot("");
      setPreviousSlot("");
      setLocation("");
      setDescription("");
      setErrors({});
      setSent(
        `« ${t} » est envoyé pour approbation. La publication sur le portail et les écrans passe par l’administration.`,
      );
    });
    sentRef.current?.focus();
  }

  return (
    <Panel eyebrow="Proposition" title="Proposer un événement">
      <p className="text-on-dark-muted text-[14px] leading-relaxed">
        Vous préparez, l’administration valide : rien n’est publié sans approbation, et seulement
        dans votre périmètre.
      </p>
      <p
        ref={sentRef}
        tabIndex={-1}
        role="status"
        className={cn(
          "focus-visible:outline-gold-light focus-visible:outline-2 focus-visible:outline-offset-2",
          sent && statusMessageCls,
        )}
      >
        {sent && <CheckIcon width={18} height={18} className="mt-0.5 shrink-0" />}
        {sent}
      </p>

      <form noValidate onSubmit={submit} className="mt-5 grid gap-4">
        <Segmented
          name="ev-new-kind"
          label="Type"
          options={KIND_ORDER.map((k) => ({ value: k, label: KIND_LABELS[k] }))}
          value={kind}
          onChange={(k) => {
            setKind(k);
            setErrors({});
            setSent("");
          }}
        />

        <Field id={EVENT_IDS.title} label="Titre" required error={errors.title}>
          <input
            {...describedBy(EVENT_IDS.title, errors.title)}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              clear("title");
            }}
            className={inputCls}
            autoComplete="off"
          />
        </Field>

        <Segmented
          name="ev-new-audience"
          label="Public"
          options={AUDIENCE_ORDER.map((a) => ({ value: a, label: AUDIENCE_LABELS[a] }))}
          value={audience}
          onChange={setAudience}
        />

        <Field
          id={EVENT_IDS.date}
          label={isPrayer ? "Date du changement" : "Date"}
          required
          error={errors.date}
        >
          <input
            {...describedBy(EVENT_IDS.date, errors.date)}
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              clear("date");
            }}
            className={cn(inputCls, "[color-scheme:dark]")}
          />
        </Field>

        <div className={cn("grid gap-4", isPrayer && "sm:grid-cols-2")}>
          {isPrayer && (
            <Field
              id={EVENT_IDS.previousSlot}
              label="Ancien horaire"
              required
              error={errors.previousSlot}
              hint="Par exemple : 12 h 30."
            >
              <input
                {...describedBy(EVENT_IDS.previousSlot, errors.previousSlot, true)}
                type="text"
                value={previousSlot}
                onChange={(e) => {
                  setPreviousSlot(e.target.value);
                  clear("previousSlot");
                }}
                className={inputCls}
                autoComplete="off"
              />
            </Field>
          )}
          <Field
            id={EVENT_IDS.slot}
            label={isPrayer ? "Nouvel horaire" : "Créneau"}
            required
            error={errors.slot}
            hint={isPrayer ? "Par exemple : 13 h 15." : "19 h 30 ou après la prière de Maghrib"}
          >
            <input
              {...describedBy(EVENT_IDS.slot, errors.slot, true)}
              type="text"
              value={slot}
              onChange={(e) => {
                setSlot(e.target.value);
                clear("slot");
              }}
              className={inputCls}
              autoComplete="off"
            />
          </Field>
        </div>

        <Field
          id={EVENT_IDS.location}
          label="Lieu"
          required
          error={errors.location}
          hint="Une salle, une adresse ou un lien."
        >
          <input
            {...describedBy(EVENT_IDS.location, errors.location, true)}
            type="text"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              clear("location");
            }}
            className={inputCls}
            autoComplete="off"
          />
        </Field>

        <Field
          id="ev-new-description"
          label={isPrayer ? "Explication du changement" : "Description"}
          hint={
            isPrayer
              ? "Facultatif. Par exemple : horaire d’hiver."
              : "Facultatif. Ce qui est prévu, en quelques lignes."
          }
        >
          <textarea
            {...describedBy("ev-new-description", undefined, true)}
            rows={3}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setSent("");
            }}
            className={cn(inputCls, "resize-y leading-relaxed")}
          />
        </Field>

        <div>
          <button type="submit" className={btn("gold")}>
            Envoyer pour approbation
          </button>
        </div>
      </form>

      <DemoNote>
        Le choix des canaux de diffusion (portail, écrans, notification) et la promotion d’un
        changement de prière en annonce urgente par un administrateur se brancheront avec le
        serveur. L’heure exacte d’un créneau « après la prière » dépend du calendrier de prières
        retenu (§9, question 13).
      </DemoNote>
    </Panel>
  );
}

// ── Bénévoles ────────────────────────────────────────────────────────────
function ChipGroup({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-on-dark mb-1.5 text-[13.5px] font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(o)}
              className={cn(
                "focus-visible:outline-gold-light inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-[14px] transition focus-visible:outline-2",
                on
                  ? "border-gold/70 bg-gold/15 text-gold-light"
                  : "border-on-dark/15 text-on-dark-muted hover:border-on-dark/35 hover:text-on-dark",
              )}
            >
              {on && <CheckIcon width={15} height={15} />}
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

function VolunteersTab() {
  const volunteers = usePortal((s) => s.volunteers);
  const persons = usePortal((s) => s.persons);
  const applications = usePortal((s) => s.volunteerApplications);
  const name = usePersonName();
  const [query, setQuery] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);

  const q = fold(query);
  const results = volunteers.filter((v) => {
    if (q && !fold(name(v.personId, true)).includes(q)) return false;
    // Within a group: any checked value matches. Across groups: all groups must match.
    if (interests.length > 0 && !v.interests.some((i) => interests.includes(i))) return false;
    if (availability.length > 0 && !v.availability.some((a) => availability.includes(a)))
      return false;
    return true;
  });
  const filtering = Boolean(q) || interests.length > 0 || availability.length > 0;
  const reachable = results
    .filter((v) => v.consentToContact)
    .map((v) => persons.find((p) => p.id === v.personId)?.email)
    .filter((email): email is string => Boolean(email));

  return (
    <div className="grid gap-6">
      <Panel eyebrow="Base de bénévoles" title="Trouver des bénévoles">
        <div className="grid gap-5">
          <Field
            id="vol-search"
            label="Nom"
            hint="Les accents et les majuscules ne comptent pas."
            className="sm:max-w-[420px]"
          >
            <input
              {...describedBy("vol-search", undefined, true)}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={inputCls}
              autoComplete="off"
            />
          </Field>
          <ChipGroup
            legend="Intérêts"
            options={VOLUNTEER_INTERESTS}
            selected={interests}
            onToggle={(v) => setInterests((l) => toggle(l, v))}
          />
          <ChipGroup
            legend="Disponibilités"
            options={VOLUNTEER_AVAILABILITY}
            selected={availability}
            onToggle={(v) => setAvailability((l) => toggle(l, v))}
          />
          <p className="text-on-dark-faint text-[12.5px] leading-relaxed">
            Un bénévole apparaît s’il correspond à au moins un intérêt coché et à au moins une
            disponibilité cochée.
          </p>
        </div>

        <div className="border-gold/10 mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p role="status" className="text-on-dark text-[14px]">
            {results.length === 0
              ? "Aucun bénévole ne correspond."
              : `${plural(results.length, "bénévole correspond", "bénévoles correspondent")}${filtering ? " à la recherche" : ""}.`}
          </p>
          <div className="flex flex-wrap gap-2">
            {reachable.length > 0 && (
              <a
                href={`mailto:?bcc=${reachable.map(encodeURIComponent).join(",")}`}
                className={btn("subtle", "sm")}
              >
                Écrire{" "}
                {reachable.length > 1
                  ? `aux ${reachable.length} bénévoles joignables`
                  : "au bénévole joignable"}
              </a>
            )}
            {filtering && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setInterests([]);
                  setAvailability([]);
                }}
                className={btn("ghost", "sm")}
              >
                Effacer les filtres
              </button>
            )}
          </div>
        </div>
      </Panel>

      <p className="border-gold/20 bg-gold/[0.06] text-on-dark-muted flex gap-3 rounded-[14px] border px-4 py-3 text-[14px] leading-relaxed">
        <LockIcon width={18} height={18} className="text-gold mt-0.5 shrink-0" />
        <span>
          Les coordonnées ne sont visibles que par les coordinateurs, et seulement pour les
          personnes qui ont consenti à être contactées.
        </span>
      </p>

      {results.length === 0 ? (
        <EmptyNote>
          Aucun bénévole ne correspond à ces critères. Retirez un filtre pour élargir la recherche.
        </EmptyNote>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((v) => (
            <VolunteerCard
              key={v.id}
              volunteer={v}
              interests={interests}
              availability={availability}
            />
          ))}
        </ul>
      )}

      <Panel
        eyebrow={plural(applications.length, "candidature", "candidatures")}
        title="Nouvelles candidatures"
      >
        {applications.length === 0 ? (
          <EmptyNote>
            Aucune nouvelle candidature. Les formulaires de bénévolat envoyés apparaîtront ici.
          </EmptyNote>
        ) : (
          <ul className="divide-gold/10 divide-y">
            {applications.map((a) => (
              <li key={a.id} className="grid gap-2 py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-on-dark text-[15.5px] font-medium">{a.name}</p>
                  <p className="text-on-dark-faint text-[13px]">
                    Reçue le <time dateTime={a.at}>{formatDateTime(a.at)}</time>
                  </p>
                </div>
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
                  <a
                    href={`mailto:${a.email}`}
                    className="text-gold-light break-all underline-offset-4 hover:underline"
                  >
                    {a.email}
                  </a>
                  {a.phone && (
                    <a
                      href={`tel:${a.phone.replace(/[^\d+]/g, "")}`}
                      className="text-gold-light underline-offset-4 hover:underline"
                    >
                      {a.phone}
                    </a>
                  )}
                </p>
                <TagLine label="Intérêts" values={a.interests} />
                <TagLine label="Disponibilités" values={a.availability} />
              </li>
            ))}
          </ul>
        )}
        <DemoNote>
          L’acceptation d’une candidature (création du profil bénévole, consentement enregistré) se
          fera côté serveur. Les catégories de bénévolat et les disponibilités restent à confirmer
          avec le centre (§9, question 15).
        </DemoNote>
      </Panel>
    </div>
  );
}

function TagLine({
  label,
  values,
  highlight = [],
}: {
  label: string;
  values: string[];
  highlight?: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
      <span className="text-on-dark-faint">{label} :</span>
      {values.length === 0 ? (
        <span className="text-on-dark-faint">non précisé</span>
      ) : (
        values.map((v) => {
          const hit = highlight.includes(v);
          return (
            <Pill key={v} tone={hit ? "gold" : "neutral"}>
              {hit && <CheckIcon width={12} height={12} />}
              {v}
              {hit && <span className="sr-only"> (correspond)</span>}
            </Pill>
          );
        })
      )}
    </div>
  );
}

function VolunteerCard({
  volunteer: v,
  interests,
  availability,
}: {
  volunteer: VolunteerProfile;
  interests: string[];
  availability: string[];
}) {
  const persons = usePortal((s) => s.persons);
  const name = usePersonName();
  const person = persons.find((p) => p.id === v.personId);
  const g: Gender = person?.gender ?? "homme";

  return (
    <li className="border-gold/15 flex min-w-0 flex-col gap-3 rounded-[16px] border bg-white/[0.035] p-5">
      <h3 className="font-display text-on-dark text-[19px] leading-tight">
        {name(v.personId, true)}
      </h3>
      <TagLine label="Intérêts" values={v.interests} highlight={interests} />
      <TagLine label="Disponibilités" values={v.availability} highlight={availability} />
      <div className="border-gold/10 mt-auto border-t pt-3 text-[14px]">
        {v.consentToContact && person ? (
          <p className="flex flex-col gap-1">
            <a
              href={`mailto:${person.email}`}
              className="text-gold-light break-all underline-offset-4 hover:underline"
            >
              {person.email}
            </a>
            {person.phone && (
              <a
                href={`tel:${person.phone.replace(/[^\d+]/g, "")}`}
                className="text-gold-light underline-offset-4 hover:underline"
              >
                {person.phone}
              </a>
            )}
          </p>
        ) : v.consentToContact ? (
          <p className="text-on-dark-faint">Coordonnées non renseignées.</p>
        ) : (
          <p className="text-on-dark-muted flex items-center gap-2">
            <LockIcon width={15} height={15} className="text-on-dark-faint shrink-0" />
            N’a pas consenti à être {agree(g, "contacté", "contactée")}
          </p>
        )}
      </div>
    </li>
  );
}
