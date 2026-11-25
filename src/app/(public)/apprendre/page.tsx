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
        className="text-on-dark relative overflow-hidden"
        style={{ backgroundImage: "linear-gradient(155deg, #124a37, #0a1c15)" }}
      >
        <Girih id="girih-learn" opacity={0.22} />
        <Star8
          size={13}
          className="animate-twinkle text-gold/45 absolute top-[22%] left-[9%]"
          style={{ animationDelay: "0.5s" }}
        />
        <Star8
          size={10}
          className="animate-twinkle text-gold/40 absolute right-[12%] bottom-[26%]"
          style={{ animationDelay: "1.8s" }}
        />
        <div className="relative mx-auto max-w-[860px] px-6 py-20 text-center md:px-8 md:py-24">
          {/* Sacred text: opacity fade only — never scaled or rotated. */}
          <span
            className="font-arabic animate-softfade text-gold block text-[26px] leading-none"
            lang="ar"
          >
            اطْلُبُوا الْعِلْمَ
          </span>
          <h1
            className="font-display animate-rise mt-4 text-[40px] leading-[1.08] md:text-[58px]"
            style={{ animationDelay: "0.1s" }}
          >
            Apprendre notre religion
          </h1>
          <Ornament
            className="animate-rise text-gold mx-auto mt-6"
            width={220}
            style={{ animationDelay: "0.2s" }}
          />
          <p
            className="animate-rise text-on-dark-muted mx-auto mt-6 max-w-[600px] text-[17px] leading-relaxed md:text-[19px]"
            style={{ animationDelay: "0.3s" }}
          >
            De courtes vidéos, choisies avec soin, pour apprendre les gestes de la foi et grandir
            ensemble — du premier woudou jusqu’à l’invocation qui vient du cœur.
          </p>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────── */}
      {LEARN_CATEGORIES.map((cat, i) => (
        <section
          key={cat.key}
          className={i % 2 === 0 ? "bg-night" : "border-gold/10 border-y bg-[#0b1f17]"}
        >
          <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-8 md:py-20">
            <div className="flex flex-col gap-x-10 gap-y-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-[560px]">
                <span
                  className="font-arabic text-gold-light inline-block text-[22px] leading-none"
                  lang="ar"
                >
                  {cat.arabic}
                </span>
                <h2 className="font-display text-on-dark mt-3 text-[30px] leading-tight md:text-[42px]">
                  {cat.name}
                </h2>
                <Ornament className="text-gold mt-4" width={150} />
              </div>
              <p className="text-on-dark-muted max-w-[440px] text-[15px] leading-relaxed">
                {cat.intro}
              </p>
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
        className="text-on-dark relative overflow-hidden"
        style={{ backgroundImage: "linear-gradient(150deg, #0f5a40, #0a1c15)" }}
      >
        <Girih id="girih-learn-cta" opacity={0.26} />
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-center px-6 py-20 text-center md:px-8 md:py-24">
          <span
            className="font-arabic animate-softfade text-gold text-[30px] leading-none"
            lang="ar"
          >
            رَبِّ زِدْنِي عِلْمًا
          </span>
          <Ornament className="text-gold mt-5" width={190} />
          <h2 className="font-display mt-5 max-w-[720px] text-[30px] leading-tight md:text-[42px]">
            « Seigneur, accrois mon savoir. »
          </h2>
          <p className="text-on-dark-muted mt-4 max-w-[520px] text-[17px]">
            Apprendre, c’est aussi faire vivre la mussalla qui nous enseigne. Chaque geste compte.
          </p>
        </div>
      </section>
    </>
  );
}
