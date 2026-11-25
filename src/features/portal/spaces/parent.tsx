"use client";

import { useState } from "react";
import { usePortal } from "@/lib/portal/store";
import { ageOn, pointsByCategory, totalPoints, weightedScore } from "@/core/portal/derive";
import type { Child, ConsentType } from "@/core/portal/types";
import { formatCAD, formatDateTime, formatDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProgressRing } from "@/components/ui/progress-ring";
import { EmptyNote, Panel, Pill, StarAvatar, StatTile, Sticker } from "@/components/portal/kit";
import {
  DemoNote,
  MushafPage,
  POINT_CATEGORY_LABELS,
  PointsBadge,
  SpaceHeading,
  SpaceTabs,
  todayIso,
  usePersonName,
  type SpaceProps,
} from "../shared";

type Tab = "suivi" | "devoirs" | "messages" | "autorisations" | "inscriptions";

const CONSENT_COPY: Record<ConsentType, { title: string; text: string }> = {
  portal_profile: {
    title: "Profil dans le portail",
    text: "Afficher le profil de l’enfant à ses enseignants et à vous.",
  },
  homework_photo: {
    title: "Photos de devoirs",
    text: "Recevoir les photos des pages à réviser dans le portail familial.",
  },
  screen_display: {
    title: "Félicitations sur les écrans",
    text: "Permettre qu’un « bravo » à son nom passe sur les télévisions du centre, après approbation de l’administration.",
  },
  external_publication: {
    title: "Publication hors du portail",
    text: "Usage éventuel hors du portail (réseaux, affiches). Désactivé par défaut.",
  },
};

/** The latest decision per consent type (the list is append-only, newest first). */
function currentConsent(child: Child, type: ConsentType): boolean {
  return child.consents.find((c) => c.type === type)?.granted ?? false;
}

export function ParentSpace({ me }: SpaceProps) {
  const children = usePortal((s) => s.children).filter((c) => c.parentId === me.id);
  const [childId, setChildId] = useState(children[0]?.id ?? "");
  const [tab, setTab] = useState<Tab>("suivi");
  const child = children.find((c) => c.id === childId) ?? children[0];

  return (
    <>
      <SpaceHeading eyebrow="Espace famille" title={`Salam, ${me.firstName}`}>
        Le suivi de vos enfants à l’école du centre : leurs points, leurs badges, les remarques des
        enseignants et les devoirs de la semaine.
      </SpaceHeading>

      {children.length === 0 ? (
        <EmptyNote>Aucun enfant n’est encore lié à votre compte.</EmptyNote>
      ) : (
        <>
          <div
            role="radiogroup"
            aria-label="Choisir un enfant"
            className="mb-6 flex flex-wrap gap-3"
          >
            {children.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={c.id === child?.id}
                onClick={() => setChildId(c.id)}
                className={cn(
                  "focus-visible:outline-gold-light flex min-h-14 items-center gap-3 rounded-full border py-1.5 pr-5 pl-1.5 text-left transition focus-visible:outline-2",
                  c.id === child?.id
                    ? "border-gold/70 bg-gold/12"
                    : "border-on-dark/15 hover:border-on-dark/35",
                )}
              >
                <StarAvatar name={c.firstName} seed={c.avatar} size={44} />
                <span className="leading-tight">
                  <span className="text-on-dark block text-[15px] font-medium">{c.firstName}</span>
                  <span className="text-on-dark-muted block text-[12.5px]">
                    {ageOn(c.birthDate, todayIso())} ans
                  </span>
                </span>
              </button>
            ))}
          </div>

          {child && (
            <>
              <SpaceTabs
                label={`Suivi de ${child.firstName}`}
                value={tab}
                onChange={setTab}
                tabs={[
                  { id: "suivi", label: "Suivi" },
                  { id: "devoirs", label: "Devoirs" },
                  { id: "messages", label: "Messages" },
                  { id: "autorisations", label: "Autorisations" },
                  { id: "inscriptions", label: "Inscriptions" },
                ]}
              />
              {tab === "suivi" && <ChildProgress child={child} />}
              {tab === "devoirs" && <ChildHomework child={child} />}
              {tab === "messages" && <ChildMessages child={child} />}
              {tab === "autorisations" && <Consents child={child} />}
              {tab === "inscriptions" && <Enrolments child={child} />}
            </>
          )}
        </>
      )}
    </>
  );
}

/** Points, badges, weighted result and the full history — shared with the child's own space. */
export function ChildProgress({ child, forChild = false }: { child: Child; forChild?: boolean }) {
  const points = usePortal((s) => s.points);
  const awards = usePortal((s) => s.awards).filter((a) => a.childId === child.id);
  const rubric = usePortal((s) => s.rubric);
  const assessments = usePortal((s) => s.assessments).filter((a) => a.childId === child.id);
  const messages = usePortal((s) => s.messages).filter(
    (m) => m.scope === "enfant" && m.targetId === child.id,
  );
  const name = usePersonName();

  const total = totalPoints(points, child.id);
  const byCat = pointsByCategory(points, child.id);
  const history = points.filter((p) => p.childId === child.id);
  const score = weightedScore(rubric, assessments, child.id);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile label="Points au total" value={total} tone="gold" hint="depuis la rentrée" />
          <StatTile label="Badges" value={awards.length} />
          <StatTile
            label="Évaluations"
            value={assessments.length}
            hint={score === null ? "aucune encore" : undefined}
          />
        </div>

        <Panel eyebrow="Barème" title={forChild ? "Mes points" : "Points par catégorie"}>
          <ul className="space-y-3">
            {(Object.keys(POINT_CATEGORY_LABELS) as (keyof typeof POINT_CATEGORY_LABELS)[]).map(
              (key) => {
                const weight = rubric.categories.find((c) => c.key === key)?.weight;
                const value = byCat[key];
                return (
                  <li key={key} className="flex items-center gap-3">
                    <span className="text-on-dark w-32 shrink-0 text-[14px]">
                      {POINT_CATEGORY_LABELS[key]}
                    </span>
                    <span
                      className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]"
                      aria-hidden="true"
                    >
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          value >= 0 ? "bg-gold-light/80" : "bg-[#e07a5f]/80",
                        )}
                        style={{ width: `${Math.min(100, Math.abs(value) * 6)}%` }}
                      />
                    </span>
                    <span
                      className={cn(
                        "nums w-10 text-right text-[14px] font-semibold",
                        value >= 0 ? "text-gold-light" : "text-[#ffb9a6]",
                      )}
                    >
                      {value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : "0"}
                    </span>
                    <span className="text-on-dark-faint hidden w-16 text-right text-[12px] sm:inline">
                      {weight !== undefined ? `${weight} %` : "bonus"}
                    </span>
                  </li>
                );
              },
            )}
          </ul>
          {!forChild && (
            <p className="text-on-dark-faint mt-4 text-[12.5px] leading-relaxed">
              Les pourcentages sont le poids de chaque catégorie dans le résultat ({rubric.name},
              version {rubric.version}). La ponctualité donne des bonus : une arrivée à l’heure
              rapporte des points, un retard n’est jamais sanctionné automatiquement.
            </p>
          )}
        </Panel>

        <Panel
          eyebrow="Historique"
          title={forChild ? "Ce que tu as gagné" : "Toutes les entrées de points"}
        >
          {history.length === 0 ? (
            <EmptyNote>Pas encore de points cette année.</EmptyNote>
          ) : (
            <ol className="divide-y divide-white/[0.06]">
              {history.map((p) => (
                <li key={p.id} className="flex items-start gap-3 py-3">
                  <PointsBadge points={p.points} />
                  <div className="min-w-0">
                    <p className="text-on-dark text-[14.5px]">{p.reason}</p>
                    <p className="text-on-dark-faint mt-0.5 text-[12.5px]">
                      {POINT_CATEGORY_LABELS[p.category]} · {name(p.teacherId)} ·{" "}
                      {formatDateTime(p.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {!forChild && (
            <DemoNote>
              Une entrée n’est jamais modifiée ni effacée : une correction ajoute une nouvelle
              ligne, et l’historique reste visible.
            </DemoNote>
          )}
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel eyebrow="Résultat" title="Résultat pondéré">
          {score === null ? (
            <EmptyNote>Le résultat apparaîtra après la première évaluation.</EmptyNote>
          ) : (
            <div className="flex items-center gap-5">
              <ProgressRing
                id={`ring-${child.id}`}
                value={score / 100}
                percent={score}
                tone="dark"
                stroke={7}
                className="w-[110px]"
              />
              <ul className="space-y-1.5 text-[13.5px]">
                {assessments.map((a) => (
                  <li key={a.id} className="text-on-dark-muted">
                    <span className="text-on-dark">{a.title}</span> —{" "}
                    <span className="nums">
                      {a.score}/{a.max}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel eyebrow="Badges" title={forChild ? "Mes badges" : "Badges et stickers"}>
          {awards.length === 0 ? (
            <EmptyNote>Aucun badge pour le moment.</EmptyNote>
          ) : (
            <ul className="grid grid-cols-2 gap-3">
              {awards.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-[14px] bg-white/[0.03] p-3"
                >
                  <Sticker kind={a.kind} size={44} />
                  <span className="min-w-0 leading-tight">
                    <span className="text-on-dark block text-[13.5px]">{a.label}</span>
                    <span className="text-on-dark-faint block text-[12px]">{formatDay(a.at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {!forChild && (
          <Panel eyebrow="De l’enseignant" title="Remarques">
            {messages.length === 0 ? (
              <EmptyNote>Pas de remarque pour l’instant.</EmptyNote>
            ) : (
              <ul className="space-y-3">
                {messages.map((m) => (
                  <li key={m.id} className="rounded-[14px] bg-white/[0.03] p-4">
                    <p className="text-on-dark text-[14.5px] font-medium">{m.title}</p>
                    <p className="text-on-dark-muted mt-1 text-[14px] leading-relaxed">{m.body}</p>
                    <p className="text-on-dark-faint mt-2 text-[12px]">
                      {name(m.authorId)} · {formatDateTime(m.at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}

export function ChildHomework({ child }: { child: Child }) {
  const homework = usePortal((s) => s.homework).filter((h) => h.classId === child.classId);
  const done = usePortal((s) => s.homeworkDone);
  const photosAllowed = currentConsent(child, "homework_photo");
  return homework.length === 0 ? (
    <EmptyNote>Aucun devoir pour le moment.</EmptyNote>
  ) : (
    <div className="grid gap-5 md:grid-cols-2">
      {homework.map((h) => (
        <Panel key={h.id} eyebrow={`À faire pour le ${formatDay(h.due)}`} title={h.title}>
          <p className="text-on-dark-muted text-[14.5px] leading-relaxed">{h.instructions}</p>
          {(() => {
            const mark = done.find((d) => d.childId === child.id && d.homeworkId === h.id);
            return mark ? (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#22c3b5]/15 px-3 py-1 text-[13px] text-[#9ff3e9]">
                {child.firstName} a coché « J’ai révisé » · {formatDateTime(mark.at)}
              </p>
            ) : null;
          })()}
          <div className="mt-4 flex flex-wrap gap-3">
            {photosAllowed && h.photos?.length
              ? h.photos.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element -- local data-URL thumbnails (demo); signed storage URLs in production
                  <img
                    key={i}
                    src={src}
                    alt={`Photo ${i + 1} du devoir`}
                    className="border-gold/20 h-28 w-auto rounded-[10px] border object-cover"
                  />
                ))
              : h.pages.map((p) => (
                  <MushafPage
                    key={p}
                    page={p}
                    className="h-28 w-auto drop-shadow-[0_10px_18px_rgba(0,0,0,0.4)]"
                  />
                ))}
          </div>
          {h.pages.length > 0 && (
            <p className="text-on-dark-faint mt-3 text-[13px]">
              Pages à réviser : <span className="nums text-on-dark">{h.pages.join(", ")}</span>
            </p>
          )}
          {!photosAllowed && h.photos?.length ? (
            <p className="text-on-dark-faint mt-2 text-[12.5px]">
              Les photos sont masquées : l’autorisation « Photos de devoirs » est désactivée.
            </p>
          ) : null}
        </Panel>
      ))}
    </div>
  );
}

function ChildMessages({ child }: { child: Child }) {
  const all = usePortal((s) => s.messages);
  const name = usePersonName();
  const mine = all.filter(
    (m) =>
      (m.scope === "enfant" && m.targetId === child.id) ||
      (m.scope === "classe" && m.targetId === child.classId) ||
      m.scope === "ecole",
  );
  const scopeLabel = {
    enfant: `Pour ${child.firstName}`,
    classe: "Pour la classe",
    ecole: "Pour toute l’école",
  } as const;
  return mine.length === 0 ? (
    <EmptyNote>Aucun message.</EmptyNote>
  ) : (
    <ul className="space-y-3">
      {mine.map((m) => (
        <li key={m.id}>
          <Panel>
            <div className="flex flex-wrap items-center gap-2">
              <Pill
                tone={m.scope === "ecole" ? "gold" : m.scope === "classe" ? "emerald" : "neutral"}
              >
                {scopeLabel[m.scope]}
              </Pill>
              <span className="text-on-dark-faint text-[12.5px]">
                {name(m.authorId)} · {formatDateTime(m.at)}
              </span>
            </div>
            <p className="font-display text-on-dark mt-3 text-[19px]">{m.title}</p>
            <p className="text-on-dark-muted mt-1 text-[14.5px] leading-relaxed">{m.body}</p>
          </Panel>
        </li>
      ))}
    </ul>
  );
}

function Consents({ child }: { child: Child }) {
  const setConsent = usePortal((s) => s.setConsent);
  const types = Object.keys(CONSENT_COPY) as ConsentType[];
  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <Panel eyebrow="Autorisations parentales" title={`Pour ${child.firstName}`}>
        <ul className="divide-y divide-white/[0.06]">
          {types.map((t) => {
            const on = currentConsent(child, t);
            const id = `consent-${child.id}-${t}`;
            return (
              <li key={t} className="flex items-start justify-between gap-4 py-4">
                <div>
                  <label htmlFor={id} className="text-on-dark text-[15px] font-medium">
                    {CONSENT_COPY[t].title}
                  </label>
                  <p className="text-on-dark-muted mt-0.5 text-[13.5px] leading-relaxed">
                    {CONSENT_COPY[t].text}
                  </p>
                </div>
                <button
                  id={id}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => setConsent(child.id, t, !on)}
                  className={cn(
                    "focus-visible:outline-gold-light relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition focus-visible:outline-2",
                    on ? "border-gold/70 bg-gold/80" : "border-on-dark/25 bg-white/[0.06]",
                  )}
                >
                  <span
                    className={cn(
                      "bg-night absolute size-5 rounded-full shadow transition-all",
                      on ? "left-6" : "left-1",
                    )}
                  />
                  <span className="sr-only">{on ? "Activée" : "Désactivée"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>
      <Panel eyebrow="Historique" title="Chaque décision est conservée">
        <ol className="space-y-2 text-[13.5px]">
          {child.consents.map((c, i) => (
            <li
              key={`${c.type}-${c.at}-${i}`}
              className="text-on-dark-muted flex justify-between gap-3"
            >
              <span>{CONSENT_COPY[c.type].title}</span>
              <span className={c.granted ? "text-gold-light" : "text-on-dark-faint"}>
                {c.granted ? "accordée" : "retirée"} · {formatDay(c.at)}
              </span>
            </li>
          ))}
        </ol>
        <DemoNote>
          Retirer une autorisation n’efface pas l’historique : une nouvelle ligne est ajoutée
          (cahier des charges §4.2).
        </DemoNote>
      </Panel>
    </div>
  );
}

function Enrolments({ child }: { child: Child }) {
  const classes = usePortal((s) => s.classes);
  const activities = usePortal((s) => s.activities);
  const name = usePersonName();
  const cls = classes.find((c) => c.id === child.classId);
  const act = activities.find((a) => a.id === cls?.activityId);
  return (
    <Panel eyebrow="Inscriptions" title={`Les activités de ${child.firstName}`}>
      {cls && act ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-on-dark text-[20px]">{act.title}</p>
            <p className="text-on-dark-muted mt-1 text-[14px]">
              {cls.title} · {cls.schedule} · {cls.room}
            </p>
            <p className="text-on-dark-muted mt-1 text-[14px]">
              Enseignant : {name(cls.teacherId, true)}
            </p>
          </div>
          <div className="text-right">
            <Pill tone="emerald">Inscrit</Pill>
            <p className="nums text-on-dark mt-2 text-[14px]">
              {act.monthlyPriceCents ? `${formatCAD(act.monthlyPriceCents)} / mois` : "Gratuit"}
            </p>
          </div>
        </div>
      ) : (
        <EmptyNote>Aucune inscription.</EmptyNote>
      )}
    </Panel>
  );
}
