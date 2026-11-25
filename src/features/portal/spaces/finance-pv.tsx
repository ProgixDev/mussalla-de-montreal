import { countTotals } from "@/core/portal/derive";
import type { CashCountSession } from "@/core/portal/types";
import { formatCADCents, formatDateTime, formatDayLong } from "@/lib/format";
import { COUNT_STATUS_META, denominationLabel, formatSigned } from "./finance-lib";

/**
 * « Procès-verbal de comptage » as a paper document (§4.10 table « Section du
 * procès-verbal »). Light ground and ink colours: the same markup is shown on screen as a
 * preview sheet and printed (PrintPortal). Presentational only.
 */
export function PvDocument({
  session,
  nameOf,
  generatedAt,
}: {
  session: CashCountSession;
  nameOf: (personId: string) => string;
  generatedAt: string;
}) {
  const t = countTotals(session);
  const day = `${formatDayLong(session.date)} ${session.date.slice(0, 4)}`;
  const attested = session.participants.filter((p) => p.attestedAt).length;

  return (
    <article
      className="mx-auto max-w-[760px] text-[13px] leading-relaxed text-[#1d1f1c]"
      aria-label="Procès-verbal de comptage"
    >
      <header className="border-b-2 border-[#1d1f1c] pb-3">
        <p className="text-[10.5px] font-semibold tracking-[0.18em] text-[#4f564f] uppercase">
          Mussalla de Montréal — centre communautaire
        </p>
        <h3 className="font-display mt-1 text-[26px] leading-tight text-[#0e231b]">
          Procès-verbal de comptage
        </h3>
        <p className="mt-0.5 text-[12px] text-[#4f564f]">
          Réf. {session.id} · {COUNT_STATUS_META[session.status].label} · document généré le{" "}
          {generatedAt}
        </p>
      </header>

      <PvSection title="Métadonnées">
        <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          <PvMeta label="Date" value={day} />
          <PvMeta label="Lieu" value={session.place} />
          <PvMeta label="Caisse ou source comptée" value={session.source} />
          <PvMeta
            label="Participants"
            value={`${session.participants.length} (${attested} attestation${attested > 1 ? "s" : ""})`}
          />
        </dl>
      </PvSection>

      <PvSection title="Pièces et billets">
        <table className="w-full border-collapse">
          <caption className="sr-only">Pièces et billets comptés</caption>
          <thead>
            <tr className="border-b border-[#1d1f1c]/40 text-left text-[11.5px] text-[#4f564f]">
              <th scope="col" className="py-1.5 font-semibold">
                Dénomination
              </th>
              <th scope="col" className="py-1.5 text-right font-semibold">
                Quantité
              </th>
              <th scope="col" className="py-1.5 text-right font-semibold">
                Sous-total
              </th>
            </tr>
          </thead>
          <tbody>
            {session.denominations.map((d) => (
              <tr key={d.cents} className="border-b border-[#1d1f1c]/12">
                <th scope="row" className="py-1 text-left font-normal">
                  {denominationLabel(d.cents)}
                </th>
                <td className="nums py-1 text-right">{d.quantity}</td>
                <td className="nums py-1 text-right">{formatCADCents(d.cents * d.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2} className="pt-2 text-left font-semibold">
                Total pièces et billets
              </th>
              <td className="nums pt-2 text-right font-semibold">
                {formatCADCents(t.coinsAndBills)}
              </td>
            </tr>
          </tfoot>
        </table>
      </PvSection>

      <PvSection title="Enveloppes">
        {session.envelopes.length === 0 ? (
          <p className="text-[#4f564f]">Aucune enveloppe.</p>
        ) : (
          <table className="w-full border-collapse">
            <caption className="sr-only">Enveloppes</caption>
            <thead>
              <tr className="border-b border-[#1d1f1c]/40 text-left text-[11.5px] text-[#4f564f]">
                <th scope="col" className="py-1.5 font-semibold">
                  Référence
                </th>
                <th scope="col" className="py-1.5 text-right font-semibold">
                  Nombre
                </th>
                <th scope="col" className="py-1.5 text-right font-semibold">
                  Montant
                </th>
              </tr>
            </thead>
            <tbody>
              {session.envelopes.map((e) => (
                <tr key={e.id} className="border-b border-[#1d1f1c]/12">
                  <th scope="row" className="py-1 text-left font-normal">
                    {e.reference}
                  </th>
                  <td className="nums py-1 text-right">{e.count}</td>
                  <td className="nums py-1 text-right">{formatCADCents(e.amountCents)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={2} className="pt-2 text-left font-semibold">
                  Total enveloppes
                </th>
                <td className="nums pt-2 text-right font-semibold">
                  {formatCADCents(t.envelopes)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </PvSection>

      <PvSection title="Chèques">
        {session.checks.length === 0 ? (
          <p className="text-[#4f564f]">Aucun chèque.</p>
        ) : (
          <table className="w-full border-collapse">
            <caption className="sr-only">Chèques</caption>
            <thead>
              <tr className="border-b border-[#1d1f1c]/40 text-left text-[11.5px] text-[#4f564f]">
                <th scope="col" className="py-1.5 font-semibold">
                  Tireur
                </th>
                <th scope="col" className="py-1.5 font-semibold">
                  Référence
                </th>
                <th scope="col" className="py-1.5 text-right font-semibold">
                  Montant
                </th>
              </tr>
            </thead>
            <tbody>
              {session.checks.map((c) => (
                <tr key={c.id} className="border-b border-[#1d1f1c]/12">
                  <th scope="row" className="py-1 text-left font-normal">
                    {c.drawer}
                  </th>
                  <td className="py-1">{c.reference || "—"}</td>
                  <td className="nums py-1 text-right">{formatCADCents(c.amountCents)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={2} className="pt-2 text-left font-semibold">
                  Total chèques
                </th>
                <td className="nums pt-2 text-right font-semibold">{formatCADCents(t.checks)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </PvSection>

      <PvSection title="Rapprochement">
        <dl className="max-w-[420px]">
          <PvLine label="Total attendu" value={formatCADCents(session.expectedCents)} />
          <PvLine label="Total compté" value={formatCADCents(t.counted)} />
          <PvLine
            label="Écart"
            value={
              t.variance === 0
                ? "Aucun écart"
                : `${formatSigned(t.variance)} (${t.variance > 0 ? "excédent" : "manque"})`
            }
            strong
          />
        </dl>
        {t.variance !== 0 && (
          <p className="mt-2">
            <span className="font-semibold">Explication de l’écart : </span>
            {session.varianceNote.trim() || (
              <em className="text-[#8a3b25]">non fournie — obligatoire avant la clôture.</em>
            )}
          </p>
        )}
      </PvSection>

      <PvSection title="Attestations">
        <table className="w-full border-collapse">
          <caption className="sr-only">Attestations des participants</caption>
          <thead>
            <tr className="border-b border-[#1d1f1c]/40 text-left text-[11.5px] text-[#4f564f]">
              <th scope="col" className="py-1.5 font-semibold">
                Participant
              </th>
              <th scope="col" className="py-1.5 font-semibold">
                Rôle
              </th>
              <th scope="col" className="py-1.5 font-semibold">
                Attestation
              </th>
            </tr>
          </thead>
          <tbody>
            {session.participants.map((p) => (
              <tr key={p.personId} className="border-b border-[#1d1f1c]/12">
                <th scope="row" className="py-1.5 text-left font-normal">
                  {nameOf(p.personId)}
                </th>
                <td className="py-1.5">{p.role}</td>
                <td className="py-1.5">
                  {p.attestedAt ? `Attesté le ${formatDateTime(p.attestedAt)}` : "En attente"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PvSection>

      <footer className="mt-6 border-t border-[#1d1f1c]/25 pt-3 text-[11px] leading-relaxed text-[#4f564f]">
        Attestations applicatives : chaque participant confirme depuis sa session authentifiée (nom,
        date, heure et intention d’approuver). La valeur juridique de la signature électronique
        reste à confirmer (cahier des charges, §9, question 5). Après clôture, toute correction
        passe par une rectification versionnée ; ce document original reste disponible.
      </footer>
    </article>
  );
}

function PvSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h4 className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-[#4f564f] uppercase">
        {title}
      </h4>
      {children}
    </section>
  );
}

function PvMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11.5px] text-[#4f564f]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function PvLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline gap-2 py-0.5">
      <dt className={`flex min-w-0 flex-1 items-baseline gap-2 ${strong ? "font-semibold" : ""}`}>
        <span>{label}</span>
        <span
          aria-hidden="true"
          className="min-w-6 flex-1 self-end border-b border-dotted border-[#1d1f1c]/40"
          style={{ marginBottom: "0.35em" }}
        />
      </dt>
      <dd className={`nums text-right ${strong ? "font-semibold" : ""}`}>{value}</dd>
    </div>
  );
}
