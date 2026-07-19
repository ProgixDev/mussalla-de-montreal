import { cn } from "@/lib/utils";

/**
 * Brand mark — a mihrab arch on a rounded tile. The tile takes `currentColor`
 * (emerald on light surfaces, gold on dark); the arch stays cream. Transcribed
 * from the design prototype (viewBox 0 0 64 64).
 */
export function Emblem({
  className,
  size = 40,
  title = "Mussalla de Montréal",
}: {
  className?: string;
  size?: number;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      className={cn("block shrink-0", className)}
    >
      <rect width="64" height="64" rx="15" fill="currentColor" />
      <path
        d="M20 51 L20 31 C20 21 25 13.5 32 11.5 C39 13.5 44 21 44 31 L44 51"
        fill="none"
        stroke="var(--cream)"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 51.5 H47.5"
        fill="none"
        stroke="var(--cream)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="32" cy="7.6" r="2.3" fill="var(--cream)" />
    </svg>
  );
}
