"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  CoinsIcon,
  HandHeartIcon,
  PlusIcon,
  ReceiptIcon,
  TargetIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { ContributionRow, ExpenseRow } from "@/components/board/rows";
import {
  goalPercent,
  goalProgress,
  goalRemainingCents,
  sumContributions,
  sumExpenses,
  TV_PAGES,
} from "@/core/data/derive";
import { formatCAD, formatNumber } from "@/lib/format";
import { useBackoffice } from "./provider";

/* ---------- shared admin bits ---------- */

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-[2px] bg-emerald px-3.5 text-[13px] font-semibold text-on-dark transition active:scale-[0.98] hover:bg-emerald-deep"
    >
      <PlusIcon width={16} height={16} />
      {children}
    </button>
  );
}

function EditLink({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-[13px] font-medium text-emerald hover:underline">
      Modifier
    </button>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[8px] border border-hairline bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-[20px] text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({
  Icon,
  message,
  action,
}: {
  Icon: typeof PlusIcon;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[6px] border border-dashed border-hairline-strong px-6 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-tint text-emerald">
        <Icon width={22} height={22} />
      </span>
      <p className="text-[14px] text-muted-ink">{message}</p>
      {action}
    </div>
  );
}

function useTotals() {
  const contributions = useBackoffice((s) => s.contributions);
  const expenses = useBackoffice((s) => s.expenses);
  const opening = useBackoffice((s) => s.openingCents);
  const monthIn = sumContributions(contributions);
  const monthOut = sumExpenses(expenses);
  return { monthIn, monthOut, balance: opening + monthIn - monthOut, count: contributions.length };
}

/* ---------- Dashboard ---------- */

export function Dashboard() {
  const goals = useBackoffice((s) => s.goals);
  const contributions = useBackoffice((s) => s.contributions);
  const expenses = useBackoffice((s) => s.expenses);
  const display = useBackoffice((s) => s.display);
  const setSection = useBackoffice((s) => s.setSection);
  const { monthIn, monthOut, balance, count } = useTotals();

  const cards = [
    { label: "Solde de la caisse", value: formatCAD(balance), tone: "ink", Icon: CoinsIcon },
    { label: "Entrées du mois", value: formatCAD(monthIn), tone: "emerald", Icon: HandHeartIcon },
    { label: "Sorties du mois", value: formatCAD(monthOut), tone: "ink", Icon: ReceiptIcon },
    { label: "Contributions", value: formatNumber(count), tone: "ink", Icon: UsersIcon },
  ] as const;

  const status =
    display.mode === "pinned"
      ? `Épinglé · ${TV_PAGES[display.pinnedPage]?.label}`
      : `Rotation · ${display.rotationSpeed} s par page`;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-[8px] border border-hairline bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="eyebrow text-faint">{c.label}</p>
              <span className="flex size-8 items-center justify-center rounded-full bg-tint text-emerald">
                <c.Icon width={16} height={16} />
              </span>
            </div>
            <p
              className={cn(
                "font-display nums mt-2 text-[32px] leading-none",
                c.tone === "emerald" ? "text-emerald" : "text-ink",
              )}
            >
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Objectifs actifs">
          <div className="space-y-4">
            {goals.map((g) => (
              <div key={g.id}>
                <div className="flex items-baseline justify-between gap-3 text-[14px]">
                  <span className="font-medium text-ink">{g.title}</span>
                  <span className="nums text-muted-ink">
                    {formatCAD(g.raisedCents)} / {formatCAD(g.targetCents)}
                  </span>
                </div>
                <ProgressBar value={goalProgress(g)} className="mt-2" height={8} />
              </div>
            ))}
          </div>
        </Panel>

        {/* Contrôle de l’affichage — dark card */}
        <section className="flex flex-col rounded-[8px] bg-ink p-6 text-on-dark">
          <p className="eyebrow text-gold">Contrôle de l’affichage</p>
          <p className="font-display mt-3 text-[26px] leading-tight">{status}</p>
          <p className="mt-2 text-[14px] text-on-dark-muted">
            C’est ce que la salle voit en ce moment sur l’écran TV.
          </p>
          <div className="mt-auto flex flex-wrap gap-3 pt-5">
            <button
              onClick={() => setSection("display")}
              className="h-9 rounded-[2px] bg-gold px-4 text-[13px] font-semibold text-ink transition active:scale-[0.98] hover:opacity-90"
            >
              Gérer l’affichage
            </button>
            <Link
              href="/tv"
              className="flex h-9 items-center rounded-[2px] border border-hairline-dark px-4 text-[13px] font-medium text-on-dark transition hover:bg-white/5"
            >
              Voir l’écran
            </Link>
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Dernières contributions">
          {contributions.slice(0, 5).map((c) => (
            <ContributionRow key={c.id} contribution={c} publicView={false} />
          ))}
        </Panel>
        <Panel title="Dernières dépenses">
          {expenses.slice(0, 5).map((e) => (
            <ExpenseRow key={e.id} expense={e} />
          ))}
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Contributions ---------- */

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn("eyebrow px-3 py-2 text-left text-faint", className)}>{children}</th>
  );
}
function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-3 text-[14px] text-ink", className)}>{children}</td>;
}

export function Contributions() {
  const rows = useBackoffice((s) => s.contributions);
  const openModal = useBackoffice((s) => s.openModal);
  return (
    <Panel
      title="Contributions"
      action={<AddButton onClick={() => openModal("contribution", "add")}>Ajouter une contribution</AddButton>}
    >
      {rows.length === 0 ? (
        <EmptyState
          Icon={CoinsIcon}
          message="Aucune contribution pour l’instant."
          action={
            <AddButton onClick={() => openModal("contribution", "add")}>
              Ajouter une contribution
            </AddButton>
          }
        />
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-hairline">
              <Th>Personne</Th>
              <Th className="text-right">Montant</Th>
              <Th>Type</Th>
              <Th>Source</Th>
              <Th>Date</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-row-divider last:border-0">
                <Td>
                  <span className="font-medium">{c.anon ? c.realName ?? "Anonyme" : c.name}</span>
                  {c.anon && (
                    <span className="ml-2 rounded-full bg-tint px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald uppercase">
                      Anonyme
                    </span>
                  )}
                </Td>
                <Td className="nums text-right font-semibold">{formatCAD(c.amountCents)}</Td>
                <Td>{c.type === "mensuel" ? "Mensuel" : "Ponctuel"}</Td>
                <Td>{c.source}</Td>
                <Td className="text-muted-ink">{c.date}</Td>
                <Td className="text-right">
                  <EditLink onClick={() => openModal("contribution", "edit", c.id)} />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </Panel>
  );
}

/* ---------- Expenses ---------- */

export function Expenses() {
  const rows = useBackoffice((s) => s.expenses);
  const openModal = useBackoffice((s) => s.openModal);
  return (
    <Panel
      title="Dépenses"
      action={<AddButton onClick={() => openModal("expense", "add")}>Ajouter une dépense</AddButton>}
    >
      {rows.length === 0 ? (
        <EmptyState
          Icon={ReceiptIcon}
          message="Aucune dépense enregistrée."
          action={
            <AddButton onClick={() => openModal("expense", "add")}>Ajouter une dépense</AddButton>
          }
        />
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-hairline">
              <Th>Poste</Th>
              <Th>Catégorie</Th>
              <Th className="text-right">Montant</Th>
              <Th>Date</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-b border-row-divider last:border-0">
                <Td className="font-medium">{e.item}</Td>
                <Td className="text-muted-ink">{e.cat}</Td>
                <Td className="nums text-right font-semibold">{formatCAD(e.amountCents)}</Td>
                <Td className="text-muted-ink">{e.date}</Td>
                <Td className="text-right">
                  <EditLink onClick={() => openModal("expense", "edit", e.id)} />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </Panel>
  );
}

/* ---------- Goals ---------- */

export function Goals() {
  const goals = useBackoffice((s) => s.goals);
  const openModal = useBackoffice((s) => s.openModal);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddButton onClick={() => openModal("goal", "add")}>Créer un objectif</AddButton>
      </div>
      {goals.length === 0 && (
        <EmptyState
          Icon={TargetIcon}
          message="Aucun objectif actif. Créez-en un pour lancer une collecte."
          action={<AddButton onClick={() => openModal("goal", "add")}>Créer un objectif</AddButton>}
        />
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g) => (
          <div key={g.id} className="rounded-[8px] border border-hairline bg-white p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-[19px] text-ink">{g.title}</h3>
              <span className="nums text-sm font-medium text-emerald">{goalPercent(g)} %</span>
            </div>
            <ProgressBar value={goalProgress(g)} className="mt-2" height={8} />
            <p className="mt-2 text-[13px] text-muted-ink">
              <span className="nums font-semibold text-ink">{formatCAD(g.raisedCents)}</span> sur{" "}
              <span className="nums">{formatCAD(g.targetCents)}</span> · il reste{" "}
              <span className="nums">{formatCAD(goalRemainingCents(g))}</span>
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[13px] text-faint">Échéance : {g.due}</span>
              <EditLink onClick={() => openModal("goal", "edit", g.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Display (Affichage) ---------- */

export function Display() {
  const display = useBackoffice((s) => s.display);
  const setDisplay = useBackoffice((s) => s.setDisplay);
  const status =
    display.mode === "pinned"
      ? `Épinglé sur « ${TV_PAGES[display.pinnedPage]?.label} »`
      : `Rotation automatique · ${display.rotationSpeed} s par page`;

  return (
    <div className="max-w-[620px] space-y-5">
      <Panel title="Mode d’affichage">
        <div className="grid grid-cols-2 overflow-hidden rounded-[2px] border border-hairline-strong">
          {[
            { v: "rotation", label: "Rotation automatique" },
            { v: "pinned", label: "Épingler une page" },
          ].map((o, i) => (
            <button
              key={o.v}
              onClick={() => setDisplay({ mode: o.v as "rotation" | "pinned" })}
              className={cn(
                "py-2.5 text-[14px] font-medium transition-colors",
                i > 0 && "border-l border-hairline-strong",
                display.mode === o.v ? "bg-emerald text-on-dark" : "bg-white text-body hover:bg-tint",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        {display.mode === "rotation" ? (
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <span className="eyebrow text-muted-ink">Vitesse</span>
              <span className="nums text-[14px] font-semibold text-ink">
                {display.rotationSpeed} s
              </span>
            </div>
            <input
              type="range"
              min={8}
              max={40}
              step={1}
              value={display.rotationSpeed}
              onChange={(e) => setDisplay({ rotationSpeed: Number(e.target.value) })}
              className="mt-2 w-full accent-emerald"
            />
            <div className="flex justify-between text-[11px] text-faint">
              <span>8 s</span>
              <span>40 s</span>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            {TV_PAGES.map((page, i) => (
              <button
                key={page.key}
                onClick={() => setDisplay({ pinnedPage: i })}
                className={cn(
                  "flex w-full items-center justify-between rounded-[4px] border px-4 py-3 text-left text-[14px] transition",
                  display.pinnedPage === i
                    ? "border-emerald bg-tint text-ink"
                    : "border-hairline bg-white text-body hover:border-emerald/40",
                )}
              >
                {page.label}
                {display.pinnedPage === i && (
                  <span className="size-2.5 rounded-full bg-emerald" />
                )}
              </button>
            ))}
          </div>
        )}
      </Panel>

      <div className="flex items-center justify-between rounded-[8px] border border-hairline bg-white px-5 py-4">
        <p className="text-[14px] text-muted-ink">
          En ce moment : <span className="font-medium text-ink">{status}</span>
        </p>
        <Link href="/tv" className="text-[13px] font-semibold text-emerald hover:underline">
          Voir l’écran TV →
        </Link>
      </div>
    </div>
  );
}

/* ---------- Members ---------- */

export function Members() {
  const members = useBackoffice((s) => s.members);
  const managers = members.length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-muted-ink">
          142 membres inscrits · <span className="font-medium text-ink">{managers} gestionnaires</span>
        </p>
        <button className="inline-flex h-9 items-center gap-1.5 rounded-[2px] bg-emerald px-3.5 text-[13px] font-semibold text-on-dark transition active:scale-[0.98] hover:bg-emerald-deep">
          <PlusIcon width={16} height={16} />
          Inviter un gestionnaire
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {members.map((m) => (
          <div key={m.id} className="rounded-[8px] border border-hairline bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-tint font-display text-[16px] text-emerald">
                {m.initials}
              </span>
              <div>
                <p className="font-medium text-ink">{m.name}</p>
                <p className="text-[13px] text-muted-ink">{m.role}</p>
              </div>
              {m.active && (
                <span className="ml-auto rounded-full bg-tint px-2.5 py-0.5 text-[11px] font-semibold text-emerald">
                  Actif
                </span>
              )}
            </div>
            <p className="mt-3 text-[13px] text-faint">Accès : {m.scope}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export const SECTION_TITLES: Record<string, string> = {
  dashboard: "Tableau de bord",
  contributions: "Contributions",
  expenses: "Dépenses",
  goals: "Objectifs",
  display: "Affichage",
  members: "Membres",
};
