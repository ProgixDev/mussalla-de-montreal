import Link from "next/link";
import type { Metadata } from "next";
import { Flythrough } from "@/features/flythrough";
import { Girih } from "@/components/ui/girih";
import { Ornament } from "@/components/ui/ornament";
import { Star8 } from "@/components/ui/star";
import { NicheCard } from "@/components/ui/niche";
import { ArrowRightIcon, LockIcon, PhoneIcon, TvIcon } from "@/components/ui/icons";
import { getCaisseData } from "@/core/data/seed";
import { computeTotals, goalPercent } from "@/core/data/derive";
import { formatCAD } from "@/lib/format";
import { site } from "@/core/site";

export const metadata: Metadata = {
  title: "Accueil",
  description: site.description,
  alternates: { canonical: "/" },
};

const STEPS = [
  {
    title: "Vous donnez, sur place",
    text: "À la mussalla, en main propre — à votre nom, ou de façon anonyme si vous préférez.",
  },
  {
    title: "Un gestionnaire l’inscrit",
    text: "Chaque don reçu et chaque dépense payée est enregistré dans la caisse, le jour même.",
  },
  {
    title: "Tout le monde le voit",
    text: "Sur l’écran de la salle et sur votre téléphone. L’anonymat est respecté, mais chaque don compte dans le total.",
  },
];

/**
 * Accueil — « Chaque don allume une lumière ». The page opens as a walk down the
 * mussalla's gallery (a Blender fly-through scrubbed by scroll, see features/flythrough),
 * and continues at night: the ledger, then how it works.
 */
export default function AccueilPage() {
  const data = getCaisseData();
  const totals = computeTotals(data);
  const gifts = data.contributions.slice(0, 5);
  const spend = data.expenses.slice(0, 5);
  const ticker = data.contributions.slice(0, 8);

  return (
    <div className="bg-night text-on-dark">
      <Flythrough
        balanceCents={totals.balanceCents}
        monthInCents={totals.monthInCents}
        monthOutCents={totals.monthOutCents}
        goals={data.goals.map((g) => ({
          id: g.id,
          title: g.title,
          percent: goalPercent(g),
          raisedCents: g.raisedCents,
          targetCents: g.targetCents,
        }))}
      />

      {/* ── Le registre ─────────────────────────────────────────────── */}
      <section id="fin-galerie" className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(80% 60% at 50% 0%, rgba(26,107,80,0.28), transparent 70%), linear-gradient(180deg, #05100c 0%, var(--night) 40%)",
          }}
        />
        <Girih id="girih-registre" opacity={0.06} color="var(--gold)" className="-z-10" />

        {/* A slow ticker of the latest gifts — the caisse breathing. Decorative: the same
            lines are in the ledger below, which is what screen readers get. */}
        <div aria-hidden="true" className="border-gold/10 relative border-y bg-white/[0.02] py-4">
          <div className="group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
            <div className="flex shrink-0 animate-[ticker_48s_linear_infinite] items-center gap-10 pr-10 group-hover:[animation-play-state:paused]">
              {[...ticker, ...ticker].map((c, i) => (
                <span
                  key={`${c.id}-${i}`}
                  className="flex shrink-0 items-center gap-3 text-[15px] whitespace-nowrap"
                >
                  <Star8 size={10} className="text-gold/70" />
                  <span className="text-on-dark">{c.name}</span>
                  <span className="nums text-gold-light font-semibold">
                    {formatCAD(c.amountCents)}
                  </span>
                  <span className="text-on-dark-faint">{c.date}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,400px)_1fr] lg:gap-16">
            <div>
              <span className="eyebrow text-gold">Le registre</span>
              <h2 className="font-display text-on-dark mt-4 text-[36px] leading-[1.05] md:text-[56px]">
                Chaque ligne, à la lumière.
              </h2>
              <Ornament className="text-gold mt-6" width={170} />
              <p className="text-on-dark-muted mt-6 text-[17px] leading-relaxed">
                Ce que la caisse a reçu, ce qu’elle a payé, et quand. Les mêmes lignes que l’écran
                de la salle — rien n’est retiré.
              </p>
              <p className="border-gold/15 text-on-dark-muted mt-6 flex items-start gap-3 rounded-[14px] border bg-white/[0.03] p-4 text-[14px] leading-relaxed">
                <LockIcon width={18} height={18} className="text-gold mt-0.5 shrink-0" />
                Un don anonyme reste anonyme à l’écran — mais il compte dans chaque total, comme
                tous les autres.
              </p>
              <Link
                href="/caisse"
                className="text-gold-light mt-8 inline-flex items-center gap-2 text-[15px] font-medium underline-offset-4 hover:underline"
              >
                Voir toute la caisse
                <ArrowRightIcon width={16} height={16} />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Ledger
                title="Entrées récentes"
                sign="+"
                rows={gifts.map((c) => ({
                  id: c.id,
                  label: c.name,
                  anon: c.anon,
                  meta: `${c.type === "mensuel" ? "Mensuel" : "Ponctuel"} · ${c.date}`,
                  amount: formatCAD(c.amountCents),
                }))}
              />
              <Ledger
                title="Sorties récentes"
                sign="−"
                rows={spend.map((e) => ({
                  id: e.id,
                  label: e.item,
                  meta: `${e.cat} · ${e.date}`,
                  amount: formatCAD(e.amountCents),
                }))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ───────────────────────────────────────── */}
      <section className="border-gold/10 relative isolate overflow-hidden border-t">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(70% 70% at 50% 100%, rgba(217,189,119,0.12), transparent 70%), var(--night)",
          }}
        />
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-[640px] text-center">
            <span className="eyebrow text-gold">Comment ça marche</span>
            <h2 className="font-display text-on-dark mt-4 text-[36px] leading-[1.05] md:text-[56px]">
              Du don à l’écran, en trois gestes.
            </h2>
            <Ornament className="text-gold mx-auto mt-6" width={170} />
          </div>

          <ol className="mt-16 grid gap-x-6 gap-y-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <NicheCard
                  id={`niche-step-${i}`}
                  tone="dark"
                  className="text-center"
                  nicheClassName="max-w-[150px]"
                  niche={
                    <span
                      aria-hidden="true"
                      className="relative flex size-[96px] items-center justify-center"
                    >
                      <Star8 size={96} className="text-gold/15 absolute inset-0" />
                      <span className="font-display text-gold-light relative text-[36px] leading-none">
                        {i + 1}
                      </span>
                    </span>
                  }
                >
                  <h3 className="font-display text-on-dark mt-6 text-[23px]">{step.title}</h3>
                  <p className="text-on-dark-muted mt-2 text-[15px] leading-relaxed">{step.text}</p>
                </NicheCard>
              </li>
            ))}
          </ol>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tv"
              className="border-gold/25 text-on-dark hover:border-gold/60 inline-flex h-12 items-center gap-2 rounded-full border bg-white/[0.03] px-6 text-[14px] font-medium transition hover:bg-white/[0.06]"
            >
              <TvIcon width={18} height={18} className="text-gold" />
              L’écran de la salle
            </Link>
            <Link
              href="/caisse"
              className="border-gold/25 text-on-dark hover:border-gold/60 inline-flex h-12 items-center gap-2 rounded-full border bg-white/[0.03] px-6 text-[14px] font-medium transition hover:bg-white/[0.06]"
            >
              <PhoneIcon width={18} height={18} className="text-gold" />
              La vue téléphone
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/** One page of the account book, at night: label · dotted leader · amount. */
function Ledger({
  title,
  sign,
  rows,
}: {
  title: string;
  sign: "+" | "−";
  rows: { id: string; label: string; meta: string; amount: string; anon?: boolean }[];
}) {
  const incoming = sign === "+";
  return (
    <div className="border-gold/15 rounded-[18px] border bg-white/[0.035] px-5 pt-5 pb-2 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur-sm">
      <h3 className="border-gold/15 flex items-center gap-3 border-b pb-4">
        <span
          aria-hidden="true"
          className={`font-display flex size-8 items-center justify-center rounded-full text-[19px] leading-none ${
            incoming ? "bg-gold/15 text-gold-light" : "text-on-dark bg-white/[0.06]"
          }`}
        >
          {sign}
        </span>
        <span className="font-display text-on-dark text-[21px]">{title}</span>
      </h3>
      <ul>
        {rows.map((r) => (
          <li key={r.id} className="border-b border-white/[0.06] py-3.5 last:border-0">
            <div className="flex items-baseline gap-2">
              <span className="text-on-dark flex min-w-0 items-center gap-1.5 truncate text-[15px] font-medium">
                {r.anon && (
                  <LockIcon width={13} height={13} className="text-on-dark-faint shrink-0" />
                )}
                {r.label}
              </span>
              <span aria-hidden="true" className="leader flex-1 opacity-60" />
              <span
                className={`nums shrink-0 text-[15px] font-semibold ${incoming ? "text-gold-light" : "text-on-dark"}`}
              >
                {r.amount}
              </span>
            </div>
            <p className="text-on-dark-faint mt-0.5 text-[12.5px]">{r.meta}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
