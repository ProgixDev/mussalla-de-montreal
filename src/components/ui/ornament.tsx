import { cn } from "@/lib/utils";
import { Star8 } from "./star";

/**
 * An arabesque divider flourish: two tapering hairlines meeting a central khatam star,
 * flanked by small lozenges. The whole thing inherits `currentColor` (default gold), so
 * `text-*` sets the tint. Decorative — sits under eyebrows / above verses to frame the
 * Islamic geometry. `width` sizes the span; pass `style` to add an entrance delay.
 */
export function Ornament({
  className,
  width = 220,
  style,
}: {
  className?: string;
  width?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex items-center gap-3 text-gold", className)}
      style={{ width, maxWidth: "100%", ...style }}
    >
      <span
        className="h-px flex-1"
        style={{ background: "linear-gradient(90deg, transparent, currentColor)", opacity: 0.55 }}
      />
      <span className="flex items-center gap-1.5">
        <span className="size-1 rotate-45 bg-current opacity-70" />
        <Star8 size={15} />
        <span className="size-1 rotate-45 bg-current opacity-70" />
      </span>
      <span
        className="h-px flex-1"
        style={{ background: "linear-gradient(270deg, transparent, currentColor)", opacity: 0.55 }}
      />
    </span>
  );
}
