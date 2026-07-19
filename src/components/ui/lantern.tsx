import { cn } from "@/lib/utils";

/**
 * Fanoos — a hanging mosque lantern that sways gently and glows, a warm, friendly
 * Islamic accent (no living beings — pure ornament). The chain + lamp rock on
 * `animate-lanternsway`; a soft nur halo breathes on `animate-glow`. Both respect
 * prefers-reduced-motion via the global reset. Decorative — aria-hidden.
 */
export function Lantern({ className, size = 64 }: { className?: string; size?: number }) {
  const glowId = "lampglow";
  return (
    <svg
      viewBox="0 0 80 168"
      width={size}
      height={size * 2.1}
      aria-hidden="true"
      className={cn("block", className)}
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="64%" r="52%">
          <stop offset="0%" stopColor="var(--gold-light)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--gold-light)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* nur halo */}
      <circle
        cx="40"
        cy="108"
        r="48"
        fill={`url(#${glowId})`}
        className="animate-glow"
        style={{ transformOrigin: "40px 108px" }}
      />

      {/* chain + lamp — sways from the top anchor */}
      <g className="animate-lanternsway" style={{ transformOrigin: "40px 4px" }}>
        <g fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinejoin="round">
          {/* chain */}
          <line x1="40" y1="2" x2="40" y2="34" />
          {/* crescent finial */}
          <path d="M33 34 a7 7 0 1 0 14 0" />
          {/* cap */}
          <path d="M27 50 L53 50 L47 60 L33 60 Z" fill="var(--gold)" fillOpacity="0.18" />
          {/* body */}
          <path d="M30 60 Q21 88 30 124 L50 124 Q59 88 50 60 Z" fill="var(--emerald)" fillOpacity="0.3" />
          {/* pierced star-light holes */}
          <g strokeWidth="1.4">
            <circle cx="40" cy="80" r="4.5" />
            <circle cx="33" cy="100" r="3" />
            <circle cx="47" cy="100" r="3" />
            <circle cx="40" cy="115" r="3" />
          </g>
          {/* base + drop */}
          <path d="M33 124 L47 124 L43 136 L37 136 Z" fill="var(--gold)" fillOpacity="0.22" />
        </g>
        <circle cx="40" cy="142" r="3" fill="var(--gold)" />
      </g>
    </svg>
  );
}
