import { GoalCard } from "@/components/board/goal-card";
import { ContributionRow, ExpenseRow } from "@/components/board/rows";
import { MosqueSilhouette } from "@/components/ui/mosque-silhouette";
import { Star8 } from "@/components/ui/star";
import { Ornament } from "@/components/ui/ornament";
import { ArchCrown } from "@/components/ui/arch";
import type { CaisseData } from "@/core/data/types";
import type { CaisseTotals } from "@/core/data/derive";
import { formatCAD } from "@/lib/format";
import { EvenementsPage, FelicitationsPage } from "./portal-pages";

/**
 * The four rotating TV pages. Plain presentational functions (rendered inside the
 * client screen). Big type, high contrast — legible from across the prayer hall.
 */
type PageProps = { data: CaisseData; totals: CaisseTotals };

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow text-gold mb-6 flex items-center gap-2.5">
      <Star8 size={12} />
      {children}
    </p>
  );
}

export function ObjectifsPage({ data }: PageProps) {
  return (
    <div className="w-full">
      <Eyebrow>Nos objectifs en cours</Eyebrow>
      {/* One full-width row of circular gauges — readable from across the hall. */}
      <div className="grid grid-cols-3 items-start gap-[clamp(24px,3.5vw,72px)]">
        {data.goals.slice(0, 3).map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            size="tv"
            layout="stack"
            ringClassName="w-[clamp(96px,11vw,200px)]"
            tone="dark"
          />
        ))}
      </div>
    </div>
  );
}

export function ContributionsPage({ data, totals }: PageProps) {
  return (
    <div className="grid w-full gap-12 md:grid-cols-[minmax(280px,1fr)_1.2fr]">
      <div>
        <Eyebrow>Contributions ce mois-ci</Eyebrow>
        <p className="font-display nums text-gold-light text-[64px] leading-none">
          {formatCAD(totals.monthInCents)}
        </p>
        <p className="text-on-dark-muted mt-4 text-[19px]">
          {totals.contributionCount} contributions · carte et espèces
        </p>
        <p className="text-on-dark-faint mt-6 max-w-[380px] text-[16px] leading-relaxed">
          Un don anonyme reste anonyme à l’écran — mais compte dans le total, comme les autres.
        </p>
      </div>
      <div>
        {data.contributions.slice(0, 6).map((c) => (
          <ContributionRow key={c.id} contribution={c} size="tv" tone="dark" />
        ))}
      </div>
    </div>
  );
}

export function CaissePage({ data, totals }: PageProps) {
  return (
    <div className="grid w-full gap-12 md:grid-cols-[minmax(280px,1fr)_1.2fr]">
      <div>
        <Eyebrow>Solde de la caisse</Eyebrow>
        <p className="font-display nums text-on-dark text-[64px] leading-none">
          {formatCAD(totals.balanceCents)}
        </p>
        <div className="mt-8 space-y-4">
          <div>
            <p className="eyebrow text-on-dark-muted">Entrées ce mois-ci</p>
            <p className="font-display nums text-gold-light mt-1 text-3xl">
              {formatCAD(totals.monthInCents)}
            </p>
          </div>
          <div>
            <p className="eyebrow text-on-dark-muted">Sorties ce mois-ci</p>
            <p className="font-display nums text-on-dark mt-1 text-3xl">
              {formatCAD(totals.monthOutCents)}
            </p>
          </div>
        </div>
      </div>
      <div>
        <Eyebrow>Dépenses récentes</Eyebrow>
        {data.expenses.map((e) => (
          <ExpenseRow key={e.id} expense={e} size="tv" tone="dark" />
        ))}
      </div>
    </div>
  );
}

export function AccueilPage() {
  return (
    <div className="flex w-full flex-col items-center text-center">
      {/* The devotional page: the du'a sits inside a mihrab-like arch. */}
      <ArchCrown width={340} className="mb-1" tone="text-gold" />
      <p className="font-arabic text-gold-light text-[38px] leading-none" lang="ar">
        بارك الله فيكم
      </p>
      <h2 className="font-display text-on-dark mt-3 max-w-[780px] text-[50px] leading-[1.12]">
        Qu’Allah récompense les donateurs
      </h2>
      <Ornament className="text-gold mt-5" width={240} />
      <p className="text-on-dark-muted mt-4 max-w-[520px] text-[19px]">
        Merci à toutes celles et ceux qui font vivre la mussalla. Chaque geste, si petit soit-il,
        compte.
      </p>
      <MosqueSilhouette className="text-gold/40 animate-floaty mt-8 w-[300px]" />
    </div>
  );
}

/** Same order as TV_PAGES (core/data/derive). */
export const TV_PAGE_COMPONENTS = [
  ObjectifsPage,
  ContributionsPage,
  CaissePage,
  FelicitationsPage,
  EvenementsPage,
  AccueilPage,
];
