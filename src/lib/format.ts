/**
 * Shared Intl formatters, Québec French (fr-CA). Every user-visible amount, date,
 * and time goes through these — never hand-rolled string math. Money is stored as
 * integer cents everywhere; only these helpers turn it into text.
 *
 * Locale rules (design handoff → Formatting):
 *   money → "2 395 $"   (sign after, thin-space thousands, no decimals)
 *   time  → "13 h 20"
 *   date  → "Dimanche 19 juillet 2026" (first letter capitalized)
 */

const cadFormatter = new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

const cadFormatterCents = new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("fr-CA");

const timeFormatter = new Intl.DateTimeFormat("fr-CA", {
  hour: "2-digit",
  minute: "2-digit",
});

const dateLongFormatter = new Intl.DateTimeFormat("fr-CA", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateShortFormatter = new Intl.DateTimeFormat("fr-CA", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const capitalize = (s: string) => (s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Cents → "2 395 $" (whole dollars, the public/display default). */
export function formatCAD(cents: number): string {
  return cadFormatter.format(cents / 100);
}

/** Cents → "2 395,00 $" (with decimals, for receipts / precise summaries). */
export function formatCADCents(cents: number): string {
  return cadFormatterCents.format(cents / 100);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** "13 h 20" */
export function formatTime(date: Date | number): string {
  return timeFormatter.format(date);
}

/** "Dimanche 19 juillet 2026" */
export function formatDateLong(date: Date | number): string {
  return capitalize(dateLongFormatter.format(date));
}

/** "30 nov. 2026" — deadlines, table rows. */
export function formatDate(date: Date | number): string {
  return dateShortFormatter.format(date);
}
