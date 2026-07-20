import type { Metadata } from "next";
import { Girih } from "@/components/ui/girih";
import { Ornament } from "@/components/ui/ornament";
import { Star8 } from "@/components/ui/star";
import { VideoCard, LEARN_CATEGORIES } from "@/features/learn";

export const metadata: Metadata = {
  title: "Apprendre",
  description:
    "De courtes vidéos pour apprendre les gestes de la foi — le woudou, la prière, le bon voisinage, les bonnes manières, la générosité et l’invocation.",
  alternates: { canonical: "/apprendre" },
};

export default function ApprendrePage() {
  return (
    <>
      {/* ── Header band ──────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-on-dark"
        style={{ backgroundImage: "linear-gradient(155deg, #124a37, #0a1c15)" }}
      >
        <Girih id="girih-learn" opacity={0.22} />
        <Star8
          size={13}
          className="animate-twinkle absolute top-[22%] left-[9%] text-gold/45"
          style={{ animationDelay: "0.5s" }}
        />
        <Star8
          size={10}
          className="animate-twinkle absolute right-[12%] bottom-[26%] text-gold/40"
          style={{ animationDelay: "1.8s" }}
        />
        <div className="relative mx-auto max-w-[860px] px-6 py-20 text-center md:px-8 md:py-24">
          {/* Sacred text: opacity fade only — never scaled or rotated. */}
          <span className="font-arabic animate-softfade block text-[26px] leading-none text-gold" lang="ar">
            اطْلُبُوا الْعِلْمَ
          </span>
          <h1
            className="font-display animate-rise mt-4 text-[40px] leading-[1.08] md:text-[58px]"
            style={{ animationDelay: "0.1s" }}
          >
            Apprendre notre religion
          </h1>
          <Ornament
            className="animate-rise mx-auto mt-6 text-gold"
            width={220}
            style={{ animationDelay: "0.2s" }}
          />
          <p
            className="animate-rise mx-auto mt-6 max-w-[600px] text-[17px] leading-relaxed text-on-dark-muted md:text-[19px]"
            style={{ animationDelay: "0.3s" }}
          >
            De courtes vidéos, choisies avec soin, pour apprendre les gestes de la foi et grandir
            ensemble — du premier woudou jusqu’à l’invocation qui vient du cœur.
          </p>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────── */}
      {LEARN_CATEGORIES.map((cat, i) => (
        <section key={cat.key} className={i % 2 === 0 ? "bg-cream" : "bg-sand"}>
          <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-8 md:py-20">
            <div className="flex flex-col gap-x-10 gap-y-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-[560px]">
                <span className="font-arabic block text-[22px] leading-none text-gold-deep" lang="ar">
                  {cat.arabic}
                </span>
                <h2 className="font-display mt-3 text-[30px] leading-tight text-ink md:text-[38px]">
                  {cat.name}
                </h2>
                <Ornament className="mt-4 text-gold-deep" width={150} />
              </div>
              <p className="max-w-[440px] text-[15px] leading-relaxed text-muted-ink">{cat.intro}</p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cat.videos.map((v) => (
                <VideoCard key={v.youtubeId} video={v} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ── Closing du‘â / CTA ───────────────────────────── */}
      <section
        className="relative overflow-hidden text-on-dark"
        style={{ backgroundImage: "linear-gradient(150deg, #0f5a40, #0a1c15)" }}
      >
        <Girih id="girih-learn-cta" opacity={0.26} />
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-center px-6 py-20 text-center md:px-8 md:py-24">
          <span className="font-arabic animate-softfade text-[30px] leading-none text-gold" lang="ar">
            رَبِّ زِدْنِي عِلْمًا
          </span>
          <Ornament className="mt-5 text-gold" width={190} />
          <h2 className="font-display mt-5 max-w-[720px] text-[30px] leading-tight md:text-[42px]">
            « Seigneur, accrois mon savoir. »
          </h2>
          <p className="mt-4 max-w-[520px] text-[17px] text-on-dark-muted">
            Apprendre, c’est aussi faire vivre la mussalla qui nous enseigne. Chaque geste compte.
          </p>
        </div>
      </section>
    </>
  );
}
