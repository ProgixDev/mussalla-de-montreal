import { GoalCard } from "@/components/board/goal-card";
import { ContributionRow, ExpenseRow } from "@/components/board/rows";
import { MosqueSilhouette } from "@/components/ui/mosque-silhouette";
import type { CaisseData } from "@/core/data/types";
import type { CaisseTotals } from "@/core/data/derive";
import { formatCAD } from "@/lib/format";

/**
 * The four rotating TV pages. Plain presentational functions (rendered inside the
 * client screen). Big type, high contrast — legible from across the prayer hall.
 */
type PageProps = { data: CaisseData; totals: CaisseTotals };

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow mb-6 text-muted-ink">{children}</p>;
}

export function ObjectifsPage({ data }: PageProps) {
  return (
    <div className="w-full">
      <Eyebrow>Nos objectifs en cours</Eyebrow>
      <div className="space-y-8">
        {data.goals.slice(0, 3).map((goal) => (
          <GoalCard key={goal.id} goal={goal} size="tv" />
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
        <p className="font-display nums text-[64px] leading-none text-emerald">
          {formatCAD(totals.monthInCents)}
        </p>
        <p className="mt-4 text-[19px] text-muted-ink">
          {totals.contributionCount} contributions · carte et espèces
        </p>
        <p className="mt-6 max-w-[380px] text-[16px] leading-relaxed text-faint">
          Un don anonyme reste anonyme à l’écran — mais compte dans le total, comme les autres.
        </p>
      </div>
      <div>
        {data.contributions.slice(0, 6).map((c) => (
          <ContributionRow key={c.id} contribution={c} size="tv" />
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
        <p className="font-display nums text-[64px] leading-none text-ink">
          {formatCAD(totals.balanceCents)}
        </p>
        <div className="mt-8 space-y-4">
          <div>
            <p className="eyebrow text-muted-ink">Entrées ce mois-ci</p>
            <p className="font-display nums mt-1 text-3xl text-emerald">
              {formatCAD(totals.monthInCents)}
            </p>
          </div>
          <div>
            <p className="eyebrow text-muted-ink">Sorties ce mois-ci</p>
            <p className="font-display nums mt-1 text-3xl text-ink">
              {formatCAD(totals.monthOutCents)}
            </p>
          </div>
        </div>
      </div>
      <div>
        <Eyebrow>Dépenses récentes</Eyebrow>
        {data.expenses.map((e) => (
          <ExpenseRow key={e.id} expense={e} size="tv" />
        ))}
      </div>
    </div>
  );
}

export function AccueilPage() {
  return (
    <div className="flex w-full flex-col items-center text-center">
      <p className="font-arabic text-[34px] leading-none text-gold-strong" lang="ar">
        بارك الله فيكم
      </p>
      <h2 className="font-display mt-3 max-w-[780px] text-[47px] leading-[1.12] text-ink">
        Qu’Allah récompense les donateurs
      </h2>
      <p className="mt-4 max-w-[520px] text-[18px] text-muted-ink">
        Merci à toutes celles et ceux qui font vivre la mussalla. Chaque geste, si petit soit-il,
        compte.
      </p>
      <MosqueSilhouette className="mt-8 w-[300px] text-emerald animate-floaty" />
    </div>
  );
}

export const TV_PAGE_COMPONENTS = [ObjectifsPage, ContributionsPage, CaissePage, AccueilPage];
