import { cn } from "@/lib/utils";
import type { Contribution, Expense } from "@/core/data/types";
import { formatCAD } from "@/lib/format";

type Tone = "light" | "dark";

/** Uppercase micro-label heading used above every board list. */
export function SectionLabel({
  children,
  className,
  tone = "light",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <p className={cn("eyebrow", tone === "dark" ? "text-gold" : "text-muted-ink", className)}>
      {children}
    </p>
  );
}

const rowLine = (tone: Tone) =>
  cn(
    "flex items-center justify-between gap-3 border-b py-3 last:border-0",
    tone === "dark" ? "border-white/[0.07]" : "border-row-divider",
  );

/**
 * A recent-contribution row. `publicView` guarantees the real name behind an
 * anonymous gift is NEVER rendered — public surfaces pass true (the default).
 */
export function ContributionRow({
  contribution,
  publicView = true,
  size = "phone",
  tone = "light",
}: {
  contribution: Contribution;
  publicView?: boolean;
  size?: "phone" | "tv";
  tone?: Tone;
}) {
  const tv = size === "tv";
  const dark = tone === "dark";
  const displayName =
    publicView || !contribution.realName ? contribution.name : contribution.realName;
  return (
    <div className={rowLine(tone)}>
      <div className="min-w-0">
        <p
          className={cn(
            "truncate",
            dark ? "text-on-dark" : "text-ink",
            tv ? "text-[19px]" : "text-[15px] font-medium",
          )}
        >
          {displayName}
          {!publicView && contribution.anon && (
            <span className="bg-tint text-emerald ml-2 rounded-full px-2 py-0.5 align-middle text-[10px] font-semibold tracking-wide uppercase">
              Anonyme
            </span>
          )}
        </p>
        <p
          className={cn(
            dark ? "text-on-dark-faint" : "text-faint",
            tv ? "text-[13px]" : "text-[12px]",
          )}
        >
          {contribution.type === "mensuel" ? "Mensuel" : "Ponctuel"} · {contribution.date}
        </p>
      </div>
      {/* On light grounds gold-ink, not gold-deep: as TEXT on white, gold-deep is 2.4:1. */}
      <span
        className={cn(
          "nums shrink-0 font-semibold",
          dark ? "text-gold-light" : "text-gold-ink",
          tv ? "text-2xl" : "text-[15px]",
        )}
      >
        {formatCAD(contribution.amountCents)}
      </span>
    </div>
  );
}

/** A recent-expense row. */
export function ExpenseRow({
  expense,
  size = "phone",
  tone = "light",
}: {
  expense: Expense;
  size?: "phone" | "tv";
  tone?: Tone;
}) {
  const tv = size === "tv";
  const dark = tone === "dark";
  return (
    <div className={rowLine(tone)}>
      <div className="min-w-0">
        <p
          className={cn(
            "truncate",
            dark ? "text-on-dark" : "text-ink",
            tv ? "text-[19px]" : "text-[15px] font-medium",
          )}
        >
          {expense.item}
        </p>
        <p
          className={cn(
            dark ? "text-on-dark-faint" : "text-faint",
            tv ? "text-[13px]" : "text-[12px]",
          )}
        >
          {expense.cat} · {expense.date}
        </p>
      </div>
      <span
        className={cn(
          "nums shrink-0 font-semibold",
          dark ? "text-on-dark" : "text-ink",
          tv ? "text-2xl" : "text-[15px]",
        )}
      >
        {formatCAD(expense.amountCents)}
      </span>
    </div>
  );
}
