import type { Metadata } from "next";
import { BalanceCard } from "@/components/board/balance-card";
import { GoalCard } from "@/components/board/goal-card";
import { ContributionRow, ExpenseRow, SectionLabel } from "@/components/board/rows";
import { QrCode } from "@/components/board/qr-code";
import { Girih } from "@/components/ui/girih";
import { Ornament } from "@/components/ui/ornament";
import { Star8 } from "@/components/ui/star";
import { ArchCrown } from "@/components/ui/arch";
import { CheckIcon } from "@/components/ui/icons";
import { getCaisseData } from "@/core/data/seed";
import { computeTotals } from "@/core/data/derive";
import { site } from "@/core/site";

export const metadata: Metadata = {
  title: "La caisse",
  description: "La caisse de la Mussalla de Montréal, en direct.",
};

/**
 * Vue téléphone — the public live board a QR scan opens.
 *
 * The two breakpoints serve different people, so they show different things:
 *  - Phone: the board itself. This is the destination of the TV's QR code.
 *  - Desktop: an explanation and a large QR to scan. A laptop-sized replica of a
 *    phone board helped nobody; whoever is at a desk wants the code that moves the
 *    board to their pocket.
 *
 * Read-only — there is no donation path on the site, and the real name behind an
 * anonymous gift is never shown here.
 */
export default function CaissePage() {
  const data = getCaisseData();
  const totals = computeTotals(data);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-sand">
      {/* Girih star-field ground — the quiet geometry under the whole board. */}
      <Girih id="girih-caisse" opacity={0.16} color="var(--gold-strong)" />
      {/* Desktop lost the tall board, so the two columns are centred in the viewport
          rather than stranded at the top of an empty page. */}
      <div className="relative mx-auto grid w-full max-w-[1080px] gap-8 px-4 py-8 md:px-8 md:py-12 lg:min-h-[calc(100dvh-9rem)] lg:grid-cols-[1fr_minmax(0,420px)] lg:items-center">
        {/* Side panel (desktop): explains the phone/QR nature. */}
        <aside className="animate-rise order-2 lg:order-1 lg:pt-6" style={{ animationDelay: "0.06s" }}>
          <p className="eyebrow text-gold-ink">Vue téléphone · public</p>
          <h1 className="font-display mt-3 text-[34px] leading-tight text-ink md:text-[42px]">
            Le même tableau, dans la poche.
          </h1>
          <Ornament className="mt-4 text-gold-deep" width={170} />
          <p className="mt-4 max-w-[420px] text-[16px] leading-relaxed text-muted-ink">
            Ouvert en scannant le code QR de l’écran de la salle. On y voit la caisse en temps
            réel : le solde, l’avancement de chaque objectif, et les dépenses, une par une.
          </p>
          <ul className="mt-5 space-y-2.5">
            {[
              "Solde et objectifs en temps réel",
              "Chaque dépense, avec sa date",
              "Rien à installer — ça s’ouvre dans le navigateur",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-[15px] text-body">
                <CheckIcon width={18} height={18} className="shrink-0 text-emerald" />
                {t}
              </li>
            ))}
          </ul>
        </aside>

        {/* Desktop: the scan invitation stands where the board preview used to sit. This
            page is meant to be READ on a phone, so a full-size mirror of it on a laptop was
            only ever decoration — the code that gets you there is the useful thing. */}
        <div
          className="animate-rise order-1 hidden lg:order-2 lg:block"
          style={{ animationDelay: "0.14s" }}
        >
          <ArchCrown className="mx-auto -mb-3" width={190} />
          {/* pt-12 keeps the white code panel clear of the arch's legs. */}
          <div className="flex flex-col items-center rounded-[16px] border border-gold-deep/25 bg-tint-warm px-8 pt-12 pb-9 text-center shadow-frame">
            <div className="rounded-[10px] bg-white p-4 shadow-lift">
              <QrCode url={`${site.url}/caisse`} size={260} />
            </div>
            <p className="font-display mt-6 flex items-center gap-2 text-[20px] text-ink">
              <Star8 size={13} className="text-gold-deep" />
              Scannez pour ouvrir
            </p>
            <p className="mt-1.5 text-[15px] text-muted-ink">sur votre téléphone</p>
            <p className="nums mt-4 border-t border-gold-deep/20 pt-4 text-[13px] text-faint">
              {site.host}
            </p>
          </div>
        </div>

        {/* The board itself (phone-shaped card), crowned by a pointed arch. Phones only —
            this is what a donor actually sees after scanning. */}
        <div
          className="animate-rise order-1 mx-auto w-full max-w-[440px] lg:hidden"
          style={{ animationDelay: "0.14s" }}
        >
          <ArchCrown className="mx-auto -mb-3" width={190} />
          <div className="flex w-full flex-col overflow-hidden rounded-[16px] border border-hairline bg-cream shadow-frame">
          <header className="flex items-center gap-3 border-b border-hairline px-5 py-3.5">
            <div className="leading-tight">
              <p className="font-display text-[17px] text-ink">Mussalla de Montréal</p>
              <p className="flex items-center gap-1.5 text-[11px] tracking-wide text-muted-ink uppercase">
                La caisse
                <span className="mx-0.5 inline-block size-1.5 rounded-full bg-gold-deep animate-livepulse" />
                en direct
              </p>
            </div>
          </header>

          <div className="space-y-6 px-4 py-5">
            <BalanceCard
              balanceCents={totals.balanceCents}
              monthInCents={totals.monthInCents}
              monthOutCents={totals.monthOutCents}
            />

            <section>
              <SectionLabel className="mb-3">Objectifs</SectionLabel>
              <div className="space-y-3">
                {data.goals.map((goal) => (
                  <div key={goal.id} className="rounded-[8px] border border-hairline bg-white p-4">
                    <GoalCard goal={goal} />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[8px] border border-hairline bg-white px-4 py-2">
              <SectionLabel className="pt-2 pb-1">Contributions récentes</SectionLabel>
              {data.contributions.slice(0, 6).map((c) => (
                <ContributionRow key={c.id} contribution={c} />
              ))}
            </section>

            <section className="rounded-[8px] border border-hairline bg-white px-4 py-2">
              <SectionLabel className="pt-2 pb-1">Dépenses récentes</SectionLabel>
              {data.expenses.map((e) => (
                <ExpenseRow key={e.id} expense={e} />
              ))}
            </section>

            <p className="px-1 text-center text-[12px] text-faint">
              Un don anonyme reste anonyme à l’écran — mais compte dans le total, comme les autres.
            </p>
          </div>
          </div>
        </div>
      </div>
    </main>
  );
}
