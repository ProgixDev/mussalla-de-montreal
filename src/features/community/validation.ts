/**
 * Field rules shared by the public forms. Messages are specific and in plain French: they
 * say what is wrong AND how to fix it. Format rules run on blur; "required" rules run on
 * submit (and again on change once a field is in error, so the message clears as soon as
 * it is fixed).
 */

/** Pragmatic e-mail shape: something@domain.tld — the server re-validates by sending mail. */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;

export function emailFormatError(value: string): string | undefined {
  const v = value.trim();
  if (!v) return undefined;
  return EMAIL_RE.test(v)
    ? undefined
    : "Ce courriel semble incomplet — exemple : prenom@exemple.ca";
}

export function emailError(
  value: string,
  emptyMessage = "Indiquez votre courriel.",
): string | undefined {
  return value.trim() ? emailFormatError(value) : emptyMessage;
}

/** North-American number: 10 digits, optionally prefixed by 1 (+1). */
export function phoneFormatError(value: string): string | undefined {
  const v = value.trim();
  if (!v) return undefined;
  const digits = v.replace(/\D/g, "");
  const ok = digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
  return ok ? undefined : "Le numéro doit compter 10 chiffres, par exemple 514 555-0142.";
}

export function phoneError(
  value: string,
  emptyMessage = "Indiquez votre numéro de téléphone.",
): string | undefined {
  return value.trim() ? phoneFormatError(value) : emptyMessage;
}

export const requiredError = (value: string, message: string): string | undefined =>
  value.trim() ? undefined : message;

export type Errors = Partial<Record<string, string>>;

/** First control to focus among ordered [errorKey, focusId] pairs. */
export function firstInvalid(
  order: [key: string, focusId: string][],
  errors: Errors,
): string | null {
  for (const [key, focusId] of order) if (errors[key]) return focusId;
  return null;
}

/** Focus a control by id and bring it into view (after the errors have rendered). */
export function focusById(id: string | null) {
  if (!id) return;
  const el = document.getElementById(id);
  if (el instanceof HTMLElement) {
    // Centre it ourselves: a plain focus() scroll can tuck the field under the sticky header.
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "center" });
  }
}
