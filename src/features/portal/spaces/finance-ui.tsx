"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { CheckIcon, LockIcon, XIcon } from "@/components/ui/icons";
import { Pill } from "@/components/portal/kit";
import type { FinancialTransaction, TxStatus } from "@/core/portal/types";
import { STATUS_META, formatSigned, signedCents } from "./finance-lib";

/** Small building blocks shared by the tabs of the accountant's space. */

// ── print ────────────────────────────────────────────────────────────────
const noopSubscribe = () => () => {};

/**
 * Renders a paper document straight under <body>, invisible on screen and the ONLY thing
 * printed while mounted: every other child of <body> (the portal shell, dialogs, dev
 * overlays) is hidden by the print stylesheet below. Mount it only while the document is
 * on screen, so « Imprimer » prints exactly what the person is looking at.
 */
export function PrintPortal({ children }: { children: React.ReactNode }) {
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  if (!isClient) return null;
  return createPortal(
    <div data-print-root="" className="hidden bg-white text-black print:block">
      <style>{PRINT_CSS}</style>
      {children}
    </div>,
    document.body,
  );
}

const PRINT_CSS = `@media print {
  body > :not([data-print-root]) { display: none !important; }
  html, body { background: #fff !important; color: #000 !important; }
  @page { margin: 14mm 12mm; }
}`;

// ── feedback ─────────────────────────────────────────────────────────────
/**
 * A polite live region that is ALWAYS mounted (so screen readers announce its changes)
 * and shows the last confirmation inline, next to where the action happened.
 */
export function Notice({
  message,
  onDismiss,
  tone = "success",
  className,
}: {
  message: string | null;
  onDismiss?: () => void;
  tone?: "success" | "info";
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={className}>
      {message && (
        <p
          className={cn(
            "flex items-start gap-2.5 rounded-[12px] border px-3.5 py-2.5 text-[14px] leading-relaxed",
            tone === "success"
              ? "border-[#1c7d5b]/50 bg-[#1c7d5b]/15 text-[#c9f0dc]"
              : "border-gold/25 bg-gold/[0.07] text-on-dark",
          )}
        >
          {tone === "success" ? (
            <CheckIcon width={18} height={18} className="mt-0.5 shrink-0" />
          ) : (
            <span
              aria-hidden="true"
              className="bg-gold-light mt-[0.55em] size-1.5 shrink-0 rounded-full"
            />
          )}
          <span className="min-w-0 flex-1">{message}</span>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Masquer ce message"
              className="focus-visible:outline-gold-light -my-1 -mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-current opacity-75 transition hover:bg-white/10 hover:opacity-100 focus-visible:outline-2"
            >
              <XIcon width={15} height={15} />
            </button>
          )}
        </p>
      )}
    </div>
  );
}

// ── forms ────────────────────────────────────────────────────────────────
type Errors<V> = Partial<Record<keyof V, string>>;

/**
 * Minimal form state with the validation timing the portal uses everywhere:
 * an error appears when the person leaves a field they have typed in (blur), and for
 * every field on submit. Typed values are always kept on error; the first invalid field
 * receives focus on a failed submit.
 */
export function useValidatedForm<V extends Record<string, string>>(
  initial: V,
  validate: (values: V) => Errors<V>,
  idPrefix: string,
) {
  const [values, setValues] = useState<V>(initial);
  const [dirty, setDirty] = useState<Partial<Record<keyof V, boolean>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof V, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(values);
  const errorOf = (k: keyof V): string | undefined =>
    submitted || touched[k] ? errors[k] : undefined;

  const set = useCallback((k: keyof V, v: string) => {
    setValues((prev) => ({ ...prev, [k]: v }));
    setDirty((prev) => (prev[k] ? prev : { ...prev, [k]: true }));
  }, []);

  /** Change a value without marking it as typed (e.g. a dependent field reset). */
  const replace = useCallback(
    (patch: Partial<V>) => setValues((prev) => ({ ...prev, ...patch })),
    [],
  );

  const blur = (k: keyof V) => {
    if (dirty[k]) setTouched((prev) => ({ ...prev, [k]: true }));
  };

  /** True when valid; otherwise reveals every error and focuses the first one. */
  const trySubmit = (): boolean => {
    setSubmitted(true);
    const first = (Object.keys(errors) as (keyof V)[]).find((k) => errors[k]);
    if (first === undefined) return true;
    document.getElementById(`${idPrefix}-${String(first)}`)?.focus();
    return false;
  };

  const reset = (patch?: Partial<V>) => {
    setValues({ ...initial, ...patch });
    setDirty({});
    setTouched({});
    setSubmitted(false);
  };

  return {
    values,
    set,
    replace,
    blur,
    errorOf,
    trySubmit,
    reset,
    id: (k: keyof V) => `${idPrefix}-${String(k)}`,
  };
}

// ── presentational ───────────────────────────────────────────────────────
export function StatusPill({ status }: { status: TxStatus }) {
  const meta = STATUS_META[status];
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

/** Signed amount of an operation: entries « + » in gold, exits « − » in plain light text. */
export function TxAmount({
  tx,
  className,
}: {
  tx: Pick<FinancialTransaction, "kind" | "amountCents" | "status">;
  className?: string;
}) {
  const signed = signedCents(tx);
  return (
    <span
      className={cn(
        "nums whitespace-nowrap",
        signed > 0 ? "text-gold-light" : "text-on-dark",
        tx.status === "annule" && "text-on-dark-faint decoration-on-dark-faint/60 line-through",
        className,
      )}
    >
      {formatSigned(signed)}
    </span>
  );
}

/** Label ……… value — the account-book row used in totals blocks. */
export function LedgerRow({
  label,
  value,
  strong,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-2 py-1.5", className)}>
      {/* The dotted leader lives inside <dt>: a <dl> group may only hold dt/dd. */}
      <dt
        className={cn(
          "flex min-w-0 flex-1 items-baseline gap-2 text-[14px]",
          strong ? "text-on-dark font-semibold" : "text-on-dark-muted",
        )}
      >
        <span>{label}</span>
        <span aria-hidden="true" className="leader flex-1" />
      </dt>
      <dd
        className={cn(
          "nums text-right whitespace-nowrap",
          strong ? "font-display text-on-dark text-[19px]" : "text-on-dark text-[14.5px]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/** Proportional horizontal bars (largest first). Text carries the data; bars are decoration. */
export function BarList({
  label,
  rows,
  format,
}: {
  label: string;
  rows: { key: string; label: string; cents: number }[];
  format: (cents: number) => string;
}) {
  const max = rows.reduce((m, r) => Math.max(m, r.cents), 0);
  const total = rows.reduce((s, r) => s + Math.max(0, r.cents), 0);
  return (
    <ul aria-label={label} className="flex flex-col gap-3.5">
      {rows.map((r) => {
        const share = total > 0 ? Math.round((Math.max(0, r.cents) / total) * 100) : 0;
        const width = max > 0 ? Math.max(2, (Math.max(0, r.cents) / max) * 100) : 0;
        return (
          <li key={r.key}>
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="text-on-dark">{r.label}</span>
              <span className="nums text-on-dark">
                {format(r.cents)}{" "}
                <span className="text-on-dark-faint text-[12.5px]">· {share} %</span>
              </span>
            </div>
            <div
              aria-hidden="true"
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]"
            >
              <div
                className="from-gold/70 to-gold-light h-full rounded-full bg-linear-to-r"
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** A quiet « Privé » marker for data that is never published (§4.10). */
export function PrivateMarker({
  children = "Privé — jamais affiché publiquement",
}: {
  children?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c2553a]/45 bg-[#c2553a]/12 px-2.5 py-1 text-[12px] font-medium text-[#ffcbbd]">
      <LockIcon width={13} height={13} strokeWidth={1.8} />
      {children}
    </span>
  );
}
