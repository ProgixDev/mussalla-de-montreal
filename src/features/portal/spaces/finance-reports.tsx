"use client";

import { useMemo, useState } from "react";
import { usePortal } from "@/lib/portal/store";
import { summarise } from "@/core/portal/derive";
import type { FinancialTransaction } from "@/core/portal/types";
import {
  EmptyNote,
  Field,
  Panel,
  Segmented,
  StatTile,
  btn,
  describedBy,
  inputCls,
} from "@/components/portal/kit";
import { cn } from "@/lib/utils";
import { formatCAD, formatCADCents, formatDateTime, formatDay } from "@/lib/format";
import { DemoNote } from "../shared";
import {
  KIND_LABEL,
  STATUS_META,
  anchorDay,
  buildCsv,
  categoryLabel,
  formatMonth,
  formatRange,
  formatSigned,
  inRange,
  isIsoDay,
  pendingCents,
  periodRange,
  signedCents,
  todayIso,
  totalsByCategory,
  type DayRange,
  type PeriodKind,
} from "./finance-lib";
import { Notice, PrintPortal, StatusPill, TxAmount } from "./finance-ui";

const nowStamp = () => formatDateTime(new Date().toISOString());

/**
 * « Rapports » — on-demand period reports (§4.10 « Objectifs, rapports et transparence
 * limitée »): totals, entries by method, exits by category, pending operations; exported
 * as CSV or printed to PDF without touching the source register.
 */
export function FinanceReports() {
  const transactions = usePortal((s) => s.transactions);
  const [today] = useState(todayIso);
  const anchor = useMemo(() => anchorDay(transactions, today), [transactions, today]);
  const [period, setPeriod] = useState<PeriodKind>("mois");
  const [custom, setCustom] = useState<DayRange>(() => periodRange("mois", anchor));
  const [notice, setNotice] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState(nowStamp);

  const customErrors = useMemo(() => {
    const e: { from?: string; to?: string } = {};
    if (!custom.from) e.from = "Indiquez la date de début.";
    else if (!isIsoDay(custom.from))
      e.from = "Date de début invalide : choisissez un jour dans le calendrier.";
    if (!custom.to) e.to = "Indiquez la date de fin.";
    else if (!isIsoDay(custom.to))
      e.to = "Date de fin invalide : choisissez un jour dans le calendrier.";
    else if (!e.from && custom.to < custom.from)
      e.to = "La date de fin doit être le même jour ou après la date de début.";
    return e;
  }, [custom]);

  const range: DayRange | null =
    period === "personnalisee"
      ? customErrors.from || customErrors.to
        ? null
        : custom
      : periodRange(period, anchor);

  const from = range?.from ?? null;
  const to = range?.to ?? null;
  const periodTxs = useMemo(
    () =>
      from && to
        ? transactions
            .filter((t) => inRange(t.date, { from, to }))
            .sort((a, b) => a.date.localeCompare(b.date))
        : [],
    [transactions, from, to],
  );

  const dataSpan = useMemo(() => {
    const days = transactions.map((t) => t.date.slice(0, 10)).sort();
    const first = days[0];
    const last = days[days.length - 1];
    return first && last ? { from: first, to: last } : null;
  }, [transactions]);

  const sum = summarise(periodTxs);
  const exits = totalsByCategory(periodTxs, "sortie");
  const pending = periodTxs.filter((t) => t.status === "soumis");
  const pendingIn = pendingCents(periodTxs, "entree");
  const pendingOut = pendingCents(periodTxs, "sortie");
  const fileName = range ? `rapport-financier_${range.from}_${range.to}.csv` : "";
  const blocked = !range
    ? "Corrigez la période pour exporter ou imprimer."
    : periodTxs.length === 0
      ? "Aucune opération dans cette période : rien à exporter."
      : null;

  const exportCsv = () => {
    if (!range || periodTxs.length === 0) return;
    const blob = new Blob([buildCsv(periodTxs)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(
      `Export prêt : ${fileName} — ${periodTxs.length} opération${periodTxs.length > 1 ? "s" : ""}, séparateur « ; », compatible Excel en français. Le registre source n’est pas modifié.`,
    );
  };

  const print = () => {
    setGeneratedAt(nowStamp());
    requestAnimationFrame(() => window.print());
  };

  const periodLabel = range
    ? `${formatRange(range)}${period === "mois" ? ` · ${formatMonth(range.from)}` : ""}`
    : "Période à corriger";

  return (
    <div className="flex flex-col gap-6">
      <Panel eyebrow="Rapport à la demande" title="Période du rapport">
        <Segmented<PeriodKind>
          name="report-period"
          label="Période"
          value={period}
          onChange={(p) => {
            setPeriod(p);
            setNotice(null);
          }}
          options={[
            { value: "semaine", label: "Semaine" },
            { value: "mois", label: "Mois" },
            { value: "annee", label: "Année" },
            { value: "personnalisee", label: "Personnalisée" },
          ]}
        />

        {period === "personnalisee" && (
          <div className="mt-4 grid gap-4 sm:max-w-[520px] sm:grid-cols-2">
            <Field id="report-from" label="Du" required error={customErrors.from}>
              <input
                {...describedBy("report-from", customErrors.from)}
                type="date"
                value={custom.from}
                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field id="report-to" label="Au" required error={customErrors.to}>
              <input
                {...describedBy("report-to", customErrors.to)}
                type="date"
                value={custom.to}
                min={custom.from || undefined}
                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                className={inputCls}
              />
            </Field>
          </div>
        )}

        <div className="border-gold/12 mt-5 rounded-[12px] border bg-white/[0.03] px-4 py-3">
          <p className="text-on-dark-muted text-[12.5px]">Période couverte</p>
          <p className="font-display text-on-dark mt-0.5 text-[19px]" aria-live="polite">
            {periodLabel}
          </p>
          <p className="text-on-dark-faint mt-1 text-[12.5px]">
            {range
              ? `${periodTxs.length} opération${periodTxs.length > 1 ? "s" : ""} dans la période. `
              : ""}
            {dataSpan
              ? `Opérations enregistrées du ${formatDay(dataSpan.from)} au ${formatDay(dataSpan.to)}.`
              : "Aucune opération enregistrée."}
            {period !== "personnalisee"
              ? " Semaine, mois et année se calculent à partir de la dernière opération enregistrée."
              : ""}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            disabled={blocked !== null}
            aria-describedby="report-actions-status"
            className={btn("gold", "sm")}
          >
            Exporter en CSV
          </button>
          <button
            type="button"
            onClick={print}
            disabled={blocked !== null}
            aria-describedby="report-actions-status"
            className={btn("ghost", "sm")}
          >
            Imprimer / PDF
          </button>
          <p
            id="report-actions-status"
            className={cn("text-[12.5px]", blocked ? "text-[#ffd98a]" : "text-on-dark-faint")}
          >
            {blocked ??
              "CSV : une ligne par opération, sorties en négatif. PDF : « Enregistrer au format PDF » dans la fenêtre d’impression."}
          </p>
        </div>
        <Notice message={notice} onDismiss={() => setNotice(null)} className="mt-3" />
        <DemoNote>
          Le plan comptable officiel et l’export vers le logiciel comptable du centre restent à
          confirmer (cahier des charges, §9, question 4), tout comme le choix PDF, CSV ou les deux
          (question 10).
        </DemoNote>
      </Panel>

      {!range ? (
        <EmptyNote>
          Corrigez les dates de la période personnalisée pour afficher le rapport.
        </EmptyNote>
      ) : (
        <>
          <section aria-label="Synthèse de la période" className="grid gap-3 sm:grid-cols-3">
            <StatTile
              label="Entrées"
              value={formatCAD(sum.inCents)}
              tone="gold"
              hint={pendingIn > 0 ? `dont ${formatCAD(pendingIn)} en attente` : "Toutes approuvées"}
            />
            <StatTile
              label="Sorties"
              value={formatCAD(sum.outCents)}
              hint={
                pendingOut > 0 ? `dont ${formatCAD(pendingOut)} en attente` : "Toutes approuvées"
              }
            />
            <StatTile
              label="Solde net"
              value={`${sum.netCents < 0 ? "−" : ""}${formatCAD(Math.abs(sum.netCents))}`}
              hint="Brouillons et opérations annulées exclus"
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel eyebrow="Rapport des entrées" title="Entrées par méthode">
              <BreakdownTable
                caption="Entrées par méthode de paiement"
                firstHeader="Méthode"
                rows={sum.byMethod.map(([m, cents]) => ({
                  key: m,
                  label: categoryLabel(m, true),
                  cents,
                }))}
                total={sum.inCents}
                empty="Aucune entrée comptabilisée dans la période."
              />
            </Panel>
            <Panel eyebrow="Rapport des sorties" title="Sorties par catégorie">
              <BreakdownTable
                caption="Sorties par catégorie"
                firstHeader="Catégorie"
                rows={exits.map(([m, cents]) => ({ key: m, label: categoryLabel(m, true), cents }))}
                total={sum.outCents}
                empty="Aucune sortie comptabilisée dans la période."
              />
            </Panel>
          </div>

          <Panel eyebrow="Synthèse" title="Opérations en attente">
            {pending.length === 0 ? (
              <EmptyNote>Aucune opération en attente d’approbation dans cette période.</EmptyNote>
            ) : (
              <ul className="divide-gold/10 divide-y">
                {pending.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-on-dark text-[14.5px] break-words">{t.label}</p>
                      <p className="text-on-dark-faint mt-0.5 text-[12.5px]">
                        <time dateTime={t.date}>{formatDay(t.date)}</time> · {KIND_LABEL[t.kind]} ·{" "}
                        {categoryLabel(t.method)}
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
            <p className="text-on-dark-faint mt-3 text-[12.5px]">
              Les opérations soumises sont comptées dans les totaux ci-dessus, en attendant leur
              approbation.
            </p>
          </Panel>

          <PrintPortal>
            <ReportDocument
              periodLabel={periodLabel}
              generatedAt={generatedAt}
              txs={periodTxs}
              inCents={sum.inCents}
              outCents={sum.outCents}
              netCents={sum.netCents}
              byMethod={sum.byMethod}
              exits={exits}
              pending={pending}
            />
          </PrintPortal>
        </>
      )}
    </div>
  );
}

function BreakdownTable({
  caption,
  firstHeader,
  rows,
  total,
  empty,
}: {
  caption: string;
  firstHeader: string;
  rows: { key: string; label: string; cents: number }[];
  total: number;
  empty: string;
}) {
  if (rows.length === 0) return <EmptyNote>{empty}</EmptyNote>;
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full border-collapse text-[14.5px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-gold/15 text-on-dark-muted border-b text-left text-[12.5px]">
            <th scope="col" className="py-2 pr-3 font-medium">
              {firstHeader}
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              Montant
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              Part
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-gold/[0.07] border-b">
              <th scope="row" className="text-on-dark py-2 pr-3 text-left font-normal">
                {r.label}
              </th>
              <td className="nums text-on-dark py-2 pr-3 text-right">{formatCADCents(r.cents)}</td>
              <td className="nums text-on-dark-muted py-2 text-right">
                {total > 0 ? `${Math.round((r.cents / total) * 100)} %` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="text-on-dark pt-3 text-left font-semibold">
              Total
            </th>
            <td className="nums font-display text-gold-light pt-3 pr-3 text-right text-[17px]">
              {formatCADCents(total)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── printable report (paper) ─────────────────────────────────────────────
function ReportDocument({
  periodLabel,
  generatedAt,
  txs,
  inCents,
  outCents,
  netCents,
  byMethod,
  exits,
  pending,
}: {
  periodLabel: string;
  generatedAt: string;
  txs: FinancialTransaction[];
  inCents: number;
  outCents: number;
  netCents: number;
  byMethod: [string, number][];
  exits: [string, number][];
  pending: FinancialTransaction[];
}) {
  const th = "py-1.5 text-left text-[11px] font-semibold text-[#4f564f]";
  const thR = "py-1.5 text-right text-[11px] font-semibold text-[#4f564f]";
  return (
    <article className="mx-auto max-w-[780px] text-[12.5px] leading-relaxed text-[#1d1f1c]">
      <header className="border-b-2 border-[#1d1f1c] pb-3">
        <p className="text-[10.5px] font-semibold tracking-[0.18em] text-[#4f564f] uppercase">
          Mussalla de Montréal — comptabilité
        </p>
        <h2 className="font-display mt-1 text-[26px] leading-tight text-[#0e231b]">
          Rapport financier
        </h2>
        <p className="mt-0.5 text-[12px] text-[#4f564f]">
          {periodLabel} · généré le {generatedAt} · document interne, non publié
        </p>
      </header>

      <section className="mt-5 break-inside-avoid">
        <h3 className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-[#4f564f] uppercase">
          Synthèse de la période
        </h3>
        <dl className="max-w-[420px]">
          {[
            ["Entrées", formatCADCents(inCents)],
            ["Sorties", formatCADCents(outCents)],
            ["Solde net", formatSigned(netCents)],
            ["Opérations en attente", String(pending.length)],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline gap-2 py-0.5">
              <dt className="flex min-w-0 flex-1 items-baseline gap-2">
                <span>{label}</span>
                <span
                  aria-hidden="true"
                  className="min-w-6 flex-1 self-end border-b border-dotted border-[#1d1f1c]/40"
                  style={{ marginBottom: "0.35em" }}
                />
              </dt>
              <dd className="nums text-right font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-6">
        {[
          { title: "Entrées par méthode", rows: byMethod, total: inCents },
          { title: "Sorties par catégorie", rows: exits, total: outCents },
        ].map((block) => (
          <section key={block.title} className="break-inside-avoid">
            <h3 className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-[#4f564f] uppercase">
              {block.title}
            </h3>
            {block.rows.length === 0 ? (
              <p className="text-[#4f564f]">Aucune.</p>
            ) : (
              <table className="w-full border-collapse">
                <tbody>
                  {block.rows.map(([m, cents]) => (
                    <tr key={m} className="border-b border-[#1d1f1c]/12">
                      <th scope="row" className="py-1 text-left font-normal">
                        {categoryLabel(m, true)}
                      </th>
                      <td className="nums py-1 text-right">{formatCADCents(cents)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" className="pt-1.5 text-left font-semibold">
                      Total
                    </th>
                    <td className="nums pt-1.5 text-right font-semibold">
                      {formatCADCents(block.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </section>
        ))}
      </div>

      <section className="mt-6">
        <h3 className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-[#4f564f] uppercase">
          Détail des opérations
        </h3>
        {txs.length === 0 ? (
          <p className="text-[#4f564f]">Aucune opération dans la période.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#1d1f1c]/40">
                <th scope="col" className={th}>
                  Date
                </th>
                <th scope="col" className={th}>
                  Type
                </th>
                <th scope="col" className={th}>
                  Libellé
                </th>
                <th scope="col" className={th}>
                  Méthode
                </th>
                <th scope="col" className={thR}>
                  Montant
                </th>
                <th scope="col" className={th}>
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr
                  key={t.id}
                  className="break-inside-avoid border-b border-[#1d1f1c]/12 align-top"
                >
                  <td className="py-1 pr-2 whitespace-nowrap">{formatDay(t.date)}</td>
                  <td className="py-1 pr-2">{KIND_LABEL[t.kind]}</td>
                  <td className="py-1 pr-2">
                    {t.label}
                    {t.reference ? <span className="text-[#4f564f]"> · {t.reference}</span> : null}
                  </td>
                  <td className="py-1 pr-2">{categoryLabel(t.method)}</td>
                  <td className="nums py-1 pr-2 text-right whitespace-nowrap">
                    {formatSigned(signedCents(t))}
                  </td>
                  <td className="py-1">{STATUS_META[t.status].label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer className="mt-6 border-t border-[#1d1f1c]/25 pt-3 text-[10.5px] leading-relaxed text-[#4f564f]">
        Généré depuis le registre opérationnel, sans le modifier. Les brouillons et les opérations
        annulées figurent au détail mais ne sont pas comptés ; les opérations soumises sont comptées
        et signalées en attente. Plan comptable et export vers le logiciel comptable : à confirmer.
      </footer>
    </article>
  );
}
