"use client";

import { useState } from "react";
import { usePortal } from "@/lib/portal/store";
import { allAttested, countTotals } from "@/core/portal/derive";
import { pastCounts } from "@/core/portal/seed";
import type { CashCountSession, Person } from "@/core/portal/types";
import { Dialog } from "@/components/portal/dialog";
import { EmptyNote, Field, Panel, Pill, btn, describedBy, inputCls } from "@/components/portal/kit";
import { CheckIcon, LockIcon, PlusIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { formatCADCents, formatDateTime, formatDay, formatDayLong } from "@/lib/format";
import { DemoNote, usePersonName } from "../shared";
import {
  COUNT_STATUS_META,
  amountError,
  denominationLabel,
  formatSigned,
  parseAmount,
} from "./finance-lib";
import { LedgerRow, Notice, PrintPortal, useValidatedForm } from "./finance-ui";
import { PvDocument } from "./finance-pv";

type NoticeSlot = "top" | "coins" | "envelopes" | "checks" | "reconcile" | "participants";
type Confirm = { kind: "attest"; personId: string } | { kind: "close" } | null;

const newId = (prefix: string) =>
  `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}`;

/** Move focus once React has committed (the focused button may just have disappeared). */
const focusLater = (id: string) =>
  requestAnimationFrame(() => document.getElementById(id)?.focus());

const fullDay = (iso: string) => `${formatDayLong(iso)} ${iso.slice(0, 4)}`;

/**
 * « Comptage » — the cash-count session and its procès-verbal (§4.10 « Séances de
 * comptage », workflow §6.3). Totals are recomputed from the entered lines on every
 * change; attestations bind to the version on screen, so any edit withdraws them.
 */
export function FinanceCount({ me }: { me: Person }) {
  const session = usePortal((s) => s.cashCount);
  const updateCashCount = usePortal((s) => s.updateCashCount);
  const setDenomination = usePortal((s) => s.setDenomination);
  const attestCount = usePortal((s) => s.attestCount);
  const closeCount = usePortal((s) => s.closeCount);
  const addTransaction = usePortal((s) => s.addTransaction);
  const personName = usePersonName();
  const fullName = (id: string) => personName(id, true);

  const [notice, setNotice] = useState<{ at: NoticeSlot; text: string } | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [pvOpen, setPvOpen] = useState(false);
  const [generatedAt, setGeneratedAt] = useState("");
  const [noteTouched, setNoteTouched] = useState(false);

  const totals = countTotals(session);
  const closed = session.status === "cloturee";
  const pending = session.participants.filter((p) => !p.attestedAt);
  const canClose = !closed && allAttested(session) && !totals.needsExplanation;
  const say = (at: NoticeSlot, text: string) => setNotice({ at, text });
  const noticeFor = (at: NoticeSlot) => (notice?.at === at ? notice.text : null);
  const dismiss = () => setNotice(null);

  /** Any change to the counted data withdraws the attestations already given. */
  const withdrawAttestations = (at: NoticeSlot, done: string) => {
    const current = usePortal.getState().cashCount;
    if (!current.participants.some((p) => p.attestedAt)) {
      if (done) say(at, done);
      return;
    }
    updateCashCount({
      participants: current.participants.map((p) => ({ personId: p.personId, role: p.role })),
    });
    say(
      at,
      `${done ? `${done} ` : ""}Le comptage a changé : les attestations déjà données ont été retirées, chaque participant devra attester cette nouvelle version.`,
    );
  };

  const edit = (patch: Partial<CashCountSession>, at: NoticeSlot, done = "") => {
    if (closed) return;
    updateCashCount(patch);
    withdrawAttestations(at, done);
  };

  const editQuantity = (cents: number, quantity: number) => {
    if (closed) return;
    const before = usePortal
      .getState()
      .cashCount.denominations.find((d) => d.cents === cents)?.quantity;
    setDenomination(cents, quantity);
    if (
      before !== quantity &&
      usePortal.getState().cashCount.participants.some((p) => p.attestedAt)
    )
      withdrawAttestations("coins", "");
  };

  const confirmAttest = (personId: string) => {
    attestCount(personId);
    const at = usePortal
      .getState()
      .cashCount.participants.find((p) => p.personId === personId)?.attestedAt;
    say(
      "participants",
      `Attestation enregistrée pour ${fullName(personId)}${at ? `, le ${formatDateTime(at)}` : ""}.`,
    );
    setConfirm(null);
    focusLater(`cc-part-${personId}`);
  };

  const confirmClose = () => {
    const cashPart = totals.coinsAndBills + totals.envelopes;
    const reference = `CPT-${session.date}`;
    const day = formatDay(session.date);
    closeCount();
    // §6.6 / §4.10: the closed count becomes entries to reconcile, through the normal approval.
    if (cashPart > 0) {
      addTransaction({
        kind: "entree",
        date: session.date,
        label: `Comptage du ${day} — espèces et enveloppes`,
        method: "especes",
        amountCents: cashPart,
        status: "soumis",
        reference,
      });
    }
    if (totals.checks > 0) {
      addTransaction({
        kind: "entree",
        date: session.date,
        label: `Comptage du ${day} — chèques`,
        method: "cheque",
        amountCents: totals.checks,
        status: "soumis",
        reference,
      });
    }
    say(
      "top",
      "Comptage clôturé : le procès-verbal est verrouillé. Les entrées correspondantes ont été ajoutées au journal à l’état « Soumis », pour approbation.",
    );
    setConfirm(null);
    focusLater("cc-locked");
  };

  const openPv = () => {
    if (!pvOpen) setGeneratedAt(formatDateTime(new Date().toISOString()));
    setPvOpen((o) => !o);
  };

  const confirmPerson =
    confirm?.kind === "attest"
      ? session.participants.find((p) => p.personId === confirm.personId)
      : undefined;
  const isMe = (id: string) => id === me.id;

  return (
    <div className="flex flex-col gap-6">
      {/* ── metadata ─────────────────────────────────────────────── */}
      <Panel
        eyebrow="Séance de comptage"
        title={fullDay(session.date)}
        action={
          <Pill tone={COUNT_STATUS_META[session.status].tone}>
            {COUNT_STATUS_META[session.status].label}
          </Pill>
        }
      >
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
          <MetaItem label="Lieu" value={session.place} />
          <MetaItem label="Caisse ou source comptée" value={session.source} />
          <MetaItem label="Référence" value={session.id} />
        </dl>
        {closed && (
          <div
            id="cc-locked"
            tabIndex={-1}
            className="focus-visible:outline-gold-light mt-4 flex items-start gap-3 rounded-[12px] border border-[#1c7d5b]/45 bg-[#1c7d5b]/12 px-4 py-3 text-[14px] leading-relaxed text-[#c9f0dc] focus:outline-none focus-visible:outline-2"
          >
            <LockIcon width={18} height={18} className="mt-0.5 shrink-0" />
            <p>
              Procès-verbal clôturé — lecture seule. Toute correction passe par une rectification
              versionnée ; ce document original reste disponible.
            </p>
          </div>
        )}
        <Notice message={noticeFor("top")} onDismiss={dismiss} className="mt-4" />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* ── coins & bills ──────────────────────────────────────── */}
          <Panel eyebrow="Monnaie" title="Pièces et billets">
            {session.denominations.length === 0 ? (
              <EmptyNote>Aucune dénomination n’est configurée pour cette caisse.</EmptyNote>
            ) : (
              <div className="-mx-1 overflow-x-auto px-1">
                <table className="w-full border-collapse text-[14.5px]">
                  <caption className="sr-only">
                    Quantités observées par dénomination, avec sous-totaux calculés
                  </caption>
                  <thead>
                    <tr className="border-gold/15 text-on-dark-muted border-b text-left text-[12.5px]">
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Dénomination
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Quantité
                      </th>
                      <th scope="col" className="py-2 text-right font-medium">
                        Sous-total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.denominations.map((d) => (
                      <tr key={d.cents} className="border-gold/[0.07] border-b">
                        <th scope="row" className="text-on-dark py-1.5 pr-3 text-left font-medium">
                          {closed ? (
                            denominationLabel(d.cents)
                          ) : (
                            <label htmlFor={`cc-den-${d.cents}`}>
                              <span className="sr-only">Quantité de </span>
                              {denominationLabel(d.cents)}
                            </label>
                          )}
                        </th>
                        <td className="py-1.5 pr-3">
                          {closed ? (
                            <span className="nums text-on-dark">{d.quantity}</span>
                          ) : (
                            <QuantityInput
                              id={`cc-den-${d.cents}`}
                              quantity={d.quantity}
                              onCommit={(q) => editQuantity(d.cents, q)}
                            />
                          )}
                        </td>
                        <td className="nums text-on-dark py-1.5 text-right">
                          {formatCADCents(d.cents * d.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th
                        scope="row"
                        colSpan={2}
                        className="text-on-dark pt-3 text-left font-semibold"
                      >
                        Total pièces et billets
                      </th>
                      <td className="nums font-display text-gold-light pt-3 text-right text-[18px]">
                        {formatCADCents(totals.coinsAndBills)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            <Notice message={noticeFor("coins")} onDismiss={dismiss} tone="info" className="mt-3" />
          </Panel>

          {/* ── envelopes ──────────────────────────────────────────── */}
          <Panel eyebrow="Enveloppes" title="Enveloppes">
            {session.envelopes.length === 0 ? (
              <EmptyNote>Aucune enveloppe pour cette séance.</EmptyNote>
            ) : (
              <div className="-mx-1 overflow-x-auto px-1">
                <table className="w-full border-collapse text-[14.5px]">
                  <caption className="sr-only">Enveloppes comptées</caption>
                  <thead>
                    <tr className="border-gold/15 text-on-dark-muted border-b text-left text-[12.5px]">
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Référence
                      </th>
                      <th scope="col" className="py-2 pr-3 text-right font-medium">
                        Nombre
                      </th>
                      <th scope="col" className="py-2 text-right font-medium">
                        Montant
                      </th>
                      {!closed && (
                        <th scope="col" className="py-2 pl-2 text-right font-medium">
                          <span className="sr-only">Action</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {session.envelopes.map((e) => (
                      <tr key={e.id} className="border-gold/[0.07] border-b">
                        <th scope="row" className="text-on-dark py-2 pr-3 text-left font-normal">
                          {e.reference}
                        </th>
                        <td className="nums text-on-dark py-2 pr-3 text-right">{e.count}</td>
                        <td className="nums text-on-dark py-2 text-right">
                          {formatCADCents(e.amountCents)}
                        </td>
                        {!closed && (
                          <td className="py-2 pl-2 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                edit(
                                  { envelopes: session.envelopes.filter((x) => x.id !== e.id) },
                                  "envelopes",
                                  `Enveloppe « ${e.reference} » retirée.`,
                                )
                              }
                              className="text-on-dark-muted hover:text-on-dark focus-visible:outline-gold-light rounded-full px-2.5 py-1.5 text-[13px] underline-offset-4 transition hover:underline focus-visible:outline-2"
                            >
                              Retirer<span className="sr-only"> l’enveloppe « {e.reference} »</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th
                        scope="row"
                        colSpan={2}
                        className="text-on-dark pt-3 text-left font-semibold"
                      >
                        Total enveloppes
                      </th>
                      <td className="nums text-on-dark pt-3 text-right font-semibold">
                        {formatCADCents(totals.envelopes)}
                      </td>
                      {!closed && <td />}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            {!closed && (
              <AddEnvelope
                onAdd={(env) =>
                  edit(
                    {
                      envelopes: [
                        ...usePortal.getState().cashCount.envelopes,
                        { id: newId("en"), ...env },
                      ],
                    },
                    "envelopes",
                    `Enveloppe « ${env.reference} » ajoutée (${formatCADCents(env.amountCents)}).`,
                  )
                }
              />
            )}
            <Notice message={noticeFor("envelopes")} onDismiss={dismiss} className="mt-3" />
          </Panel>

          {/* ── cheques ────────────────────────────────────────────── */}
          <Panel eyebrow="Chèques" title="Chèques">
            <p className="text-on-dark-faint -mt-2 mb-3 text-[12.5px]">
              Données sensibles : visibles uniquement par la comptabilité.
            </p>
            {session.checks.length === 0 ? (
              <EmptyNote>Aucun chèque pour cette séance.</EmptyNote>
            ) : (
              <div className="-mx-1 overflow-x-auto px-1">
                <table className="w-full border-collapse text-[14.5px]">
                  <caption className="sr-only">Chèques comptés</caption>
                  <thead>
                    <tr className="border-gold/15 text-on-dark-muted border-b text-left text-[12.5px]">
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Tireur
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Référence
                      </th>
                      <th scope="col" className="py-2 text-right font-medium">
                        Montant
                      </th>
                      {!closed && (
                        <th scope="col" className="py-2 pl-2 text-right font-medium">
                          <span className="sr-only">Action</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {session.checks.map((c) => (
                      <tr key={c.id} className="border-gold/[0.07] border-b">
                        <th scope="row" className="text-on-dark py-2 pr-3 text-left font-normal">
                          {c.drawer}
                        </th>
                        <td className="text-on-dark-muted py-2 pr-3">{c.reference || "—"}</td>
                        <td className="nums text-on-dark py-2 text-right">
                          {formatCADCents(c.amountCents)}
                        </td>
                        {!closed && (
                          <td className="py-2 pl-2 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                edit(
                                  { checks: session.checks.filter((x) => x.id !== c.id) },
                                  "checks",
                                  `Chèque de ${c.drawer} retiré.`,
                                )
                              }
                              className="text-on-dark-muted hover:text-on-dark focus-visible:outline-gold-light rounded-full px-2.5 py-1.5 text-[13px] underline-offset-4 transition hover:underline focus-visible:outline-2"
                            >
                              Retirer<span className="sr-only"> le chèque de {c.drawer}</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th
                        scope="row"
                        colSpan={2}
                        className="text-on-dark pt-3 text-left font-semibold"
                      >
                        Total chèques
                      </th>
                      <td className="nums text-on-dark pt-3 text-right font-semibold">
                        {formatCADCents(totals.checks)}
                      </td>
                      {!closed && <td />}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            {!closed && (
              <AddCheck
                onAdd={(chk) =>
                  edit(
                    {
                      checks: [
                        ...usePortal.getState().cashCount.checks,
                        { id: newId("ch"), ...chk },
                      ],
                    },
                    "checks",
                    `Chèque de ${chk.drawer} ajouté (${formatCADCents(chk.amountCents)}).`,
                  )
                }
              />
            )}
            <Notice message={noticeFor("checks")} onDismiss={dismiss} className="mt-3" />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {/* ── reconciliation ─────────────────────────────────────── */}
          <Panel eyebrow="Rapprochement" title="Totaux">
            <dl>
              <LedgerRow label="Pièces et billets" value={formatCADCents(totals.coinsAndBills)} />
              <LedgerRow label="Enveloppes" value={formatCADCents(totals.envelopes)} />
              <LedgerRow label="Chèques" value={formatCADCents(totals.checks)} />
              <LedgerRow
                label="Total compté"
                value={formatCADCents(totals.counted)}
                strong
                className="border-gold/15 mt-1 border-t pt-2.5"
              />
              <LedgerRow label="Total attendu" value={formatCADCents(session.expectedCents)} />
              <LedgerRow
                label="Écart"
                strong
                value={
                  <span className={totals.variance === 0 ? "text-[#9fe0c2]" : "text-[#ffd98a]"}>
                    {totals.variance === 0
                      ? "Aucun écart"
                      : `${formatSigned(totals.variance)} · ${totals.variance > 0 ? "excédent" : "manque"}`}
                  </span>
                }
              />
            </dl>
            <p className="text-on-dark-faint mt-2 text-[12.5px]">
              Le total attendu provient du registre de la caisse ; les totaux sont recalculés à
              chaque saisie.
            </p>

            {totals.variance !== 0 &&
              (closed ? (
                <div className="border-gold/12 mt-4 rounded-[12px] border bg-white/[0.03] px-4 py-3">
                  <p className="text-on-dark-muted text-[12.5px]">Explication de l’écart</p>
                  <p className="text-on-dark mt-1 text-[14.5px]">{session.varianceNote}</p>
                </div>
              ) : (
                <Field
                  id="cc-variance-note"
                  label="Explication de l’écart"
                  required
                  className="mt-5"
                  hint={
                    totals.needsExplanation
                      ? `Obligatoire avant la clôture : expliquez l’écart de ${formatSigned(totals.variance)} (pièce étrangère retirée, erreur de rendu de monnaie…).`
                      : "Cette explication figure au procès-verbal."
                  }
                  error={
                    totals.needsExplanation && noteTouched
                      ? `L’écart de ${formatSigned(totals.variance)} doit être expliqué : la clôture reste impossible tant que ce champ est vide.`
                      : undefined
                  }
                >
                  <textarea
                    {...describedBy(
                      "cc-variance-note",
                      totals.needsExplanation && noteTouched ? "error" : undefined,
                      true,
                    )}
                    rows={3}
                    value={session.varianceNote}
                    onChange={(e) => edit({ varianceNote: e.target.value }, "reconcile")}
                    onBlur={() => setNoteTouched(true)}
                    className={cn(inputCls, "resize-y")}
                  />
                </Field>
              ))}
            <Notice
              message={noticeFor("reconcile")}
              onDismiss={dismiss}
              tone="info"
              className="mt-3"
            />
          </Panel>

          {/* ── participants ───────────────────────────────────────── */}
          <Panel eyebrow="Participants" title="Attestations">
            {session.participants.length === 0 ? (
              <EmptyNote>Aucun participant n’est inscrit à cette séance.</EmptyNote>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {session.participants.map((p) => (
                  <li
                    key={p.personId}
                    id={`cc-part-${p.personId}`}
                    tabIndex={-1}
                    className="border-gold/10 focus-visible:outline-gold-light flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-[12px] border bg-white/[0.025] px-3.5 py-3 focus:outline-none focus-visible:outline-2"
                  >
                    <div className="min-w-0">
                      <p className="text-on-dark text-[14.5px] font-medium">
                        {fullName(p.personId)}
                        {isMe(p.personId) && (
                          <span className="text-on-dark-faint font-normal"> (vous)</span>
                        )}
                      </p>
                      <p className="text-on-dark-muted text-[12.5px]">{p.role}</p>
                    </div>
                    {p.attestedAt ? (
                      <div className="flex flex-col items-end gap-1">
                        <Pill tone="emerald">
                          <CheckIcon width={13} height={13} /> Attesté
                        </Pill>
                        <span className="text-on-dark-faint text-[12px]">
                          le {formatDateTime(p.attestedAt)}
                        </span>
                      </div>
                    ) : closed ? (
                      <Pill>Non attesté</Pill>
                    ) : (
                      <button
                        type="button"
                        disabled={totals.needsExplanation}
                        aria-describedby={totals.needsExplanation ? "cc-attest-blocked" : undefined}
                        onClick={() => setConfirm({ kind: "attest", personId: p.personId })}
                        className={btn("subtle", "sm")}
                      >
                        {isMe(p.personId)
                          ? "Attester (en mon nom)"
                          : `Attester (au nom de ${personName(p.personId)})`}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!closed && totals.needsExplanation && (
              <p id="cc-attest-blocked" className="mt-3 text-[13px] text-[#ffd98a]">
                Les attestations s’ouvrent une fois l’écart expliqué : chacun atteste un
                procès-verbal complet.
              </p>
            )}
            {!closed && (
              <p className="text-on-dark-faint mt-3 text-[12.5px]">
                Une attestation porte sur la version affichée : toute modification du comptage la
                retire.
              </p>
            )}
            <Notice message={noticeFor("participants")} onDismiss={dismiss} className="mt-3" />
            <DemoNote>
              Pour la démonstration, vous pouvez attester au nom de chaque participant. En
              production, chaque personne atteste depuis sa propre session authentifiée (nom, date,
              heure et intention enregistrés).
            </DemoNote>
          </Panel>

          {/* ── closing ────────────────────────────────────────────── */}
          {!closed && (
            <Panel eyebrow="Clôture" title="Clôturer le comptage">
              <button
                type="button"
                disabled={!canClose}
                aria-describedby="cc-close-status"
                onClick={() => setConfirm({ kind: "close" })}
                className={btn("gold")}
              >
                <LockIcon width={16} height={16} /> Clôturer le comptage
              </button>
              <div id="cc-close-status" className="mt-3 text-[13.5px] leading-relaxed">
                {canClose ? (
                  <p className="text-[#9fe0c2]">
                    Tout est prêt : chaque participant a attesté et le rapprochement est complet.
                  </p>
                ) : (
                  <>
                    <p className="text-on-dark-muted">Clôture impossible pour l’instant :</p>
                    <ul className="mt-1 list-disc pl-5 text-[#ffd98a]">
                      {totals.needsExplanation && (
                        <li>l’écart de {formatSigned(totals.variance)} n’est pas expliqué ;</li>
                      )}
                      {session.participants.length === 0 && (
                        <li>aucun participant n’est inscrit ;</li>
                      )}
                      {pending.length > 0 && (
                        <li>
                          {pending.length === 1
                            ? "il manque l’attestation de "
                            : `il manque ${pending.length} attestations : `}
                          {pending.map((p) => fullName(p.personId)).join(", ")}.
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </div>
            </Panel>
          )}
        </div>
      </div>

      {/* ── procès-verbal ──────────────────────────────────────────── */}
      <Panel
        eyebrow="Document"
        title="Procès-verbal de comptage"
        action={
          <button
            type="button"
            onClick={openPv}
            aria-expanded={pvOpen}
            aria-controls="cc-pv"
            className={btn(pvOpen ? "ghost" : "subtle", "sm")}
          >
            {pvOpen ? "Masquer le procès-verbal" : "Voir le procès-verbal"}
          </button>
        }
      >
        <p className="text-on-dark-muted text-[14px] leading-relaxed">
          Généré à partir des données saisies ci-dessus, avec les attestations enregistrées. Il
          s’imprime seul, sur fond blanc.
        </p>
        <div id="cc-pv" hidden={!pvOpen}>
          {pvOpen && (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => window.print()} className={btn("gold", "sm")}>
                  Imprimer / PDF
                </button>
                <p className="text-on-dark-faint text-[12.5px]">
                  Pour un PDF, choisissez « Enregistrer au format PDF » comme imprimante.
                </p>
              </div>
              <div className="mt-4 overflow-x-auto rounded-[14px] bg-[#fbf9f3] p-5 shadow-[0_24px_50px_-30px_rgba(0,0,0,0.9)] md:p-9">
                <PvDocument session={session} nameOf={fullName} generatedAt={generatedAt} />
              </div>
              <PrintPortal>
                <PvDocument session={session} nameOf={fullName} generatedAt={generatedAt} />
              </PrintPortal>
            </>
          )}
        </div>
      </Panel>

      {/* ── history ───────────────────────────────────────────────── */}
      <PastCounts
        current={
          closed
            ? {
                date: session.date,
                countedCents: totals.counted,
                varianceCents: totals.variance,
                participants: session.participants.length,
              }
            : null
        }
      />

      <Dialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.kind === "close" ? "Clôturer le comptage ?" : "Attester le comptage"}
        footer={
          confirm?.kind === "close" ? (
            <>
              <button type="button" onClick={() => setConfirm(null)} className={btn("ghost")}>
                Retour
              </button>
              <button type="button" onClick={confirmClose} className={btn("gold")}>
                Clôturer et verrouiller
              </button>
            </>
          ) : confirm?.kind === "attest" ? (
            <>
              <button type="button" onClick={() => setConfirm(null)} className={btn("ghost")}>
                Retour
              </button>
              <button
                type="button"
                onClick={() => confirmAttest(confirm.personId)}
                className={btn("gold")}
              >
                {isMe(confirm.personId)
                  ? "J’atteste"
                  : `Attester au nom de ${personName(confirm.personId)}`}
              </button>
            </>
          ) : undefined
        }
      >
        {confirm?.kind === "close" && (
          <div className="text-on-dark-muted flex flex-col gap-3 text-[14.5px] leading-relaxed">
            <dl className="border-gold/12 rounded-[12px] border bg-white/[0.03] px-4 py-2">
              <LedgerRow label="Total compté" value={formatCADCents(totals.counted)} />
              <LedgerRow
                label="Écart"
                value={totals.variance === 0 ? "Aucun écart" : formatSigned(totals.variance)}
              />
              <LedgerRow
                label="Attestations"
                value={`${session.participants.length} sur ${session.participants.length}`}
              />
            </dl>
            <p>
              Le procès-verbal sera verrouillé : plus aucune modification possible. Toute correction
              passera par une rectification versionnée, et ce document original restera disponible.
            </p>
            <p>
              Les entrées correspondantes seront ajoutées au journal à l’état « Soumis », pour
              approbation.
            </p>
          </div>
        )}
        {confirm?.kind === "attest" && confirmPerson && (
          <div className="text-on-dark-muted flex flex-col gap-3 text-[14.5px] leading-relaxed">
            <blockquote className="border-gold/60 text-on-dark rounded-[12px] border-l-2 bg-white/[0.03] px-4 py-3">
              « Je, {fullName(confirmPerson.personId)} ({confirmPerson.role.toLowerCase()}), atteste
              avoir participé au comptage du {fullDay(session.date)} — {session.source} — et
              confirme un total compté de{" "}
              <span className="nums">{formatCADCents(totals.counted)}</span> pour un total attendu
              de <span className="nums">{formatCADCents(session.expectedCents)}</span>
              {totals.variance === 0 ? (
                ", sans écart."
              ) : (
                <>
                  , soit un écart de <span className="nums">{formatSigned(totals.variance)}</span>{" "}
                  expliqué au procès-verbal.
                </>
              )}{" "}
              »
            </blockquote>
            <p className="text-[13px]">
              Le nom, la date et l’heure sont enregistrés. Si le comptage est modifié ensuite, cette
              attestation sera retirée.
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-on-dark-muted text-[12.5px]">{label}</dt>
      <dd className="text-on-dark mt-0.5 text-[15px] break-words">{value}</dd>
    </div>
  );
}

// ── quantity cell ────────────────────────────────────────────────────────
/**
 * Keeps the typed text while the field is focused (so clearing it to retype works),
 * commits every valid whole number to the store at once, and shows the store value again
 * on blur (an emptied field counts as 0). An invalid entry stays visible with its message
 * and is not counted.
 */
function QuantityInput({
  id,
  quantity,
  onCommit,
}: {
  id: string;
  quantity: number;
  onCommit: (q: number) => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? String(quantity);
  const invalid = text !== null && text !== "" && !/^\d+$/.test(text);
  return (
    <div className="flex flex-col gap-1">
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={shown}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        onFocus={() => setText(String(quantity))}
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          if (/^\d+$/.test(v)) onCommit(Number(v));
        }}
        onBlur={() => {
          // An emptied field means zero; an invalid entry stays visible with its message.
          if (text === "") onCommit(0);
          setText((t) => (t !== null && t !== "" && !/^\d+$/.test(t) ? t : null));
        }}
        className={cn(inputCls, "nums w-24 px-3 py-2 text-right")}
      />
      {invalid && (
        <p id={`${id}-error`} role="alert" className="max-w-[10rem] text-[12px] text-[#ffb9a6]">
          Nombre entier, 0 ou plus : cette valeur n’est pas comptée.
        </p>
      )}
    </div>
  );
}

// ── add rows ─────────────────────────────────────────────────────────────
function AddRowToggle({
  open,
  onToggle,
  controls,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  controls: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controls}
      className={`${btn("ghost", "sm")} mt-4`}
    >
      <PlusIcon width={15} height={15} />
      {children}
    </button>
  );
}

type EnvelopeValues = { reference: string; count: string; amount: string };

function AddEnvelope({
  onAdd,
}: {
  onAdd: (e: { reference: string; count: number; amountCents: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const form = useValidatedForm<EnvelopeValues>(
    { reference: "", count: "", amount: "" },
    (v) => {
      const e: Partial<Record<keyof EnvelopeValues, string>> = {};
      if (!v.reference.trim())
        e.reference = "Indiquez la référence du lot (ex. « Enveloppes du vendredi »).";
      const c = v.count.trim();
      if (!c) e.count = "Indiquez le nombre d’enveloppes.";
      else if (!/^\d+$/.test(c) || Number(c) < 1)
        e.count = "Le nombre d’enveloppes est un nombre entier, 1 ou plus.";
      const a = amountError(v.amount);
      if (a) e.amount = a;
      return e;
    },
    "cc-env",
  );
  return (
    <>
      <AddRowToggle open={open} onToggle={() => setOpen((o) => !o)} controls="cc-env-form">
        {open ? "Fermer l’ajout" : "Ajouter une enveloppe"}
      </AddRowToggle>
      <div id="cc-env-form" hidden={!open}>
        {open && (
          <form
            noValidate
            aria-label="Ajouter une enveloppe"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.trySubmit()) return;
              const amount = parseAmount(form.values.amount);
              if (!amount.ok) return;
              onAdd({
                reference: form.values.reference.trim(),
                count: Number(form.values.count.trim()),
                amountCents: amount.cents,
              });
              form.reset();
              document.getElementById(form.id("reference"))?.focus();
            }}
            className="border-gold/15 bg-night/40 mt-3 grid gap-3 rounded-[12px] border p-4 sm:grid-cols-[1fr_110px_130px]"
          >
            <Field
              id={form.id("reference")}
              label="Référence"
              required
              error={form.errorOf("reference")}
            >
              <input
                {...describedBy(form.id("reference"), form.errorOf("reference"))}
                type="text"
                autoComplete="off"
                value={form.values.reference}
                onChange={(e) => form.set("reference", e.target.value)}
                onBlur={() => form.blur("reference")}
                className={inputCls}
              />
            </Field>
            <Field id={form.id("count")} label="Nombre" required error={form.errorOf("count")}>
              <input
                {...describedBy(form.id("count"), form.errorOf("count"))}
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={form.values.count}
                onChange={(e) => form.set("count", e.target.value)}
                onBlur={() => form.blur("count")}
                className={cn(inputCls, "nums")}
              />
            </Field>
            <Field
              id={form.id("amount")}
              label="Montant ($)"
              required
              error={form.errorOf("amount")}
            >
              <input
                {...describedBy(form.id("amount"), form.errorOf("amount"))}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={form.values.amount}
                onChange={(e) => form.set("amount", e.target.value)}
                onBlur={() => form.blur("amount")}
                className={cn(inputCls, "nums")}
              />
            </Field>
            <div className="sm:col-span-3">
              <button type="submit" className={btn("gold", "sm")}>
                Ajouter l’enveloppe
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

type CheckValues = { drawer: string; reference: string; amount: string };

function AddCheck({
  onAdd,
}: {
  onAdd: (c: { drawer: string; reference: string; amountCents: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const form = useValidatedForm<CheckValues>(
    { drawer: "", reference: "", amount: "" },
    (v) => {
      const e: Partial<Record<keyof CheckValues, string>> = {};
      if (!v.drawer.trim())
        e.drawer = "Indiquez le nom du tireur (la personne ou la famille qui a signé le chèque).";
      if (v.reference.trim().length > 40)
        e.reference = "La référence est trop longue (40 caractères maximum).";
      const a = amountError(v.amount);
      if (a) e.amount = a;
      return e;
    },
    "cc-chk",
  );
  return (
    <>
      <AddRowToggle open={open} onToggle={() => setOpen((o) => !o)} controls="cc-chk-form">
        {open ? "Fermer l’ajout" : "Ajouter un chèque"}
      </AddRowToggle>
      <div id="cc-chk-form" hidden={!open}>
        {open && (
          <form
            noValidate
            aria-label="Ajouter un chèque"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.trySubmit()) return;
              const amount = parseAmount(form.values.amount);
              if (!amount.ok) return;
              onAdd({
                drawer: form.values.drawer.trim(),
                reference: form.values.reference.trim(),
                amountCents: amount.cents,
              });
              form.reset();
              document.getElementById(form.id("drawer"))?.focus();
            }}
            className="border-gold/15 bg-night/40 mt-3 grid gap-3 rounded-[12px] border p-4 sm:grid-cols-[1fr_120px_130px]"
          >
            <Field
              id={form.id("drawer")}
              label="Nom du tireur"
              required
              error={form.errorOf("drawer")}
            >
              <input
                {...describedBy(form.id("drawer"), form.errorOf("drawer"))}
                type="text"
                autoComplete="off"
                value={form.values.drawer}
                onChange={(e) => form.set("drawer", e.target.value)}
                onBlur={() => form.blur("drawer")}
                className={inputCls}
              />
            </Field>
            <Field
              id={form.id("reference")}
              label="Référence"
              hint="Facultatif"
              error={form.errorOf("reference")}
            >
              <input
                {...describedBy(form.id("reference"), form.errorOf("reference"), true)}
                type="text"
                autoComplete="off"
                value={form.values.reference}
                onChange={(e) => form.set("reference", e.target.value)}
                onBlur={() => form.blur("reference")}
                className={inputCls}
              />
            </Field>
            <Field
              id={form.id("amount")}
              label="Montant ($)"
              required
              error={form.errorOf("amount")}
            >
              <input
                {...describedBy(form.id("amount"), form.errorOf("amount"))}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={form.values.amount}
                onChange={(e) => form.set("amount", e.target.value)}
                onBlur={() => form.blur("amount")}
                className={cn(inputCls, "nums")}
              />
            </Field>
            <div className="sm:col-span-3">
              <button type="submit" className={btn("gold", "sm")}>
                Ajouter le chèque
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

// ── history ──────────────────────────────────────────────────────────────
function PastCounts({
  current,
}: {
  current: {
    date: string;
    countedCents: number;
    varianceCents: number;
    participants: number;
  } | null;
}) {
  const rows = [...(current ? [{ id: "current", ...current }] : []), ...pastCounts];
  return (
    <Panel eyebrow="Historique" title="Comptages précédents">
      {rows.length === 0 ? (
        <EmptyNote>Aucun comptage précédent.</EmptyNote>
      ) : (
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[520px] border-collapse text-[14.5px]">
            <caption className="sr-only">Comptages précédents</caption>
            <thead>
              <tr className="border-gold/15 text-on-dark-muted border-b text-left text-[12.5px]">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Date
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  Total compté
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  Écart
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  Participants
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  État
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-gold/[0.07] border-b">
                  <th scope="row" className="text-on-dark py-2.5 pr-3 text-left font-normal">
                    <time dateTime={r.date}>{formatDay(r.date)}</time>
                  </th>
                  <td className="nums text-on-dark py-2.5 pr-3 text-right">
                    {formatCADCents(r.countedCents)}
                  </td>
                  <td
                    className={cn(
                      "nums py-2.5 pr-3 text-right",
                      r.varianceCents === 0 ? "text-[#9fe0c2]" : "text-[#ffd98a]",
                    )}
                  >
                    {r.varianceCents === 0 ? "Aucun" : formatSigned(r.varianceCents)}
                  </td>
                  <td className="nums text-on-dark py-2.5 pr-3 text-right">{r.participants}</td>
                  <td className="py-2.5 text-right">
                    <Pill tone="emerald">Clôturé</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
