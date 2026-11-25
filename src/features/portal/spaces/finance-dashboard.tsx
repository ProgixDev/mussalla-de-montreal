"use client";

import { useMemo, useState } from "react";
import { usePortal } from "@/lib/portal/store";
import {
  allAttested,
  collectionReady,
  collectionTotal,
  countTotals,
  summarise,
} from "@/core/portal/derive";
import { EmptyNote, Panel, Pill, StatTile, btn } from "@/components/portal/kit";
import { ArrowRightIcon } from "@/components/ui/icons";
import { formatCAD, formatCADCents, formatDay } from "@/lib/format";
import {
  COUNT_STATUS_META,
  anchorDay,
  categoryLabel,
  formatMonth,
  formatSigned,
  inRange,
  pendingCents,
  periodRange,
  todayIso,
} from "./finance-lib";
import { BarList, LedgerRow, PrivateMarker, StatusPill, TxAmount } from "./finance-ui";

export type FinanceTab = "tableau" | "journal" | "comptage" | "rapports" | "collecte";

/** « Tableau de bord » — the month at a glance and what is waiting for the accountant. */
export function FinanceDashboard({
  onOpen,
}: {
  onOpen: (tab: FinanceTab, opts?: { pendingOnly?: boolean }) => void;
}) {
  const transactions = usePortal((s) => s.transactions);
  const cashCount = usePortal((s) => s.cashCount);
  const collection = usePortal((s) => s.externalCollection);
  const [today] = useState(todayIso);

  const { month, monthTxs } = useMemo(() => {
    const anchor = anchorDay(transactions, today);
    const range = periodRange("mois", anchor);
    return {
      month: { range, label: formatMonth(anchor) },
      monthTxs: transactions.filter((t) => inRange(t.date, range)),
    };
  }, [transactions, today]);

  const sum = summarise(monthTxs);
  const pendingAll = useMemo(
    () =>
      transactions
        .filter((t) => t.status === "soumis")
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions],
  );
  const pendingIn = pendingCents(monthTxs, "entree");
  const pendingOut = pendingCents(monthTxs, "sortie");

  const totals = countTotals(cashCount);
  const attested = cashCount.participants.filter((p) => p.attestedAt).length;
  const countMeta = COUNT_STATUS_META[cashCount.status];

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="fin-month-title">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="fin-month-title" className="font-display text-on-dark text-[22px]">
            {month.label}
          </h2>
          <p className="text-on-dark-faint text-[13px]">
            Opérations soumises incluses, brouillons et annulations exclus.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Entrées du mois"
            value={formatCAD(sum.inCents)}
            tone="gold"
            hint={pendingIn > 0 ? `dont ${formatCAD(pendingIn)} en attente` : "Toutes approuvées"}
          />
          <StatTile
            label="Sorties du mois"
            value={formatCAD(sum.outCents)}
            hint={pendingOut > 0 ? `dont ${formatCAD(pendingOut)} en attente` : "Toutes approuvées"}
          />
          <StatTile
            label="Solde net"
            value={`${sum.netCents < 0 ? "−" : ""}${formatCAD(Math.abs(sum.netCents))}`}
            hint={sum.netCents >= 0 ? "Entrées moins sorties" : "Les sorties dépassent les entrées"}
          />
          <StatTile
            label="Opérations en attente"
            value={pendingAll.length}
            hint={
              pendingAll.length === 0
                ? "Rien à approuver"
                : pendingAll.length === 1
                  ? "1 à approuver"
                  : `${pendingAll.length} à approuver`
            }
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel eyebrow={month.label} title="Entrées par méthode">
            {sum.byMethod.length === 0 ? (
              <EmptyNote>Aucune entrée comptabilisée ce mois-ci.</EmptyNote>
            ) : (
              <BarList
                label={`Entrées par méthode, ${month.label}`}
                format={formatCADCents}
                rows={sum.byMethod.map(([m, cents]) => ({
                  key: m,
                  label: categoryLabel(m, true),
                  cents,
                }))}
              />
            )}
          </Panel>

          <Panel
            eyebrow="À approuver"
            title="Opérations soumises"
            action={
              pendingAll.length > 0 ? (
                <button
                  type="button"
                  onClick={() => onOpen("journal", { pendingOnly: true })}
                  className={btn("ghost", "sm")}
                >
                  Ouvrir dans le journal <ArrowRightIcon width={15} height={15} />
                </button>
              ) : undefined
            }
          >
            {pendingAll.length === 0 ? (
              <EmptyNote>Aucune opération en attente. Tout est approuvé.</EmptyNote>
            ) : (
              <ul className="divide-gold/10 divide-y">
                {pendingAll.slice(0, 5).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-on-dark text-[14.5px] break-words">{t.label}</p>
                      <p className="text-on-dark-faint mt-0.5 text-[12.5px]">
                        <time dateTime={t.date}>{formatDay(t.date)}</time> ·{" "}
                        {t.kind === "entree" ? "Entrée" : "Sortie"} · {categoryLabel(t.method)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <TxAmount tx={t} className="text-[15px]" />
                      <StatusPill status={t.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {pendingAll.length > 5 && (
              <p className="text-on-dark-faint mt-3 text-[13px]">
                Et {pendingAll.length - 5} autre{pendingAll.length - 5 > 1 ? "s" : ""} dans le
                journal.
              </p>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            eyebrow="Comptage de caisse"
            title={`Séance du ${formatDay(cashCount.date)}`}
            action={<Pill tone={countMeta.tone}>{countMeta.label}</Pill>}
          >
            <p className="text-on-dark-muted text-[13.5px]">{cashCount.source}</p>
            <dl className="mt-3">
              <LedgerRow label="Total compté" value={formatCADCents(totals.counted)} />
              <LedgerRow label="Total attendu" value={formatCADCents(cashCount.expectedCents)} />
              <LedgerRow
                label="Écart"
                value={
                  <span className={totals.variance === 0 ? "text-[#9fe0c2]" : "text-[#ffd98a]"}>
                    {totals.variance === 0 ? "Aucun écart" : formatSigned(totals.variance)}
                  </span>
                }
              />
              <LedgerRow
                label="Attestations"
                value={`${attested} sur ${cashCount.participants.length}`}
              />
            </dl>
            <p className="text-on-dark-faint mt-3 text-[13px]">
              {cashCount.status === "cloturee"
                ? "Procès-verbal clôturé et verrouillé."
                : totals.needsExplanation
                  ? "L’écart doit être expliqué avant la clôture."
                  : allAttested(cashCount)
                    ? "Tout le monde a attesté : prêt à clôturer."
                    : "En attente d’attestations."}
            </p>
            <button
              type="button"
              onClick={() => onOpen("comptage")}
              className={`${btn("gold", "sm")} mt-4`}
            >
              Ouvrir le comptage <ArrowRightIcon width={15} height={15} />
            </button>
          </Panel>

          <Panel eyebrow="Collecte extérieure" title={collection.place}>
            <div className="flex flex-wrap items-center gap-2">
              <PrivateMarker>Privé</PrivateMarker>
              <Pill tone={collection.status === "brouillon" ? "neutral" : "warn"}>
                {collection.status === "brouillon"
                  ? "Brouillon"
                  : collection.status === "soumis"
                    ? "Soumis"
                    : "Rapproché"}
              </Pill>
            </div>
            <dl className="mt-3">
              <LedgerRow label="Date" value={formatDay(collection.date)} />
              <LedgerRow label="Total reçu" value={formatCADCents(collectionTotal(collection))} />
              <LedgerRow
                label="Attestations"
                value={`${Math.min(collection.attestations.length, 2)} sur 2 requises`}
              />
            </dl>
            <p className="text-on-dark-faint mt-3 text-[13px]">
              {collectionReady(collection)
                ? "Procès-verbal attesté et transmis à la comptabilité."
                : `Il manque ${2 - collection.attestations.length} attestation${2 - collection.attestations.length > 1 ? "s" : ""} de responsable.`}
            </p>
            <button
              type="button"
              onClick={() => onOpen("collecte")}
              className={`${btn("ghost", "sm")} mt-4`}
            >
              Voir la collecte <ArrowRightIcon width={15} height={15} />
            </button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
