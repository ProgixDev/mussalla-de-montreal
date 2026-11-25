"use client";

import Image from "next/image";
import { Fredoka } from "next/font/google";
import { useState } from "react";
import { usePortal } from "@/lib/portal/store";
import { hasConsent, isOnScreen, pointsByCategory, totalPoints } from "@/core/portal/derive";
import { levelFor } from "@/core/portal/levels";
import type { Child, PointCategory, StickerKind } from "@/core/portal/types";
import { formatDayLong } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Star8 } from "@/components/ui/star";
import { CheckIcon, TvIcon } from "@/components/ui/icons";
import { EmptyNote, StarAvatar, Sticker } from "@/components/portal/kit";
import { MushafPage, POINT_CATEGORY_LABELS, type SpaceProps } from "../shared";
import { POWER_COLORS, STICKER_INFO, SkyStars, StarBurst, wordOfTheDay } from "./child-kit";

/** A rounded, friendly face for the children's space only. */
const kids = Fredoka({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

/**
 * « Mon ciel » — the child's own space (role `child`, spec §3). Read-only on everything
 * that matters: a child never changes a score, a point, a consent or family data. The one
 * thing a child can do is tick « J’ai révisé ! » on a mission — the parent sees it.
 *
 * Points are « étoiles » here, with celestial levels; corrections are shown gently as
 * « petits rappels ». No faces or creatures — stars, moons and lanterns only.
 */
export function ChildSpace({ me }: SpaceProps) {
  const child = usePortal((s) => s.children.find((c) => c.id === me.id));
  if (!child) return <EmptyNote>Profil introuvable.</EmptyNote>;
  return (
    <div className={cn(kids.className, "space-y-8 md:space-y-10")}>
      <Sky child={child} />
      <Album child={child} />
      <Missions child={child} />
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <Powers child={child} />
        <WordOfTheDay />
      </div>
      <Recent child={child} />
    </div>
  );
}

// ── Mon ciel ──────────────────────────────────────────────────────────────
function Sky({ child }: { child: Child }) {
  const points = usePortal((s) => s.points);
  const congrats = usePortal((s) => s.congratulations);
  const stars = Math.max(0, totalPoints(points, child.id));
  const lvl = levelFor(stars);
  const bravo = congrats.find(
    (c) => c.childId === child.id && isOnScreen(c, new Date().toISOString()),
  );

  return (
    <section
      aria-labelledby="ciel-titre"
      className="relative isolate overflow-hidden rounded-[32px] px-5 pt-7 pb-6 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] md:px-10 md:pt-10 md:pb-9"
      style={{
        background:
          "radial-gradient(90% 120% at 90% -10%, rgba(255,111,145,0.28), transparent 55%), radial-gradient(70% 90% at 0% 110%, rgba(34,195,181,0.3), transparent 60%), linear-gradient(160deg, #2a1d6e 0%, #1a1150 55%, #110b36 100%)",
      }}
    >
      <SkyStars />
      <Image
        src="/stickers/croissant.webp"
        alt=""
        aria-hidden="true"
        width={150}
        height={150}
        unoptimized
        className="animate-floaty pointer-events-none absolute -top-3 -right-4 w-[110px] opacity-95 md:top-2 md:right-6 md:w-[150px]"
      />

      <div className="relative flex items-center gap-4 md:gap-6">
        <span className="rounded-full bg-white/10 p-1.5 ring-2 ring-[#ffc22e]/60">
          <StarAvatar name={child.firstName} seed={child.avatar} size={76} />
        </span>
        <div>
          <p className="text-[14px] font-medium tracking-[0.18em] text-[#9ff3e9] uppercase">
            Mon ciel
          </p>
          <h1
            id="ciel-titre"
            className="text-[38px] leading-none font-bold text-white md:text-[56px]"
          >
            Salam {child.firstName} !
          </h1>
        </div>
      </div>

      <div className="relative mt-7 grid gap-4 md:grid-cols-[auto_1fr] md:items-center md:gap-8">
        <div className="flex items-center gap-3 rounded-[24px] bg-white/[0.08] px-5 py-3.5 ring-1 ring-white/10">
          <Sticker kind="etoile" size={64} />
          <p className="leading-none">
            <span className="nums block text-[52px] font-bold text-[#ffd35c]">{stars}</span>
            <span className="text-[16px] font-medium text-white/85">étoiles</span>
          </p>
        </div>

        <div className="rounded-[24px] bg-white/[0.08] px-5 py-4 ring-1 ring-white/10">
          <p className="flex flex-wrap items-baseline gap-x-2 text-white">
            <span className="text-[14px] font-medium text-[#9ff3e9]">Niveau {lvl.index + 1}</span>
            <span className="text-[24px] font-semibold">{lvl.level.name}</span>
          </p>
          <div
            role="progressbar"
            aria-label={lvl.next ? `Progression vers ${lvl.next.name}` : "Niveau maximum atteint"}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(lvl.progress * 100)}
            className="relative mt-3 h-5 overflow-hidden rounded-full bg-white/10"
          >
            <span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${Math.max(6, lvl.progress * 100)}%`,
                background: "linear-gradient(90deg, #ffc22e, #ff6f91)",
                boxShadow: "0 0 18px rgba(255,194,46,0.6)",
              }}
            />
          </div>
          <p className="mt-2.5 text-[16px] text-white/90">
            {lvl.next ? (
              <>
                Encore{" "}
                <span className="font-semibold text-[#ffd35c]">
                  {lvl.toNext} étoile{lvl.toNext > 1 ? "s" : ""}
                </span>{" "}
                pour devenir « {lvl.next.name} » !
              </>
            ) : (
              <>Tu as atteint le plus haut niveau. Bravo !</>
            )}
          </p>
        </div>
      </div>

      {bravo && (
        <div
          className="relative mt-5 flex items-center gap-4 rounded-[24px] px-5 py-4"
          style={{
            background: "linear-gradient(100deg, rgba(255,194,46,0.95), rgba(255,140,80,0.95))",
          }}
        >
          <span className="relative">
            <Sticker kind="etoile" size={54} className="animate-floaty" />
            <StarBurst />
          </span>
          <div className="text-[#2a1405]">
            <p className="text-[26px] leading-tight font-bold">{bravo.title}</p>
            <p className="text-[16px] font-medium">{bravo.message}</p>
            {/* Only promise the TV when it's true: the parent may have withdrawn screen consent. */}
            {hasConsent(child, "screen_display") && (
              <p className="mt-1 flex items-center gap-1.5 text-[14px]">
                <TvIcon width={16} height={16} /> Ton bravo passe sur l’écran de la salle !
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ── Mon album ─────────────────────────────────────────────────────────────
function Album({ child }: { child: Child }) {
  const awards = usePortal((s) => s.awards).filter((a) => a.childId === child.id);
  const kinds = Object.keys(STICKER_INFO) as StickerKind[];
  const earned = kinds.filter((k) => awards.some((a) => a.kind === k)).length;
  return (
    <section aria-labelledby="album-titre">
      <SectionTitle
        id="album-titre"
        title="Mon album"
        note={`${earned} sur ${kinds.length} stickers`}
      />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {kinds.map((k, i) => {
          const mine = awards.filter((a) => a.kind === k);
          const has = mine.length > 0;
          const info = STICKER_INFO[k];
          return (
            <li
              key={k}
              className="relative flex flex-col items-center rounded-[26px] px-3 pt-4 pb-4 text-center"
              style={{
                background: has ? info.tint : "rgba(255,255,255,0.03)",
                boxShadow: has
                  ? `inset 0 0 0 2px ${info.ring}`
                  : "inset 0 0 0 2px rgba(255,255,255,0.08)",
              }}
            >
              {has && mine.length > 1 && (
                <span className="nums absolute top-3 right-3 rounded-full bg-white px-2 text-[14px] font-bold text-[#1a1150]">
                  ×{mine.length}
                </span>
              )}
              {/* staggered float so the album breathes */}
              <span
                className={has ? "animate-floaty" : undefined}
                style={{ animationDelay: `${i * 0.5}s` }}
              >
                <Sticker kind={k} size={96} locked={!has} />
              </span>
              <p className="mt-2 text-[18px] font-semibold text-white">
                {has ? (mine[0]?.label ?? info.name) : info.name}
              </p>
              <p className="text-[14px] text-white/70">{has ? "Gagné !" : info.hint}</p>
              {!has && (
                <span className="mt-2 rounded-full bg-white/10 px-3 py-0.5 text-[13px] font-medium text-white/80">
                  À gagner !
                </span>
              )}
              <span className="sr-only">
                {has ? `Sticker gagné ${mine.length} fois` : "Pas encore gagné"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── Mes missions ──────────────────────────────────────────────────────────
function Missions({ child }: { child: Child }) {
  const homework = usePortal((s) => s.homework).filter((h) => h.classId === child.classId);
  const done = usePortal((s) => s.homeworkDone);
  const toggle = usePortal((s) => s.toggleHomeworkDone);
  const [burst, setBurst] = useState<Record<string, number>>({});
  const photosAllowed = child.consents.find((c) => c.type === "homework_photo")?.granted ?? false;

  return (
    <section aria-labelledby="missions-titre">
      <SectionTitle
        id="missions-titre"
        title="Mes missions"
        note="Ton parent voit quand tu as révisé."
      />
      {homework.length === 0 ? (
        <EmptyNote>Pas de mission cette semaine. Profite !</EmptyNote>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {homework.map((h) => {
            const isDone = done.some((d) => d.childId === child.id && d.homeworkId === h.id);
            return (
              <li
                key={h.id}
                className="flex flex-col rounded-[26px] p-5 ring-1 ring-white/10"
                style={{
                  background: isDone
                    ? "linear-gradient(160deg, rgba(34,195,181,0.22), rgba(34,195,181,0.06))"
                    : "linear-gradient(160deg, rgba(142,92,240,0.2), rgba(255,255,255,0.03))",
                }}
              >
                <p className="text-[14px] font-medium text-[#9ff3e9]">
                  Pour {formatDayLong(h.due).toLowerCase()}
                </p>
                <h3 className="mt-1 text-[22px] leading-snug font-semibold text-white">
                  {h.title}
                </h3>
                <p className="mt-1 text-[16px] leading-relaxed text-white/80">{h.instructions}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {photosAllowed && h.photos?.length
                    ? h.photos.map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element -- demo data-URL photos from the teacher
                        <img
                          key={i}
                          src={src}
                          alt={`Photo ${i + 1} de la mission`}
                          className="h-24 w-auto rounded-[14px] object-cover ring-2 ring-white/20"
                        />
                      ))
                    : h.pages.map((p) => (
                        <MushafPage
                          key={p}
                          page={p}
                          className="h-24 w-auto rotate-[-2deg] drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)] odd:rotate-[2deg]"
                        />
                      ))}
                </div>
                <div className="relative mt-5">
                  <button
                    type="button"
                    aria-pressed={isDone}
                    onClick={() => {
                      toggle(child.id, h.id);
                      if (!isDone) setBurst((b) => ({ ...b, [h.id]: (b[h.id] ?? 0) + 1 }));
                    }}
                    className={cn(
                      "relative inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-full px-6 text-[19px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.97] sm:w-auto",
                      isDone
                        ? "bg-[#22c3b5] text-[#06231f]"
                        : "bg-[#ffc22e] text-[#2a1405] hover:bg-[#ffd35c]",
                    )}
                  >
                    {isDone ? <CheckIcon width={22} height={22} /> : <Star8 size={20} />}
                    {isDone ? "Bravo, c’est fait !" : "J’ai révisé !"}
                    {burst[h.id] ? <StarBurst key={burst[h.id]} /> : null}
                  </button>
                  {isDone && (
                    <p className="mt-2 text-[14px] text-white/70">
                      Touche encore si tu veux recommencer.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ── Mes super-pouvoirs ────────────────────────────────────────────────────
function Powers({ child }: { child: Child }) {
  const points = usePortal((s) => s.points);
  const byCat = pointsByCategory(points, child.id);
  const cats = Object.keys(POINT_CATEGORY_LABELS) as PointCategory[];
  return (
    <section aria-labelledby="pouvoirs-titre">
      <SectionTitle id="pouvoirs-titre" title="Mes super-pouvoirs" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cats.map((k) => {
          const v = byCat[k];
          return (
            <li key={k} className="rounded-[22px] bg-white/[0.04] p-4 ring-1 ring-white/10">
              <Star8
                size={26}
                style={{ color: POWER_COLORS[k] }}
                className="drop-shadow-[0_0_10px_currentColor]"
              />
              <p className="mt-2 text-[16px] font-medium text-white">{POINT_CATEGORY_LABELS[k]}</p>
              <p
                className="nums text-[30px] leading-tight font-bold"
                style={{ color: v >= 0 ? POWER_COLORS[k] : "#ffb56b" }}
              >
                {v > 0 ? `+${v}` : v}
              </p>
              {v < 0 && <p className="text-[13px] text-[#ffcf9e]">À travailler</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── Le mot du jour ────────────────────────────────────────────────────────
function WordOfTheDay() {
  const w = wordOfTheDay();
  return (
    <section
      aria-labelledby="mot-titre"
      className="relative overflow-hidden rounded-[28px] p-6 ring-1 ring-white/10"
      style={{
        background: "linear-gradient(160deg, rgba(255,111,145,0.22), rgba(142,92,240,0.16))",
      }}
    >
      <h2
        id="mot-titre"
        className="text-[15px] font-medium tracking-[0.16em] text-[#ffc7d6] uppercase"
      >
        Le mot du jour
      </h2>
      <p className="font-arabic mt-3 text-[56px] leading-none text-white" lang="ar">
        {w.ar}
      </p>
      <p className="mt-3 text-[22px] font-semibold text-white">
        {w.lat} <span className="font-normal text-white/75">— {w.fr}</span>
      </p>
      <p className="mt-2 text-[16px] leading-relaxed text-white/85">{w.phrase}</p>
    </section>
  );
}

// ── Mes dernières étoiles ─────────────────────────────────────────────────
function Recent({ child }: { child: Child }) {
  const history = usePortal((s) => s.points)
    .filter((p) => p.childId === child.id)
    .slice(0, 8);
  return (
    <section aria-labelledby="recent-titre">
      <SectionTitle id="recent-titre" title="Mes dernières étoiles" />
      {history.length === 0 ? (
        <EmptyNote>Tes premières étoiles arrivent bientôt !</EmptyNote>
      ) : (
        <ul className="space-y-2.5">
          {history.map((p) => {
            const good = p.points > 0;
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-[20px] bg-white/[0.04] px-4 py-3 ring-1 ring-white/10"
              >
                <span
                  className={cn(
                    "nums inline-flex min-w-[76px] items-center justify-center gap-1 rounded-full px-3 py-1 text-[16px] font-bold",
                    good ? "bg-[#ffc22e] text-[#2a1405]" : "bg-[#ffb56b]/20 text-[#ffcf9e]",
                  )}
                >
                  {good ? (
                    <>
                      +{p.points} <Star8 size={13} />
                    </>
                  ) : (
                    "Rappel"
                  )}
                </span>
                <span className="min-w-0 text-[16px] text-white">
                  {p.reason}
                  <span className="block text-[13px] text-white/60">
                    {POINT_CATEGORY_LABELS[p.category]}
                    {!good && ` · ${p.points} étoile${p.points < -1 ? "s" : ""}`}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function SectionTitle({ id, title, note }: { id: string; title: string; note?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <h2
        id={id}
        className="flex items-center gap-2.5 text-[28px] font-bold text-white md:text-[32px]"
      >
        <Star8 size={18} className="text-[#ffc22e]" />
        {title}
      </h2>
      {note && <p className="text-[15px] text-white/70">{note}</p>}
    </div>
  );
}
