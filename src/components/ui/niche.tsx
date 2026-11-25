import { cn } from "@/lib/utils";
import { Star8 } from "./star";

/**
 * A card with a mihrab niche carved into it: the card itself stays a calm rectangle,
 * and a pointed (two-centred) arch is cut INTO its upper part, lit from within like
 * the lantern niches of the hero render. Whatever goes in `niche` (a gauge, a numeral)
 * sits in the lamplight; `children` is the card text below.
 *
 * Why not an arch-shaped card: a white arch-topped slab crowned with a star reads as a
 * headstone. The arch belongs to the wall, not to the silhouette of the object.
 *
 * The arch is an SVG with a fixed aspect ratio, so it never distorts at any width.
 */
export function NicheCard({
  id,
  niche,
  children,
  className,
  nicheClassName,
  tone = "light",
}: {
  /** Unique per instance on the page — names the SVG glow gradient. */
  id: string;
  niche: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Sizing for the niche window (default: up to 240px wide). */
  nicheClassName?: string;
  /** light: white card on cream. dark: night glass card, emerald niche, gold lamplight. */
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  // Pointed arch on a 100 × 92 box: imposts at y=40, apex at the top centre.
  const ARCH = "M2 92 L2 40 C2 22 26 9 50 2 C74 9 98 22 98 40 L98 92 Z";
  const ARCH_INNER = "M8 92 L8 41 C8 26 29 14.5 50 8.4 C71 14.5 92 26 92 41 L92 92";

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-[16px] border px-6 pt-6 pb-7",
        dark
          ? "border-gold/15 bg-white/[0.035] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur-sm"
          : "border-hairline bg-white shadow-[0_1px_0_rgba(10,28,21,0.04),0_18px_36px_-24px_rgba(10,28,21,0.28)]",
        className,
      )}
    >
      <div className={cn("relative mx-auto aspect-[100/92] w-full max-w-[240px]", nicheClassName)}>
        <svg
          viewBox="0 0 100 92"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            {/* lamplight pooling under the keystone */}
            <radialGradient id={`${id}-glow`} cx="50%" cy="34%" r="70%">
              <stop offset="0%" stopColor="var(--gold-light)" stopOpacity={dark ? 0.32 : 0.55} />
              <stop
                offset="55%"
                stopColor={dark ? "var(--emerald-deep)" : "var(--cream)"}
                stopOpacity="0.9"
              />
              <stop
                offset="100%"
                stopColor={dark ? "var(--emerald-niche)" : "var(--cream-2)"}
                stopOpacity="1"
              />
            </radialGradient>
          </defs>
          <path d={ARCH} fill={`url(#${id}-glow)`} />
          <path
            d={ARCH}
            fill="none"
            stroke="var(--gold-deep)"
            strokeOpacity="0.7"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          {/* the carved second line of the moulding */}
          <path
            d={ARCH_INNER}
            fill="none"
            stroke="var(--gold-deep)"
            strokeOpacity="0.45"
            strokeWidth="1"
            strokeDasharray="1 3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <Star8
          size={11}
          className="text-gold-deep absolute top-[2.2%] left-1/2 -translate-x-1/2 -translate-y-1/2"
        />
        {/* content sits low in the niche, under the arch, on its sill */}
        <div className="absolute inset-x-0 top-[16%] bottom-0 flex items-center justify-center">
          {niche}
        </div>
      </div>
      {children}
    </div>
  );
}
