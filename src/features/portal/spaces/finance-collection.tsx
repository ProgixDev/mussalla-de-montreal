"use client";

import { useState } from "react";
import { usePortal } from "@/lib/portal/store";
import { collectionReady, collectionTotal } from "@/core/portal/derive";
import type { ExternalCollection, Person } from "@/core/portal/types";
import { Dialog } from "@/components/portal/dialog";
import { Panel, Pill, btn } from "@/components/portal/kit";
import { ArrowRightIcon, CheckIcon, LockIcon } from "@/components/ui/icons";
import { formatCADCents, formatDateTime, formatDayLong } from "@/lib/format";
import { DemoNote, usePersonName } from "../shared";
import { formatSigned, type Tone } from "./finance-lib";
import { LedgerRow, Notice, PrivateMarker, StatusPill } from "./finance-ui";

const REQUIRED = 2;

const COLLECTION_STATUS: Record<ExternalCollection["status"], { label: string; tone: Tone }> = {
  brouillon: { label: "Brouillon", tone: "neutral" },
  soumis: { label: "Soumis à la comptabilité", tone: "gold" },
  rapproche: { label: "Rapproché", tone: "emerald" },
};

const focusLater = (id: string) =>
  requestAnimationFrame(() => document.getElementById(id)?.focus());

/**
 * « Collecte extérieure » — the private PV of a collection made at another mosque or
 * centre (§4.10, workflow §6.6). Never published; needs two authenticated attestations,
 * then reaches the accountant to be reconciled with an entry of the journal.
 */
export function FinanceCollection({
  me,
  onOpenJournal,
}: {
  me: Person;
  onOpenJournal: () => void;
}) {
  const c = usePortal((s) => s.externalCollection);
  const attestCollection = usePortal((s) => s.attestCollection);
  const transactions = usePortal((s) => s.transactions);
  const personName = usePersonName();
  const fullName = (id: string) => personName(id, true);

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const total = collectionTotal(c);
  const forCentre = total - c.shareForHostCents;
  const ready = collectionReady(c);
  const done = Math.min(c.attestations.length, REQUIRED);
  const day = `${formatDayLong(c.date)} ${c.date.slice(0, 4)}`;
  const status = COLLECTION_STATUS[c.status];
  // Collectors first, then anyone else who attested (a host responsible, for instance).
  const people = [
    ...c.collectorIds,
    ...c.attestations.map((a) => a.personId).filter((id) => !c.collectorIds.includes(id)),
  ];
  const attestationOf = (id: string) => c.attestations.find((a) => a.personId === id);
  const linked = transactions.find((t) => t.reference === c.id.toUpperCase());
  const isMe = (id: string) => id === me.id;

  const confirmAttest = (personId: string) => {
    const wasReady = collectionReady(c);
    attestCollection(personId);
    const next = usePortal.getState().externalCollection;
    const at = next.attestations.find((a) => a.personId === personId)?.at;
    setNotice(
      `Attestation enregistrée pour ${fullName(personId)}${at ? `, le ${formatDateTime(at)}` : ""}.${
        !wasReady && collectionReady(next)
          ? " Deux responsables ont attesté : le procès-verbal est verrouillé et transmis à la comptabilité."
          : ""
      }`,
    );
    setConfirmId(null);
    focusLater(`col-person-${personId}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <Panel
        eyebrow="Procès-verbal de collecte extérieure"
        title={c.place}
        action={<Pill tone={status.tone}>{status.label}</Pill>}
      >
        <div className="flex flex-wrap items-center gap-3">
          <PrivateMarker />
        </div>
        <p className="text-on-dark-muted mt-3 max-w-[640px] text-[14px] leading-relaxed">
          Ce document n’apparaît ni sur le site, ni sur les écrans, ni dans la transparence publiée.
          Après deux attestations, il est verrouillé et transmis à la comptabilité pour
          rapprochement.
        </p>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <section aria-labelledby="col-visit">
            <h3 id="col-visit" className="eyebrow text-gold">
              Visite
            </h3>
            <dl className="mt-3 grid gap-3">
              <Meta label="Date" value={day} />
              <Meta label="Centre ou mosquée visité" value={c.place} />
              <Meta label="Adresse" value={c.address} />
              <Meta
                label="Équipe de collecte"
                value={c.collectorIds.map(fullName).join(", ") || "—"}
              />
            </dl>
          </section>
          <section aria-labelledby="col-amounts">
            <h3 id="col-amounts" className="eyebrow text-gold">
              Montants
            </h3>
            <dl className="mt-2">
              <LedgerRow label="Interac / virement" value={formatCADCents(c.interacCents)} />
              <LedgerRow label="Espèces" value={formatCADCents(c.cashCents)} />
              <LedgerRow
                label="Total reçu"
                value={formatCADCents(total)}
                strong
                className="border-gold/15 mt-1 border-t pt-2.5"
              />
              <LedgerRow
                label="Part pour le centre visité"
                value={c.shareForHostCents > 0 ? formatCADCents(c.shareForHostCents) : "Aucune"}
              />
              {c.shareForHostCents > 0 && (
                <LedgerRow label="Revient au centre" value={formatCADCents(forCentre)} strong />
              )}
            </dl>
          </section>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Panel eyebrow="Attestations" title="Responsables présents">
          <p className="text-on-dark text-[14px]">Au moins deux responsables doivent attester.</p>
          <div className="mt-3 flex items-center gap-3">
            <div
              aria-hidden="true"
              className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]"
            >
              <div
                className={
                  ready
                    ? "h-full rounded-full bg-[#5fb38c]"
                    : "from-gold/70 to-gold-light h-full rounded-full bg-linear-to-r"
                }
                style={{ width: `${(done / REQUIRED) * 100}%` }}
              />
            </div>
            <p className="nums text-on-dark shrink-0 text-[14px] font-medium">
              {done}/{REQUIRED}
              <span className="sr-only">
                {" "}
                : {done} attestation{done > 1 ? "s" : ""} sur {REQUIRED} requises
              </span>
            </p>
          </div>

          <ul className="mt-4 flex flex-col gap-2.5">
            {people.map((id) => {
              const a = attestationOf(id);
              return (
                <li
                  key={id}
                  id={`col-person-${id}`}
                  tabIndex={-1}
                  className="border-gold/10 focus-visible:outline-gold-light flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-[12px] border bg-white/[0.025] px-3.5 py-3 focus:outline-none focus-visible:outline-2"
                >
                  <div className="min-w-0">
                    <p className="text-on-dark text-[14.5px] font-medium">
                      {fullName(id)}
                      {isMe(id) && <span className="text-on-dark-faint font-normal"> (vous)</span>}
                    </p>
                    <p className="text-on-dark-muted text-[12.5px]">
                      {c.collectorIds.includes(id) ? "Équipe de collecte" : "Responsable présent"}
                    </p>
                  </div>
                  {a ? (
                    <div className="flex flex-col items-end gap-1">
                      <Pill tone="emerald">
                        <CheckIcon width={13} height={13} /> Attesté
                      </Pill>
                      <span className="text-on-dark-faint text-[12px]">
                        le {formatDateTime(a.at)}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(id)}
                      className={btn("subtle", "sm")}
                    >
                      {isMe(id)
                        ? "Attester (en mon nom)"
                        : `Attester (au nom de ${personName(id)})`}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <Notice message={notice} onDismiss={() => setNotice(null)} className="mt-3" />
          <DemoNote>
            Pour la démonstration, vous pouvez attester au nom de chaque collecteur. En production,
            chaque responsable atteste depuis sa propre session authentifiée ; le comptage par
            dénominations du PV est saisi par l’équipe sur place.
          </DemoNote>
        </Panel>

        <Panel eyebrow="Comptabilité" title="Rapprochement">
          {ready ? (
            <p className="flex items-start gap-2.5 rounded-[12px] border border-[#1c7d5b]/45 bg-[#1c7d5b]/12 px-3.5 py-2.5 text-[14px] leading-relaxed text-[#c9f0dc]">
              <LockIcon width={17} height={17} className="mt-0.5 shrink-0" />
              Procès-verbal verrouillé et transmis à la comptabilité.
            </p>
          ) : (
            <p className="text-on-dark-muted text-[14px] leading-relaxed">
              Le rapprochement commence une fois le procès-verbal attesté par deux responsables (il
              en manque {REQUIRED - done}).
            </p>
          )}

          {linked ? (
            <div className="border-gold/12 mt-4 rounded-[12px] border bg-white/[0.03] px-4 py-3">
              <p className="text-on-dark-muted text-[12.5px]">Écriture liée dans le journal</p>
              <p className="text-on-dark mt-1 text-[14.5px] break-words">{linked.label}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="nums text-gold-light text-[15px]">
                  {formatCADCents(linked.amountCents)}
                </span>
                <StatusPill status={linked.status} />
              </div>
              <p className="mt-2 text-[13.5px]">
                {linked.amountCents === forCentre ? (
                  <span className="text-[#9fe0c2]">
                    Montants concordants avec le procès-verbal.
                  </span>
                ) : (
                  <span className="text-[#ffd98a]">
                    Écart de {formatSigned(linked.amountCents - forCentre)} avec le procès-verbal :
                    à examiner.
                  </span>
                )}
              </p>
            </div>
          ) : (
            <p className="text-on-dark-faint mt-4 text-[13.5px]">
              Aucune écriture du journal ne porte encore la référence {c.id.toUpperCase()}.
            </p>
          )}
          <button type="button" onClick={onOpenJournal} className={`${btn("ghost", "sm")} mt-4`}>
            Ouvrir le journal <ArrowRightIcon width={15} height={15} />
          </button>
        </Panel>
      </div>

      <Dialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        title="Attester la collecte"
        footer={
          confirmId ? (
            <>
              <button type="button" onClick={() => setConfirmId(null)} className={btn("ghost")}>
                Retour
              </button>
              <button
                type="button"
                onClick={() => confirmAttest(confirmId)}
                className={btn("gold")}
              >
                {isMe(confirmId) ? "J’atteste" : `Attester au nom de ${personName(confirmId)}`}
              </button>
            </>
          ) : undefined
        }
      >
        {confirmId && (
          <div className="text-on-dark-muted flex flex-col gap-3 text-[14.5px] leading-relaxed">
            <blockquote className="border-gold/60 text-on-dark rounded-[12px] border-l-2 bg-white/[0.03] px-4 py-3">
              « Je, {fullName(confirmId)}, atteste avoir participé à la collecte du {day} —{" "}
              {c.place}, {c.address} — et confirme un total reçu de{" "}
              <span className="nums">{formatCADCents(total)}</span> (Interac{" "}
              <span className="nums">{formatCADCents(c.interacCents)}</span>, espèces{" "}
              <span className="nums">{formatCADCents(c.cashCents)}</span>). »
            </blockquote>
            <p className="text-[13px]">
              Le nom, la date et l’heure sont enregistrés. Ce procès-verbal reste privé.
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-on-dark-muted text-[12.5px]">{label}</dt>
      <dd className="text-on-dark mt-0.5 text-[15px] break-words">{value}</dd>
    </div>
  );
}
