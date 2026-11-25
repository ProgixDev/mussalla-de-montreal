/**
 * Domain model of the community-centre portal — transcribed from the client's
 * developer spec (design/cahier-des-charges-portail.md, §3 roles and §5 data model).
 * Lives in `core` because the public site, the portal, the TV and the backoffice all
 * read it. Money is ALWAYS integer cents; dates are ISO strings (YYYY-MM-DD or full
 * ISO timestamps) and only src/lib/format.ts turns them into text.
 *
 * UI-first phase: these shapes back a typed seed (./seed.ts) and a demo store. When the
 * backend lands they are produced from Supabase rows with the same names.
 */

// ── identity & roles (§3) ────────────────────────────────────────────────
export type BaseRole = "admin" | "teacher" | "parent" | "child" | "screen";
/** Cumulative functional profiles — a parent can also be the secretary (§3.1). */
export type FunctionalProfile =
  | "secretary"
  | "shura_member"
  | "activity_manager"
  | "imam"
  | "accountant"
  | "volunteer_coordinator";

export type Gender = "femme" | "homme";
export type MembershipStatus = "prospect" | "pending" | "active" | "suspended" | "expired";

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  role: BaseRole;
  profiles: FunctionalProfile[];
  membership: MembershipStatus;
  email: string;
  phone: string;
}

/** A demo persona: who you "sign in" as in the portal prototype. */
export interface Persona {
  id: string;
  personId: string;
  label: string;
  description: string;
  role: BaseRole;
  profiles: FunctionalProfile[];
}

// ── activities & membership (§4.1) ───────────────────────────────────────
export type Audience = "femmes" | "hommes" | "enfants" | "tous";
export type ActivityCategory = "coran" | "arabe" | "sport" | "communaute" | "dars";

export interface Activity {
  id: string;
  title: string;
  category: ActivityCategory;
  audience: Audience;
  ageMin: number | null;
  ageMax: number | null;
  membershipRequired: boolean;
  capacity: number;
  enrolled: number;
  schedule: string;
  location: string;
  /** 0 = free. Monthly price in cents otherwise. */
  monthlyPriceCents: number;
  description: string;
}

// ── families & school (§4.2, §4.3) ───────────────────────────────────────
export type ConsentType =
  | "portal_profile"
  | "homework_photo"
  | "screen_display"
  | "external_publication";

export interface Consent {
  type: ConsentType;
  granted: boolean;
  /** ISO date of this (append-only) decision. */
  at: string;
}

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: Gender;
  parentId: string;
  classId: string;
  /** Avatar colour seed (index into the avatar palette). */
  avatar: number;
  consents: Consent[];
}

export interface SchoolClass {
  id: string;
  activityId: string;
  title: string;
  teacherId: string;
  schedule: string;
  room: string;
}

export type AttendanceStatus = "present" | "late" | "absent" | "excused" | "left_early";

export interface AttendanceRecord {
  id: string;
  childId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  /** Arrived early/on time — may trigger a punctuality point (never a sanction). */
  early?: boolean;
}

export type PointCategory =
  | "memorisation"
  | "lecture"
  | "attitude"
  | "comportement"
  | "ponctualite";

/** Points are never edited: a correction is a new entry (§4.3). */
export interface PointEntry {
  id: string;
  childId: string;
  classId: string;
  category: PointCategory;
  /** Non-zero. Positive or negative (e.g. +10, −2). */
  points: number;
  reason: string;
  teacherId: string;
  at: string;
}

export type StickerKind = "etoile" | "croissant" | "livre" | "lanterne";

export interface Award {
  id: string;
  childId: string;
  kind: StickerKind;
  label: string;
  teacherId: string;
  at: string;
}

export interface RubricCategory {
  key: PointCategory;
  label: string;
  /** Weight in percent; a weighted rubric must total 100. */
  weight: number;
}

export interface Rubric {
  id: string;
  name: string;
  version: number;
  scope: string;
  status: "draft" | "active" | "archived";
  categories: RubricCategory[];
}

export interface Assessment {
  id: string;
  childId: string;
  title: string;
  category: PointCategory;
  score: number;
  max: number;
  comment: string;
  at: string;
}

export interface Homework {
  id: string;
  classId: string;
  title: string;
  instructions: string;
  /** Mushaf/textbook pages to revise — rendered as page thumbnails. */
  pages: number[];
  /**
   * Photos the teacher took of the pages (client: « il prend des photos, il les uploade
   * directement dans l'exercice »). Demo: small JPEG data URLs; production: signed URLs
   * to secure object storage — never stored in the database (§8).
   */
  photos?: string[];
  due: string;
  postedAt: string;
}

export type MessageScope = "enfant" | "classe" | "ecole";

export interface PortalMessage {
  id: string;
  scope: MessageScope;
  /** childId for "enfant", classId for "classe", absent for "ecole". */
  targetId?: string;
  authorId: string;
  title: string;
  body: string;
  at: string;
}

// ── communications, alerts, screens (§4.4, §4.5) ─────────────────────────
export type AlertAudience = "tout_le_centre" | "parents" | "enseignants" | "classe";
export type AlertChannel = "portail" | "courriel" | "sms" | "ecran";

export interface EmergencyAlert {
  id: string;
  title: string;
  message: string;
  /** The explicit instruction, e.g. « Gardez les enfants à la maison ». */
  instruction: string;
  level: "urgent" | "important";
  audience: AlertAudience;
  channels: AlertChannel[];
  authorId: string;
  publishedAt: string;
  expiresAt: string;
  /** Simulated delivery report until an SMS/e-mail provider is chosen (§10). */
  deliveries: { channel: AlertChannel; sent: number; failed: number }[];
}

export type CongratulationScope =
  | "enfant_du_jour"
  | "enfant_de_la_semaine"
  | "groupe_de_la_semaine";
export type ApprovalStatus = "submitted" | "approved" | "rejected";

export interface Congratulation {
  id: string;
  scope: CongratulationScope;
  childId?: string;
  classId?: string;
  title: string;
  message: string;
  status: ApprovalStatus;
  proposedBy: string;
  approvedBy?: string;
  displayFrom: string;
  displayUntil: string;
}

export interface ScreenDevice {
  id: string;
  name: string;
  location: string;
  status: "paired" | "pending" | "revoked";
  lastSeen: string;
  pairingCode?: string;
}

// ── events & information (§4.8) ──────────────────────────────────────────
export type EventKind = "dars" | "halaqa" | "evenement" | "priere" | "annonce";

export interface CentreEvent {
  id: string;
  kind: EventKind;
  title: string;
  audience: Audience;
  date: string;
  /** Free slot text: « 19 h 30 » or « après la prière de Maghrib ». */
  slot: string;
  location: string;
  description: string;
  status: "draft" | "submitted" | "published";
  /** For prayer-time changes. */
  previousSlot?: string;
}

export interface PrayerTime {
  name: string;
  arabic: string;
  time: string;
}

// ── governance / Shura (§4.6) ────────────────────────────────────────────
export type RsvpStatus = "accepted" | "declined" | "tentative" | "no_response";
export type GovAttendance = "present" | "late" | "absent" | "excused";

export interface GovernanceMeeting {
  id: string;
  title: string;
  date: string;
  slot: string;
  mode: "sur_place" | "distanciel" | "hybride";
  location: string;
  agenda: string[];
  status: "planned" | "held";
  invitations: { personId: string; rsvp: RsvpStatus }[];
  attendance: { personId: string; status: GovAttendance }[];
}

export interface GovernanceDocument {
  id: string;
  category: "pv_shura" | "charte" | "finances" | "propositions";
  title: string;
  version: number;
  meetingId?: string;
  status: "brouillon" | "publie_interne";
  at: string;
}

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  authorId: string;
  status: "ouverte" | "adoptee" | "rejetee";
  comments: { personId: string; text: string; at: string }[];
}

// ── volunteering & delegations (§4.7) ────────────────────────────────────
export interface VolunteerProfile {
  id: string;
  personId: string;
  interests: string[];
  availability: string[];
  consentToContact: boolean;
}

export interface TeacherDelegation {
  id: string;
  classId: string;
  fromTeacherId: string;
  toTeacherId: string;
  reason: string;
  from: string;
  until: string;
  status: "active" | "expired" | "revoked";
}

// ── Imam (§4.9) ──────────────────────────────────────────────────────────
export type ImamQuestionStatus =
  | "received"
  | "triaged"
  | "assigned"
  | "answered"
  | "contact_requested"
  | "closed";

export interface ImamQuestion {
  id: string;
  authorId: string;
  /**
   * Name typed by the author when `authorId` is not a known person (public form, until
   * sign-in is required). Private: only the author, authorised admins and the imam see it.
   */
  authorName?: string;
  question: string;
  followUp: "portail" | "courriel" | "telephone";
  /** E-mail or phone for the follow-up channel the author chose. Private, never published. */
  contact?: string;
  status: ImamQuestionStatus;
  answer?: string;
  at: string;
}

// ── finance (§4.10) ──────────────────────────────────────────────────────
export type TxMethod =
  | "especes"
  | "virement"
  | "mensualite"
  | "abonnement"
  | "don"
  | "cheque"
  | "autre";
export type TxStatus = "brouillon" | "soumis" | "approuve" | "annule" | "corrige";

export interface FinancialTransaction {
  id: string;
  kind: "entree" | "sortie";
  date: string;
  label: string;
  /** Entries: payment method; exits: category. */
  method: TxMethod | "loyer" | "service" | "fournisseur" | "achat" | "remboursement";
  amountCents: number;
  status: TxStatus;
  reference?: string;
  /** A correction links to the entry it rectifies (never a silent edit). */
  correctsId?: string;
}

/** Denomination in cents (5 = 5¢, 10000 = 100 $). Configurable, never hard-coded. */
export interface DenominationCount {
  cents: number;
  quantity: number;
}

export interface CashCountSession {
  id: string;
  date: string;
  place: string;
  source: string;
  status: "ouverte" | "attestation" | "cloturee";
  denominations: DenominationCount[];
  envelopes: { id: string; reference: string; count: number; amountCents: number }[];
  checks: { id: string; drawer: string; reference: string; amountCents: number }[];
  expectedCents: number;
  varianceNote: string;
  participants: { personId: string; role: string; attestedAt?: string }[];
}

export interface ExternalCollection {
  id: string;
  date: string;
  place: string;
  address: string;
  collectorIds: string[];
  interacCents: number;
  cashCents: number;
  shareForHostCents: number;
  status: "brouillon" | "soumis" | "rapproche";
  attestations: { personId: string; at: string }[];
}
