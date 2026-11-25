"use client";

import { usePortal } from "@/lib/portal/store";
import { PrayerChanges, UpcomingEvents } from "./events";
import { addDaysIso } from "./labels";

/**
 * The public event lists, fed by the shared portal store: an event a manager proposes and
 * the administration publishes in the portal appears here (spec §4.8). Before the saved
 * demo state is restored the store holds exactly the seed, so the server HTML and the
 * first client render are identical; with the backend this becomes a server read.
 */
export function LivePrayerChanges({ today, keepDays }: { today: string; keepDays: number }) {
  const events = usePortal((s) => s.events);
  const changes = events
    .filter(
      (e) =>
        e.status === "published" && e.kind === "priere" && e.date >= addDaysIso(today, -keepDays),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  return <PrayerChanges changes={changes} today={today} />;
}

export function LiveUpcomingEvents({ today }: { today: string }) {
  const events = usePortal((s) => s.events);
  const upcoming = events.filter(
    (e) => e.status === "published" && e.kind !== "priere" && e.date >= today,
  );
  return <UpcomingEvents events={upcoming} />;
}
