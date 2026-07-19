import { cn } from "@/lib/utils";

/**
 * A single statistic: an uppercase micro-label above a large Marcellus value. Used in
 * the hero stat strip and the backoffice dashboard cards. `tone` recolors the value
 * for the emerald "entrées" / neutral "sorties" distinction in the design.
 */
export function StatTile({
  label,
  value,
  tone = "ink",
  className,
}: {
  label: string;
  value: string;
  tone?: "ink" | "emerald";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="eyebrow text-faint">{label}</span>
      <span
        className={cn(
          "font-display nums text-3xl leading-none md:text-[34px]",
          tone === "emerald" ? "text-emerald" : "text-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}
