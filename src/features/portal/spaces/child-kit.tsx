"use client";

import { m } from "@/components/motion";
import { Star8 } from "@/components/ui/star";
import type { StickerKind } from "@/core/portal/types";

/** Decorative pieces of the children's space: the sky, the star burst, the word of the day. */

const SKY_STARS = [
  { x: "6%", y: "14%", s: 9, d: 0 },
  { x: "18%", y: "62%", s: 6, d: 1.1 },
  { x: "31%", y: "22%", s: 7, d: 2.3 },
  { x: "44%", y: "8%", s: 5, d: 0.7 },
  { x: "57%", y: "30%", s: 8, d: 1.8 },
  { x: "66%", y: "70%", s: 6, d: 2.9 },
  { x: "73%", y: "12%", s: 10, d: 0.4 },
  { x: "88%", y: "52%", s: 7, d: 1.5 },
  { x: "94%", y: "84%", s: 5, d: 2.6 },
  { x: "12%", y: "88%", s: 6, d: 3.1 },
  { x: "38%", y: "78%", s: 5, d: 0.9 },
  { x: "52%", y: "56%", s: 4, d: 2.1 },
];

/** Twinkling stars across a section (decorative). */
export function SkyStars() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {SKY_STARS.map((st, i) => (
        <Star8
          key={i}
          size={st.s}
          className="animate-twinkle absolute text-[#fff3c4]"
          style={{ left: st.x, top: st.y, animationDelay: `${st.d}s` }}
        />
      ))}
    </div>
  );
}

const BURST = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  return {
    x: Math.cos(a) * 70,
    y: Math.sin(a) * 52,
    c: ["#ffc22e", "#22c3b5", "#ff6f91", "#8e5cf0", "#4cc9f0"][i % 5],
  };
});

/**
 * A little burst of stars — the reward moment. Keyed by the caller so it replays.
 * MotionConfig(reducedMotion="user") turns it into a plain fade for those who ask.
 */
export function StarBurst() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {BURST.map((b, i) => (
        <m.span
          key={i}
          className="absolute"
          style={{ color: b.c }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
          animate={{ opacity: [0, 1, 0], x: b.x, y: b.y, scale: [0.4, 1.1, 0.8] }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <Star8 size={14} />
        </m.span>
      ))}
    </span>
  );
}

/** Per-sticker colours and how a child can earn it (the teacher still decides). */
export const STICKER_INFO: Record<
  StickerKind,
  { name: string; hint: string; tint: string; ring: string }
> = {
  etoile: {
    name: "L’étoile",
    hint: "Pour une belle récitation",
    tint: "rgba(255,194,46,0.16)",
    ring: "rgba(255,194,46,0.55)",
  },
  croissant: {
    name: "Le croissant",
    hint: "Pour l’entraide",
    tint: "rgba(34,195,181,0.16)",
    ring: "rgba(34,195,181,0.55)",
  },
  livre: {
    name: "Le livre",
    hint: "Pour une belle lecture",
    tint: "rgba(255,111,97,0.16)",
    ring: "rgba(255,111,97,0.55)",
  },
  lanterne: {
    name: "La lanterne",
    hint: "Pour la ponctualité",
    tint: "rgba(142,92,240,0.2)",
    ring: "rgba(142,92,240,0.6)",
  },
};

export const POWER_COLORS = {
  memorisation: "#ffc22e",
  lecture: "#ff6f61",
  attitude: "#22c3b5",
  comportement: "#8e5cf0",
  ponctualite: "#4cc9f0",
} as const;

/** One gentle Arabic word a day — everyday vocabulary, not sacred text. */
export const WORDS = [
  { ar: "نُور", lat: "nour", fr: "la lumière", phrase: "Chaque don allume une lumière." },
  {
    ar: "صَبْر",
    lat: "sabr",
    fr: "la patience",
    phrase: "On apprend une sourate petit à petit, avec patience.",
  },
  {
    ar: "شُكْرًا",
    lat: "choukran",
    fr: "merci",
    phrase: "On dit merci à son professeur à la fin du cours.",
  },
  {
    ar: "سَلَام",
    lat: "salam",
    fr: "la paix",
    phrase: "On se salue avec « As-salamou ‘alaykoum ».",
  },
  {
    ar: "عِلْم",
    lat: "‘ilm",
    fr: "le savoir",
    phrase: "Apprendre, c’est allumer une lampe dans son cœur.",
  },
  {
    ar: "صَدَقَة",
    lat: "sadaqa",
    fr: "le don, la générosité",
    phrase: "Un sourire aussi est une sadaqa.",
  },
  {
    ar: "رَحْمَة",
    lat: "rahma",
    fr: "la bonté, la miséricorde",
    phrase: "Être doux avec les plus petits.",
  },
] as const;

/** Same word for the whole day, for everyone. */
export function wordOfTheDay(date = new Date()) {
  const day = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  return WORDS[day % WORDS.length] ?? WORDS[0];
}
