import { Girih } from "@/components/ui/girih";
import { Ornament } from "@/components/ui/ornament";
import { Star8 } from "@/components/ui/star";

/**
 * The short night band that opens every community page: a lamplit radial glow over a
 * faint girih, film grain, then eyebrow · title · ornament · lead. Server-renderable.
 */
export function CommunityHero({
  id,
  eyebrow,
  title,
  arabic,
  children,
}: {
  /** Unique per page — names the girih SVG pattern. */
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  /** Optional Arabic accent (sacred text: opacity fade only, never transformed). */
  arabic?: { text: string; gloss: string };
  children?: React.ReactNode;
}) {
  return (
    <section className="border-gold/10 bg-night text-on-dark relative isolate overflow-hidden border-b">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(70% 110% at 18% 0%, rgba(26,107,80,0.42), transparent 70%), radial-gradient(50% 80% at 95% 100%, rgba(217,189,119,0.10), transparent 70%), linear-gradient(180deg, #05100c 0%, var(--night) 100%)",
        }}
      />
      <Girih id={`girih-${id}`} opacity={0.07} className="-z-10" />
      <div aria-hidden="true" className="grain pointer-events-none absolute inset-0 -z-10" />
      <Star8
        size={12}
        className="animate-twinkle text-gold/50 absolute top-[24%] right-[12%] hidden sm:block"
        style={{ animationDelay: "0.6s" }}
      />
      <Star8
        size={9}
        className="animate-twinkle text-gold/40 absolute right-[30%] bottom-[18%] hidden sm:block"
        style={{ animationDelay: "1.9s" }}
      />

      <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-8 md:py-20">
        <div className="max-w-[720px]">
          {arabic && (
            <p className="animate-softfade mb-5">
              <span lang="ar" className="font-arabic text-gold block text-[26px] leading-none">
                {arabic.text}
              </span>
              <span className="text-on-dark-faint mt-2 block text-[13px]">{arabic.gloss}</span>
            </p>
          )}
          <p className="eyebrow text-gold">{eyebrow}</p>
          <h1 className="font-display animate-rise mt-3 text-[38px] leading-[1.06] md:text-[56px]">
            {title}
          </h1>
          <Ornament className="text-gold mt-5" width={170} />
          {children && (
            <div className="text-on-dark-muted mt-5 max-w-[620px] text-[16.5px] leading-relaxed md:text-[18px]">
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
