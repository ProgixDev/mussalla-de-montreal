import { cn } from "@/lib/utils";

/**
 * Khatam — the eight-point Islamic star (najmah / rub-el-hizb), drawn as a 16-vertex
 * star polygon. Inherits `currentColor` so it tints with text utilities (text-gold,
 * text-emerald…). Purely decorative — always aria-hidden. Used as a bullet, a divider
 * centerpiece (Ornament), a twinkling accent, and a card watermark.
 */
const STAR8 =
  "M0 -11 L1.73 -4.17 L7.78 -7.78 L4.17 -1.73 L11 0 L4.17 1.73 L7.78 7.78 L1.73 4.17 L0 11 L-1.73 4.17 L-7.78 7.78 L-4.17 1.73 L-11 0 L-4.17 -1.73 L-7.78 -7.78 L-1.73 -4.17 Z";

export function Star8({
  size = 16,
  className,
  filled = true,
  strokeWidth = 1.4,
  style,
}: {
  size?: number;
  className?: string;
  filled?: boolean;
  strokeWidth?: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="-12 -12 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      className={cn("block shrink-0", className)}
      style={style}
    >
      <path
        d={STAR8}
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
        strokeWidth={filled ? undefined : strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}
