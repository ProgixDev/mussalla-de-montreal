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
 * Vue téléphone — the public live board a QR scan opens. Mobile-first (the phone is
 * the frame). On desktop it sits beside an explanatory panel + QR so the page fills
 * the width instead of floating as a lone column. Read-only; the real name behind an
 * anonymous gift is never shown here.
 */
export default function CaissePage() {
  const data = getCaisseData();
  const totals = computeTotals(data);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-sand">
      {/* Girih star-field ground — the quiet geometry under the whole board. */}
      <Girih id="girih-caisse" opacity={0.16} color="var(--gold-strong)" />
      <div className="relative mx-auto grid w-full max-w-[1080px] gap-8 px-4 py-8 md:px-8 md:py-12 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-start">
        {/* Side panel (desktop): explains the phone/QR nature. */}
        <aside className="animate-rise order-2 lg:order-1 lg:pt-6" style={{ animationDelay: "0.06s" }}>
          <p className="eyebrow text-gold-ink">Vue téléphone · public</p>
          <h1 className="font-display mt-3 text-[34px] leading-tight text-ink md:text-[42px]">
            Le même tableau, dans la poche.
          </h1>
          <Ornament className="mt-4 text-gold-deep" width={170} />
          <p className="mt-4 max-w-[420px] text-[16px] leading-relaxed text-muted-ink">
            Ouvert en scannant le code QR de l’écran. On y voit la caisse en temps réel — et l’on
            peut donner par carte en quelques secondes, au nom affiché ou de façon anonyme.
          </p>
          <ul className="mt-5 space-y-2.5">
            {["Paiement sécurisé par Square", "Don unique ou mensuel", "Reçu envoyé par courriel"].map(
              (t) => (
                <li key={t} className="flex items-center gap-2.5 text-[15px] text-body">
                  <CheckIcon width={18} height={18} className="shrink-0 text-emerald" />
                  {t}
                </li>
              ),
            )}
          </ul>
          <div className="mt-7 hidden items-center gap-4 rounded-[8px] border border-gold-deep/25 bg-tint-warm p-4 lg:flex">
            <div className="rounded-[6px] bg-white p-1">
              <QrCode url={`${site.url}/caisse`} size={84} />
            </div>
            <div>
              <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <Star8 size={11} className="text-gold-deep" />
                Scannez pour ouvrir
              </p>
              <p className="text-[12px] text-muted-ink">sur votre téléphone</p>
            </div>
          </div>
        </aside>

        {/* The board (phone-shaped card), crowned by a pointed arch. */}
        <div
          className="animate-rise order-1 mx-auto w-full max-w-[440px] lg:order-2"
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
