"use client";

import { useMemo, useState } from "react";
import { usePortal } from "@/lib/portal/store";
import { Dialog } from "@/components/portal/dialog";
import {
  EmptyNote,
  Field,
  Panel,
  Segmented,
  btn,
  describedBy,
  inputCls,
} from "@/components/portal/kit";
import { CheckIcon, PlusIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { formatCADCents, formatDay } from "@/lib/format";
import type { FinancialTransaction, TxStatus } from "@/core/portal/types";
import { DemoNote } from "../shared";
import {
  ENTRY_METHODS,
  EXIT_CATEGORIES,
  KIND_LABEL,
  METHOD_LABEL,
  STATUS_META,
  amountError,
  categoryLabel,
  centsToInput,
  currentAmount,
  formatSigned,
  isIsoDay,
  isTxCategory,
  parseAmount,
  rectificationsOf,
  signedCents,
  todayIso,
  type TxKind,
} from "./finance-lib";
import { Notice, StatusPill, TxAmount, useValidatedForm } from "./finance-ui";

export type KindFilter = "tout" | TxKind;
export type StatusFilter = "tous" | TxStatus;
export interface JournalFilter {
  kind: KindFilter;
  status: StatusFilter;
}
export const DEFAULT_JOURNAL_FILTER: JournalFilter = { kind: "tout", status: "tous" };

const STATUS_ORDER: TxStatus[] = ["brouillon", "soumis", "approuve", "annule", "corrige"];

const matches = (t: Pick<FinancialTransaction, "kind" | "status">, f: JournalFilter) =>
  (f.kind === "tout" || t.kind === f.kind) && (f.status === "tous" || t.status === f.status);

/**
 * After an action the focused button often disappears (the line changed state or left the
 * filtered list): move focus to the line itself, or to the list summary, once React has
 * committed — never leave it on <body>.
 */
const focusAfter = (...ids: string[]) =>
  requestAnimationFrame(() => {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) {
        el.focus();
        return;
      }
    }
  });

/**
 * « Journal » — the operational register (§4.10 « Entrées et sorties »). A finalized line
 * is never edited: a mistake is fixed by a linked rectification that goes through the
 * same approval as any other operation.
 */
export function FinanceJournal({
  filter,
  onFilterChange,
}: {
  filter: JournalFilter;
  onFilterChange: (f: JournalFilter) => void;
}) {
  const transactions = usePortal((s) => s.transactions);
  const decide = usePortal((s) => s.decideTransaction);
  const addTransaction = usePortal((s) => s.addTransaction);

  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [rectifyingId, setRectifyingId] = useState<string | null>(null);
  const [refusing, setRefusing] = useState<FinancialTransaction | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const byId = useMemo(() => new Map(transactions.map((t) => [t.id, t])), [transactions]);
  const rows = useMemo(
    () =>
      transactions.filter((t) => matches(t, filter)).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, filter],
  );

  /** Adds through the store, then highlights the new line (the store prepends it). */
  const create = (t: Omit<FinancialTransaction, "id">): { id: string | null; hidden: boolean } => {
    addTransaction(t);
    const id = usePortal.getState().transactions[0]?.id ?? null;
    setHighlightId(id);
    return { id, hidden: !matches(t, filter) };
  };

  const leavesFilter = (status: TxStatus, t: FinancialTransaction) =>
    matches({ kind: t.kind, status }, filter)
      ? ""
      : " Elle n’apparaît plus avec les filtres actuels.";

  const approve = (t: FinancialTransaction) => {
    decide(t.id, true);
    setNotice(
      `Opération approuvée : « ${t.label} » (${formatSigned(signedCents(t))}). Elle est désormais finalisée.${leavesFilter("approuve", t)}`,
    );
    focusAfter(`tx-row-${t.id}`, "journal-count");
  };

  const confirmRefuse = () => {
    if (!refusing) return;
    decide(refusing.id, false);
    setNotice(
      `Opération refusée : « ${refusing.label} » est maintenant annulée et ne compte plus dans les totaux.${leavesFilter("annule", refusing)}`,
    );
    focusAfter(`tx-row-${refusing.id}`, "journal-count");
    setRefusing(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <Panel
        eyebrow="Registre des opérations"
        title="Journal"
        action={
          <button
            type="button"
            onClick={() => setFormOpen((o) => !o)}
            aria-expanded={formOpen}
            aria-controls="tx-new-panel"
            className={btn(formOpen ? "ghost" : "gold", "sm")}
          >
            <PlusIcon width={15} height={15} />
            {formOpen ? "Masquer le formulaire" : "Nouvelle opération"}
          </button>
        }
      >
        <div id="tx-new-panel" hidden={!formOpen}>
          {formOpen && (
            <NewTxForm
              onClose={() => setFormOpen(false)}
              onCreate={(t) => {
                const r = create(t);
                return r.hidden;
              }}
            />
          )}
        </div>

        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <Segmented<KindFilter>
            name="journal-kind"
            label="Type"
            value={filter.kind}
            onChange={(kind) => onFilterChange({ ...filter, kind })}
            options={[
              { value: "tout", label: "Tout" },
              { value: "entree", label: "Entrées" },
              { value: "sortie", label: "Sorties" },
            ]}
          />
          <div className="flex w-full flex-col gap-1.5 sm:w-56">
            <label htmlFor="journal-status" className="text-on-dark text-[13.5px] font-medium">
              État
            </label>
            <select
              id="journal-status"
              value={filter.status}
              onChange={(e) => {
                const v = e.target.value;
                onFilterChange({
                  ...filter,
                  status:
                    v === "tous" || STATUS_ORDER.includes(v as TxStatus)
                      ? (v as StatusFilter)
                      : "tous",
                });
              }}
              className={inputCls}
            >
              <option value="tous">Tous les états</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <p
            id="journal-count"
            tabIndex={-1}
            className="text-on-dark-faint text-[13px] focus:outline-none"
            aria-live="polite"
          >
            {rows.length === 0
              ? "Aucune opération"
              : rows.length === 1
                ? "1 opération"
                : `${rows.length} opérations`}
            {filter.kind !== "tout" || filter.status !== "tous" ? " (filtrées)" : ""}
          </p>
        </div>

        <Notice message={notice} onDismiss={() => setNotice(null)} className="mt-3" />

        {rows.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-3">
            <EmptyNote>Aucune opération ne correspond à ces filtres.</EmptyNote>
            <button
              type="button"
              onClick={() => onFilterChange({ kind: "tout", status: "tous" })}
              className={btn("ghost", "sm")}
            >
              Afficher toutes les opérations
            </button>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {rows.map((t) => (
              <TxRow
                key={t.id}
                tx={t}
                original={t.correctsId ? byId.get(t.correctsId) : undefined}
                rectifications={rectificationsOf(transactions, t.id)}
                currentCents={currentAmount(t, transactions)}
                highlighted={t.id === highlightId}
                rectifyOpen={rectifyingId === t.id}
                onApprove={() => approve(t)}
                onRefuse={() => setRefusing(t)}
                onToggleRectify={() => setRectifyingId((id) => (id === t.id ? null : t.id))}
                onCancelRectify={() => {
                  setRectifyingId(null);
                  focusAfter(`rect-btn-${t.id}`);
                }}
                onRectify={(deltaCents, reason, date) => {
                  const r = create({
                    kind: t.kind,
                    date,
                    label: `Rectification — ${reason}`,
                    method: t.method,
                    amountCents: deltaCents,
                    status: "soumis",
                    correctsId: t.id,
                    ...(t.reference ? { reference: t.reference } : {}),
                  });
                  setRectifyingId(null);
                  focusAfter(`tx-row-${t.id}`, "journal-count");
                  setNotice(
                    `Rectification soumise pour approbation : ajustement de ${formatSigned(t.kind === "entree" ? deltaCents : -deltaCents)} sur « ${t.label} ». L’opération d’origine reste intacte.${r.hidden ? " La nouvelle écriture est masquée par les filtres actuels." : ""}`,
                  );
                }}
              />
            ))}
          </ul>
        )}

        <DemoNote>
          Ici, le comptable saisit et approuve. En production, l’approbation exige la permission{" "}
          <code>finance.approver</code> et, selon la politique du centre, une autre personne que
          l’auteur ; chaque décision est inscrite au journal d’audit. Les pièces justificatives
          (fichiers joints) arriveront avec le stockage sécurisé.
        </DemoNote>
      </Panel>

      <Dialog
        open={refusing !== null}
        onClose={() => setRefusing(null)}
        title="Refuser cette opération ?"
        footer={
          <>
            <button type="button" onClick={() => setRefusing(null)} className={btn("ghost")}>
              Retour
            </button>
            <button type="button" onClick={confirmRefuse} className={btn("danger")}>
              Refuser l’opération
            </button>
          </>
        }
      >
        {refusing && (
          <div className="text-on-dark-muted flex flex-col gap-3 text-[14.5px] leading-relaxed">
            <p className="border-gold/12 text-on-dark rounded-[12px] border bg-white/[0.03] px-4 py-3">
              <span className="block font-medium">{refusing.label}</span>
              <span className="text-on-dark-muted mt-0.5 block text-[13px]">
                {formatDay(refusing.date)} · {KIND_LABEL[refusing.kind]} ·{" "}
                {categoryLabel(refusing.method)} ·{" "}
                <span className="nums">{formatSigned(signedCents(refusing))}</span>
              </span>
            </p>
            <p>
              Elle passera à l’état « Annulé » : elle ne sera plus comptée dans les totaux, mais
              restera visible dans le journal avec son historique. Ce refus ne peut pas être modifié
              ensuite ; une nouvelle opération devra être saisie si nécessaire.
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
}

// ── one line of the journal ──────────────────────────────────────────────
function TxRow({
  tx,
  original,
  rectifications,
  currentCents,
  highlighted,
  rectifyOpen,
  onApprove,
  onRefuse,
  onToggleRectify,
  onCancelRectify,
  onRectify,
}: {
  tx: FinancialTransaction;
  original: FinancialTransaction | undefined;
  rectifications: FinancialTransaction[];
  currentCents: number;
  highlighted: boolean;
  rectifyOpen: boolean;
  onApprove: () => void;
  onRefuse: () => void;
  onToggleRectify: () => void;
  onCancelRectify: () => void;
  onRectify: (deltaCents: number, reason: string, date: string) => void;
}) {
  const pendingRect = rectifications.some((r) => r.status === "soumis");
  const approvedRect = rectifications.some((r) => r.status === "approuve");
  const canRectify = tx.status === "approuve" && !tx.correctsId;
  const panelId = `rect-${tx.id}`;

  return (
    <li
      id={`tx-row-${tx.id}`}
      tabIndex={-1}
      className={cn(
        "focus-visible:outline-gold-light rounded-[14px] border bg-white/[0.025] p-4 transition focus:outline-none focus-visible:outline-2",
        highlighted ? "border-gold/55 shadow-[0_0_0_1px_rgba(217,189,119,0.25)]" : "border-gold/10",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="text-on-dark text-[15px] font-medium break-words">
            {tx.label}
            {highlighted && (
              <span className="text-gold ml-2 align-middle text-[11.5px] font-semibold tracking-wide uppercase">
                Nouveau
              </span>
            )}
          </p>
          <p className="text-on-dark-muted mt-1 text-[13px]">
            <time dateTime={tx.date}>{formatDay(tx.date)}</time>
            {" · "}
            {KIND_LABEL[tx.kind]} · {categoryLabel(tx.method)}
            {tx.reference && <> · Réf. {tx.reference}</>}
          </p>
          {tx.correctsId && (
            <p className="text-on-dark-faint mt-1.5 text-[13px]">
              Rectifie{" "}
              {original ? (
                <>
                  « {original.label} » du {formatDay(original.date)}
                </>
              ) : (
                "une opération d’origine"
              )}
            </p>
          )}
          {rectifications.length > 0 && (
            <p className="text-on-dark-faint mt-1.5 text-[13px]">
              {rectifications.length === 1
                ? "Une rectification liée"
                : `${rectifications.length} rectifications liées`}{" "}
              :{" "}
              {rectifications.map((r, i) => (
                <span key={r.id}>
                  {i > 0 && ", "}
                  <span className="nums">{formatSigned(signedCents(r))}</span> (
                  {STATUS_META[r.status].label.toLowerCase()})
                </span>
              ))}
              {approvedRect && (
                <>
                  {" "}
                  · montant rectifié :{" "}
                  <span className="nums text-on-dark-muted">{formatCADCents(currentCents)}</span>
                </>
              )}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <TxAmount tx={tx} className="font-display text-[19px] leading-none" />
          <StatusPill status={tx.status} />
        </div>
      </div>

      {(tx.status === "soumis" || canRectify) && (
        <div className="border-gold/10 mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
          {tx.status === "soumis" && (
            <>
              <button type="button" onClick={onApprove} className={btn("subtle", "sm")}>
                <CheckIcon width={15} height={15} /> Approuver
                <span className="sr-only"> « {tx.label} »</span>
              </button>
              <button type="button" onClick={onRefuse} className={btn("ghost", "sm")}>
                Refuser<span className="sr-only"> « {tx.label} »</span>
              </button>
            </>
          )}
          {canRectify &&
            (pendingRect ? (
              <p className="text-on-dark-faint text-[13px]">
                Une rectification attend déjà son approbation.
              </p>
            ) : (
              <button
                type="button"
                id={`rect-btn-${tx.id}`}
                onClick={onToggleRectify}
                aria-expanded={rectifyOpen}
                aria-controls={panelId}
                className={btn("ghost", "sm")}
              >
                {rectifyOpen ? "Fermer la rectification" : "Rectifier"}
                <span className="sr-only"> « {tx.label} »</span>
              </button>
            ))}
        </div>
      )}

      {canRectify && rectifyOpen && (
        <div id={panelId}>
          <RectifyForm
            tx={tx}
            currentCents={currentCents}
            onSubmit={onRectify}
            onCancel={onCancelRectify}
          />
        </div>
      )}
    </li>
  );
}

// ── rectification ────────────────────────────────────────────────────────
type RectValues = { amount: string; reason: string };

function RectifyForm({
  tx,
  currentCents,
  onSubmit,
  onCancel,
}: {
  tx: FinancialTransaction;
  currentCents: number;
  onSubmit: (deltaCents: number, reason: string, date: string) => void;
  onCancel: () => void;
}) {
  const [today] = useState(todayIso);
  const form = useValidatedForm<RectValues>(
    { amount: centsToInput(currentCents), reason: "" },
    (v) => {
      const e: Partial<Record<keyof RectValues, string>> = {};
      const amountMsg = amountError(v.amount, { allowZero: true });
      const parsed = parseAmount(v.amount);
      if (amountMsg) e.amount = amountMsg;
      else if (parsed.ok && parsed.cents === currentCents)
        e.amount = "C’est déjà le montant enregistré : indiquez le montant correct.";
      const reason = v.reason.trim();
      if (reason.length === 0)
        e.reason = "Indiquez le motif : il reste attaché à l’écriture, dans l’historique.";
      else if (reason.length < 5) e.reason = "Précisez le motif (5 caractères minimum).";
      return e;
    },
    `rect-${tx.id}`,
  );

  const parsed = parseAmount(form.values.amount);
  const delta = parsed.ok ? parsed.cents - currentCents : null;

  return (
    <form
      noValidate
      aria-labelledby={`rect-${tx.id}-title`}
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.trySubmit() || delta === null) return;
        onSubmit(delta, form.values.reason.trim(), today);
      }}
      className="border-gold/20 bg-night/40 mt-3 rounded-[12px] border p-4"
    >
      <h3 id={`rect-${tx.id}-title`} className="font-display text-on-dark text-[18px]">
        Rectifier cette opération
      </h3>
      <p className="text-on-dark-muted mt-1 text-[13px] leading-relaxed">
        L’opération approuvée reste intacte. Une écriture de rectification, liée à celle-ci et datée
        d’aujourd’hui, est soumise pour approbation avec votre motif.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field
          id={form.id("amount")}
          label="Montant correct ($)"
          required
          hint={`Montant enregistré : ${formatCADCents(currentCents)}. Écrivez 0 pour annuler entièrement l’opération.`}
          error={form.errorOf("amount")}
        >
          <input
            {...describedBy(form.id("amount"), form.errorOf("amount"), true)}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={form.values.amount}
            onChange={(e) => form.set("amount", e.target.value)}
            onBlur={() => form.blur("amount")}
            className={cn(inputCls, "nums")}
          />
        </Field>
        <Field
          id={form.id("reason")}
          label="Motif de la rectification"
          required
          error={form.errorOf("reason")}
        >
          <textarea
            {...describedBy(form.id("reason"), form.errorOf("reason"))}
            rows={2}
            value={form.values.reason}
            onChange={(e) => form.set("reason", e.target.value)}
            onBlur={() => form.blur("reason")}
            className={cn(inputCls, "min-h-[46px] resize-y")}
          />
        </Field>
      </div>
      <p className="text-on-dark-muted mt-3 text-[13.5px]" aria-live="polite">
        {delta === null || delta === 0 ? (
          "L’ajustement s’affichera ici."
        ) : (
          <>
            Ajustement enregistré :{" "}
            <span className="nums text-on-dark font-semibold">
              {formatSigned(tx.kind === "entree" ? delta : -delta)}
            </span>{" "}
            sur le solde ({KIND_LABEL[tx.kind].toLowerCase()} · {METHOD_LABEL[tx.method]}).
          </>
        )}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" className={btn("gold", "sm")}>
          Soumettre la rectification
        </button>
        <button type="button" onClick={onCancel} className={btn("ghost", "sm")}>
          Abandonner
        </button>
      </div>
    </form>
  );
}

// ── new operation ────────────────────────────────────────────────────────
type NewTxValues = {
  date: string;
  label: string;
  method: string;
  amount: string;
  reference: string;
};

function validateNewTx(
  v: NewTxValues,
  kind: TxKind,
  today: string,
): Partial<Record<keyof NewTxValues, string>> {
  const e: Partial<Record<keyof NewTxValues, string>> = {};
  if (!v.date) e.date = "Indiquez la date de l’opération.";
  else if (!isIsoDay(v.date)) e.date = "Date invalide : choisissez un jour dans le calendrier.";
  else if (v.date > today)
    e.date = "La date ne peut pas être dans le futur : on enregistre une opération déjà faite.";
  const label = v.label.trim();
  if (label.length === 0) e.label = "Indiquez un libellé, par exemple « Loyer — décembre ».";
  else if (label.length < 3) e.label = "Le libellé est trop court (3 caractères minimum).";
  else if (label.length > 120) e.label = "Le libellé est trop long (120 caractères maximum).";
  const allowed: readonly string[] = kind === "entree" ? ENTRY_METHODS : EXIT_CATEGORIES;
  if (!v.method)
    e.method =
      kind === "entree"
        ? "Choisissez la méthode de paiement."
        : "Choisissez la catégorie de la dépense.";
  else if (!allowed.includes(v.method))
    e.method = "Cette valeur ne correspond pas au type choisi : choisissez-en une autre.";
  const amount = amountError(v.amount);
  if (amount) e.amount = amount;
  if (v.reference.trim().length > 60)
    e.reference = "La référence est trop longue (60 caractères maximum).";
  return e;
}

function NewTxForm({
  onCreate,
  onClose,
}: {
  onCreate: (t: Omit<FinancialTransaction, "id">) => boolean;
  onClose: () => void;
}) {
  const [today] = useState(todayIso);
  const [kind, setKind] = useState<TxKind>("entree");
  const [success, setSuccess] = useState<string | null>(null);
  const form = useValidatedForm<NewTxValues>(
    { date: today, label: "", method: "", amount: "", reference: "" },
    (v) => validateNewTx(v, kind, today),
    "tx-new",
  );
  const { values } = form;
  const options = kind === "entree" ? ENTRY_METHODS : EXIT_CATEGORIES;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.trySubmit()) {
      setSuccess(null);
      return;
    }
    const parsed = parseAmount(values.amount);
    if (!parsed.ok || !isTxCategory(values.method)) return;
    const reference = values.reference.trim();
    const tx: Omit<FinancialTransaction, "id"> = {
      kind,
      date: values.date,
      label: values.label.trim(),
      method: values.method,
      amountCents: parsed.cents,
      status: "soumis",
      ...(reference ? { reference } : {}),
    };
    const hidden = onCreate(tx);
    setSuccess(
      `Opération soumise pour approbation : « ${tx.label} », ${formatSigned(signedCents(tx))}.${hidden ? " Elle est masquée par les filtres actuels du journal." : ""}`,
    );
    form.reset({ date: values.date });
  };

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-labelledby="tx-new-title"
      className="border-gold/25 bg-night/45 mb-6 rounded-[16px] border p-4 md:p-5"
    >
      <h3 id="tx-new-title" className="font-display text-on-dark text-[20px]">
        Nouvelle opération
      </h3>
      <p className="text-on-dark-muted mt-1 text-[13px]">
        Elle est enregistrée à l’état « Soumis » et attend une approbation.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Segmented<TxKind>
          name="tx-new-kind"
          label="Type"
          value={kind}
          onChange={(k) => {
            setKind(k);
            form.replace({ method: "" });
          }}
          options={[
            { value: "entree", label: "Entrée" },
            { value: "sortie", label: "Sortie" },
          ]}
          className="sm:col-span-2"
        />
        <Field id={form.id("date")} label="Date" required error={form.errorOf("date")}>
          <input
            {...describedBy(form.id("date"), form.errorOf("date"))}
            type="date"
            max={today}
            value={values.date}
            onChange={(e) => form.set("date", e.target.value)}
            onBlur={() => form.blur("date")}
            className={inputCls}
          />
        </Field>
        <Field
          id={form.id("method")}
          label={kind === "entree" ? "Méthode de paiement" : "Catégorie"}
          required
          error={form.errorOf("method")}
        >
          <select
            {...describedBy(form.id("method"), form.errorOf("method"))}
            value={values.method}
            onChange={(e) => form.set("method", e.target.value)}
            onBlur={() => form.blur("method")}
            className={inputCls}
          >
            <option value="">Choisir…</option>
            {options.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABEL[m]}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id={form.id("label")}
          label="Libellé"
          required
          error={form.errorOf("label")}
          className="sm:col-span-2"
        >
          <input
            {...describedBy(form.id("label"), form.errorOf("label"))}
            type="text"
            autoComplete="off"
            value={values.label}
            onChange={(e) => form.set("label", e.target.value)}
            onBlur={() => form.blur("label")}
            className={inputCls}
          />
        </Field>
        <Field
          id={form.id("amount")}
          label="Montant ($)"
          required
          hint="Par exemple 12,50 — la virgule et le point sont acceptés."
          error={form.errorOf("amount")}
        >
          <div className="relative">
            <input
              {...describedBy(form.id("amount"), form.errorOf("amount"), true)}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={values.amount}
              onChange={(e) => form.set("amount", e.target.value)}
              onBlur={() => form.blur("amount")}
              className={cn(inputCls, "nums pr-9")}
            />
            <span
              aria-hidden="true"
              className="text-on-dark-faint pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2"
            >
              $
            </span>
          </div>
        </Field>
        <Field
          id={form.id("reference")}
          label="Référence (facultatif)"
          hint="Numéro de chèque, de facture ou de reçu."
          error={form.errorOf("reference")}
        >
          <input
            {...describedBy(form.id("reference"), form.errorOf("reference"), true)}
            type="text"
            autoComplete="off"
            value={values.reference}
            onChange={(e) => form.set("reference", e.target.value)}
            onBlur={() => form.blur("reference")}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="submit" className={btn("gold")}>
          Soumettre l’opération
        </button>
        <button type="button" onClick={onClose} className={btn("ghost")}>
          Fermer
        </button>
      </div>
      <Notice message={success} onDismiss={() => setSuccess(null)} className="mt-4" />
    </form>
  );
}
