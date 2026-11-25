"use client";

import { useEffect, useRef, useState } from "react";
import { usePortal } from "@/lib/portal/store";
import { SpaceHeading, SpaceTabs, type SpaceProps } from "../shared";
import { FinanceDashboard, type FinanceTab } from "./finance-dashboard";
import { DEFAULT_JOURNAL_FILTER, FinanceJournal, type JournalFilter } from "./finance-journal";
import { FinanceCount } from "./finance-count";
import { FinanceReports } from "./finance-reports";
import { FinanceCollection } from "./finance-collection";

const TAB_LABELS: Record<FinanceTab, string> = {
  tableau: "Tableau de bord",
  journal: "Journal",
  comptage: "Comptage",
  rapports: "Rapports",
  collecte: "Collecte extérieure",
};

/**
 * Espace Comptabilité (spec §4.10, permissions `finance.*` §3.2) — a transparent
 * operational register, not an accounting package: entries and exits with approval and
 * rectification, the cash-count PV, period reports and the external-collection PV.
 */
export function FinanceSpace({ me }: SpaceProps) {
  const [tab, setTab] = useState<FinanceTab>("tableau");
  const [journalFilter, setJournalFilter] = useState<JournalFilter>(DEFAULT_JOURNAL_FILTER);
  const panelRef = useRef<HTMLDivElement>(null);
  const focusPanel = useRef(false);

  const pendingCount = usePortal((s) => s.transactions.filter((t) => t.status === "soumis").length);
  const countOpen = usePortal((s) => s.cashCount.status !== "cloturee");
  const countMissing = usePortal(
    (s) => s.cashCount.participants.filter((p) => !p.attestedAt).length,
  );
  const collectionMissing = usePortal((s) =>
    Math.max(0, 2 - s.externalCollection.attestations.length),
  );

  // After a jump from a dashboard card, move focus to the newly shown panel.
  useEffect(() => {
    if (!focusPanel.current) return;
    focusPanel.current = false;
    panelRef.current?.focus({ preventScroll: true });
    panelRef.current?.scrollIntoView({ block: "start" });
  }, [tab]);

  const open = (next: FinanceTab, opts?: { pendingOnly?: boolean }) => {
    if (next === "journal")
      setJournalFilter(
        opts?.pendingOnly ? { kind: "tout", status: "soumis" } : DEFAULT_JOURNAL_FILTER,
      );
    focusPanel.current = true;
    setTab(next);
  };

  return (
    <div>
      <SpaceHeading eyebrow="Comptabilité" title={`Salam, ${me.firstName}`}>
        Le registre transparent du centre : les entrées et les sorties, les comptages attestés, les
        rapports. Une opération finalisée ne se modifie jamais — une correction est une nouvelle
        écriture, liée à l’originale.
      </SpaceHeading>

      <SpaceTabs<FinanceTab>
        label="Sections de la comptabilité"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "tableau", label: TAB_LABELS.tableau },
          { id: "journal", label: TAB_LABELS.journal, badge: pendingCount },
          { id: "comptage", label: TAB_LABELS.comptage, badge: countOpen ? countMissing : 0 },
          { id: "rapports", label: TAB_LABELS.rapports },
          { id: "collecte", label: TAB_LABELS.collecte, badge: collectionMissing },
        ]}
      />

      <div
        ref={panelRef}
        role="tabpanel"
        aria-label={TAB_LABELS[tab]}
        tabIndex={-1}
        className="focus-visible:outline-gold-light/60 scroll-mt-24 rounded-[18px] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {tab === "tableau" && <FinanceDashboard onOpen={open} />}
        {tab === "journal" && (
          <FinanceJournal filter={journalFilter} onFilterChange={setJournalFilter} />
        )}
        {tab === "comptage" && <FinanceCount me={me} />}
        {tab === "rapports" && <FinanceReports />}
        {tab === "collecte" && <FinanceCollection me={me} onOpenJournal={() => open("journal")} />}
      </div>
    </div>
  );
}
