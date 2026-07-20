import { cn } from "@/lib/utils";
import { ProgressRing } from "@/components/ui/progress-ring";
import { goalPercent, goalProgress, goalRemainingCents } from "@/core/data/derive";
import type { Goal } from "@/core/data/types";
import { formatCAD } from "@/lib/format";

/**
 * One objective, read as a circular gauge: an emerald→gold ring that sweeps to the
 * goal's percentage on mount, with the figures alongside. Shared by the phone board,
 * the TV "Objectifs" page, and the home page.
 *
 * `layout="row"`  — ring left, figures right (compact: phone board, home cards).
 * `layout="stack"` — ring above, figures centred beneath (the full-width TV row).
 *                    Size the ring fluidly via `ringClassName`.
 */
export function GoalCard({
  goal,
  size = "phone",
  layout = "row",
  ringClassName,
  className,
}: {
  goal: Goal;
  size?: "phone" | "tv";
  layout?: "row" | "stack";
  ringClassName?: string;
  className?: string;
}) {
  const tv = size === "tv";
  const stack = layout === "stack";

  const ring = (
    <ProgressRing
      id={`ring-${size}-${layout}-${goal.id}`}
      value={goalProgress(goal)}
      percent={goalPercent(goal)}
      stroke={stack ? 7 : 9}
      size={stack ? undefined : tv ? 116 : 74}
      className={stack ? ringClassName : undefined}
    />
  );

  if (stack) {
    return (
      <div className={cn("flex flex-col items-center text-center", className)}>
        {ring}
        <h3 className="font-display mt-[clamp(16px,1.6vw,32px)] text-[clamp(19px,1.75vw,34px)] leading-tight text-ink">
          {goal.title}
        </h3>
        <p className="mt-[clamp(8px,0.8vw,16px)] text-[clamp(14px,1.1vw,22px)] text-muted-ink">
          <span className="nums font-semibold text-ink">{formatCAD(goal.raisedCents)}</span> sur{" "}
          <span className="nums">{formatCAD(goal.targetCents)}</span>
        </p>
        <p className="mt-[clamp(4px,0.4vw,10px)] text-[clamp(12px,0.9vw,18px)] text-faint">
          il reste <span className="nums">{formatCAD(goalRemainingCents(goal))}</span> · Échéance :{" "}
          {goal.due}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-5", tv && "gap-7", className)}>
      {ring}
      <div className="min-w-0 flex-1">
        <h3
          className={cn(
            "font-display text-ink",
            tv ? "text-[27px] leading-tight" : "text-[19px] leading-snug",
          )}
        >
          {goal.title}
        </h3>
        <p className={cn("mt-1.5 text-muted-ink", tv ? "text-[15px]" : "text-[12px]")}>
          <span className="nums font-semibold text-ink">{formatCAD(goal.raisedCents)}</span> sur{" "}
          <span className="nums">{formatCAD(goal.targetCents)}</span>
        </p>
        <p
          className={cn("mt-1 flex flex-wrap gap-x-3 text-faint", tv ? "text-[14px]" : "text-[12px]")}
        >
          <span>
            il reste <span className="nums">{formatCAD(goalRemainingCents(goal))}</span>
          </span>
          <span>·</span>
          <span>Échéance : {goal.due}</span>
        </p>
      </div>
    </div>
  );
}
