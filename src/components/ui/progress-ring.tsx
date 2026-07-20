import { cn } from "@/lib/utils";

/**
 * Circular goal progress — an emerald→gold arc that sweeps from empty to its value on
 * mount, with the whole-percent reading at its centre. Replaces the flat bar so a
 * goal's standing is legible at a glance (and from across the prayer hall on the TV).
 *
 * Drawn in a fixed 0–100 viewBox and stretched to its box, so it scales to ANY size:
 * pass `size` for a fixed px square, or size it with `className` (e.g. a clamp width)
 * for a fluid ring — the arc, the stroke, and the numeral all scale together.
 *
 * CSS-only: the element hands the keyframe its circumference and target offset via
 * custom properties, so this stays a Server Component and ships no JS. The global
 * prefers-reduced-motion reset collapses the sweep to its final value instantly.
 *
 * `id` MUST be unique per instance — it names the SVG gradient.
 */
export function ProgressRing({
  value,
  percent,
  id,
  size,
  stroke = 8,
  className,
}: {
  /** Fraction in [0, 1]. */
  value: number;
  /** Whole percent printed at the centre (already rounded by the caller). */
  percent: number;
  id: string;
  /** Fixed px square. Omit and size via `className` for a fluid ring. */
  size?: number;
  /** Stroke width in viewBox units (0–100). */
  stroke?: number;
  className?: string;
}) {
  const clamped = Math.min(1, Math.max(0, value));
  const radius = (100 - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = circumference * (1 - clamped);

  return (
    <div
      className={cn("relative aspect-square shrink-0", className)}
      style={size ? { width: size, height: size } : undefined}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg viewBox="0 0 100 100" className="block h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--emerald)" />
            <stop offset="100%" stopColor="var(--gold-deep)" />
          </linearGradient>
        </defs>

        {/* track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--hairline)"
          strokeWidth={stroke}
        />

        {/* value arc — starts at 12 o'clock and sweeps clockwise */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          transform="rotate(-90 50 50)"
          className="animate-ringfill"
          style={
            {
              "--ring-circ": circumference,
              "--ring-target": target,
            } as React.CSSProperties
          }
        />

        {/* the reading scales with the viewBox, so it stays centred at every size */}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-display"
          fill="var(--emerald)"
          fontSize="23"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {percent} %
        </text>
      </svg>
    </div>
  );
}
