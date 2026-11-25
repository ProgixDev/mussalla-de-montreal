"use client";

import { useMemo, useRef, useState, type ComponentProps, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { usePortal } from "@/lib/portal/store";
import { absenceWarning } from "@/core/portal/derive";
import type {
  GovAttendance,
  GovernanceDocument,
  GovernanceMeeting,
  GovernanceProposal,
  Person,
  RsvpStatus,
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
import { CheckIcon, LockIcon, PlusIcon } from "@/components/ui/icons";
import { formatDateTime, formatDay, formatDayLong } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DemoNote, SpaceHeading, SpaceTabs, usePersonName, type SpaceProps } from "../shared";

/**
 * Secrétariat & Shura (spec §4.6, §6.4) — meetings with prayer-relative slots,
 * invitations, confirmed attendance, the internal minutes library, proposals, and the
 * charter's absence rule. The rule only ever PROPOSES a warning: every decision is human.
 */

type Tone = NonNullable<ComponentProps<typeof Pill>["tone"]>;
type Gender = Person["gender"];
type Agreed = Record<Gender, string>;
type MeetingMode = GovernanceMeeting["mode"];

const same = (s: string): Agreed => ({ homme: s, femme: s });

const RSVP_ORDER: RsvpStatus[] = ["accepted", "tentative", "declined", "no_response"];
const RSVP_META: Record<RsvpStatus, { label: Agreed; plural: string; tone: Tone }> = {
  accepted: { label: { homme: "Présent", femme: "Présente" }, plural: "présents", tone: "emerald" },
  tentative: { label: same("Peut-être"), plural: "peut-être", tone: "warn" },
  declined: { label: { homme: "Absent", femme: "Absente" }, plural: "absents", tone: "danger" },
  no_response: { label: same("Sans réponse"), plural: "sans réponse", tone: "neutral" },
};

const ATTENDANCE_ORDER: GovAttendance[] = ["present", "late", "absent", "excused"];
const ATTENDANCE_META: Record<
  GovAttendance,
  { label: Agreed; one: string; many: string; tone: Tone }
> = {
  present: {
    label: { homme: "Présent", femme: "Présente" },
    one: "présent",
    many: "présents",
    tone: "emerald",
  },
  late: { label: same("En retard"), one: "en retard", many: "en retard", tone: "warn" },
  absent: {
    label: { homme: "Absent", femme: "Absente" },
    one: "absent",
    many: "absents",
    tone: "danger",
  },
  excused: {
    label: { homme: "Excusé", femme: "Excusée" },
    one: "excusé",
    many: "excusés",
    tone: "neutral",
  },
};

const MODE_LABELS: Record<MeetingMode, string> = {
  sur_place: "Sur place",
  distanciel: "À distance",
  hybride: "Hybride",
};
const MODE_OPTIONS = (Object.keys(MODE_LABELS) as MeetingMode[]).map((value) => ({
  value,
  label: MODE_LABELS[value],
}));
const LOCATION_LABELS: Record<MeetingMode, string> = {
  sur_place: "Lieu",
  distanciel: "Lien de visioconférence",
  hybride: "Lieu et lien de visioconférence",
};

const DOC_CATEGORIES: GovernanceDocument["category"][] = [
  "pv_shura",
  "charte",
  "finances",
  "propositions",
];
const DOC_CATEGORY_LABELS: Record<GovernanceDocument["category"], string> = {
  pv_shura: "Procès-verbaux de la Shura",
  charte: "Charte",
  finances: "Finances",
  propositions: "Propositions",
};
const DOC_STATUS: Record<GovernanceDocument["status"], { label: string; tone: Tone }> = {
  brouillon: { label: "Brouillon", tone: "warn" },
  publie_interne: { label: "Publié — interne", tone: "emerald" },
};

const PROPOSAL_STATUS: Record<GovernanceProposal["status"], { label: string; tone: Tone }> = {
  ouverte: { label: "Ouverte", tone: "gold" },
  adoptee: { label: "Adoptée", tone: "emerald" },
  rejetee: { label: "Rejetée", tone: "danger" },
};

/** Charter rule used by the warning engine (art. 7 of the seeded charter). */
const ABSENCE_THRESHOLD = 3;
const ABSENCE_WINDOW = 4;

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
type Prayer = (typeof PRAYERS)[number];
type SlotWhen = "apres" | "avant";

/** « après la prière de Maghrib », « avant la prière d’Isha ». */
function prayerSlot(when: SlotWhen, prayer: Prayer): string {
  const of = /^[AEIOU]/.test(prayer) ? "d’" : "de ";
  return `${when === "apres" ? "après" : "avant"} la prière ${of}${prayer}`;
}

/** The slot select's value: "apres:Maghrib", "avant:Fajr" or "heure". */
function parseSlotChoice(choice: string): { prayer: Prayer; text: string } | null {
  const [when, name] = choice.split(":");
  const prayer = PRAYERS.find((p) => p === name);
  if ((when === "apres" || when === "avant") && prayer)
    return { prayer, text: prayerSlot(when, prayer) };
  return null;
}

/** "19:30" → "19 h 30", "09:00" → "9 h" (Québec French). */
function formatClock(hhmm: string): string {
  const [h = "0", m = "00"] = hhmm.split(":");
  const hour = String(Number(h));
  return m === "00" ? `${hour} h` : `${hour} h ${m}`;
}

/** Today as a LOCAL bare day — only ever called from event handlers. */
function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

const selectCls = cn(inputCls, "[&_option]:bg-night [&_option]:text-on-dark");
const subHeading = "font-display text-[18px] leading-tight text-on-dark";

function useGenderOf() {
  const persons = usePortal((s) => s.persons);
  return (id: string): Gender => persons.find((p) => p.id === id)?.gender ?? "homme";
}

// ── space ────────────────────────────────────────────────────────────────
type Tab = "reunions" | "pv" | "propositions" | "presences";

export function GovernanceSpace({ me }: SpaceProps) {
  const [tab, setTab] = useState<Tab>("reunions");
  const persons = usePortal((s) => s.persons);
  const meetings = usePortal((s) => s.meetings);
  const proposals = usePortal((s) => s.proposals);

  const shura = useMemo(
    () => persons.filter((p) => p.profiles.includes("shura_member")),
    [persons],
  );
  const openProposals = proposals.filter((p) => p.status === "ouverte").length;
  const flagged = shura.filter(
    (p) => absenceWarning(meetings, p.id, ABSENCE_THRESHOLD, ABSENCE_WINDOW).flagged,
  ).length;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "reunions", label: "Réunions" },
    { id: "pv", label: "Procès-verbaux" },
    { id: "propositions", label: "Propositions", badge: openProposals },
    { id: "presences", label: "Présences & charte", badge: flagged },
  ];
  const current = tabs.find((t) => t.id === tab)?.label ?? "";

  return (
    <>
      <SpaceHeading eyebrow="Secrétariat & Shura" title={`Bienvenue, ${me.firstName}`}>
        Réunions, invitations, présences et procès-verbaux de la Shura. Tout ce qui se trouve ici
        reste interne à l’organe : les autres membres du centre n’y ont pas accès.
      </SpaceHeading>
      <SpaceTabs label="Sections du secrétariat" tabs={tabs} value={tab} onChange={setTab} />
      <div role="tabpanel" aria-label={current}>
        {tab === "reunions" && <MeetingsTab me={me} shura={shura} />}
        {tab === "pv" && <MinutesTab />}
        {tab === "propositions" && <ProposalsTab me={me} />}
        {tab === "presences" && <AttendanceTab me={me} shura={shura} />}
      </div>
    </>
  );
}

// ── Réunions ─────────────────────────────────────────────────────────────
function MeetingsTab({ me, shura }: { me: Person; shura: Person[] }) {
  const meetings = usePortal((s) => s.meetings);
  const planned = useMemo(
    () =>
      meetings.filter((m) => m.status === "planned").sort((a, b) => a.date.localeCompare(b.date)),
    [meetings],
  );
  const held = useMemo(
    () => meetings.filter((m) => m.status === "held").sort((a, b) => b.date.localeCompare(a.date)),
    [meetings],
  );
  const next = planned[0];
  const later = planned.slice(1);

  const [planning, setPlanning] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const openRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLParagraphElement>(null);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="grid min-w-0 gap-6">
        {next ? (
          <MeetingPanel meeting={next} me={me} highlight />
        ) : (
          <Panel eyebrow="Prochaine réunion" title="Aucune réunion planifiée">
            <EmptyNote>
              Planifiez la prochaine réunion de la Shura avec le formulaire ci-contre.
            </EmptyNote>
          </Panel>
        )}
        {later.map((m) => (
          <MeetingPanel key={m.id} meeting={m} me={me} />
        ))}
      </div>

      <div className="grid min-w-0 gap-6">
        <Panel eyebrow="Secrétariat" title="Nouvelle réunion">
          <p className="text-on-dark-muted text-[14px] leading-relaxed">
            Titre, date, créneau — à une heure précise ou par rapport à une prière —, mode, lieu ou
            lien, ordre du jour et membres invités.
          </p>
          <p
            ref={confirmRef}
            tabIndex={-1}
            role="status"
            className={cn(
              "focus-visible:outline-gold-light focus-visible:outline-2 focus-visible:outline-offset-2",
              confirmation &&
                "mt-4 flex gap-2.5 rounded-[12px] border border-[#1c7d5b]/45 bg-[#1c7d5b]/15 px-3.5 py-3 text-[14px] leading-relaxed text-[#bfeedb]",
            )}
          >
            {confirmation && <CheckIcon width={18} height={18} className="mt-0.5 shrink-0" />}
            {confirmation}
          </p>
          {planning ? (
            <PlanMeetingForm
              shura={shura}
              onCancel={() => {
                flushSync(() => setPlanning(false));
                openRef.current?.focus();
              }}
              onPlanned={(msg) => {
                flushSync(() => {
                  setPlanning(false);
                  setConfirmation(msg);
                });
                confirmRef.current?.focus();
              }}
            />
          ) : (
            <button
              ref={openRef}
              type="button"
              className={cn(btn("gold"), "mt-4")}
              onClick={() => {
                setConfirmation("");
                setPlanning(true);
              }}
            >
              <PlusIcon width={17} height={17} />
              Planifier une réunion
            </button>
          )}
          <DemoNote>
            Le calcul de l’heure exacte d’un créneau lié à une prière dépend de la source de
            calendrier de prières à choisir (§9, question 13). L’envoi des invitations par courriel,
            les rappels et la création des liens de visioconférence sont des intégrations à retenir
            (§9, question 14).
          </DemoNote>
        </Panel>

        <Panel eyebrow="Historique" title="Réunions tenues">
          {held.length === 0 ? (
            <EmptyNote>Aucune réunion tenue pour l’instant.</EmptyNote>
          ) : (
            <ul>
              {held.map((m) => (
                <HeldMeeting key={m.id} meeting={m} />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-on-dark-faint text-[12.5px]">{label}</dt>
      <dd className="text-on-dark mt-0.5 text-[15px] [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

function MeetingPanel({
  meeting,
  me,
  highlight = false,
}: {
  meeting: GovernanceMeeting;
  me: Person;
  highlight?: boolean;
}) {
  const setRsvp = usePortal((s) => s.setRsvp);
  const name = usePersonName();
  const genderOf = useGenderOf();
  const [announce, setAnnounce] = useState("");

  const mine = meeting.invitations.find((i) => i.personId === me.id);
  const counts = RSVP_ORDER.map((r) => ({
    r,
    n: meeting.invitations.filter((i) => i.rsvp === r).length,
  }));

  const answer = (personId: string, rsvp: RsvpStatus) => {
    setRsvp(meeting.id, personId, rsvp);
    const who = personId === me.id ? "Votre réponse" : `Réponse de ${name(personId)}`;
    setAnnounce(`${who} : ${RSVP_META[rsvp].label[genderOf(personId)]}.`);
  };

  return (
    <Panel
      eyebrow={highlight ? "Prochaine réunion" : "Réunion planifiée"}
      title={meeting.title}
      className={highlight ? "border-gold/40 bg-gold/[0.06]" : undefined}
    >
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <Info label="Date">{formatDayLong(meeting.date)}</Info>
        <Info label="Créneau">{meeting.slot}</Info>
        <Info label="Mode">{MODE_LABELS[meeting.mode]}</Info>
        <Info label={LOCATION_LABELS[meeting.mode]}>{meeting.location || "À préciser"}</Info>
      </dl>

      <h3 className={cn(subHeading, "mt-6")}>Ordre du jour</h3>
      {meeting.agenda.length > 0 ? (
        <ol className="text-on-dark-muted marker:text-gold mt-2 list-decimal space-y-1 pl-5 text-[15px] leading-relaxed">
          {meeting.agenda.map((point, i) => (
            <li key={`${i}-${point}`}>{point}</li>
          ))}
        </ol>
      ) : (
        <p className="text-on-dark-faint mt-2 text-[14px]">Ordre du jour à compléter.</p>
      )}

      <h3 className={cn(subHeading, "mt-6")}>Invitations</h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {counts.map(({ r, n }) => (
          <div key={r} className="border-gold/12 rounded-[12px] border bg-white/[0.03] px-3 py-2">
            <dt className="text-on-dark-muted text-[12px] first-letter:uppercase">
              {RSVP_META[r].plural}
            </dt>
            <dd className="font-display nums text-on-dark text-[22px] leading-tight">{n}</dd>
          </div>
        ))}
      </dl>

      {mine && (
        <Segmented
          className="mt-5"
          name={`rsvp-me-${meeting.id}`}
          label="Votre réponse"
          options={RSVP_ORDER.filter((r) => r !== "no_response").map((r) => ({
            value: r,
            label: RSVP_META[r].label[me.gender],
          }))}
          value={mine.rsvp}
          onChange={(v) => answer(me.id, v)}
        />
      )}

      {meeting.invitations.length === 0 ? (
        <div className="mt-4">
          <EmptyNote>Personne n’est invité à cette réunion.</EmptyNote>
        </div>
      ) : (
        <ul className="divide-gold/10 border-gold/10 mt-4 divide-y border-y">
          {meeting.invitations.map((inv) => {
            const g = genderOf(inv.personId);
            const meta = RSVP_META[inv.rsvp];
            const isMe = inv.personId === me.id;
            const selectId = `rsvp-${meeting.id}-${inv.personId}`;
            return (
              <li key={inv.personId} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                <span className="text-on-dark min-w-[8rem] flex-1 text-[15px]">
                  {name(inv.personId, true)}
                  {isMe && <span className="text-on-dark-faint"> (vous)</span>}
                </span>
                <Pill tone={meta.tone}>{meta.label[g]}</Pill>
                {!isMe && (
                  <>
                    <label htmlFor={selectId} className="sr-only">
                      Simuler la réponse de {name(inv.personId, true)}
                    </label>
                    <select
                      id={selectId}
                      value={inv.rsvp}
                      onChange={(e) => {
                        const next = RSVP_ORDER.find((r) => r === e.target.value);
                        if (next) answer(inv.personId, next);
                      }}
                      className={cn(selectCls, "w-auto py-1.5")}
                    >
                      {RSVP_ORDER.map((r) => (
                        <option key={r} value={r}>
                          {RSVP_META[r].label[g]}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p role="status" className="text-gold-light mt-2 min-h-5 text-[13px]">
        {announce}
      </p>
      <p className="text-on-dark-faint mt-1 text-[12.5px] leading-relaxed">
        Le menu de chaque ligne simule, pour la démo, la réponse du membre — qui répondra
        normalement depuis son propre espace.
      </p>
    </Panel>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("text-gold mt-1 shrink-0 transition-transform", open && "rotate-180")}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function HeldMeeting({ meeting }: { meeting: GovernanceMeeting }) {
  const setGovAttendance = usePortal((s) => s.setGovAttendance);
  const docs = usePortal((s) => s.govDocuments);
  const name = usePersonName();
  const genderOf = useGenderOf();
  const [open, setOpen] = useState(false);
  const [announce, setAnnounce] = useState("");
  const panelId = `held-${meeting.id}`;

  const members = [
    ...new Set([
      ...meeting.invitations.map((i) => i.personId),
      ...meeting.attendance.map((a) => a.personId),
    ]),
  ];
  const statusOf = (id: string) => meeting.attendance.find((a) => a.personId === id)?.status;
  const tally = ATTENDANCE_ORDER.map((s) => ({
    s,
    n: members.filter((id) => statusOf(id) === s).length,
  })).filter((t) => t.n > 0);
  const missing = members.filter((id) => !statusOf(id)).length;
  const summary = [
    ...tally.map(({ s, n }) => plural(n, ATTENDANCE_META[s].one, ATTENDANCE_META[s].many)),
    ...(missing ? [plural(missing, "non saisi", "non saisis")] : []),
  ].join(" · ");
  const pv = docs.find((d) => d.meetingId === meeting.id);

  return (
    <li className="border-gold/10 border-t first:border-t-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="focus-visible:outline-gold-light flex w-full items-start justify-between gap-3 rounded-[10px] py-3.5 text-left focus-visible:outline-2"
        >
          <span className="min-w-0">
            <span className="text-on-dark block text-[15px] font-medium">{meeting.title}</span>
            <span className="text-on-dark-muted mt-0.5 block text-[13px]">
              {formatDay(meeting.date)} · {summary || "présences à saisir"}
            </span>
          </span>
          <Chevron open={open} />
        </button>
      </h3>
      <div id={panelId} hidden={!open} className="pb-5">
        <p className="text-on-dark-muted text-[13.5px] [overflow-wrap:anywhere]">
          {meeting.slot} · {MODE_LABELS[meeting.mode]} · {meeting.location || "Lieu non précisé"}
        </p>
        <p className="text-on-dark-muted mt-1 text-[13.5px]">
          Procès-verbal :{" "}
          {pv ? (
            <span className="text-on-dark">
              {pv.title} (v{pv.version}, {DOC_STATUS[pv.status].label.toLowerCase()})
            </span>
          ) : (
            "pas encore déposé"
          )}
        </p>

        <p className="border-gold/15 text-on-dark-muted mt-4 rounded-[12px] border bg-white/[0.03] px-3.5 py-2.5 text-[13px] leading-relaxed">
          L’absence doit être confirmée par une personne habilitée. La présence est saisie ici —
          elle n’est jamais déduite d’une connexion au portail.
        </p>

        <ul className="divide-gold/10 mt-3 divide-y">
          {members.map((id) => {
            const status = statusOf(id);
            const g = genderOf(id);
            const selectId = `att-${meeting.id}-${id}`;
            return (
              <li key={id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
                <span className="text-on-dark min-w-[8rem] flex-1 text-[14.5px]">
                  {name(id, true)}
                </span>
                <label htmlFor={selectId} className="sr-only">
                  Présence de {name(id, true)}
                </label>
                <select
                  id={selectId}
                  value={status ?? ""}
                  onChange={(e) => {
                    const next = ATTENDANCE_ORDER.find((s) => s === e.target.value);
                    if (!next) return;
                    setGovAttendance(meeting.id, id, next);
                    setAnnounce(
                      `Présence de ${name(id)} enregistrée : ${ATTENDANCE_META[next].label[g]}.`,
                    );
                  }}
                  className={cn(selectCls, "w-auto py-1.5")}
                >
                  {!status && (
                    <option value="" disabled>
                      Non saisie
                    </option>
                  )}
                  {ATTENDANCE_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {ATTENDANCE_META[s].label[g]}
                    </option>
                  ))}
                </select>
              </li>
            );
          })}
        </ul>
        <p role="status" className="text-gold-light mt-2 min-h-5 text-[13px]">
          {announce}
        </p>
      </div>
    </li>
  );
}

// ── Planifier une réunion ────────────────────────────────────────────────
type PlanField = "title" | "date" | "time" | "invitees";
const PLAN_IDS: Record<PlanField, string> = {
  title: "mt-new-title",
  date: "mt-new-date",
  time: "mt-new-time",
  invitees: "mt-new-invitees",
};

function PlanMeetingForm({
  shura,
  onPlanned,
  onCancel,
}: {
  shura: Person[];
  onPlanned: (message: string) => void;
  onCancel: () => void;
}) {
  const addMeeting = usePortal((s) => s.addMeeting);
  const prayerTimes = usePortal((s) => s.prayerTimes);
  const name = usePersonName();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [slotChoice, setSlotChoice] = useState("apres:Maghrib");
  const [time, setTime] = useState("");
  const [mode, setMode] = useState<MeetingMode>("sur_place");
  const [location, setLocation] = useState("");
  const [agenda, setAgenda] = useState("");
  const [invitees, setInvitees] = useState<string[]>(() => shura.map((p) => p.id));
  const [errors, setErrors] = useState<Partial<Record<PlanField, string>>>({});

  const prayer = parseSlotChoice(slotChoice);
  const indicative = prayer ? prayerTimes.find((p) => p.name === prayer.prayer)?.time : undefined;
  const allChecked = invitees.length === shura.length;

  const clear = (field: PlanField) =>
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Partial<Record<PlanField, string>> = {};
    const t = title.trim();
    if (!t) next.title = "Indiquez le titre de la réunion.";
    else if (t.length < 3) next.title = "Le titre doit compter au moins 3 caractères.";
    if (!date) next.date = "Choisissez la date de la réunion.";
    else if (date < todayIso())
      next.date = "Cette date est passée : choisissez aujourd’hui ou une date à venir.";
    if (!prayer && !time)
      next.time = "Indiquez l’heure de début, ou choisissez un créneau lié à une prière.";
    if (invitees.length === 0) next.invitees = "Cochez au moins un membre de la Shura à inviter.";

    const firstInvalid = (Object.keys(PLAN_IDS) as PlanField[]).find((k) => next[k]);
    if (firstInvalid) {
      flushSync(() => setErrors(next));
      document.getElementById(PLAN_IDS[firstInvalid])?.focus();
      return;
    }

    const slot = prayer ? prayer.text : formatClock(time);
    const ordered = shura.filter((p) => invitees.includes(p.id)).map((p) => p.id);
    addMeeting({
      title: t,
      date,
      slot,
      mode,
      location: location.trim(),
      agenda: agenda
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      invitees: ordered,
    });
    onPlanned(
      `Réunion planifiée : « ${t} », ${formatDayLong(date)}, ${slot}. ${plural(ordered.length, "invitation préparée", "invitations préparées")} — les membres répondront depuis leur espace.`,
    );
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      className="border-gold/10 mt-5 grid gap-4 border-t pt-5"
      aria-label="Planifier une réunion"
    >
      <Field id={PLAN_IDS.title} label="Titre" required error={errors.title}>
        <input
          {...describedBy(PLAN_IDS.title, errors.title)}
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

      <Field id={PLAN_IDS.date} label="Date" required error={errors.date}>
        <input
          {...describedBy(PLAN_IDS.date, errors.date)}
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            clear("date");
          }}
          className={cn(inputCls, "[color-scheme:dark]")}
        />
      </Field>

      <Field
        id="mt-new-slot"
        label="Créneau"
        hint={
          prayer
            ? `Horaire indicatif de ${prayer.prayer} aujourd’hui : ${indicative ?? "—"}. L’heure exacte du jour de la réunion dépendra du calendrier de prières retenu.`
            : "Indiquez l’heure de début ci-dessous."
        }
      >
        <select
          {...describedBy("mt-new-slot", undefined, true)}
          value={slotChoice}
          onChange={(e) => {
            setSlotChoice(e.target.value);
            clear("time");
          }}
          className={selectCls}
        >
          <optgroup label="Après une prière">
            {PRAYERS.map((p) => (
              <option key={`apres-${p}`} value={`apres:${p}`}>
                {prayerSlot("apres", p)}
              </option>
            ))}
          </optgroup>
          <optgroup label="Avant une prière">
            {PRAYERS.map((p) => (
              <option key={`avant-${p}`} value={`avant:${p}`}>
                {prayerSlot("avant", p)}
              </option>
            ))}
          </optgroup>
          <option value="heure">Heure précise</option>
        </select>
      </Field>

      {!prayer && (
        <Field id={PLAN_IDS.time} label="Heure de début" required error={errors.time}>
          <input
            {...describedBy(PLAN_IDS.time, errors.time)}
            type="time"
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              clear("time");
            }}
            className={cn(inputCls, "[color-scheme:dark] sm:max-w-[12rem]")}
          />
        </Field>
      )}

      <Segmented
        name="mt-new-mode"
        label="Mode"
        options={MODE_OPTIONS}
        value={mode}
        onChange={setMode}
      />

      <Field
        id="mt-new-location"
        label={LOCATION_LABELS[mode]}
        hint={
          mode === "sur_place"
            ? "Par exemple : Salle de réunion."
            : "Collez le lien de la visioconférence (fourni manuellement pour l’instant)."
        }
      >
        <input
          {...describedBy("mt-new-location", undefined, true)}
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={inputCls}
          autoComplete="off"
        />
      </Field>

      <Field id="mt-new-agenda" label="Ordre du jour" hint="Un point par ligne.">
        <textarea
          {...describedBy("mt-new-agenda", undefined, true)}
          rows={4}
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          className={cn(inputCls, "resize-y leading-relaxed")}
        />
      </Field>

      <fieldset
        aria-describedby={errors.invitees ? `${PLAN_IDS.invitees}-error` : undefined}
        className="min-w-0"
      >
        <legend className="text-on-dark text-[13.5px] font-medium">
          Invités — membres de la Shura
          <span className="text-gold ml-1" aria-hidden="true">
            *
          </span>
          <span className="sr-only"> (obligatoire)</span>
        </legend>
        <div className="mt-1.5 grid gap-0.5 sm:grid-cols-2">
          {shura.map((p, i) => {
            const checked = invitees.includes(p.id);
            return (
              <label
                key={p.id}
                className="text-on-dark has-[:focus-visible]:outline-gold-light flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] px-2 text-[14.5px] hover:bg-white/[0.04] has-[:focus-visible]:outline-2"
              >
                <input
                  id={i === 0 ? PLAN_IDS.invitees : undefined}
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setInvitees((list) =>
                      checked ? list.filter((x) => x !== p.id) : [...list, p.id],
                    );
                    clear("invitees");
                  }}
                  className="accent-gold size-[18px] shrink-0"
                />
                {name(p.id, true)}
              </label>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            setInvitees(allChecked ? [] : shura.map((p) => p.id));
            clear("invitees");
          }}
          className="text-gold-light focus-visible:outline-gold-light mt-1 rounded-full px-2 py-1 text-[13px] underline-offset-4 hover:underline focus-visible:outline-2"
        >
          {allChecked ? "Tout décocher" : "Tout cocher"}
        </button>
        {errors.invitees && (
          <p
            id={`${PLAN_IDS.invitees}-error`}
            role="alert"
            className="mt-1 text-[12.5px] text-[#ffb9a6]"
          >
            {errors.invitees}
          </p>
        )}
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={btn("gold")}>
          Planifier la réunion
        </button>
        <button type="button" onClick={onCancel} className={btn("ghost")}>
          Annuler
        </button>
      </div>
    </form>
  );
}

// ── Procès-verbaux ───────────────────────────────────────────────────────
function MinutesTab() {
  const docs = usePortal((s) => s.govDocuments);
  const meetings = usePortal((s) => s.meetings);

  return (
    <div className="grid gap-6">
      <p className="border-gold/20 bg-gold/[0.06] text-on-dark-muted flex gap-3 rounded-[14px] border px-4 py-3 text-[14px] leading-relaxed">
        <LockIcon width={18} height={18} className="text-gold mt-0.5 shrink-0" />
        <span>
          <strong className="text-on-dark font-semibold">Documents confidentiels.</strong> Ils ne
          sont visibles que par les membres de l’organe concerné, selon les droits de lecture de
          chaque catégorie. Un procès-verbal finalisé n’est plus modifiable : une correction devient
          une nouvelle version.
        </span>
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {DOC_CATEGORIES.map((cat) => {
          const list = docs
            .filter((d) => d.category === cat)
            .sort((a, b) => b.at.localeCompare(a.at));
          return (
            <Panel
              key={cat}
              eyebrow={plural(list.length, "document", "documents")}
              title={DOC_CATEGORY_LABELS[cat]}
            >
              {list.length === 0 ? (
                <EmptyNote>Aucun document dans cette catégorie pour l’instant.</EmptyNote>
              ) : (
                <ul className="divide-gold/10 divide-y">
                  {list.map((d) => {
                    const meeting = d.meetingId
                      ? meetings.find((m) => m.id === d.meetingId)
                      : undefined;
                    return (
                      <li
                        key={d.id}
                        className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-on-dark text-[15px] font-medium">{d.title}</p>
                          <p className="text-on-dark-muted mt-0.5 text-[13px]">
                            <span className="nums">
                              <span className="sr-only">version </span>
                              <span aria-hidden="true">v</span>
                              {d.version}
                            </span>
                            {" · "}
                            <time dateTime={d.at}>{formatDay(d.at)}</time>
                            {meeting && <> · {meeting.title}</>}
                          </p>
                        </div>
                        <Pill tone={DOC_STATUS[d.status].tone}>{DOC_STATUS[d.status].label}</Pill>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          );
        })}
      </div>

      <Panel eyebrow="Dépôt" title="Déposer un document">
        <p className="text-on-dark-muted text-[14px] leading-relaxed">
          Chaque document porte une catégorie, un titre, une version, la réunion liée, son auteur et
          son état de publication interne.
        </p>
        <DemoNote>
          Le dépôt de fichiers n’est pas actif dans ce prototype : les PDF iront dans un stockage
          objet sécurisé une fois le serveur branché — jamais dans la base de données (§8). Les
          catégories requises et les droits de lecture de chacune restent à confirmer avec le centre
          (§9, question 11).
        </DemoNote>
      </Panel>
    </div>
  );
}

// ── Propositions ─────────────────────────────────────────────────────────
function ProposalsTab({ me }: { me: Person }) {
  const proposals = usePortal((s) => s.proposals);
  const order: GovernanceProposal["status"][] = ["ouverte", "adoptee", "rejetee"];
  const sorted = [...proposals].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

  if (sorted.length === 0)
    return <EmptyNote>Aucune proposition n’a encore été soumise à la Shura.</EmptyNote>;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      {sorted.map((p) => (
        <ProposalCard key={p.id} proposal={p} me={me} />
      ))}
    </div>
  );
}

function ProposalCard({ proposal, me }: { proposal: GovernanceProposal; me: Person }) {
  const addComment = usePortal((s) => s.addProposalComment);
  const name = usePersonName();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const fieldId = `comment-${proposal.id}`;
  const status = PROPOSAL_STATUS[proposal.status];
  const isOpen = proposal.status === "ouverte";

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      flushSync(() => setError("Écrivez votre commentaire avant de l’envoyer."));
      document.getElementById(fieldId)?.focus();
      return;
    }
    addComment(proposal.id, me.id, trimmed);
    setText("");
    setError("");
    setDone("Commentaire publié pour les membres de la Shura.");
  }

  return (
    <Panel
      eyebrow="Proposition"
      title={proposal.title}
      action={<Pill tone={status.tone}>{status.label}</Pill>}
    >
      <p className="text-on-dark-muted text-[15px] leading-relaxed">{proposal.description}</p>
      <p className="text-on-dark-faint mt-2 text-[13px]">
        Proposée par {name(proposal.authorId, true)}
      </p>

      <h3 className={cn(subHeading, "mt-6")}>
        Commentaires{" "}
        <span className="nums text-on-dark-faint text-[15px]">({proposal.comments.length})</span>
      </h3>
      {proposal.comments.length === 0 ? (
        <p className="text-on-dark-faint mt-2 text-[14px]">Aucun commentaire pour l’instant.</p>
      ) : (
        <ol className="mt-3 grid gap-3">
          {proposal.comments.map((c, i) => (
            <li
              key={`${c.at}-${i}`}
              className="border-gold/10 rounded-[12px] border bg-white/[0.03] px-3.5 py-3"
            >
              <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-[13px]">
                <span className="text-on-dark font-medium">{name(c.personId)}</span>
                <time dateTime={c.at} className="text-on-dark-faint">
                  {formatDateTime(c.at)}
                </time>
              </p>
              <p className="text-on-dark-muted mt-1 text-[14.5px] leading-relaxed">{c.text}</p>
            </li>
          ))}
        </ol>
      )}

      {isOpen ? (
        <form noValidate onSubmit={submit} className="mt-5 grid gap-3">
          <Field
            id={fieldId}
            label="Votre commentaire"
            required
            error={error}
            hint="Visible par les membres de la Shura."
          >
            <textarea
              {...describedBy(fieldId, error, true)}
              rows={3}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError("");
                if (done) setDone("");
              }}
              className={cn(inputCls, "resize-y leading-relaxed")}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className={btn("gold", "sm")}>
              Publier le commentaire
            </button>
            <p role="status" className="text-[13px] text-[#9fe0c2]">
              {done}
            </p>
          </div>
        </form>
      ) : (
        <p className="text-on-dark-faint mt-5 text-[13.5px]">
          Décision finale : proposition {status.label.toLowerCase()}. Les commentaires sont fermés.
        </p>
      )}
    </Panel>
  );
}

// ── Présences & charte ───────────────────────────────────────────────────
interface Decision {
  kind: "review" | "dismissed";
  at: string;
}

function AttendanceTab({ me, shura }: { me: Person; shura: Person[] }) {
  const meetings = usePortal((s) => s.meetings);
  const docs = usePortal((s) => s.govDocuments);
  const name = usePersonName();
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const recordRefs = useRef<Record<string, HTMLParagraphElement | null>>({});

  const charter = docs
    .filter((d) => d.category === "charte")
    .sort((a, b) => b.version - a.version)[0];
  const recent = meetings
    .filter((m) => m.status === "held")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, ABSENCE_WINDOW)
    .reverse();
  const rows = shura
    .map((person) => ({
      person,
      warning: absenceWarning(meetings, person.id, ABSENCE_THRESHOLD, ABSENCE_WINDOW),
    }))
    .sort((a, b) => Number(b.warning.flagged) - Number(a.warning.flagged));

  const decide = (personId: string, kind: Decision["kind"]) => {
    flushSync(() =>
      setDecisions((d) => ({ ...d, [personId]: { kind, at: new Date().toISOString() } })),
    );
    recordRefs.current[personId]?.focus();
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
      <Panel
        eyebrow="Règle en vigueur"
        title={charter ? `${charter.title} · v${charter.version}` : "Charte de la Shura"}
      >
        <p className="text-on-dark-muted text-[14.5px] leading-relaxed">
          <strong className="text-on-dark font-semibold">Article 7.</strong> Un avertissement peut
          être proposé à partir de {ABSENCE_THRESHOLD} absences non excusées sur les{" "}
          {ABSENCE_WINDOW} dernières réunions tenues. Les absences excusées et les retards ne
          comptent pas.
        </p>
        <p className="text-on-dark-muted mt-3 text-[14.5px] leading-relaxed">
          Le moteur ne fait que <strong className="text-on-dark font-semibold">signaler</strong> :
          il ne sanctionne ni n’exclut jamais. La décision est humaine, motivée et rattachée à la
          version de la charte applicable.
        </p>
        <DemoNote>
          Les décisions prises ici restent dans ce navigateur. Avec le serveur, elles seront
          historisées et journalisées ; les seuils exacts et la personne qui décide restent à
          confirmer (§9, question 12).
        </DemoNote>
      </Panel>

      <Panel
        eyebrow={`${plural(recent.length, "réunion tenue", "réunions tenues")} dans la fenêtre`}
        title="Présences des membres"
      >
        {rows.length === 0 ? (
          <EmptyNote>Aucun membre de la Shura n’est enregistré.</EmptyNote>
        ) : (
          <ul className="divide-gold/10 divide-y">
            {rows.map(({ person, warning }) => {
              const decision = decisions[person.id];
              const fullName = name(person.id, true);
              const absText =
                warning.absences === 0
                  ? `Aucune absence sur ${plural(warning.window, "réunion", "réunions")}`
                  : `${plural(warning.absences, "absence", "absences")} sur ${plural(warning.window, "réunion", "réunions")}`;
              return (
                <li key={person.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-on-dark text-[15.5px] font-medium">
                      {fullName}
                      {person.id === me.id && (
                        <span className="text-on-dark-faint font-normal"> (vous)</span>
                      )}
                    </p>
                    <Pill tone={warning.flagged ? "warn" : "neutral"}>
                      {warning.flagged ? "Seuil atteint" : "Sous le seuil"}
                    </Pill>
                  </div>
                  <p className="text-on-dark-muted mt-1 text-[14px]">{absText}</p>
                  <div aria-hidden="true" className="mt-2 flex max-w-[220px] gap-1">
                    {Array.from({ length: ABSENCE_THRESHOLD }, (_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          i < warning.absences ? "bg-[#e0a24a]" : "bg-white/[0.08]",
                        )}
                      />
                    ))}
                  </div>
                  {recent.length > 0 && (
                    <ul
                      aria-label={`Détail des réunions de ${fullName}`}
                      className="mt-2.5 flex flex-wrap gap-1.5"
                    >
                      {recent.map((m) => {
                        const st = m.attendance.find((a) => a.personId === person.id)?.status;
                        return (
                          <li key={m.id}>
                            <Pill tone={st ? ATTENDANCE_META[st].tone : "neutral"}>
                              {formatDay(m.date)} ·{" "}
                              {st ? ATTENDANCE_META[st].label[person.gender] : "Non saisie"}
                            </Pill>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {warning.flagged && (
                    <div className="mt-3 rounded-[14px] border border-[#d9a23d]/40 bg-[#d9a23d]/10 p-4">
                      <p className="text-[14.5px] leading-relaxed font-medium text-[#ffd98a]">
                        Seuil de la charte atteint (art. 7 : {ABSENCE_THRESHOLD} absences sur{" "}
                        {ABSENCE_WINDOW} réunions) — proposition d’avertissement à examiner.
                      </p>
                      <p className="text-on-dark-muted mt-1 text-[14px] leading-relaxed">
                        Aucune exclusion n’est automatique : la décision revient aux responsables
                        habilités.
                      </p>
                      <p
                        ref={(el) => {
                          recordRefs.current[person.id] = el;
                        }}
                        tabIndex={-1}
                        role="status"
                        className={cn(
                          "focus-visible:outline-gold-light focus-visible:outline-2 focus-visible:outline-offset-2",
                          decision &&
                            "border-gold/20 bg-night/40 text-on-dark mt-3 flex gap-2 rounded-[10px] border px-3 py-2.5 text-[13.5px] leading-relaxed",
                        )}
                      >
                        {decision && (
                          <CheckIcon width={16} height={16} className="text-gold mt-0.5 shrink-0" />
                        )}
                        {decision &&
                          (decision.kind === "review"
                            ? `Dossier ouvert pour examen par ${name(me.id)} le ${formatDateTime(decision.at)}. Aucune mesure ne s’applique tant que les responsables habilités n’ont pas statué.`
                            : `Classé sans suite par ${name(me.id)} le ${formatDateTime(decision.at)}. Aucune mesure n’est prise ; la décision est consignée.`)}
                      </p>
                      {!decision && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={btn("gold", "sm")}
                            onClick={() => decide(person.id, "review")}
                          >
                            Examiner le dossier
                          </button>
                          <button
                            type="button"
                            className={btn("ghost", "sm")}
                            onClick={() => decide(person.id, "dismissed")}
                          >
                            Classer sans suite
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
