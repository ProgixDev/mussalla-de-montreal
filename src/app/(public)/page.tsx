import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Girih } from "@/components/ui/girih";
import { Ornament } from "@/components/ui/ornament";
import { Star8 } from "@/components/ui/star";
import { GoalCard } from "@/components/board/goal-card";
import {
  ArrowRightIcon,
  EyeIcon,
  HeartIcon,
  LockIcon,
  PhoneIcon,
  ShieldIcon,
  TvIcon,
  ZapIcon,
} from "@/components/ui/icons";
import { getCaisseData } from "@/core/data/seed";
import { computeTotals } from "@/core/data/derive";
import { formatCAD, formatNumber } from "@/lib/format";
import { site } from "@/core/site";

export const metadata: Metadata = {
  title: "Accueil",
  description: site.description,
  alternates: { canonical: "/" },
};

const features = [
  {
    Icon: EyeIcon,
    title: "Tout est visible",
    text: "Chaque contribution et chaque dépense apparaît, en direct. Le solde se calcule tout seul : entrées moins sorties.",
  },
  {
    Icon: LockIcon,
    title: "Anonyme si vous voulez",
    text: "Donnez à votre nom ou en tant qu’Anonyme. À l’écran, l’anonymat est respecté — mais votre don compte dans chaque total.",
  },
  {
    Icon: ShieldIcon,
    title: "Paiement sécurisé",
    text: "Les dons par carte passent par Square. La mussalla ne touche jamais directement à l’argent.",
  },
  {
    Icon: ZapIcon,
    title: "En direct dans la salle",
    text: "L’écran de la salle et les téléphones se mettent à jour tout seuls. Rien à rafraîchir.",
  },
];

const surfaces = [
  {
    href: "/tv",
    Icon: TvIcon,
    title: "Écran TV",
    description:
      "L’affichage public, en direct dans la salle — rotation automatique entre les pages, pilotée depuis le backoffice.",
    cta: "Ouvrir l’écran",
  },
  {
    href: "/caisse",
    Icon: PhoneIcon,
    title: "Vue téléphone",
    description:
      "Le même contenu, ouvert par code QR — avec un bouton « Faire un don » pour contribuer sur place ou de chez soi.",
    cta: "Ouvrir la vue",
  },
  {
    href: "/admin",
    Icon: ShieldIcon,
    title: "Backoffice",
    description:
      "L’espace privé des gestionnaires : contributions, dépenses, objectifs, membres et contrôle de l’affichage.",
    cta: "Ouvrir le backoffice",
  },
];

export default function AccueilPage() {
  const data = getCaisseData();
  const totals = computeTotals(data);

  const stats = [
    { label: "Solde de la caisse", value: formatCAD(totals.balanceCents), tone: "ink" as const },
    { label: "Entrées ce mois-ci", value: formatCAD(totals.monthInCents), tone: "emerald" as const },
    { label: "Sorties ce mois-ci", value: formatCAD(totals.monthOutCents), tone: "ink" as const },
    { label: "Objectifs actifs", value: formatNumber(totals.activeGoals), tone: "ink" as const },
  ];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden text-on-dark">
        {/* Photographic ground — Al-Masjid an-Nabawi at golden hour (photo: Unsplash).
            Swap public/hero-mosque.jpg to change it. object-position keeps the domes
            and sky in frame; the crowd at the foot sits under the bottom gradient. */}
        <Image
          src="/hero-mosque.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%]"
        />
        {/* Legibility gradient — dark at the top for the nav, dark at the foot for the
            headline, so cream text stays readable over the photo. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,20,14,0.74) 0%, rgba(8,24,18,0.26) 28%, rgba(8,24,18,0.42) 60%, rgba(4,15,11,0.9) 100%)",
          }}
        />
        {/* Warm emerald wash — ties the photo to the house palette. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: "radial-gradient(115% 82% at 12% 46%, rgba(15,90,64,0.5), transparent 62%)",
            mixBlendMode: "multiply",
          }}
        />
        {/* Twinkling khatam stars — a touch of nûr over the sky. */}
        <Star8
          size={13}
          className="animate-twinkle absolute top-[15%] left-[8%] text-gold/50"
          style={{ animationDelay: "0.6s" }}
        />
        <Star8
          size={9}
          className="animate-twinkle absolute top-[26%] right-[12%] text-gold/45"
          style={{ animationDelay: "1.7s" }}
        />
        <div className="relative mx-auto w-full max-w-[1200px] px-6 pt-28 pb-20 md:px-8 md:pt-32 md:pb-28">
          <div className="max-w-[760px]">
            <div
              className="animate-rise flex flex-wrap items-center gap-x-6 gap-y-2"
              style={{ animationDelay: "0.05s" }}
            >
              <span className="eyebrow text-gold">La caisse · Transparence</span>
              {/* Sacred text: opacity fade only — never scaled or rotated. */}
              <span className="font-arabic animate-softfade text-2xl text-gold" lang="ar">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </span>
            </div>
            <Ornament
              className="animate-rise mt-5 text-gold"
              width={210}
              style={{ animationDelay: "0.24s" }}
            />
            <h1
              className="font-display animate-rise mt-6 text-[44px] leading-[1.04] text-on-dark md:text-[68px]"
              style={{ animationDelay: "0.32s" }}
            >
              Chaque don, chaque dépense — visible de tous.
            </h1>
            <p
              className="animate-rise mt-6 max-w-[620px] text-[18px] leading-[1.6] font-light text-on-dark-muted md:text-[21px]"
              style={{ animationDelay: "0.46s" }}
            >
              Un fonds transparent pour la mussalla. Ce que la communauté donne, et ce qu’elle
              dépense, en direct — sur l’écran de la salle et sur le téléphone de chacun. Ce que cela
              construit n’est pas un écran : c’est la confiance.
            </p>
            <div
              className="animate-rise mt-9 flex flex-wrap gap-3"
              style={{ animationDelay: "0.58s" }}
            >
              <Link
                href="/don"
                className="sheen inline-flex h-12 items-center gap-2 rounded-[2px] bg-gold px-6 text-[15px] font-semibold text-ink shadow-lamp transition hover:opacity-90 active:scale-[0.98]"
              >
                <HeartIcon width={18} height={18} />
                Faire un don
              </Link>
              <Link
                href="/caisse"
                className="inline-flex h-12 items-center gap-2 rounded-[2px] border border-on-dark/25 px-6 text-[15px] font-medium text-on-dark transition hover:border-gold/60 hover:bg-white/5"
              >
                Voir la caisse en direct
                <ArrowRightIcon width={16} height={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live stats ───────────────────────────────────── */}
      <section className="bg-cream">
        <div className="mx-auto max-w-[1200px] px-6 py-10 md:px-8">
          <div className="mb-6 flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-gold-deep animate-livepulse" />
            <span className="eyebrow text-muted-ink">La caisse en direct</span>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="border-l-2 border-hairline pl-5">
                <p className="eyebrow text-faint">{s.label}</p>
                <p
                  className={`font-display nums mt-2 text-[36px] leading-none md:text-[44px] ${
                    s.tone === "emerald" ? "text-emerald" : "text-ink"
                  }`}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Objectifs ────────────────────────────────────── */}
      <section className="bg-sand">
        <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-8 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow text-gold-strong">Nos objectifs en cours</span>
              <h2 className="font-display mt-2 text-[32px] text-ink md:text-[40px]">
                La communauté avance, ensemble.
              </h2>
              <Ornament className="mt-4 text-gold-deep" width={170} />
            </div>
            <Link
              href="/don"
              className="inline-flex items-center gap-2 text-[15px] font-medium text-emerald hover:underline"
            >
              Contribuer à un objectif
              <ArrowRightIcon width={16} height={16} />
            </Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {data.goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-[10px] border border-hairline bg-white p-6 shadow-sm"
              >
                <GoalCard goal={goal} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Transparence / features ──────────────────────── */}
      <section className="bg-cream">
        <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-8 md:py-20">
          <div className="max-w-[640px]">
            <span className="eyebrow text-gold-strong">Pourquoi la caisse</span>
            <h2 className="font-display mt-2 text-[32px] text-ink md:text-[40px]">
              Une caisse, entièrement transparente.
            </h2>
            <Ornament className="mt-4 text-gold-deep" width={170} />
            <p className="mt-4 text-[17px] leading-relaxed text-muted-ink">
              Rien n’est caché : l’argent qui entre, l’argent qui sort, et où va chaque objectif.
              C’est la confiance, rendue visible.
            </p>
          </div>
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ Icon, title, text }) => (
              <div key={title}>
                <span className="flex size-12 items-center justify-center rounded-[12px] bg-tint text-emerald">
                  <Icon width={24} height={24} />
                </span>
                <h3 className="font-display mt-4 text-[20px] text-ink">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-ink">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Surfaces ─────────────────────────────────────── */}
      <section className="bg-sand">
        <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-8 md:py-20">
          <span className="eyebrow text-gold-strong">Où voir la caisse</span>
          <h2 className="font-display mt-2 text-[32px] text-ink md:text-[40px]">
            Trois façons de suivre le fonds.
          </h2>
          <Ornament className="mt-4 text-gold-deep" width={170} />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {surfaces.map(({ href, Icon, title, description, cta }) => (
              <Link
                key={title}
                href={href}
                className="group flex min-h-[220px] flex-col rounded-[10px] border border-hairline bg-white p-7 transition-all duration-200 hover:-translate-y-1 hover:border-gold-deep hover:shadow-lift"
              >
                <span className="mb-5 inline-flex size-[46px] items-center justify-center rounded-[12px] bg-tint text-emerald">
                  <Icon width={22} height={22} />
                </span>
                <h3 className="font-display text-[26px] leading-tight text-ink">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-ink">{description}</p>
                <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-medium text-emerald">
                  {cta}
                  <ArrowRightIcon
                    width={16}
                    height={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Verse / CTA ──────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-on-dark"
        style={{ backgroundImage: "linear-gradient(150deg, #0f5a40, #0a1c15)" }}
      >
        <Girih id="girih-verse" opacity={0.28} />
        <Star8
          size={12}
          className="animate-twinkle absolute top-[22%] left-[16%] text-gold/40"
          style={{ animationDelay: "0.8s" }}
        />
        <Star8
          size={10}
          className="animate-twinkle absolute right-[18%] bottom-[26%] text-gold/40"
          style={{ animationDelay: "1.9s" }}
        />
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-center px-6 py-20 text-center md:px-8 md:py-24">
          <span className="font-arabic animate-softfade text-[32px] leading-none text-gold" lang="ar">
            بارك الله فيكم
          </span>
          <Ornament className="mt-5 text-gold" width={190} />
          <h2 className="font-display mt-5 max-w-[760px] text-[34px] leading-tight md:text-[46px]">
            Qu’Allah récompense les donateurs.
          </h2>
          <p className="mt-4 max-w-[520px] text-[17px] text-on-dark-muted">
            Merci à toutes celles et ceux qui font vivre la mussalla. Chaque geste, si petit
            soit-il, compte.
          </p>
          <Link
            href="/don"
            className="sheen mt-9 inline-flex h-12 items-center gap-2 rounded-[2px] bg-gold px-7 text-[15px] font-semibold text-ink shadow-lamp transition hover:opacity-90 active:scale-[0.98]"
          >
            <HeartIcon width={18} height={18} />
            Faire un don
          </Link>
        </div>
      </section>
    </>
  );
}
