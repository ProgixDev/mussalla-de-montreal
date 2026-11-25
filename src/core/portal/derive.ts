/**
 * Pure business rules of the portal, straight from the client's spec. Synchronous and
 * side-effect free so they run in Server Components, the demo store, and unit tests —
 * and so the server can enforce exactly the same rules once the backend lands.
 */
import type {
  Activity,
  Assessment,
  CashCountSession,
  Child,
  Congratulation,
  ConsentType,
  EmergencyAlert,
  ExternalCollection,
  FinancialTransaction,
  Gender,
  GovernanceMeeting,
  MembershipStatus,
  PointCategory,
  PointEntry,
  Rubric,
} from "./types";

// ── dates ────────────────────────────────────────────────────────────────
/** Whole years between a birth date and `on` (both ISO). */
export function ageOn(birthDate: string, on: string): number {
  const b = new Date(birthDate);
  const d = new Date(on);
  let age = d.getUTCFullYear() - b.getUTCFullYear();
  const beforeBirthday =
    d.getUTCMonth() < b.getUTCMonth() ||
    (d.getUTCMonth() === b.getUTCMonth() && d.getUTCDate() < b.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

// ── activities & eligibility (§4.1) ──────────────────────────────────────
export interface Applicant {
  gender: Gender;
  age: number;
  membership: MembershipStatus;
}

export interface Eligibility {
  ok: boolean;
  /** Plain-French reasons, shown as-is to the applicant. */
  reasons: string[];
}

/**
 * Server-side admissibility rule (§4.1 « Admissibilité »): declared gender, age range,
 * active membership. A man can never enrol in a women's activity and vice versa.
 */
export function checkEligibility(activity: Activity, who: Applicant): Eligibility {
  const reasons: string[] = [];
  if (activity.audience === "femmes" && who.gender !== "femme") {
    reasons.push("Cette activité est réservée aux femmes.");
  }
  if (activity.audience === "hommes" && who.gender !== "homme") {
    reasons.push("Cette activité est réservée aux hommes.");
  }
  if (activity.ageMin !== null && who.age < activity.ageMin) {
    reasons.push(`Âge minimum : ${activity.ageMin} ans.`);
  }
  if (activity.ageMax !== null && who.age > activity.ageMax) {
    reasons.push(`Âge maximum : ${activity.ageMax} ans.`);
  }
  if (activity.membershipRequired && who.membership !== "active") {
    reasons.push("Une adhésion active est requise.");
  }
  return { ok: reasons.length === 0, reasons };
}

export function seatsLeft(activity: Activity): number {
  return Math.max(0, activity.capacity - activity.enrolled);
}

/** Full activities take a waiting list instead of refusing (§4.1 « Inscription »). */
export const isWaitlisted = (activity: Activity): boolean => seatsLeft(activity) === 0;

// ── points & rubrics (§4.3) ──────────────────────────────────────────────
export interface PointEntryDraft {
  points: number;
  reason: string;
  category: PointCategory | "";
}

/** A point entry needs a category, a non-zero value and a written reason (§4.3). */
export function validatePointEntry(draft: PointEntryDraft): string[] {
  const errors: string[] = [];
  if (!draft.category) errors.push("Choisissez une catégorie.");
  if (!Number.isFinite(draft.points) || draft.points === 0) {
    errors.push("La valeur doit être différente de zéro.");
  }
  if (draft.reason.trim().length < 3) {
    errors.push("Écrivez une courte justification (elle est visible par le parent).");
  }
  return errors;
}

export function pointsByCategory(
  entries: PointEntry[],
  childId: string,
): Record<PointCategory, number> {
  const out: Record<PointCategory, number> = {
    memorisation: 0,
    lecture: 0,
    attitude: 0,
    comportement: 0,
    ponctualite: 0,
  };
  for (const e of entries) if (e.childId === childId) out[e.category] += e.points;
  return out;
}

export const totalPoints = (entries: PointEntry[], childId: string): number =>
  entries.reduce((sum, e) => (e.childId === childId ? sum + e.points : sum), 0);

export const rubricWeightTotal = (rubric: Pick<Rubric, "categories">): number =>
  rubric.categories.reduce((sum, c) => sum + c.weight, 0);

/** A weighted rubric can only be activated when its weights total exactly 100 % (§6.2). */
export const isRubricValid = (rubric: Pick<Rubric, "categories">): boolean =>
  rubric.categories.length > 0 &&
  rubric.categories.every((c) => c.weight >= 0) &&
  rubricWeightTotal(rubric) === 100;

/**
 * Weighted academic result (0–100) from assessments, using the rubric's weights.
 * Categories with no assessment yet are left out and the remaining weights are
 * re-normalised, so a child is never penalised for an exam that hasn't happened.
 * Behaviour POINTS are deliberately not mixed into this (§4.3 rule 3).
 */
export function weightedScore(
  rubric: Rubric,
  assessments: Assessment[],
  childId: string,
): number | null {
  let weighted = 0;
  let weights = 0;
  for (const cat of rubric.categories) {
    const own = assessments.filter(
      (a) => a.childId === childId && a.category === cat.key && a.max > 0,
    );
    if (own.length === 0) continue;
    const avg = own.reduce((s, a) => s + a.score / a.max, 0) / own.length;
    weighted += avg * cat.weight;
    weights += cat.weight;
  }
  return weights === 0 ? null : Math.round((weighted / weights) * 100);
}

// ── consents (§4.2) ──────────────────────────────────────────────────────
/**
 * The parent's CURRENT decision for one consent. Consents are append-only (newest first),
 * so the latest line wins; no line at all means "not granted".
 */
export function hasConsent(child: Pick<Child, "consents">, type: ConsentType): boolean {
  let latest: Child["consents"][number] | undefined;
  for (const c of child.consents) {
    if (c.type === type && (!latest || c.at > latest.at)) latest = c;
  }
  return latest?.granted ?? false;
}

// ── alerts & screens (§4.4, §4.5) ────────────────────────────────────────
/**
 * May this congratulation be on a SCREEN right now? Approved, inside its window, and —
 * for a child — the parent's LATEST screen-display decision still allows it. Withdrawing
 * consent takes the child off the TV immediately, not at the end of the window (§4.2).
 */
export function canDisplayOnScreen(
  c: Congratulation,
  now: string,
  children: Pick<Child, "id" | "consents">[],
): boolean {
  if (!isOnScreen(c, now)) return false;
  if (!c.childId) return true;
  const child = children.find((k) => k.id === c.childId);
  return child ? hasConsent(child, "screen_display") : false;
}

/** An expired alert is never shown nor sent again (§4.4 « Expiration »). */
export const isAlertActive = (alert: EmergencyAlert, now: string): boolean =>
  alert.publishedAt <= now && now < alert.expiresAt;

/** Screens only play approved content inside its display window (§4.5). */
export const isOnScreen = (c: Congratulation, now: string): boolean =>
  c.status === "approved" && c.displayFrom <= now && now <= c.displayUntil;

// ── finance (§4.10) ──────────────────────────────────────────────────────
export function countTotals(s: CashCountSession) {
  const coinsAndBills = s.denominations.reduce((sum, d) => sum + d.cents * d.quantity, 0);
  const envelopes = s.envelopes.reduce((sum, e) => sum + e.amountCents, 0);
  const checks = s.checks.reduce((sum, c) => sum + c.amountCents, 0);
  const counted = coinsAndBills + envelopes + checks;
  const variance = counted - s.expectedCents;
  return {
    coinsAndBills,
    envelopes,
    checks,
    counted,
    variance,
    /** A non-zero variance requires a written explanation before closing (§4.10). */
    needsExplanation: variance !== 0 && s.varianceNote.trim().length === 0,
  };
}

/** The PV can close only when every present participant has attested. */
export const allAttested = (s: CashCountSession): boolean =>
  s.participants.length > 0 && s.participants.every((p) => Boolean(p.attestedAt));

/** External collection PV needs at least two authenticated attestations (§4.10). */
export const collectionReady = (c: ExternalCollection): boolean => c.attestations.length >= 2;

export const collectionTotal = (c: ExternalCollection): number => c.interacCents + c.cashCents;

export function summarise(txs: FinancialTransaction[]) {
  const live = txs.filter((t) => t.status !== "annule" && t.status !== "brouillon");
  const sum = (kind: "entree" | "sortie") =>
    live.filter((t) => t.kind === kind).reduce((s, t) => s + t.amountCents, 0);
  const byMethod = new Map<string, number>();
  for (const t of live.filter((t) => t.kind === "entree")) {
    byMethod.set(t.method, (byMethod.get(t.method) ?? 0) + t.amountCents);
  }
  return {
    inCents: sum("entree"),
    outCents: sum("sortie"),
    netCents: sum("entree") - sum("sortie"),
    byMethod: [...byMethod.entries()].sort((a, b) => b[1] - a[1]),
    pending: txs.filter((t) => t.status === "soumis").length,
  };
}

// ── governance (§4.6) ────────────────────────────────────────────────────
/**
 * Absence warning rule. It only ever PROPOSES an action to the people entitled to
 * decide — never an automatic exclusion (§4.6, §6.4).
 */
export function absenceWarning(
  meetings: GovernanceMeeting[],
  personId: string,
  threshold: number,
  window: number,
): { absences: number; window: number; flagged: boolean } {
  const held = meetings
    .filter((m) => m.status === "held")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, window);
  const absences = held.filter((m) =>
    m.attendance.some((a) => a.personId === personId && a.status === "absent"),
  ).length;
  return { absences, window: held.length, flagged: absences >= threshold };
}
