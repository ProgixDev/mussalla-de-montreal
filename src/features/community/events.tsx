import type { CentreEvent, PrayerTime } from "@/core/portal/types";
import { Panel, Pill, EmptyNote } from "@/components/portal/kit";
import { Star8 } from "@/components/ui/star";
import { formatDayLong } from "@/lib/format";
import { AUDIENCE_LABELS, EVENT_KIND_LABELS, lowerFirst } from "./labels";

/**
 * Server-rendered pieces of « Événements et annonces » (§4.8). Pure presentation: the page
 * decides what is published and upcoming; these only lay it out.
 */

/** Prayer-time changes, set apart: they change everyone's day. */
export function PrayerChanges({ changes, today }: { changes: CentreEvent[]; today: string }) {
  if (changes.length === 0) return null;
  return (
    <section aria-labelledby="changements-priere" className="mb-10">
      <h2 id="changements-priere" className="eyebrow text-gold">
        Changement d’horaire de prière
      </h2>
      <ul className="mt-3 space-y-4">
        {changes.map((e) => {
          const day = lowerFirst(formatDayLong(e.date));
          const when = e.date >= today ? `à partir du ${day}` : `depuis le ${day}`;
          return (
            <li key={e.id}>
              <article
                aria-labelledby={`ev-${e.id}`}
                className="border-gold/40 bg-gold/[0.07] relative overflow-hidden rounded-[20px] border p-5 shadow-[0_0_60px_-24px_rgba(236,217,160,0.45)] md:p-7"
              >
                <Star8 size={140} className="text-gold/[0.07] absolute -top-8 -right-8" />
                <h3
                  id={`ev-${e.id}`}
                  className="font-display text-on-dark relative text-[22px] leading-tight md:text-[26px]"
                >
                  {e.title}
                </h3>
                <p className="text-on-dark relative mt-3 text-[17px] leading-snug md:text-[19px]">
                  Nouvel horaire :{" "}
                  <strong className="nums text-gold-light font-semibold">{e.slot}</strong>
                  {e.previousSlot && (
                    <span className="text-on-dark-muted">
                      {" "}
                      (auparavant <span className="nums">{e.previousSlot}</span>)
                    </span>
                  )}{" "}
                  — <time dateTime={e.date}>{when}</time>
                </p>
                <p className="text-on-dark-muted relative mt-3 max-w-[640px] text-[15px] leading-relaxed">
                  {e.description}
                </p>
                <p className="text-on-dark-faint relative mt-3 text-[13.5px]">
                  {e.location} · {AUDIENCE_LABELS[e.audience]}
                </p>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Upcoming events, grouped by day in date order. */
export function UpcomingEvents({ events }: { events: CentreEvent[] }) {
  const days = new Map<string, CentreEvent[]>();
  for (const e of [...events].sort((a, b) => a.date.localeCompare(b.date))) {
    days.set(e.date, [...(days.get(e.date) ?? []), e]);
  }

  return (
    <section aria-labelledby="a-venir">
      <h2
        id="a-venir"
        className="font-display text-on-dark text-[28px] leading-tight md:text-[34px]"
      >
        À venir
      </h2>
      {days.size === 0 ? (
        <div className="mt-5">
          <EmptyNote>Aucun événement annoncé pour le moment. Revenez bientôt.</EmptyNote>
        </div>
      ) : (
        <ol className="mt-6 space-y-8">
          {[...days.entries()].map(([date, list]) => (
            <li key={date}>
              <h3 className="text-gold-light flex items-center gap-3 text-[15px] font-semibold">
                <Star8 size={11} className="text-gold" />
                <time dateTime={date}>{formatDayLong(date)}</time>
              </h3>
              <ul className="border-gold/15 mt-3 space-y-3 border-l pl-4 md:pl-6">
                {list.map((e) => (
                  <li key={e.id}>
                    <EventCard event={e} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function EventCard({ event: e }: { event: CentreEvent }) {
  return (
    <article
      aria-labelledby={`ev-${e.id}`}
      className="border-gold/15 rounded-[16px] border bg-white/[0.035] p-4 shadow-[0_24px_50px_-34px_rgba(0,0,0,0.85)] md:p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={e.kind === "annonce" ? "neutral" : "gold"}>
          <span className="sr-only">Type : </span>
          {EVENT_KIND_LABELS[e.kind]}
        </Pill>
        <Pill tone="neutral">
          <span className="sr-only">Public : </span>
          {AUDIENCE_LABELS[e.audience]}
        </Pill>
      </div>
      <h4 id={`ev-${e.id}`} className="font-display text-on-dark mt-2.5 text-[20px] leading-tight">
        {e.title}
      </h4>
      <p className="text-on-dark mt-1.5 text-[14px]">
        <span className="sr-only">Quand : </span>
        <span className="nums">{e.slot}</span>
        <span aria-hidden="true" className="text-on-dark-faint mx-2">
          ·
        </span>
        <span className="sr-only">Où : </span>
        {e.location}
      </p>
      <p className="text-on-dark-muted mt-2 text-[14.5px] leading-relaxed">{e.description}</p>
    </article>
  );
}

/** Indicative prayer times, clearly labelled as such until the official calendar plugs in. */
export function PrayerTimesPanel({ times }: { times: PrayerTime[] }) {
  return (
    <Panel eyebrow="Indicatif" title="Horaires de prière">
      <p className="border-gold/15 bg-gold/[0.06] text-on-dark-muted -mt-1 mb-4 rounded-[12px] border px-3.5 py-2.5 text-[13px] leading-relaxed">
        <strong className="text-gold-light font-semibold">Horaires indicatifs</strong> — le
        calendrier officiel du centre sera affiché ici.
      </p>
      <ul>
        {times.map((t) => (
          <li
            key={t.name}
            className="flex items-center justify-between gap-3 border-b border-white/[0.06] py-3 last:border-0"
          >
            <span className="flex min-w-0 items-baseline gap-3">
              <span className="text-on-dark text-[15px] font-medium">{t.name}</span>
              <span lang="ar" className="font-arabic text-gold text-[19px] leading-none">
                {t.arabic}
              </span>
            </span>
            <span className="nums font-display text-gold-light text-[20px]">{t.time}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
