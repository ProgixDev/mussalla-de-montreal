"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  animate,
  m,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Star8 } from "@/components/ui/star";
import { Ornament } from "@/components/ui/ornament";
import { ArrowRightIcon } from "@/components/ui/icons";
import { formatCAD } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * « Chaque don allume une lumière » — the home page as a walk down the mussalla's
 * gallery at night. A sticky full-screen canvas scrubs through a Blender fly-through
 * (design/flythrough) as the visitor scrolls: the camera advances, the lanterns light
 * up pair by pair, and the caisse is told in chapters laid over the walk, ending at
 * the lit mihrab.
 *
 * - Frames: 100 WebP per orientation, wide (desktop) and tall (phones). Frame 1 is
 *   server-rendered as a <picture> poster; the rest stream in by priority (every 10th,
 *   then every 5th…), so scrubbing works at once and sharpens as frames arrive.
 * - Between two frames the canvas cross-fades by the fractional position, which reads
 *   as continuous motion at 100 frames.
 * - Every chapter stays in the DOM (screen readers, search). Keyboard focus inside a
 *   chapter scrolls the walk to it. prefers-reduced-motion gets a still page instead.
 */

export interface FlyGoal {
  id: string;
  title: string;
  percent: number;
  raisedCents: number;
  targetCents: number;
}

interface Props {
  balanceCents: number;
  monthInCents: number;
  monthOutCents: number;
  goals: FlyGoal[];
}

const FRAME_COUNT = 100;
const SETS = {
  wide: "/flythrough/wide",
  tall: "/flythrough/tall",
} as const;
type SetKey = keyof typeof SETS;
const frameSrc = (set: SetKey, i: number) =>
  `${SETS[set]}/f_${String(i + 1).padStart(3, "0")}.webp`;

/** Scroll ranges (0–1 over the whole walk) for each chapter. */
const CHAPTERS = [
  { id: "bienvenue", label: "Bienvenue", range: [0, 0.13] },
  { id: "solde", label: "Le solde", range: [0.17, 0.35] },
  { id: "mois", label: "Ce mois-ci", range: [0.39, 0.56] },
  { id: "objectifs", label: "Objectifs", range: [0.6, 0.79] },
  { id: "merci", label: "Merci", range: [0.85, 1] },
] as const;

/** Chapter by index, clamped — never undefined. */
const chapterAt = (i: number) =>
  CHAPTERS[Math.max(0, Math.min(CHAPTERS.length - 1, i))] ?? CHAPTERS[0];

// ── media queries as external stores (no hydration mismatch) ────────────
function useMedia(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// ── frame player ─────────────────────────────────────────────────────────
/** Priority order: 0, every 10th, every 5th, every 2nd, then the rest. */
function loadOrder(n: number): number[] {
  const seen = new Set<number>();
  const order: number[] = [];
  for (const step of [n, 10, 5, 2, 1]) {
    for (let i = 0; i < n; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  if (!seen.has(n - 1)) order.push(n - 1);
  return order;
}

function useFramePlayer(canvasRef: React.RefObject<HTMLCanvasElement | null>, set: SetKey) {
  const frames = useRef<(HTMLImageElement | null)[]>([]);
  const position = useRef(0);
  const raf = useRef(0);

  const paint = useCallback(() => {
    raf.current = 0;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const pos = Math.min(FRAME_COUNT - 1, Math.max(0, position.current));
    const nearest = (i: number) => {
      for (let d = 0; d < FRAME_COUNT; d++) {
        const a = frames.current[i - d];
        if (a) return a;
        const b = frames.current[i + d];
        if (b) return b;
      }
      return null;
    };
    const i0 = Math.floor(pos);
    const a = frames.current[i0] ?? nearest(i0);
    if (!a) return;
    const b = frames.current[Math.min(FRAME_COUNT - 1, i0 + 1)];
    const cw = canvas.width;
    const ch = canvas.height;
    const draw = (img: HTMLImageElement, alpha: number) => {
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    };
    draw(a, 1);
    const frac = pos - i0;
    if (b && b !== a && frac > 0.01) draw(b, frac);
    ctx.globalAlpha = 1;
  }, [canvasRef]);

  const request = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(paint);
  }, [paint]);

  // Size the canvas to its box (capped at 2× DPR — the frames are 1280 px anyway).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      request();
    };
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    fit();
    return () => ro.disconnect();
  }, [canvasRef, request]);

  // Stream the frames in priority order, a few at a time.
  useEffect(() => {
    let cancelled = false;
    frames.current = new Array(FRAME_COUNT).fill(null);
    const queue = loadOrder(FRAME_COUNT);
    const next = async (): Promise<void> => {
      const i = queue.shift();
      if (i === undefined || cancelled) return;
      const img = new Image();
      img.decoding = "async";
      img.src = frameSrc(set, i);
      try {
        await img.decode();
        if (cancelled) return;
        frames.current[i] = img;
        // Repaint if this frame is near what's on screen.
        if (Math.abs(i - position.current) < 12) request();
      } catch {
        /* a missing frame just falls back to its nearest neighbour */
      }
      return next();
    };
    for (let k = 0; k < 6; k++) void next();
    return () => {
      cancelled = true;
    };
  }, [set, request]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return useCallback(
    (pos: number) => {
      position.current = pos;
      request();
    },
    [request],
  );
}

// ── chapters ─────────────────────────────────────────────────────────────
/** Piecewise-linear map of v through (input → output), clamped at both ends. */
function lerpRange(v: number, input: readonly number[], output: readonly number[]): number {
  const n = input.length;
  if (v <= (input[0] ?? 0)) return output[0] ?? 0;
  for (let i = 1; i < n; i++) {
    const x1 = input[i] ?? 0;
    if (v <= x1) {
      const x0 = input[i - 1] ?? 0;
      const y0 = output[i - 1] ?? 0;
      const y1 = output[i] ?? 0;
      return x1 === x0 ? y1 : y0 + ((v - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return output[n - 1] ?? 0;
}

function useChapterStyle(progress: MotionValue<number>, index: number) {
  const [a, b] = chapterAt(index).range;
  const first = index === 0;
  const last = index === CHAPTERS.length - 1;
  const f = 0.035;
  const input = first ? [a, b - f, b] : last ? [a, a + f, b] : [a, a + f, b - f, b];
  const fade = first ? [1, 1, 0] : last ? [0, 1, 1] : [0, 1, 1, 0];
  const lift = first ? [0, 0, -40] : last ? [40, 0, 0] : [40, 0, 0, -40];
  // Function transforms on purpose: Motion hands range-mapped opacity to the browser's
  // native ScrollTimeline, which tracked the wrong scroll range here (the first chapter
  // stayed half-visible over the second). A function can't be offloaded, so the value
  // is always the one computed from this track's own progress.
  const opacity = useTransform(progress, (v) => lerpRange(v, input, fade));
  const y = useTransform(progress, (v) => lerpRange(v, input, lift));
  const pointerEvents = useTransform(opacity, (o) => (o > 0.6 ? "auto" : "none"));
  return { opacity, y, pointerEvents };
}

function Chapter({
  index,
  progress,
  still,
  onFocusChapter,
  className,
  children,
}: {
  index: number;
  progress: MotionValue<number>;
  still: boolean;
  onFocusChapter: (index: number) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const style = useChapterStyle(progress, index);
  const chapter = chapterAt(index);
  if (still) {
    return (
      <section
        aria-labelledby={`ch-${chapter.id}`}
        className={cn(
          "relative flex min-h-[80svh] flex-col items-center justify-center px-5 py-20",
          className,
        )}
      >
        {children}
      </section>
    );
  }
  return (
    <m.section
      aria-labelledby={`ch-${chapter.id}`}
      style={style}
      onFocusCapture={() => onFocusChapter(index)}
      className={cn("absolute inset-0 flex flex-col items-center px-5", className)}
    >
      {children}
    </m.section>
  );
}

/**
 * A goal ring that sweeps to its value when the "objectifs" chapter comes into view.
 * Timed, not scroll-linked: a visitor who stops mid-chapter must never read a figure
 * that is still on its way (76 % instead of 81 %) — on a transparency board, a wrong
 * number on screen is a lie, however brief.
 */
function GoalRing({
  fill,
  percent,
  index,
}: {
  /** Shared 0 → 1 sweep for all rings; each ring starts a little later. */
  fill: MotionValue<number>;
  percent: number;
  index: number;
}) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const local = useTransform(fill, (f) => Math.min(1, Math.max(0, (f - index * 0.12) / 0.76)));
  const offset = useTransform(local, (t) => c * (1 - (t * percent) / 100));
  const label = useTransform(local, (t) => `${Math.round(t * percent)} %`);
  return (
    <div className="relative aspect-square w-full">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(236,217,160,0.16)" strokeWidth="3" />
        <circle
          cx="50"
          cy="50"
          r={r - 6.5}
          fill="none"
          stroke="rgba(236,217,160,0.35)"
          strokeWidth="0.7"
          strokeDasharray="0.01 2.8"
          strokeLinecap="round"
        />
        <m.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--gold-light)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          style={{
            strokeDashoffset: offset,
            filter: "drop-shadow(0 0 4px rgba(236,217,160,0.65))",
          }}
        />
      </svg>
      <m.span
        aria-hidden="true"
        className="font-display nums text-on-dark absolute inset-0 flex items-center justify-center text-[clamp(20px,2.6vw,34px)]"
      >
        {label}
      </m.span>
      <span className="sr-only">{percent} %</span>
    </div>
  );
}

// ── the walk ─────────────────────────────────────────────────────────────
export function Flythrough({ balanceCents, monthInCents, monthOutCents, goals }: Props) {
  const still = useMedia("(prefers-reduced-motion: reduce)");
  const portrait = useMedia("(max-aspect-ratio: 9/10)");
  const set: SetKey = portrait ? "tall" : "wide";

  const track = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  const done = useMotionValue(1);
  const progress = still ? done : scrollYProgress;

  const show = useFramePlayer(canvas, set);
  const [active, setActive] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    show(v * (FRAME_COUNT - 1));
    const idx = CHAPTERS.findIndex((c) => v >= c.range[0] - 0.02 && v <= c.range[1] + 0.02);
    if (idx !== -1 && idx !== active) setActive(idx);
  });
  // First paint (and after the frame set changes).
  useEffect(() => {
    show(scrollYProgress.get() * (FRAME_COUNT - 1));
  }, [set, show, scrollYProgress]);

  /** Scroll so chapter `i` sits at the middle of its range. */
  const goTo = useCallback((i: number, smooth = true) => {
    const el = track.current;
    if (!el) return;
    const [a, b] = chapterAt(i).range;
    const mid = i === 0 ? 0 : i === CHAPTERS.length - 1 ? 0.97 : (a + b) / 2;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + mid * span, behavior: smooth ? "smooth" : "auto" });
  }, []);
  const onFocusChapter = useCallback(
    (i: number) => {
      if (i !== active) goTo(i, false);
    },
    [active, goTo],
  );

  // Count-ups: TIMED, started when a chapter comes into view, so the figure at rest is
  // always the true one (see GoalRing). Still mode shows the final values at once.
  const balance = useMotionValue(still ? balanceCents : 0);
  const monthIn = useMotionValue(still ? monthInCents : 0);
  const monthOut = useMotionValue(still ? monthOutCents : 0);
  const ringFill = useMotionValue(still ? 1 : 0);
  const balanceText = useTransform(balance, (v) => formatCAD(Math.round(v / 100) * 100));
  const inLabel = useTransform(monthIn, (v) => `+ ${formatCAD(Math.round(v / 100) * 100)}`);
  const outLabel = useTransform(monthOut, (v) => `− ${formatCAD(Math.round(v / 100) * 100)}`);

  useEffect(() => {
    const finals: [MotionValue<number>, number][] = [
      [balance, balanceCents],
      [monthIn, monthInCents],
      [monthOut, monthOutCents],
      [ringFill, 1],
    ];
    if (still) {
      for (const [mv, to] of finals) mv.set(to);
      return;
    }
    const ease = [0.16, 1, 0.3, 1] as const;
    const run: [MotionValue<number>, number, number][] =
      active === 1
        ? [[balance, balanceCents, 1.6]]
        : active === 2
          ? [
              [monthIn, monthInCents, 1.3],
              [monthOut, monthOutCents, 1.5],
            ]
          : active === 3
            ? [[ringFill, 1, 2.2]]
            : [];
    const controls = run.map(([mv, to, duration]) => {
      mv.set(0);
      return animate(mv, to, { duration, ease });
    });
    return () => controls.forEach((ctl) => ctl.stop());
  }, [
    active,
    still,
    balance,
    monthIn,
    monthOut,
    ringFill,
    balanceCents,
    monthInCents,
    monthOutCents,
  ]);

  const chapterProps = { progress, still, onFocusChapter };

  return (
    <div
      ref={track}
      className={cn("bg-night relative", still ? "" : "h-[620svh] md:h-[640vh]")}
      aria-label="La caisse, en marchant dans la galerie"
    >
      {/* The stage: pinned for the length of the walk. When still, it simply stays
          behind the stacked chapters (sticky is not motion). */}
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Poster: frame 1 (or, when still, the lit mihrab) — no JS needed. */}
        <picture>
          <source
            media="(max-aspect-ratio: 9/10)"
            srcSet={frameSrc("tall", still ? FRAME_COUNT - 1 : 0)}
          />
          {/* Poster frame of the canvas sequence — already a sized WebP. */}
          <img
            src={frameSrc("wide", still ? FRAME_COUNT - 1 : 0)}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
        {!still && (
          <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        )}

        {/* Legibility + film: vignette, top/bottom shade, a whisper of grain. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 85% at 50% 52%, rgba(4,12,9,0.5) 0%, rgba(4,12,9,0.15) 45%, rgba(4,12,9,0.6) 100%), linear-gradient(180deg, rgba(4,12,9,0.7) 0%, rgba(4,12,9,0) 20%, rgba(4,12,9,0) 72%, rgba(4,12,9,0.75) 100%)",
          }}
        />
        <div aria-hidden="true" className="grain pointer-events-none absolute inset-0" />
      </div>

      {/* ── Chapters ── laid over the walk (or stacked over the still stage) */}
      <div className={cn(still ? "relative -mt-[100svh]" : "absolute inset-0")}>
        <div className={cn(still ? "" : "sticky top-0 h-[100svh]")}>
          {/* 1 · Bienvenue */}
          <Chapter index={0} {...chapterProps} className="justify-center pt-16 text-center">
            {/* Sacred text: opacity only — never scaled or rotated. */}
            <p className="font-arabic text-gold-light text-[26px] md:text-[30px]" lang="ar">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <Ornament className="text-gold mx-auto mt-5" width={200} />
            <h1
              id="ch-bienvenue"
              className="font-display text-on-dark mt-7 max-w-[15ch] text-[44px] leading-[1.02] text-balance [text-shadow:0_4px_40px_rgba(0,0,0,0.6)] md:text-[88px]"
            >
              Chaque don allume <span className="text-gold-light">une lumière.</span>
            </h1>
            <p className="text-on-dark-muted mt-6 max-w-[520px] text-[16px] leading-relaxed md:text-[19px]">
              Bienvenue dans la caisse de la Mussalla de Montréal : ce que la communauté donne et ce
              qu’elle dépense, visible de tous.
            </p>
            {!still && (
              <button
                type="button"
                onClick={() => goTo(1)}
                className="text-on-dark-muted hover:text-gold-light focus-visible:outline-gold-light mt-12 flex flex-col items-center gap-3 text-[12px] tracking-[0.2em] uppercase transition focus-visible:outline-2"
              >
                Avancez dans la galerie
                <span className="scrollcue bg-on-dark/20 relative block h-12 w-px overflow-hidden" />
              </button>
            )}
          </Chapter>

          {/* 2 · Le solde */}
          <Chapter index={1} {...chapterProps} className="justify-center text-center">
            <p className="eyebrow text-gold flex items-center gap-2">
              <span className="bg-gold-light animate-livepulse inline-block size-1.5 rounded-full" />
              En direct
            </p>
            <h2
              id="ch-solde"
              className="font-display text-on-dark-muted mt-4 text-[22px] md:text-[28px]"
            >
              Le solde de la caisse
            </h2>
            <p className="font-display nums text-on-dark mt-3 text-[64px] leading-none [text-shadow:0_0_60px_rgba(236,217,160,0.35)] md:text-[150px]">
              <m.span aria-hidden="true">{balanceText}</m.span>
              <span className="sr-only">{formatCAD(balanceCents)}</span>
            </p>
            <p className="text-on-dark-muted mt-6 max-w-[460px] text-[15px] leading-relaxed md:text-[17px]">
              Personne ne le saisit : il se calcule tout seul, à partir de chaque entrée et de
              chaque sortie inscrites dans la caisse.
            </p>
          </Chapter>

          {/* 3 · Ce mois-ci */}
          <Chapter index={2} {...chapterProps} className="justify-center text-center">
            <h2 id="ch-mois" className="eyebrow text-gold">
              Ce mois-ci
            </h2>
            <div className="mt-6 grid w-full max-w-[880px] grid-cols-1 gap-6 sm:grid-cols-2 md:gap-10">
              <div className="border-gold/20 bg-night/45 rounded-[18px] border px-6 py-7 backdrop-blur-md">
                <p className="text-on-dark-muted text-[14px]">Reçu de la communauté</p>
                <p className="font-display nums text-gold-light mt-2 text-[44px] leading-none md:text-[64px]">
                  <m.span aria-hidden="true">{inLabel}</m.span>
                  <span className="sr-only">plus {formatCAD(monthInCents)}</span>
                </p>
              </div>
              <div className="border-on-dark/15 bg-night/45 rounded-[18px] border px-6 py-7 backdrop-blur-md">
                <p className="text-on-dark-muted text-[14px]">Dépensé pour la mussalla</p>
                <p className="font-display nums text-on-dark mt-2 text-[44px] leading-none md:text-[64px]">
                  <m.span aria-hidden="true">{outLabel}</m.span>
                  <span className="sr-only">moins {formatCAD(monthOutCents)}</span>
                </p>
              </div>
            </div>
            <p className="text-on-dark-muted mt-7 max-w-[480px] text-[15px] leading-relaxed md:text-[17px]">
              Loyer, électricité, entretien : chaque dépense est inscrite, avec sa date. Rien n’est
              caché.
            </p>
          </Chapter>

          {/* 4 · Objectifs */}
          <Chapter index={3} {...chapterProps} className="justify-center text-center">
            <h2 id="ch-objectifs" className="font-display text-on-dark text-[30px] md:text-[48px]">
              Nos objectifs, ensemble
            </h2>
            <Ornament className="text-gold mx-auto mt-4" width={170} />
            <ul className="mt-8 grid w-full max-w-[1000px] grid-cols-3 gap-3 md:mt-12 md:gap-12">
              {goals.map((g, i) => (
                <li key={g.id} className="flex flex-col items-center">
                  <div className="w-full max-w-[200px]">
                    <GoalRing fill={ringFill} percent={g.percent} index={i} />
                  </div>
                  <p className="font-display text-on-dark mt-3 text-[14px] leading-snug text-balance md:mt-5 md:text-[21px]">
                    {g.title}
                  </p>
                  <p className="nums text-on-dark-muted mt-1 hidden text-[14px] md:block">
                    {formatCAD(g.raisedCents)} sur {formatCAD(g.targetCents)}
                  </p>
                </li>
              ))}
            </ul>
          </Chapter>

          {/* 5 · Merci — at the lit mihrab */}
          <Chapter index={4} {...chapterProps} className="justify-end pb-[12svh] text-center">
            <p
              className="font-arabic text-gold-light text-[34px] leading-none md:text-[44px]"
              lang="ar"
            >
              بارك الله فيكم
            </p>
            <Ornament className="text-gold mx-auto mt-5" width={200} />
            <h2
              id="ch-merci"
              className="font-display text-on-dark mt-5 max-w-[18ch] text-[34px] leading-tight text-balance [text-shadow:0_4px_30px_rgba(0,0,0,0.7)] md:text-[60px]"
            >
              Qu’Allah récompense les donateurs.
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/caisse"
                className="sheen bg-gold text-ink shadow-lamp hover:bg-gold-light focus-visible:outline-gold-light inline-flex h-12 items-center gap-2 rounded-full px-7 text-[15px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Voir la caisse en direct
                <ArrowRightIcon width={16} height={16} />
              </Link>
              <Link
                href="/apprendre"
                className="border-on-dark/30 text-on-dark hover:border-gold/70 focus-visible:outline-gold-light inline-flex h-12 items-center rounded-full border px-7 text-[15px] font-medium backdrop-blur-sm transition focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Apprendre
              </Link>
            </div>
          </Chapter>
          {/* Chapter rail — where you are in the walk; each star jumps to its chapter.
              Last in the overlay so no chapter layer can sit on top of it. */}
          {!still && (
            <nav
              aria-label="Chapitres"
              className="absolute top-1/2 right-3 z-20 hidden -translate-y-1/2 flex-col items-end gap-4 md:right-6 md:flex"
            >
              {CHAPTERS.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={active === i ? "step" : undefined}
                  className="group text-on-dark-muted focus-visible:outline-gold-light flex items-center gap-3 rounded-full py-1 pl-3 text-[12px] transition focus-visible:outline-2"
                >
                  <span
                    className={cn(
                      "eyebrow opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100",
                      active === i && "text-gold-light opacity-100",
                    )}
                  >
                    {c.label}
                  </span>
                  <Star8
                    size={active === i ? 16 : 10}
                    className={cn(
                      "transition-all",
                      active === i
                        ? "text-gold-light drop-shadow-[0_0_8px_rgba(236,217,160,0.9)]"
                        : "text-on-dark-faint group-hover:text-gold",
                    )}
                  />
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
