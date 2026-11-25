/**
 * Community slice — the public pages of the centre: activity catalogue, membership,
 * volunteering, events and the private question to the Imam (spec §4.1, §4.2, §4.7–§4.9).
 */
export { CommunityHero } from "./hero";
export { ActivityCatalogue } from "./activity-catalogue";
export { MembershipForm } from "./membership-form";
export { VolunteerForm } from "./volunteer-form";
export { ImamQuestionForm } from "./imam-form";
export { PrayerChanges, PrayerTimesPanel, UpcomingEvents } from "./events";
export { LivePrayerChanges, LiveUpcomingEvents } from "./events-live";
export { addDaysIso, centreToday } from "./labels";
