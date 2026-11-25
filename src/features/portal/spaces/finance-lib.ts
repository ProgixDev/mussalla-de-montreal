/**
 * Pure helpers of the accountant's space (spec §4.10) — labels, amount parsing, period
 * maths and the CSV export. No React, no store: unit-tested in finance-lib.test.ts.
 *
 * Money stays integer cents end to end; a typed amount is parsed with integer maths only
 * (never `parseFloat` × 100, which turns 0,29 $ into 28 cents).
 */
import type { CashCountSession, FinancialTransaction, TxStatus } from "@/core/portal/types";
import { formatCADCents, formatDay, parseDay } from "@/lib/format";

// ── categories & labels ──────────────────────────────────────────────────
export type TxCategory = FinancialTransaction["method"];
export type TxKind = FinancialTransaction["kind"];

/** Payment methods of an entry (§4.10 « Entrées »). */
export const ENTRY_METHODS = [
  "especes",
  "virement",
  "mensualite",
  "abonnement",
  "don",
  "cheque",
  "autre",
] as const satisfies readonly TxCategory[];
/** Categories of an exit. « activité » (spec) is not in the data model yet. */
export const EXIT_CATEGORIES = [
  "fournisseur",
  "loyer",
  "service",
  "achat",
  "remboursement",
  "autre",
] as const satisfies readonly TxCategory[];

/** Singular — one line of the journal. */
export const METHOD_LABEL: Record<TxCategory, string> = {
  especes: "Espèces",
  virement: "Virement",
  mensualite: "Mensualité",
  abonnement: "Abonnement",
  don: "Don",
  cheque: "Chèque",
  autre: "Autre",
  loyer: "Loyer",
  service: "Service",
  fournisseur: "Fournisseur",
  achat: "Achat",
  remboursement: "Remboursement",
};

/** Plural — aggregates (« Entrées par méthode », « Sorties par catégorie »). */
export const METHOD_LABEL_PLURAL: Record<TxCategory, string> = {
  especes: "Espèces",
  virement: "Virement",
  mensualite: "Mensualités",
  abonnement: "Abonnements",
  don: "Dons",
  cheque: "Chèques",
  autre: "Autre",
  loyer: "Loyer",
  service: "Services",
  fournisseur: "Fournisseurs",
  achat: "Achats",
  remboursement: "Remboursements",
};

export const isTxCategory = (m: string): m is TxCategory =>
  Object.prototype.hasOwnProperty.call(METHOD_LABEL, m);
export const categoryLabel = (m: string, plural = false): string =>
  isTxCategory(m) ? (plural ? METHOD_LABEL_PLURAL[m] : METHOD_LABEL[m]) : m;

export const KIND_LABEL: Record<TxKind, string> = { entree: "Entrée", sortie: "Sortie" };

export type Tone = "gold" | "emerald" | "neutral" | "danger" | "warn";

export const STATUS_META: Record<TxStatus, { label: string; tone: Tone }> = {
  brouillon: { label: "Brouillon", tone: "neutral" },
  soumis: { label: "Soumis", tone: "warn" },
  approuve: { label: "Approuvé", tone: "emerald" },
  annule: { label: "Annulé", tone: "danger" },
  corrige: { label: "Corrigé", tone: "gold" },
};

export const COUNT_STATUS_META: Record<CashCountSession["status"], { label: string; tone: Tone }> =
  {
    ouverte: { label: "Saisie en cours", tone: "gold" },
    attestation: { label: "En attestation", tone: "warn" },
    cloturee: { label: "Clôturé", tone: "emerald" },
  };

/** "5 ¢", "1 $", "100 $" — derived from the configured cents, never a hard-coded list. */
export function denominationLabel(cents: number): string {
  if (cents < 100) return `${cents} ¢`;
  if (cents % 100 === 0) return `${cents / 100} $`;
  return formatCADCents(cents);
}

// ── money ────────────────────────────────────────────────────────────────
const MINUS = "−";

/** "+1 842,50 $", "−4,50 $", "0,00 $" — the sign is always written, never colour-only. */
export function formatSigned(cents: number): string {
  if (cents === 0) return formatCADCents(0);
  return `${cents > 0 ? "+" : MINUS}${formatCADCents(Math.abs(cents))}`;
}

/** Signed effect of a transaction on the balance: entries add, exits subtract. */
export const signedCents = (t: Pick<FinancialTransaction, "kind" | "amountCents">): number =>
  t.kind === "entree" ? t.amountCents : -t.amountCents;

export type AmountParse =
  | { ok: true; cents: number }
  | { ok: false; reason: "empty" | "negative" | "format" | "decimals" | "too_large" };

/** "12,50", "12.50", "1 234,5", "12 $" → integer cents. Integer maths only. */
export function parseAmount(raw: string): AmountParse {
  const s = raw
    .replace(/[\s  ]/g, "")
    .replace(/^\$|\$$/g, "")
    .replace(",", ".");
  if (s === "") return { ok: false, reason: "empty" };
  if (s.startsWith("-") || s.startsWith(MINUS)) return { ok: false, reason: "negative" };
  const m = /^(\d+)(?:\.(\d*))?$/.exec(s);
  if (!m) return { ok: false, reason: "format" };
  const whole = m[1] ?? "0";
  const frac = m[2] ?? "";
  if (frac.length > 2) return { ok: false, reason: "decimals" };
  if (whole.replace(/^0+/, "").length > 8) return { ok: false, reason: "too_large" };
  return { ok: true, cents: Number(whole) * 100 + Number(frac.padEnd(2, "0")) };
}

/** A specific, human message for a typed amount — or undefined when it is valid. */
export function amountError(raw: string, opts: { allowZero?: boolean } = {}): string | undefined {
  const r = parseAmount(raw);
  if (!r.ok) {
    switch (r.reason) {
      case "empty":
        return "Indiquez le montant.";
      case "negative":
        return "Écrivez le montant sans signe moins : le type (entrée ou sortie) donne le sens.";
      case "decimals":
        return "Deux décimales au maximum (les cents), par exemple 12,50.";
      case "too_large":
        return "Ce montant semble trop élevé : vérifiez la saisie.";
      default:
        return "Montant non reconnu : écrivez par exemple 12,50 ou 12.50.";
    }
  }
  if (r.cents === 0 && !opts.allowZero) return "Le montant doit être supérieur à 0 $.";
  return undefined;
}

/** Cents → "1842,50" — the form's own notation, to prefill an input. */
export function centsToInput(cents: number): string {
  const a = Math.abs(cents);
  return `${cents < 0 ? "-" : ""}${Math.floor(a / 100)},${String(a % 100).padStart(2, "0")}`;
}

// ── days & periods ───────────────────────────────────────────────────────
/** Local Date → "2026-11-25" (never via toISOString, which is UTC). */
export function toIsoDay(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export const todayIso = (): string => toIsoDay(new Date());

export function addDays(iso: string, n: number): string {
  const d = parseDay(iso);
  d.setDate(d.getDate() + n);
  return toIsoDay(d);
}

/** A real calendar day in YYYY-MM-DD form (rejects 2026-02-31). */
export function isIsoDay(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return toIsoDay(parseDay(s)) === s;
}

export type PeriodKind = "semaine" | "mois" | "annee" | "personnalisee";
export interface DayRange {
  from: string;
  to: string;
}

/** The week (Monday → Sunday), month or year that contains `anchor`. */
export function periodRange(kind: Exclude<PeriodKind, "personnalisee">, anchor: string): DayRange {
  const d = parseDay(anchor);
  if (kind === "semaine") {
    const fromMonday = (d.getDay() + 6) % 7;
    const from = addDays(anchor, -fromMonday);
    return { from, to: addDays(from, 6) };
  }
  if (kind === "mois") {
    return {
      from: toIsoDay(new Date(d.getFullYear(), d.getMonth(), 1)),
      to: toIsoDay(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
    };
  }
  return { from: `${d.getFullYear()}-01-01`, to: `${d.getFullYear()}-12-31` };
}

export const inRange = (iso: string, r: DayRange): boolean => {
  const day = iso.slice(0, 10);
  return day >= r.from && day <= r.to;
};

/**
 * Reference day of the dashboard and the reports: the latest dated operation. The demo
 * data is November 2026 — anchoring on it keeps « le mois » meaningful whenever the demo
 * is opened (with the backend this becomes today).
 */
export function anchorDay(txs: Pick<FinancialTransaction, "date">[], fallback: string): string {
  return txs.reduce((max, t) => (t.date > max ? t.date.slice(0, 10) : max), "") || fallback;
}

const monthFormatter = new Intl.DateTimeFormat("fr-CA", { month: "long", year: "numeric" });

/** "2026-11-08" → "Novembre 2026" */
export function formatMonth(iso: string): string {
  const s = monthFormatter.format(parseDay(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "Du 1 nov. 2026 au 30 nov. 2026" (or a single day). */
export function formatRange(r: DayRange): string {
  return r.from === r.to
    ? `Le ${formatDay(r.from)}`
    : `Du ${formatDay(r.from)} au ${formatDay(r.to)}`;
}

// ── aggregates ───────────────────────────────────────────────────────────
/** Same rule as `summarise`: drafts and cancelled operations never count. */
export const isCounted = (t: Pick<FinancialTransaction, "status">): boolean =>
  t.status !== "annule" && t.status !== "brouillon";

/** Totals per method (entries) or category (exits), largest first. */
export function totalsByCategory(txs: FinancialTransaction[], kind: TxKind): [string, number][] {
  const m = new Map<string, number>();
  for (const t of txs)
    if (t.kind === kind && isCounted(t)) m.set(t.method, (m.get(t.method) ?? 0) + t.amountCents);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

/** Amount of `kind` still waiting for an approval (status « soumis »). */
export const pendingCents = (txs: FinancialTransaction[], kind: TxKind): number =>
  txs
    .filter((t) => t.kind === kind && t.status === "soumis")
    .reduce((s, t) => s + t.amountCents, 0);

// ── rectifications (§4.10: a finalized operation is never edited) ─────────
export const rectificationsOf = (txs: FinancialTransaction[], id: string): FinancialTransaction[] =>
  txs.filter((t) => t.correctsId === id);

/** Original amount plus every APPROVED adjustment linked to it. */
export const currentAmount = (
  original: FinancialTransaction,
  txs: FinancialTransaction[],
): number =>
  rectificationsOf(txs, original.id)
    .filter((r) => r.status === "approuve")
    .reduce((s, r) => s + r.amountCents, original.amountCents);

// ── CSV export ───────────────────────────────────────────────────────────
export const CSV_COLUMNS = [
  "date",
  "type",
  "libellé",
  "méthode",
  "montant",
  "statut",
  "référence",
] as const;

/** Quote when needed, and neutralise spreadsheet formulas in free-text cells. */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[";\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Signed amount with a decimal comma and no thousands separator (Excel-fr reads it as a number). */
export const csvAmount = (cents: number): string => centsToInput(cents);

/**
 * `;`-separated, CRLF, UTF-8 BOM — what Excel in French opens correctly with a
 * double-click. Exits are exported as negative amounts so a column sum is the balance.
 */
export function buildCsv(txs: FinancialTransaction[]): string {
  const rows = [...txs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) =>
      [
        t.date.slice(0, 10),
        KIND_LABEL[t.kind],
        csvCell(t.label),
        csvCell(categoryLabel(t.method)),
        csvAmount(signedCents(t)),
        STATUS_META[t.status].label,
        csvCell(t.reference ?? ""),
      ].join(";"),
    );
  return `﻿${[CSV_COLUMNS.join(";"), ...rows].join("\r\n")}\r\n`;
}
