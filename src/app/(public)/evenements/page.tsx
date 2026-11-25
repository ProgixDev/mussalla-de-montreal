import Link from "next/link";
import type { Metadata } from "next";
import {
  CommunityHero,
  LivePrayerChanges,
  LiveUpcomingEvents,
  PrayerTimesPanel,
  centreToday,
} from "@/features/community";
import { EmergencyBanner } from "@/components/emergency-banner";
import { ArrowRightIcon } from "@/components/ui/icons";
import { prayerTimes } from "@/core/portal/seed";

export const metadata: Metadata = {
  title: "Événements et annonces",
  description:
    "Dars, halaqas, événements, annonces et changements d’horaire de prière à la Mussalla de Montréal.",
  alternates: { canonical: "/evenements" },
};

/** "Upcoming" depends on the day: re-render at most hourly instead of freezing it at build time. */
export const revalidate = 3600;

/** A prayer-time change stays announced this many days after it takes effect. */
const PRAYER_CHANGE_DAYS = 30;

/**
 * « Événements et annonces » (spec §4.8). Only PUBLISHED items reach the public — drafts
 * and items awaiting approval never do. Live emergency alerts (client) sit on top.
 */
export default function EvenementsPage() {
  const today = centreToday();

  return (
    <div className="bg-night text-on-dark">
      <CommunityHero id="evenements" eyebrow="Le centre" title="Événements et annonces">
        Les dars et halaqas, les rencontres, les annonces du centre — et chaque changement d’horaire
        de prière, dès qu’il est décidé.
      </CommunityHero>

      <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
        <EmergencyBanner variant="panel" />
        <LivePrayerChanges today={today} keepDays={PRAYER_CHANGE_DAYS} />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
          {/* First in reading order on phones; the right-hand column on desktop. */}
          <aside aria-label="Horaires de prière" className="lg:col-start-2 lg:row-start-1">
            <div className="lg:sticky lg:top-24">
              <PrayerTimesPanel times={prayerTimes} />
            </div>
          </aside>

          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <LiveUpcomingEvents today={today} />
            <p className="mt-10">
              <Link
                href="/activites"
                className="text-gold-light inline-flex items-center gap-2 text-[15px] font-medium underline-offset-4 hover:underline"
              >
                Voir aussi les activités régulières
                <ArrowRightIcon width={16} height={16} />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
