import { cn } from "@/lib/utils";

/**
 * Girih — an authentic Islamic geometric watermark: a tessellation of eight-point
 * khatam stars (two overlapping squares) linked by an octagon grid. A tiling inline
 * SVG <pattern>, richer and more overtly Islamic than a plain circle lattice. Absolute
 * fill by default; the parent must be `relative` + `overflow-hidden`.
 *
 * `id` MUST be unique per instance on a page (SVG pattern ids are global). `scale`
 * grows the tile (e.g. larger stars on the TV). Inherits nothing — pass an explicit
 * `color` token.
 */
export function Girih({
  id = "girih8",
  className,
  opacity = 0.3,
  color = "var(--gold)",
  scale = 1,
}: {
  id?: string;
  className?: string;
  opacity?: number;
  color?: string;
  scale?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      style={{ opacity }}
    >
      <defs>
        <pattern
          id={id}
          width={80}
          height={80}
          patternUnits="userSpaceOnUse"
          patternTransform={`scale(${scale})`}
        >
          <g fill="none" stroke={color} strokeWidth="1">
            {/* eight-point star = two overlapping squares (khatam) */}
            <rect x="20" y="20" width="40" height="40" />
            <rect x="20" y="20" width="40" height="40" transform="rotate(45 40 40)" />
            {/* central octagon dot */}
            <circle cx="40" cy="40" r="5.5" />
            {/* ticks that knit neighbouring stars into one lattice */}
            <path d="M0 40 H12 M68 40 H80 M40 0 V12 M40 68 V80" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
