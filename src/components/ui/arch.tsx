import { cn } from "@/lib/utils";
import { Star8 } from "./star";

/**
 * A pointed/ogee arch crown — the architectural motif of the system. Drawn as a thin
 * gold hairline that springs from two imposts, meets at a keystone point, and carries
 * a small khatam star at its apex. Sits on top of a card/section to frame it like a
 * niche without any heavy chrome.
 *
 * Purely ornamental (aria-hidden). On devotional surfaces (receipt, TV welcome,
 * sign-in) this reads as a mihrab; on utility surfaces it's simply a pointed arch.
 */
export function ArchCrown({
  className,
  width = 220,
  tone = "text-gold-deep",
  star = true,
}: {
  className?: string;
  width?: number;
  tone?: string;
  star?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none block", tone, className)}
      style={{ width, maxWidth: "100%" }}
    >
      <svg viewBox="0 0 220 46" width="100%" fill="none" className="block overflow-visible">
        {/* ogee arch: springs from the imposts, cusps inward, meets at a point */}
        <path
          d="M4 46 L4 30 C4 16 40 22 62 10 C86 -3 134 -3 158 10 C180 22 216 16 216 30 L216 46"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.75"
        />
        {/* imposts */}
        <path d="M4 46 H20 M200 46 H216" stroke="currentColor" strokeWidth="1.25" opacity="0.5" />
      </svg>
      {star && (
        <span className="-mt-[38px] flex justify-center">
          <Star8 size={13} />
        </span>
      )}
    </span>
  );
}

/**
 * A full niche: an arched, gold-hairlined container. `as` lets it wrap any block.
 * The arch is baked into the border via a rounded top so content can sit inside it.
 */
export function ArchFrame({
  children,
  className,
  crown = true,
}: {
  children: React.ReactNode;
  className?: string;
  crown?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      {crown && (
        <ArchCrown className="absolute -top-8 left-1/2 -translate-x-1/2" width={200} />
      )}
      <div className="rounded-t-[999px_140px] rounded-b-[10px] border border-hairline bg-white/70 px-6 pt-10 pb-6 backdrop-blur-[1px]">
        {children}
      </div>
    </div>
  );
}
