import Image from "next/image";
import type { Metadata } from "next";
import { BalanceCard } from "@/components/board/balance-card";
import { GoalCard } from "@/components/board/goal-card";
import { ContributionRow, ExpenseRow, SectionLabel } from "@/components/board/rows";
import { QrCode } from "@/components/board/qr-code";
import { Ornament } from "@/components/ui/ornament";
import { Star8 } from "@/components/ui/star";
import { CheckIcon, LockIcon } from "@/components/ui/icons";
import { getCaisseData } from "@/core/data/seed";
import { computeTotals } from "@/core/data/derive";
import { site } from "@/core/site";

export const metadata: Metadata = {
  title: "La caisse",
  description: "La caisse de la Mussalla de Montréal, en direct.",
};

/**
 * Vue téléphone — the public live board a QR scan opens, at night like the home page.
 *
 * The two breakpoints serve different people, so they show different things:
 *  - Phone: the board itself, under a lamplit band of the gallery. This is the
 *    destination of the TV's QR code.
 *  - Desktop: an explanation and a large QR to scan — whoever is at a desk wants the
 *    code that moves the board to their pocket.
 *
 * Read-only — there is no donation path on the site, and the real name behind an
 * anonymous gift is never shown here.
 */
export default function CaissePage() {
  const data = getCaisseData();
  const totals = computeTotals(data);

  return (
    <main className="bg-night text-on-dark relative isolate min-h-dvh overflow-hidden">
      {/* Desktop backdrop: the gallery, deep in shadow. */}
      <Image
        src="/hero-galerie-wide.jpg"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 hidden object-cover object-[65%_50%] lg:block"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden lg:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(5,16,12,0.96) 0%, rgba(5,16,12,0.86) 45%, rgba(5,16,12,0.55) 100%)",
        }}
      />
      <div aria-hidden="true" className="grain pointer-events-none absolute inset-0 -z-10" />

      <div className="relative mx-auto grid w-full max-w-[1120px] lg:min-h-[calc(100dvh-9rem)] lg:grid-cols-[1fr_minmax(0,420px)] lg:items-center lg:gap-16 lg:px-8 lg:py-12">
        {/* ── Desktop: what this page is ── */}
        <aside className="animate-rise hidden lg:block" style={{ animationDelay: "0.06s" }}>
          <p className="eyebrow text-gold">Vue téléphone · public</p>
          <h1 className="font-display text-on-dark mt-4 text-[52px] leading-[1.04]">
            Le même tableau, <span className="text-gold-light">dans la poche.</span>
          </h1>
          <Ornament className="text-gold mt-6" width={170} />
          <p className="text-on-dark-muted mt-6 max-w-[440px] text-[17px] leading-relaxed">
            Ouvert en scannant le code QR de l’écran de la salle. On y voit la caisse en temps réel
            : le solde, l’avancement de chaque objectif, et les dépenses, une par une.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Solde et objectifs en temps réel",
              "Chaque dépense, avec sa date",
              "Rien à installer — ça s’ouvre dans le navigateur",
            ].map((t) => (
              <li key={t} className="text-on-dark flex items-center gap-3 text-[15px]">
                <CheckIcon width={18} height={18} className="text-gold shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </aside>

        {/* ── Desktop: the code that moves the board to a phone ── */}
        <div className="animate-rise hidden lg:block" style={{ animationDelay: "0.14s" }}>
          <div className="border-gold/20 bg-night/60 flex flex-col items-center rounded-[22px] border px-8 pt-10 pb-9 text-center shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-md">
            <div className="rounded-[14px] bg-white p-4 shadow-[0_0_60px_-10px_rgba(236,217,160,0.45)]">
              <QrCode url={`${site.url}/caisse`} size={250} />
            </div>
            <p className="font-display text-on-dark mt-7 flex items-center gap-2 text-[22px]">
              <Star8 size={13} className="text-gold" />
              Scannez pour ouvrir
            </p>
            <p className="text-on-dark-muted mt-1.5 text-[15px]">sur votre téléphone</p>
            <p className="nums border-gold/15 text-on-dark-faint mt-5 w-full border-t pt-4 text-[13px]">
              {site.host}
            </p>
          </div>
        </div>

        {/* ── Phone: the board itself ── */}
        <div className="lg:hidden">
          {/* Lamplit band: the gallery at the head of the board. */}
          <header className="relative isolate flex h-[230px] flex-col justify-end overflow-hidden px-5 pb-6">
            <Image
              src="/hero-galerie-tall.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="-z-20 object-cover object-[50%_46%]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "linear-gradient(180deg, rgba(5,16,12,0.55) 0%, rgba(5,16,12,0.25) 40%, rgba(5,16,12,0.85) 85%, var(--night) 100%)",
              }}
            />
            <p className="text-gold-light flex items-center gap-2 text-[12px] tracking-[0.16em] uppercase">
              <span className="bg-gold-light animate-livepulse inline-block size-1.5 rounded-full" />
              En direct
            </p>
            <h1 className="font-display text-on-dark mt-2 text-[38px] leading-none">La caisse</h1>
            <p className="text-on-dark-muted mt-1.5 text-[14px]">Mussalla de Montréal</p>
          </header>

          <div className="space-y-6 px-4 pt-2 pb-12">
            <BalanceCard
              balanceCents={totals.balanceCents}
              monthInCents={totals.monthInCents}
              monthOutCents={totals.monthOutCents}
              className="shadow-[0_0_0_1px_rgba(217,189,119,0.12),0_30px_60px_-30px_rgba(0,0,0,0.9)]"
            />

            <section>
              <SectionLabel tone="dark" className="mb-3 px-1">
                Objectifs
              </SectionLabel>
              <div className="space-y-3">
                {data.goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="border-gold/15 rounded-[14px] border bg-white/[0.035] p-4"
                  >
                    <GoalCard goal={goal} tone="dark" />
                  </div>
                ))}
              </div>
            </section>

            <section className="border-gold/15 rounded-[14px] border bg-white/[0.035] px-4 py-2">
              <SectionLabel tone="dark" className="pt-2 pb-1">
                Contributions récentes
              </SectionLabel>
              {data.contributions.slice(0, 6).map((c) => (
                <ContributionRow key={c.id} contribution={c} tone="dark" />
              ))}
            </section>

            <section className="border-gold/15 rounded-[14px] border bg-white/[0.035] px-4 py-2">
              <SectionLabel tone="dark" className="pt-2 pb-1">
                Dépenses récentes
              </SectionLabel>
              {data.expenses.map((e) => (
                <ExpenseRow key={e.id} expense={e} tone="dark" />
              ))}
            </section>

            <p className="text-on-dark-faint flex items-start justify-center gap-2 px-2 text-center text-[13px] leading-relaxed">
              <LockIcon width={14} height={14} className="text-gold/70 mt-0.5 shrink-0" />
              Un don anonyme reste anonyme à l’écran — mais compte dans le total, comme les autres.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
