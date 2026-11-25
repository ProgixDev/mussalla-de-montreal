"use client";

import Link from "next/link";
import { useState } from "react";
import { usePortal } from "@/lib/portal/store";
import { isAlertActive, isRubricValid, rubricWeightTotal } from "@/core/portal/derive";
import type {
  AlertAudience,
  AlertChannel,
  EmergencyAlert,
  MembershipStatus,
  RubricCategory,
} from "@/core/portal/types";
import { formatDateTime, formatDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/portal/dialog";
import {
  EmptyNote,
  Field,
  Panel,
  Pill,
  Segmented,
  StatTile,
  btn,
  describedBy,
  inputCls,
} from "@/components/portal/kit";
import {
  DemoNote,
  PROFILE_LABELS,
  ROLE_LABELS,
  SpaceHeading,
  SpaceTabs,
  usePersonName,
  type SpaceProps,
} from "../shared";

type Tab = "tableau" | "alerte" | "approbations" | "baremes" | "ecrans" | "membres";

const AUDIENCE_LABELS: Record<AlertAudience, string> = {
  tout_le_centre: "Tout le centre",
  parents: "Tous les parents",
  enseignants: "Tous les enseignants",
  classe: "Une classe",
};
const CHANNEL_LABELS: Record<AlertChannel, string> = {
  portail: "Portail",
  courriel: "Courriel",
  sms: "SMS",
  ecran: "Écrans",
};
const AUDIENCE_SIZE: Record<AlertAudience, number> = {
  tout_le_centre: 236,
  parents: 188,
  enseignants: 14,
  classe: 20,
};

export function AdminSpace({ me }: SpaceProps) {
  const [tab, setTab] = useState<Tab>("tableau");
  const congrats = usePortal((s) => s.congratulations);
  const events = usePortal((s) => s.events);
  const pendingApprovals =
    congrats.filter((c) => c.status === "submitted").length +
    events.filter((e) => e.status === "submitted").length;

  return (
    <>
      <SpaceHeading eyebrow="Administration" title={`Salam, ${me.firstName}`}>
        Alertes, approbations, barèmes, écrans et membres. Les opérations sensibles sont tracées
        dans le journal d’audit (qui, quoi, quand).
      </SpaceHeading>
      <SpaceTabs
        label="Administration"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "tableau", label: "Tableau de bord" },
          { id: "alerte", label: "Alerte urgente" },
          { id: "approbations", label: "Approbations", badge: pendingApprovals },
          { id: "baremes", label: "Barèmes" },
          { id: "ecrans", label: "Écrans" },
          { id: "membres", label: "Membres" },
        ]}
      />
      {tab === "tableau" && <Dashboard go={setTab} />}
      {tab === "alerte" && <AlertComposer me={me.id} />}
      {tab === "approbations" && <Approvals me={me.id} />}
      {tab === "baremes" && <Rubrics />}
      {tab === "ecrans" && <Screens />}
      {tab === "membres" && <Members />}
    </>
  );
}

function Dashboard({ go }: { go: (t: Tab) => void }) {
  const persons = usePortal((s) => s.persons);
  const applications = usePortal((s) => s.applications);
  const congrats = usePortal((s) => s.congratulations);
  const events = usePortal((s) => s.events);
  const alerts = usePortal((s) => s.alerts);
  const screens = usePortal((s) => s.screens);
  const now = new Date().toISOString();
  const active = alerts.filter((a) => isAlertActive(a, now));
  return (
    <div className="space-y-5">
      {active.length > 0 && (
        <div
          role="status"
          className="rounded-[16px] border border-[#e07a5f]/50 bg-[#5a1d12]/60 px-5 py-4"
        >
          <p className="font-semibold text-[#ffb9a6]">Alerte en cours : {active[0]?.title}</p>
          <button
            type="button"
            onClick={() => go("alerte")}
            className="text-on-dark mt-1 text-[14px] underline underline-offset-4"
          >
            Voir le rapport d’envoi
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Membres actifs"
          value={persons.filter((p) => p.membership === "active").length}
          tone="gold"
        />
        <StatTile
          label="Adhésions à valider"
          value={persons.filter((p) => p.membership === "pending").length + applications.length}
        />
        <StatTile
          label="Approbations en attente"
          value={
            congrats.filter((c) => c.status === "submitted").length +
            events.filter((e) => e.status === "submitted").length
          }
        />
        <StatTile
          label="Écrans connectés"
          value={`${screens.filter((s) => s.status === "paired").length}/${screens.length}`}
        />
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {(
          [
            [
              "alerte",
              "Alerte urgente",
              "Tempête, fermeture, problème majeur : prévenir tout le monde en une fois.",
            ],
            [
              "approbations",
              "Approbations",
              "Félicitations à afficher, événements proposés par les responsables.",
            ],
            ["baremes", "Barèmes", "Les catégories et leurs poids, par classe ou par activité."],
          ] as const
        ).map(([id, title, text]) => (
          <button
            key={id}
            type="button"
            onClick={() => go(id)}
            className="border-gold/15 hover:border-gold/55 focus-visible:outline-gold-light rounded-[18px] border bg-white/[0.035] p-5 text-left transition focus-visible:outline-2"
          >
            <p className="font-display text-on-dark text-[20px]">{title}</p>
            <p className="text-on-dark-muted mt-1 text-[14px]">{text}</p>
          </button>
        ))}
      </div>
      <Panel eyebrow="La caisse" title="Contributions, dépenses, objectifs et affichage TV">
        <p className="text-on-dark-muted text-[14px]">
          La gestion de la caisse publique reste dans le backoffice de la caisse.
        </p>
        <Link href="/admin" className={cn(btn("ghost", "sm"), "mt-3")}>
          Ouvrir le backoffice de la caisse
        </Link>
      </Panel>
    </div>
  );
}

// ── Alerte urgente (§4.4, §6.1) ───────────────────────────────────────────
function plusHours(h: number) {
  const d = new Date(Date.now() + h * 3_600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AlertComposer({ me }: { me: string }) {
  const alerts = usePortal((s) => s.alerts);
  const publish = usePortal((s) => s.publishAlert);
  const endAlert = usePortal((s) => s.endAlert);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [instruction, setInstruction] = useState("Gardez les enfants à la maison.");
  const [level, setLevel] = useState<"urgent" | "important">("urgent");
  const [audience, setAudience] = useState<AlertAudience>("tout_le_centre");
  const [channels, setChannels] = useState<AlertChannel[]>(["portail", "courriel", "sms", "ecran"]);
  const [expires, setExpires] = useState(plusHours(24));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const [published, setPublished] = useState("");
  const now = new Date().toISOString();
  const active = alerts.filter((a) => isAlertActive(a, now));
  const past = alerts.filter((a) => !isAlertActive(a, now));

  const validate = () => {
    const e: Record<string, string> = {};
    if (title.trim().length < 4)
      e.title = "Un titre court et clair, par exemple « Centre fermé samedi — tempête ».";
    if (message.trim().length < 10) e.message = "Expliquez ce qui se passe en une ou deux phrases.";
    if (channels.length === 0) e.channels = "Choisissez au moins un canal.";
    if (!expires || new Date(expires).getTime() <= Date.now())
      e.expires = "L’expiration doit être dans le futur : une alerte expirée n’est plus affichée.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const doPublish = () => {
    publish({
      title: title.trim(),
      message: message.trim(),
      instruction: instruction.trim(),
      level,
      audience,
      channels,
      authorId: me,
      expiresAt: new Date(expires).toISOString(),
    });
    setConfirm(false);
    setPublished(title.trim());
    setTitle("");
    setMessage("");
    // Bring the delivery report (top of the tab) into view: after publishing, the admin
    // must SEE that it left and to how many people — not stay on an emptied form.
    requestAnimationFrame(() => {
      document
        .getElementById("alert-status")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("alert-status")?.focus();
    });
  };

  return (
    <div className="space-y-5">
      <div id="alert-status" tabIndex={-1} className="scroll-mt-24 outline-none">
        {published && (
          <p
            role="status"
            className="border-gold/30 bg-gold/10 text-gold-light mb-4 rounded-[14px] border px-4 py-3 text-[14.5px]"
          >
            « {published} » est publiée : bandeau sur le site, plein écran sur les télévisions,
            envois courriel et SMS ci-dessous.
          </p>
        )}
        {active.map((a) => (
          <ActiveAlert key={a.id} alert={a} onEnd={() => endAlert(a.id)} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <Panel eyebrow="Nouvelle alerte" title="Prévenir tout le monde">
          <div className="space-y-4">
            <Field id="al-title" label="Titre" required error={errors.title}>
              <input
                {...describedBy("al-title", errors.title)}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field id="al-msg" label="Message" required error={errors.message}>
              <textarea
                {...describedBy("al-msg", errors.message)}
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field
              id="al-ins"
              label="Consigne"
              hint="La consigne est mise en évidence : ce que chacun doit faire."
            >
              <input
                {...describedBy("al-ins", undefined, true)}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Segmented
              name="level"
              label="Niveau"
              value={level}
              onChange={setLevel}
              options={[
                { value: "urgent", label: "Urgent" },
                { value: "important", label: "Important" },
              ]}
            />
            <Segmented
              name="audience"
              label="Destinataires"
              value={audience}
              onChange={setAudience}
              options={(Object.keys(AUDIENCE_LABELS) as AlertAudience[]).map((k) => ({
                value: k,
                label: AUDIENCE_LABELS[k],
              }))}
            />
            <fieldset aria-describedby={errors.channels ? "al-ch-error" : undefined}>
              <legend className="text-on-dark mb-1.5 text-[13.5px] font-medium">Canaux</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CHANNEL_LABELS) as AlertChannel[]).map((c) => (
                  <label
                    key={c}
                    className={cn(
                      "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-[14px]",
                      channels.includes(c)
                        ? "border-gold/70 bg-gold/15 text-gold-light"
                        : "border-on-dark/15 text-on-dark-muted",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={channels.includes(c)}
                      onChange={(e) =>
                        setChannels((cur) =>
                          e.target.checked ? [...cur, c] : cur.filter((x) => x !== c),
                        )
                      }
                      className="size-4 accent-[#d9bd77]"
                    />
                    {CHANNEL_LABELS[c]}
                  </label>
                ))}
              </div>
              {errors.channels && (
                <p id="al-ch-error" role="alert" className="mt-1.5 text-[12.5px] text-[#ffb9a6]">
                  {errors.channels}
                </p>
              )}
            </fieldset>
            <Field id="al-exp" label="Fin de l’alerte" required error={errors.expires}>
              <input
                {...describedBy("al-exp", errors.expires)}
                type="datetime-local"
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
                className={inputCls}
              />
            </Field>
            <button
              type="button"
              onClick={() => validate() && setConfirm(true)}
              className={btn("danger")}
            >
              Publier l’alerte…
            </button>
            <DemoNote>
              Courriel et SMS passent par un fournisseur à choisir (§10) ; ici, l’envoi est simulé
              avec un rapport réaliste. À décider : une seule personne peut-elle publier, ou faut-il
              une double approbation ? (§9, question 1)
            </DemoNote>
          </div>
        </Panel>

        <Panel eyebrow="Aperçu" title="Ce que les gens verront">
          <div className="overflow-hidden rounded-[14px] border border-[#e07a5f]/50">
            <div className="bg-[#5a1d12] px-4 py-3">
              <p className="text-[12px] font-semibold tracking-[0.14em] text-[#ffb9a6] uppercase">
                {level === "urgent" ? "Alerte urgente" : "Information importante"}
              </p>
              <p className="mt-1 text-[16px] font-semibold text-white">
                {title || "Titre de l’alerte"}
              </p>
              <p className="mt-1 text-[14px] text-[#ffe1d8]">
                {message || "Le message apparaîtra ici."}
              </p>
              {instruction && (
                <p className="mt-2 text-[14.5px] font-bold text-white">{instruction}</p>
              )}
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-[13.5px]">
            <div>
              <dt className="text-on-dark-faint">Destinataires</dt>
              <dd className="text-on-dark">
                {AUDIENCE_LABELS[audience]} · ≈ {AUDIENCE_SIZE[audience]}
              </dd>
            </div>
            <div>
              <dt className="text-on-dark-faint">Canaux</dt>
              <dd className="text-on-dark">
                {channels.map((c) => CHANNEL_LABELS[c]).join(", ") || "—"}
              </dd>
            </div>
          </dl>
          <p className="text-on-dark-faint mt-3 text-[12.5px]">
            Le bandeau apparaît en haut du site public et en plein écran sur les télévisions,
            jusqu’à la fin de l’alerte.
          </p>
        </Panel>
      </div>

      <Panel eyebrow="Historique" title="Alertes passées">
        {past.length === 0 ? (
          <EmptyNote>Aucune alerte passée.</EmptyNote>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {past.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-[14px]"
              >
                <span className="text-on-dark">{a.title}</span>
                <span className="text-on-dark-faint">
                  {formatDateTime(a.publishedAt)} → {formatDateTime(a.expiresAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Publier cette alerte ?"
        footer={
          <>
            <button type="button" onClick={() => setConfirm(false)} className={btn("ghost")}>
              Annuler
            </button>
            <button type="button" onClick={doPublish} className={btn("danger")}>
              Publier maintenant
            </button>
          </>
        }
      >
        <p className="text-on-dark-muted text-[15px] leading-relaxed">
          « <span className="text-on-dark">{title}</span> » sera envoyée à{" "}
          <span className="text-on-dark">{AUDIENCE_LABELS[audience].toLowerCase()}</span> (≈{" "}
          {AUDIENCE_SIZE[audience]} personnes) par{" "}
          <span className="text-on-dark">{channels.map((c) => CHANNEL_LABELS[c]).join(", ")}</span>.
          Les SMS et courriels partis ne peuvent pas être rappelés.
        </p>
      </Dialog>
    </div>
  );
}

function ActiveAlert({ alert, onEnd }: { alert: EmergencyAlert; onEnd: () => void }) {
  const [ask, setAsk] = useState(false);
  return (
    <section
      className="rounded-[18px] border border-[#e07a5f]/50 bg-[#5a1d12]/55 p-5"
      aria-label="Alerte en cours"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Pill tone="danger">En cours jusqu’au {formatDateTime(alert.expiresAt)}</Pill>
          <p className="mt-2 text-[18px] font-semibold text-white">{alert.title}</p>
          <p className="text-[14px] text-[#ffe1d8]">{alert.message}</p>
        </div>
        <button type="button" onClick={() => setAsk(true)} className={btn("ghost", "sm")}>
          Mettre fin à l’alerte
        </button>
      </div>
      <table className="mt-4 w-full text-left text-[14px]">
        <caption className="sr-only">Rapport d’envoi</caption>
        <thead className="text-[12px] text-[#ffcfc2]">
          <tr>
            <th scope="col" className="py-1 font-medium">
              Canal
            </th>
            <th scope="col" className="py-1 font-medium">
              Envoyés
            </th>
            <th scope="col" className="py-1 font-medium">
              Échecs
            </th>
          </tr>
        </thead>
        <tbody className="text-white">
          {alert.channels.includes("portail") && (
            <tr>
              <td className="py-1">Portail</td>
              <td className="nums">publié</td>
              <td>—</td>
            </tr>
          )}
          {alert.deliveries.map((d) => (
            <tr key={d.channel}>
              <td className="py-1">{CHANNEL_LABELS[d.channel]}</td>
              <td className="nums">{d.sent}</td>
              <td className="nums">{d.failed > 0 ? `${d.failed} — relance programmée` : "0"}</td>
            </tr>
          ))}
          {alert.channels.includes("ecran") && (
            <tr>
              <td className="py-1">Écrans</td>
              <td>en plein écran</td>
              <td>—</td>
            </tr>
          )}
        </tbody>
      </table>
      <Dialog
        open={ask}
        onClose={() => setAsk(false)}
        title="Mettre fin à l’alerte ?"
        footer={
          <>
            <button type="button" onClick={() => setAsk(false)} className={btn("ghost")}>
              Garder
            </button>
            <button
              type="button"
              onClick={() => {
                onEnd();
                setAsk(false);
              }}
              className={btn("gold")}
            >
              Mettre fin
            </button>
          </>
        }
      >
        <p className="text-on-dark-muted text-[15px]">
          Le bandeau disparaît du site et des écrans. L’alerte reste dans l’historique et le journal
          d’audit.
        </p>
      </Dialog>
    </section>
  );
}

// ── Approbations ──────────────────────────────────────────────────────────
function Approvals({ me }: { me: string }) {
  const congrats = usePortal((s) => s.congratulations);
  const children = usePortal((s) => s.children);
  const events = usePortal((s) => s.events);
  const decide = usePortal((s) => s.decideCongratulation);
  const decideEvent = usePortal((s) => s.decideEvent);
  const name = usePersonName();
  const pending = congrats.filter((c) => c.status === "submitted");
  const pendingEvents = events.filter((e) => e.status === "submitted");
  const consentOk = (childId?: string) =>
    !childId ||
    (children.find((c) => c.id === childId)?.consents.find((x) => x.type === "screen_display")
      ?.granted ??
      false);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel eyebrow="Écrans" title="Félicitations à approuver">
        {pending.length === 0 ? (
          <EmptyNote>Rien à approuver.</EmptyNote>
        ) : (
          <ul className="space-y-3">
            {pending.map((c) => {
              const ok = consentOk(c.childId);
              return (
                <li key={c.id} className="rounded-[14px] bg-white/[0.03] p-4">
                  <p className="font-display text-gold-light text-[20px]">{c.title}</p>
                  <p className="text-on-dark-muted text-[14px]">{c.message}</p>
                  <p className="text-on-dark-faint mt-1 text-[12.5px]">
                    Proposé par {name(c.proposedBy)} · du {formatDay(c.displayFrom)} au{" "}
                    {formatDay(c.displayUntil)}
                  </p>
                  {!ok && (
                    <p className="mt-2 text-[13px] text-[#ffd98a]">
                      Le parent n’a pas autorisé l’affichage sur les écrans : approbation
                      impossible.
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={!ok}
                      onClick={() => decide(c.id, true, me)}
                      className={btn("gold", "sm")}
                    >
                      Approuver
                    </button>
                    <button
                      type="button"
                      onClick={() => decide(c.id, false, me)}
                      className={btn("ghost", "sm")}
                    >
                      Refuser
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <DemoNote>
          Une félicitation approuvée passe sur l’écran TV pendant sa fenêtre de diffusion. Ouvrez
          /tv pour la voir.
        </DemoNote>
      </Panel>
      <Panel eyebrow="Publication" title="Événements proposés">
        {pendingEvents.length === 0 ? (
          <EmptyNote>Aucun événement en attente.</EmptyNote>
        ) : (
          <ul className="space-y-3">
            {pendingEvents.map((e) => (
              <li key={e.id} className="rounded-[14px] bg-white/[0.03] p-4">
                <p className="text-on-dark text-[15px] font-medium">{e.title}</p>
                <p className="text-on-dark-muted text-[13.5px]">
                  {formatDay(e.date)} · {e.slot} · {e.location}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => decideEvent(e.id, true)}
                    className={btn("gold", "sm")}
                  >
                    Publier
                  </button>
                  <button
                    type="button"
                    onClick={() => decideEvent(e.id, false)}
                    className={btn("ghost", "sm")}
                  >
                    Renvoyer en brouillon
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

// ── Barèmes (§4.3, §6.2) ──────────────────────────────────────────────────
function Rubrics() {
  const rubric = usePortal((s) => s.rubric);
  const save = usePortal((s) => s.setRubricCategories);
  const [cats, setCats] = useState<RubricCategory[]>(rubric.categories);
  const [ok, setOk] = useState("");
  const total = rubricWeightTotal({ categories: cats });
  const valid = isRubricValid({ categories: cats });

  return (
    <Panel eyebrow={`${rubric.scope} · version ${rubric.version}`} title={rubric.name}>
      <ul className="space-y-3">
        {cats.map((c, i) => (
          <li key={c.key} className="flex items-center gap-3">
            <label htmlFor={`w-${c.key}`} className="text-on-dark w-36 text-[15px]">
              {c.label}
            </label>
            <input
              id={`w-${c.key}`}
              type="range"
              min={0}
              max={100}
              step={5}
              value={c.weight}
              onChange={(e) =>
                setCats((cur) =>
                  cur.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)),
                )
              }
              className="flex-1 accent-[#d9bd77]"
            />
            <span className="nums text-gold-light w-14 text-right text-[15px]">{c.weight} %</span>
          </li>
        ))}
      </ul>
      <p
        role="status"
        className={cn("mt-4 text-[14px]", valid ? "text-gold-light" : "text-[#ffd98a]")}
      >
        Total : <span className="nums font-semibold">{total} %</span>
        {valid
          ? " — prêt à activer."
          : ` — il faut exactement 100 % (${total > 100 ? `retirez ${total - 100}` : `ajoutez ${100 - total}`} points).`}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!valid}
          onClick={() => {
            save(cats);
            setOk("Nouvelle version activée. Les résultats déjà validés ne sont pas recalculés.");
          }}
          className={btn("gold")}
        >
          Activer cette version
        </button>
        <button type="button" onClick={() => setCats(rubric.categories)} className={btn("ghost")}>
          Annuler les changements
        </button>
      </div>
      {ok && (
        <p role="status" className="text-gold-light mt-3 text-[13.5px]">
          {ok}
        </p>
      )}
      <DemoNote>
        Le barème est configurable par activité, classe ou période. Une modification crée une
        nouvelle version et ne recalcule jamais rétroactivement les résultats validés (§4.3, règle
        4). La ponctualité reste un bonus hors pondération.
      </DemoNote>
    </Panel>
  );
}

// ── Écrans (§4.5) ─────────────────────────────────────────────────────────
function Screens() {
  const screens = usePortal((s) => s.screens);
  const pair = usePortal((s) => s.pairScreen);
  const revoke = usePortal((s) => s.revokeScreen);
  const [ask, setAsk] = useState<string | null>(null);
  return (
    <Panel
      eyebrow="Affichage numérique"
      title="Télévisions du centre"
      action={
        <Link href="/tv" className={btn("ghost", "sm")}>
          Ouvrir l’écran
        </Link>
      }
    >
      <ul className="divide-y divide-white/[0.06]">
        {screens.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-on-dark text-[15px]">{s.name}</p>
              <p className="text-on-dark-muted text-[13px]">{s.location}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {s.status === "pending" && (
                <>
                  <Pill tone="warn">Code d’appairage : {s.pairingCode}</Pill>
                  <button type="button" onClick={() => pair(s.id)} className={btn("gold", "sm")}>
                    Confirmer l’appairage
                  </button>
                </>
              )}
              {s.status === "paired" && (
                <>
                  <Pill tone="emerald">Connecté</Pill>
                  <button type="button" onClick={() => setAsk(s.id)} className={btn("ghost", "sm")}>
                    Révoquer
                  </button>
                </>
              )}
              {s.status === "revoked" && <Pill tone="danger">Révoqué</Pill>}
            </div>
          </li>
        ))}
      </ul>
      <DemoNote>
        Chaque télévision affiche un code temporaire ; l’administrateur le confirme ici et l’écran
        reçoit un jeton limité à son flux, révocable à tout moment. Il ne voit ni profils, ni
        messages privés, ni finances.
      </DemoNote>
      <Dialog
        open={ask !== null}
        onClose={() => setAsk(null)}
        title="Révoquer cet écran ?"
        footer={
          <>
            <button type="button" onClick={() => setAsk(null)} className={btn("ghost")}>
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                if (ask) revoke(ask);
                setAsk(null);
              }}
              className={btn("danger")}
            >
              Révoquer
            </button>
          </>
        }
      >
        <p className="text-on-dark-muted text-[15px]">
          L’écran cesse immédiatement d’afficher le contenu du centre. Il faudra un nouveau code
          pour le reconnecter.
        </p>
      </Dialog>
    </Panel>
  );
}

// ── Membres ───────────────────────────────────────────────────────────────
const MEMBERSHIP_TONE: Record<MembershipStatus, "emerald" | "warn" | "neutral" | "danger"> = {
  active: "emerald",
  pending: "warn",
  prospect: "neutral",
  suspended: "danger",
  expired: "neutral",
};
const MEMBERSHIP_LABEL: Record<MembershipStatus, string> = {
  active: "Active",
  pending: "En attente",
  prospect: "Prospect",
  suspended: "Suspendue",
  expired: "Expirée",
};

function Members() {
  const persons = usePortal((s) => s.persons);
  const applications = usePortal((s) => s.applications);
  return (
    <div className="space-y-5">
      {applications.length > 0 && (
        <Panel eyebrow="Depuis le site" title="Nouvelles demandes d’adhésion">
          <ul className="divide-y divide-white/[0.06]">
            {applications.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-[14px]"
              >
                <span className="text-on-dark">
                  {a.firstName} {a.lastName} · {a.email}
                  {a.children.length > 0 && (
                    <span className="text-on-dark-muted"> · {a.children.length} enfant(s)</span>
                  )}
                </span>
                <Pill tone="warn">À valider</Pill>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <Panel eyebrow="Rôles et profils" title="Membres">
        <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead className="text-on-dark-faint text-[12.5px]">
              <tr className="border-b border-white/[0.08]">
                <th scope="col" className="py-2 font-medium">
                  Nom
                </th>
                <th scope="col" className="py-2 font-medium">
                  Rôle
                </th>
                <th scope="col" className="py-2 font-medium">
                  Profils cumulés
                </th>
                <th scope="col" className="py-2 font-medium">
                  Adhésion
                </th>
              </tr>
            </thead>
            <tbody>
              {persons.map((p) => (
                <tr key={p.id} className="border-b border-white/[0.05]">
                  <td className="text-on-dark py-2.5">
                    {p.firstName} {p.lastName}
                  </td>
                  <td className="text-on-dark-muted py-2.5">{ROLE_LABELS[p.role]}</td>
                  <td className="py-2.5">
                    <span className="flex flex-wrap gap-1">
                      {p.profiles.length ? (
                        p.profiles.map((pr) => <Pill key={pr}>{PROFILE_LABELS[pr]}</Pill>)
                      ) : (
                        <span className="text-on-dark-faint">—</span>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <Pill tone={MEMBERSHIP_TONE[p.membership]}>
                      {MEMBERSHIP_LABEL[p.membership]}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DemoNote>
          Une même personne peut cumuler plusieurs profils (par exemple parent, comptable et membre
          de la Shura) sans perdre son accès parental. Chaque permission est vérifiée côté serveur
          (§3).
        </DemoNote>
      </Panel>
    </div>
  );
}
