import Link from "next/link";
import type { Metadata } from "next";
import { Lattice } from "@/components/ui/lattice";
import { MosqueSilhouette } from "@/components/ui/mosque-silhouette";
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
      <section
        className="relative overflow-hidden text-on-dark"
        style={{ backgroundImage: "linear-gradient(155deg, #124a37, #0a1c15)" }}
      >
        <Lattice opacity={0.45} />
        <MosqueSilhouette className="absolute right-0 -bottom-1 w-[560px] max-w-[52%] text-emerald-mid opacity-40" />
        <div className="relative mx-auto max-w-[1200px] px-6 py-20 md:px-8 md:py-28">
          <div className="max-w-[760px]">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="eyebrow text-gold">La caisse · Transparence</span>
              <span className="font-arabic text-2xl text-gold" lang="ar">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </span>
            </div>
            <h1 className="font-display mt-6 text-[44px] leading-[1.04] text-on-dark md:text-[68px]">
              Chaque don, chaque dépense — visible de tous.
            </h1>
            <p className="mt-6 max-w-[620px] text-[18px] leading-[1.6] font-light text-on-dark-muted md:text-[21px]">
              Un fonds transparent pour la mussalla. Ce que la communauté donne, et ce qu’elle
              dépense, en direct — sur l’écran de la salle et sur le téléphone de chacun. Ce que cela
              construit n’est pas un écran : c’est la confiance.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/don"
                className="inline-flex h-12 items-center gap-2 rounded-[2px] bg-gold px-6 text-[15px] font-semibold text-ink transition active:scale-[0.98] hover:opacity-90"
              >
                <HeartIcon width={18} height={18} />
                Faire un don
              </Link>
              <Link
                href="/caisse"
                className="inline-flex h-12 items-center gap-2 rounded-[2px] border border-on-dark/25 px-6 text-[15px] font-medium text-on-dark transition hover:bg-white/5"
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
        <Lattice opacity={0.35} />
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-center px-6 py-20 text-center md:px-8 md:py-24">
          <span className="font-arabic text-[32px] leading-none text-gold" lang="ar">
            بارك الله فيكم
          </span>
          <h2 className="font-display mt-4 max-w-[760px] text-[34px] leading-tight md:text-[46px]">
            Qu’Allah récompense les donateurs.
          </h2>
          <p className="mt-4 max-w-[520px] text-[17px] text-on-dark-muted">
            Merci à toutes celles et ceux qui font vivre la mussalla. Chaque geste, si petit
            soit-il, compte.
          </p>
          <Link
            href="/don"
            className="mt-9 inline-flex h-12 items-center gap-2 rounded-[2px] bg-gold px-7 text-[15px] font-semibold text-ink transition active:scale-[0.98] hover:opacity-90"
          >
            <HeartIcon width={18} height={18} />
            Faire un don
          </Link>
        </div>
      </section>
    </>
  );
}
