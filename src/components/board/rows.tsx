import { cn } from "@/lib/utils";
import type { Contribution, Expense } from "@/core/data/types";
import { formatCAD } from "@/lib/format";

/** Uppercase micro-label heading used above every board list. */
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("eyebrow text-muted-ink", className)}>{children}</p>;
}

/**
 * A recent-contribution row. `publicView` guarantees the real name behind an
 * anonymous gift is NEVER rendered — public surfaces pass true (the default).
 */
export function ContributionRow({
  contribution,
  publicView = true,
  size = "phone",
}: {
  contribution: Contribution;
  publicView?: boolean;
  size?: "phone" | "tv";
}) {
  const tv = size === "tv";
  const displayName = publicView || !contribution.realName ? contribution.name : contribution.realName;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-row-divider py-3 last:border-0">
      <div className="min-w-0">
        <p className={cn("truncate text-ink", tv ? "text-[19px]" : "text-[15px] font-medium")}>
          {displayName}
          {!publicView && contribution.anon && (
            <span className="ml-2 rounded-full bg-tint px-2 py-0.5 align-middle text-[10px] font-semibold tracking-wide text-emerald uppercase">
              Anonyme
            </span>
          )}
        </p>
        <p className={cn("text-faint", tv ? "text-[13px]" : "text-[12px]")}>
          {contribution.type === "mensuel" ? "Mensuel" : "Ponctuel"} · {contribution.date}
        </p>
      </div>
      <span className={cn("nums shrink-0 font-semibold text-gold-deep", tv ? "text-2xl" : "text-[15px]")}>
        {formatCAD(contribution.amountCents)}
      </span>
    </div>
  );
}

/** A recent-expense row. */
export function ExpenseRow({ expense, size = "phone" }: { expense: Expense; size?: "phone" | "tv" }) {
  const tv = size === "tv";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-row-divider py-3 last:border-0">
      <div className="min-w-0">
        <p className={cn("truncate text-ink", tv ? "text-[19px]" : "text-[15px] font-medium")}>
          {expense.item}
        </p>
        <p className={cn("text-faint", tv ? "text-[13px]" : "text-[12px]")}>
          {expense.cat} · {expense.date}
        </p>
      </div>
      <span className={cn("nums shrink-0 font-semibold text-ink", tv ? "text-2xl" : "text-[15px]")}>
        {formatCAD(expense.amountCents)}
      </span>
    </div>
  );
}
