import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { goalPercent, goalProgress, goalRemainingCents } from "@/core/data/derive";
import type { Goal } from "@/core/data/types";
import { formatCAD } from "@/lib/format";

/**
 * One objective with its gold-emerald progress bar. Shared by the phone board, the
 * TV "Objectifs" page, and the backoffice. `size` scales the type for TV legibility.
 */
export function GoalCard({
  goal,
  size = "phone",
  className,
}: {
  goal: Goal;
  size?: "phone" | "tv";
  className?: string;
}) {
  const tv = size === "tv";
  return (
    <div className={cn(className)}>
      <div className="flex items-baseline justify-between gap-4">
        <h3
          className={cn(
            "font-display text-ink",
            tv ? "text-[27px] leading-tight" : "text-[19px] leading-snug",
          )}
        >
          {goal.title}
        </h3>
        <span
          className={cn(
            "nums shrink-0 font-medium whitespace-nowrap text-emerald",
            tv ? "text-2xl" : "text-sm",
          )}
        >
          {goalPercent(goal)} %
        </span>
      </div>
      <ProgressBar value={goalProgress(goal)} className="mt-2" height={tv ? 14 : 8} />
      <div
        className={cn(
          "mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1",
          tv ? "text-[15px]" : "text-[12px]",
        )}
      >
        <p className="text-muted-ink">
          <span className="nums font-semibold text-ink">{formatCAD(goal.raisedCents)}</span> sur{" "}
          <span className="nums">{formatCAD(goal.targetCents)}</span> · il reste{" "}
          <span className="nums">{formatCAD(goalRemainingCents(goal))}</span>
        </p>
        <p className="text-faint">Échéance : {goal.due}</p>
      </div>
    </div>
  );
}
