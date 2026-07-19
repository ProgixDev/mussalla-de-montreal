import { cn } from "@/lib/utils";

/**
 * Goal progress bar — gold-to-emerald gradient fill on a faint track, fully rounded.
 * `value` is a fraction in [0, 1]. The fill grows on mount (growbar) and transitions
 * its width when the value changes, matching the design’s motion spec.
 */
export function ProgressBar({
  value,
  className,
  height = 10,
}: {
  value: number;
  className?: string;
  height?: number;
}) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-hairline/70", className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full origin-left rounded-full animate-growbar"
        style={{
          width: `${pct}%`,
          background: "linear-gradient(90deg, var(--emerald), var(--emerald-fill))",
          transition: "width 0.8s ease",
        }}
      />
    </div>
  );
}
