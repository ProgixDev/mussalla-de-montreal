"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { seatsLeft } from "@/core/portal/derive";
import type { Activity, ActivityCategory, Audience } from "@/core/portal/types";
import { Pill, btn } from "@/components/portal/kit";
import { ArrowRightIcon, LockIcon } from "@/components/ui/icons";
import { Star8 } from "@/components/ui/star";
import { ChipGroup, ChoiceGroup } from "./form-bits";
import { usePublicActivities } from "./hooks";
import { AUDIENCE_LABELS, CATEGORY_LABELS, ageRangeLabel, priceLabel, seatsLabel } from "./labels";

type AudienceFilter = Audience | "toutes";

/** French plural: 0 and 1 are singular. */
const plural = (n: number) => `${n} ${n > 1 ? "activités" : "activité"}`;

const AUDIENCE_OPTIONS: { value: AudienceFilter; label: string }[] = [
  { value: "toutes", label: "Toutes" },
  { value: "femmes", label: "Femmes" },
  { value: "hommes", label: "Hommes" },
  { value: "enfants", label: "Enfants" },
  { value: "tous", label: "Tous publics" },
];

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABELS) as ActivityCategory[]).map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}));

const AUDIENCE_TONE: Record<Audience, "gold" | "emerald" | "neutral"> = {
  femmes: "gold",
  hommes: "emerald",
  enfants: "neutral",
  tous: "neutral",
};

/**
 * « Nos activités » — the published catalogue (§4.1 « Catalogue »): public, age, capacity,
 * place and schedule, filterable by audience and category. Every card leads to the
 * membership form with the activity pre-selected; a full activity offers the waiting list
 * instead of refusing (§4.1 « Inscription »).
 */
export function ActivityCatalogue() {
  const activities = usePublicActivities();
  const [audience, setAudience] = useState<AudienceFilter>("toutes");
  const [categories, setCategories] = useState<string[]>([]);

  const visible = activities.filter(
    (a) =>
      (audience === "toutes" || a.audience === audience) &&
      (categories.length === 0 || categories.includes(a.category)),
  );
  const filtered = audience !== "toutes" || categories.length > 0;
  const reset = () => {
    setAudience("toutes");
    setCategories([]);
  };

  return (
    <div>
      <div className="border-gold/15 rounded-[18px] border bg-white/[0.03] p-4 md:p-5">
        <h3 className="sr-only">Filtrer les activités</h3>
        <div className="grid gap-5 lg:grid-cols-[auto_1fr] lg:gap-10">
          <ChoiceGroup
            name="filtre-public"
            legend="Public"
            options={AUDIENCE_OPTIONS}
            value={audience}
            onChange={setAudience}
          />
          <ChipGroup
            name="filtre-categorie"
            legend="Catégorie"
            options={CATEGORY_OPTIONS}
            values={categories}
            onToggle={(v) =>
              setCategories((cur) => (cur.includes(v) ? cur.filter((c) => c !== v) : [...cur, v]))
            }
            hint="Aucune case cochée : toutes les catégories."
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-on-dark-muted text-[14px]">
          {visible.length === activities.length
            ? plural(activities.length)
            : `${plural(visible.length)} sur ${activities.length}`}
        </p>
        {filtered && visible.length > 0 && (
          <button type="button" onClick={reset} className={btn("subtle", "sm")}>
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="border-on-dark/20 mt-4 rounded-[18px] border border-dashed px-5 py-12 text-center">
          <Star8 size={22} className="text-gold/60 mx-auto" />
          <p className="font-display text-on-dark mt-4 text-[22px]">
            Aucune activité ne correspond
          </p>
          <p className="text-on-dark-muted mx-auto mt-2 max-w-[420px] text-[15px]">
            Essayez un autre public ou retirez une catégorie — ou affichez de nouveau tout le
            catalogue.
          </p>
          <button type="button" onClick={reset} className={cn(btn("gold"), "mt-6")}>
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((a) => (
            <li key={a.id} className="flex">
              <ActivityCard activity={a} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActivityCard({ activity: a }: { activity: Activity }) {
  const left = seatsLeft(a);
  const full = left === 0;
  const pct = a.capacity > 0 ? Math.min(100, Math.round((a.enrolled / a.capacity) * 100)) : 100;
  const titleId = `activite-${a.id}`;

  return (
    <article
      aria-labelledby={titleId}
      className="border-gold/15 flex w-full flex-col rounded-[18px] border bg-white/[0.035] p-5 shadow-[0_30px_60px_-34px_rgba(0,0,0,0.85)] backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={AUDIENCE_TONE[a.audience]}>
          <span className="sr-only">Public : </span>
          {AUDIENCE_LABELS[a.audience]}
        </Pill>
        <span className="text-on-dark-faint text-[12.5px]">
          <span className="sr-only">Catégorie : </span>
          {CATEGORY_LABELS[a.category]}
        </span>
      </div>

      <h3 id={titleId} className="font-display text-on-dark mt-3 text-[21px] leading-tight">
        {a.title}
      </h3>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[14px]">
        <dt className="text-on-dark-faint">Âge</dt>
        <dd className="text-on-dark">{ageRangeLabel(a)}</dd>
        <dt className="text-on-dark-faint">Horaire</dt>
        <dd className="text-on-dark">{a.schedule}</dd>
        <dt className="text-on-dark-faint">Lieu</dt>
        <dd className="text-on-dark">{a.location}</dd>
        <dt className="text-on-dark-faint">Tarif</dt>
        <dd
          className={cn(
            "font-medium",
            a.monthlyPriceCents === 0 ? "text-gold-light" : "text-on-dark",
          )}
        >
          {priceLabel(a)}
        </dd>
      </dl>

      {a.membershipRequired && (
        <p className="mt-3">
          <Pill tone="neutral">
            <LockIcon width={12} height={12} />
            Adhésion requise
          </Pill>
        </p>
      )}

      <p className="text-on-dark-muted mt-3 text-[14.5px] leading-relaxed">{a.description}</p>

      <div className="mt-auto pt-5">
        <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: full
                ? "#d9a23d"
                : "linear-gradient(90deg, var(--gold-strong), var(--gold-light))",
            }}
          />
        </div>
        <p className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[13px]">
          {full ? (
            <Pill tone="warn">{seatsLabel(a)}</Pill>
          ) : (
            <span className="text-on-dark font-medium">{seatsLabel(a)}</span>
          )}
          <span className="nums text-on-dark-faint">
            {a.enrolled} {a.enrolled > 1 ? "inscrits" : "inscrit"} sur {a.capacity}
          </span>
        </p>

        <Link
          href={`/adhesion?activite=${encodeURIComponent(a.id)}`}
          className={cn(btn(full ? "ghost" : "gold"), "mt-4 w-full")}
        >
          {full ? "Rejoindre la liste d’attente" : "S’inscrire"}
          <span className="sr-only"> — {a.title}</span>
          <ArrowRightIcon width={16} height={16} />
        </Link>
      </div>
    </article>
  );
}
