"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, m } from "@/components/motion";
import { Emblem } from "@/components/ui/emblem";
import { Lattice } from "@/components/ui/lattice";
import { MaximizeIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { TV_PAGES } from "@/core/data/derive";
import type { CaisseData } from "@/core/data/types";
import type { CaisseTotals } from "@/core/data/derive";
import { formatDateLong, formatTime } from "@/lib/format";
import { useTvStore } from "./provider";
import { TV_PAGE_COMPONENTS } from "./pages";

/**
 * The full-screen kiosk. On a real TV the browser is fullscreened onto this page —
 * no device bezel. Rotates between the four pages at the backoffice-set speed unless
 * a page is pinned; each change crossfades. Clock ticks locally.
 */
export function TvScreen({
  data,
  totals,
  qr,
}: {
  data: CaisseData;
  totals: CaisseTotals;
  qr: React.ReactNode;
}) {
  const display = useTvStore((s) => s.display);
  const tvPage = useTvStore((s) => s.tvPage);
  const now = useTvStore((s) => s.now);
  const setNow = useTvStore((s) => s.setNow);
  const advance = useTvStore((s) => s.advance);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Local clock.
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [setNow]);

  // Rotation ticker — only while auto-rotating and the tab is visible.
  useEffect(() => {
    if (display.mode !== "rotation") return;
    const id = setInterval(() => {
      if (!document.hidden) advance();
    }, display.rotationSpeed * 1000);
    return () => clearInterval(id);
  }, [display.mode, display.rotationSpeed, advance]);

  // Keep the button in sync if the user exits fullscreen with Esc.
  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  const activeIndex = display.mode === "pinned" ? display.pinnedPage : tvPage;
  const PageComponent = TV_PAGE_COMPONENTS[activeIndex] ?? TV_PAGE_COMPONENTS[0]!;
  const statusLabel =
    display.mode === "pinned"
      ? `Épinglé · ${TV_PAGES[display.pinnedPage]?.label ?? ""}`
      : `Rotation · ${display.rotationSpeed} s par page`;

  return (
    <div className="group relative flex h-dvh w-full flex-col overflow-hidden bg-cream-tv px-11 py-8 text-ink">
      <Lattice opacity={0.4} />

      {/* Fullscreen toggle — subtle, corner; clearer on hover. */}
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
        className="absolute top-3 right-3 z-20 inline-flex size-9 items-center justify-center rounded-full bg-ink/5 text-muted-ink opacity-30 transition hover:bg-ink/10 hover:opacity-100 focus-visible:opacity-100"
      >
        <MaximizeIcon width={18} height={18} />
      </button>

      {/* Header */}
      <header className="relative flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Emblem size={52} className="text-emerald" />
          <div>
            <p className="font-display text-3xl leading-none">Mussalla de Montréal</p>
            <p className="mt-1 flex items-center gap-2 text-sm tracking-wide text-muted-ink uppercase">
              <span className="inline-block size-2 rounded-full bg-gold-deep animate-livepulse" />
              En direct · {statusLabel}
            </p>
          </div>
        </div>
        <div className="pr-10 text-right">
          <p className="font-display nums text-5xl leading-none">
            {now === null ? "—" : formatTime(now)}
          </p>
          <p className="mt-2 text-base text-muted-ink">{now === null ? "" : formatDateLong(now)}</p>
        </div>
      </header>

      {/* Rotating page (crossfade) */}
      <main className="relative flex flex-1 items-center py-8">
        <AnimatePresence mode="wait">
          <m.div
            key={activeIndex}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
            className="w-full"
          >
            <PageComponent data={data} totals={totals} />
          </m.div>
        </AnimatePresence>
      </main>

      {/* Footer: QR + progress dots */}
      <footer className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-[8px] bg-white p-2 shadow-frame">{qr}</div>
          <div>
            <p className="text-[15px] font-semibold text-ink">
              Scannez pour voir la caisse et donner
            </p>
            <p className="text-sm text-muted-ink">mussalla-mtl.ca</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {TV_PAGES.map((page, i) => (
            <span
              key={page.key}
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                i === activeIndex ? "w-[26px] bg-emerald" : "w-2 bg-hairline-strong",
              )}
            />
          ))}
        </div>
      </footer>
    </div>
  );
}
