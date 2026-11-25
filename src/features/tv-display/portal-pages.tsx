"use client";

import { usePortal } from "@/lib/portal/store";
import { usePortalReady } from "@/lib/portal/hydrator";
import { canDisplayOnScreen, isAlertActive } from "@/core/portal/derive";
import type { CentreEvent, Congratulation } from "@/core/portal/types";
import { formatDateTime, formatDayLong } from "@/lib/format";
import { Star8 } from "@/components/ui/star";
import { StarAvatar } from "@/components/portal/kit";

/**
 * TV pages fed by the portal (spec §4.5): approved congratulations, events and
 * prayer-time changes, and the emergency takeover. Screens only ever receive approved,
 * targeted, unexpired content — never profiles, private messages or finances.
 */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow text-gold mb-6 flex items-center gap-2.5">
      <Star8 size={12} />
      {children}
    </p>
  );
}

const SCOPE_TV: Record<Congratulation["scope"], string> = {
  enfant_du_jour: "Enfant du jour",
  enfant_de_la_semaine: "Enfant de la semaine",
  groupe_de_la_semaine: "Groupe de la semaine",
};

export function FelicitationsPage() {
  const ready = usePortalReady();
  const congrats = usePortal((s) => s.congratulations);
  const children = usePortal((s) => s.children);
  const classes = usePortal((s) => s.classes);
  const now = new Date().toISOString();
  const live = ready
    ? congrats.filter((c) => canDisplayOnScreen(c, now, children)).slice(0, 2)
    : [];

  return (
    <div className="w-full">
      <Eyebrow>Félicitations</Eyebrow>
      {live.length === 0 ? (
        <p className="font-display text-on-dark-muted text-[44px]">
          Les bravos de la semaine apparaîtront ici.
        </p>
      ) : (
        <div className="grid gap-[clamp(24px,3vw,64px)] md:grid-cols-2">
          {live.map((c) => {
            const child = children.find((k) => k.id === c.childId);
            const cls = classes.find((k) => k.id === c.classId);
            return (
              <div
                key={c.id}
                className="border-gold/30 flex items-center gap-[clamp(20px,2.4vw,44px)] rounded-[28px] border bg-white/[0.04] p-[clamp(20px,2.4vw,44px)]"
              >
                {child ? (
                  <StarAvatar name={child.firstName} seed={child.avatar} size={150} />
                ) : (
                  <span className="relative flex size-[150px] shrink-0 items-center justify-center">
                    <Star8 size={150} className="text-gold/25 absolute inset-0" />
                    <span className="font-display text-gold-light relative text-[24px]">
                      {cls?.title.replace("Groupe ", "") ?? "Groupe"}
                    </span>
                  </span>
                )}
                <div className="min-w-0">
                  <p className="eyebrow text-gold">{SCOPE_TV[c.scope]}</p>
                  <p className="font-display text-gold-light mt-2 text-[clamp(34px,3.6vw,64px)] leading-none">
                    {c.title}
                  </p>
                  <p className="text-on-dark mt-4 text-[clamp(17px,1.4vw,26px)] leading-snug">
                    {c.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const KIND_TV: Record<CentreEvent["kind"], string> = {
  dars: "Dars",
  halaqa: "Halaqa",
  evenement: "Événement",
  priere: "Prière",
  annonce: "Annonce",
};

export function EvenementsPage() {
  // Seed and persisted events render identically before hydration, so no ready-gate here.
  const events = usePortal((s) => s.events);
  const prayerTimes = usePortal((s) => s.prayerTimes);
  const published = events.filter((e) => e.status === "published");
  const change = published.find((e) => e.kind === "priere");
  const upcoming = published
    .filter((e) => e.kind !== "priere")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  return (
    <div className="grid w-full gap-12 md:grid-cols-[1.4fr_1fr]">
      <div>
        <Eyebrow>Événements et annonces</Eyebrow>
        {change && (
          <div className="border-gold/45 bg-gold/10 mb-7 rounded-[22px] border px-7 py-5">
            <p className="eyebrow text-gold">Changement d’horaire</p>
            <p className="font-display text-on-dark mt-2 text-[34px] leading-tight">
              {change.title}
            </p>
            <p className="text-on-dark mt-1 text-[22px]">
              <span className="text-on-dark-muted line-through decoration-1">
                {change.previousSlot}
              </span>{" "}
              <span className="text-gold-light font-semibold">→ {change.slot}</span> · dès le{" "}
              {formatDayLong(change.date).toLowerCase()}
            </p>
          </div>
        )}
        <ul className="space-y-5">
          {upcoming.map((e) => (
            <li key={e.id} className="flex items-baseline gap-5 border-b border-white/[0.08] pb-4">
              <span className="text-gold w-28 shrink-0 text-[16px]">{KIND_TV[e.kind]}</span>
              <span>
                <span className="font-display text-on-dark block text-[26px] leading-tight">
                  {e.title}
                </span>
                <span className="text-on-dark-muted text-[18px]">
                  {formatDayLong(e.date)} · {e.slot}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-gold/20 rounded-[24px] border bg-white/[0.04] p-7">
        <p className="eyebrow text-gold">Horaires de prière</p>
        <ul className="mt-5 space-y-4">
          {prayerTimes.map((p) => (
            <li
              key={p.name}
              className="flex items-baseline justify-between gap-4 border-b border-white/[0.07] pb-3"
            >
              <span className="text-on-dark text-[22px]">{p.name}</span>
              <span className="font-arabic text-gold-light text-[24px]" lang="ar">
                {p.arabic}
              </span>
              <span className="nums font-display text-on-dark text-[30px]">{p.time}</span>
            </li>
          ))}
        </ul>
        <p className="text-on-dark-faint mt-4 text-[13px]">
          Horaires indicatifs — le calendrier officiel du centre sera branché ici.
        </p>
      </div>
    </div>
  );
}

/** Full-screen emergency takeover — shown over every page while an alert targets screens. */
export function EmergencyTakeover() {
  const ready = usePortalReady();
  const alerts = usePortal((s) => s.alerts);
  if (!ready) return null;
  const now = new Date().toISOString();
  const alert = alerts.find((a) => a.channels.includes("ecran") && isAlertActive(a, now));
  if (!alert) return null;
  return (
    <div
      role="alert"
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#3a1209] px-16 text-center"
    >
      <div
        aria-hidden="true"
        className="animate-glow absolute inset-0"
        style={{
          background: "radial-gradient(60% 60% at 50% 45%, rgba(224,122,95,0.35), transparent 70%)",
        }}
      />
      <p className="relative text-[22px] font-semibold tracking-[0.2em] text-[#ffb9a6] uppercase">
        {alert.level === "urgent" ? "Alerte urgente" : "Information importante"}
      </p>
      <p className="font-display relative mt-6 max-w-[1300px] text-[clamp(48px,5.2vw,96px)] leading-[1.05] text-white">
        {alert.title}
      </p>
      <p className="relative mt-6 max-w-[1100px] text-[clamp(22px,1.9vw,34px)] leading-snug text-[#ffe1d8]">
        {alert.message}
      </p>
      {alert.instruction && (
        <p className="relative mt-8 rounded-full bg-white px-10 py-4 text-[clamp(22px,2vw,36px)] font-bold text-[#3a1209]">
          {alert.instruction}
        </p>
      )}
      <p className="relative mt-8 text-[18px] text-[#ffcfc2]">
        Jusqu’au {formatDateTime(alert.expiresAt)}
      </p>
    </div>
  );
}
