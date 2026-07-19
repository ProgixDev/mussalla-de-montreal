/**
 * Domain model for « la caisse ». Lives in `core` because every feature reads it
 * and features may not import each other (module-boundaries.md). Money is ALWAYS
 * integer cents — only src/lib/format.ts turns cents into text.
 *
 * During the UI-first phase these types back a static seed (./seed.ts). When the
 * backend lands, the same shapes are produced from Supabase rows; `date` becomes a
 * real timestamp formatted via src/lib/format.ts instead of the display label used
 * now for render-fidelity with the prototype.
 */

export type ContributionType = "mensuel" | "ponctuel";
export type ContributionSource = "Square" | "Espèces";
export type ExpenseCategory =
  | "Loyer"
  | "Services"
  | "Entretien"
  | "Fournitures"
  | "Administration"
  | "Autre";
export type MemberRole = "Administrateur" | "Gestionnaire";

/** The four rotating TV pages, in order. */
export type TvPageKey = "objectifs" | "contributions" | "caisse" | "accueil";
export type DisplayMode = "rotation" | "pinned";

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  /** Human description of what this manager may do. */
  scope: string;
  initials: string;
  active: boolean;
}

export interface Contribution {
  id: string;
  /** Public-facing name, or "Anonyme". Never expose realName on public surfaces. */
  name: string;
  /** Real name behind an anonymous gift — backoffice only. */
  realName?: string;
  anon: boolean;
  amountCents: number;
  type: ContributionType;
  /** Display label ("Aujourd’hui", "16 juil."). Real schema: timestamp. */
  date: string;
  source: ContributionSource;
}

export interface Expense {
  id: string;
  item: string;
  amountCents: number;
  date: string;
  cat: ExpenseCategory;
}

export interface Goal {
  id: string;
  title: string;
  targetCents: number;
  raisedCents: number;
  /** Display label ("30 nov. 2026"). Real schema: date. */
  due: string;
}

export interface DisplaySettings {
  mode: DisplayMode;
  /** Index into the TV page order when mode === "pinned". */
  pinnedPage: number;
  /** Seconds per page when rotating (design range 8–40). */
  rotationSpeed: number;
}

/** Everything on every screen is derived from these five collections + opening. */
export interface CaisseData {
  members: Member[];
  contributions: Contribution[];
  expenses: Expense[];
  goals: Goal[];
  display: DisplaySettings;
  /** Opening balance before this period’s flows, in cents. */
  openingCents: number;
}
