"use client";

import { useEffect, useState } from "react";
import { isAlertActive } from "@/core/portal/derive";
import type { EmergencyAlert } from "@/core/portal/types";
import { usePortal } from "@/lib/portal/store";
import { usePortalReady } from "@/lib/portal/hydrator";
import { formatDateTime, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Urgent alerts on the public site (§4.4, §6.1): every alert that is live right now and
 * targets the "portail" channel. Visually distinct from everything else — deep ember red
 * with a coral accent — yet still in the night language of the site.
 *
 * - `band` (default) sits at the very top of the site header, so it moves with the fixed
 *   transparent header of the home page. role="alert": announced once when it appears.
 * - `panel` is the in-page version (events page) — no role="alert", the band already spoke.
 *
 * Renders nothing until the saved demo state is restored and the clock is read on the
 * client (no hydration mismatch), and re-checks every 30 s so an expired alert disappears
 * by itself (« Une alerte expirée ne doit plus être affichée »).
 */
export function EmergencyBanner({ variant = "band" }: { variant?: "band" | "panel" }) {
  const ready = usePortalReady();
  const alerts = usePortal((s) => s.alerts);
  const now = useNowIso();

  if (!ready || !now) return null;
  const live = alerts.filter((a) => a.channels.includes("portail") && isAlertActive(a, now));
  if (live.length === 0) return null;

  if (variant === "panel") {
    return (
      <section
        aria-labelledby="alertes-en-cours"
        className="mb-10 overflow-hidden rounded-[18px] border border-[#ffb9a6]/35 bg-[#5a1d12] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]"
      >
        <h2 id="alertes-en-cours" className="sr-only">
          {live.length > 1 ? "Alertes en cours" : "Alerte en cours"}
        </h2>
        {live.map((a, i) => (
          <AlertBody
            key={a.id}
            alert={a}
            now={now}
            className={cn("px-5 py-5 md:px-6", i > 0 && "border-t border-[#ffb9a6]/20")}
            large
          />
        ))}
      </section>
    );
  }

  return (
    <div role="alert" className="border-b border-[#ffb9a6]/30 bg-[#5a1d12] text-[#fff1ec]">
      {live.map((a, i) => (
        <AlertBody
          key={a.id}
          alert={a}
          now={now}
          className={cn(
            "mx-auto max-w-[1200px] px-4 py-3 md:px-8",
            i > 0 && "border-t border-[#ffb9a6]/20",
          )}
        />
      ))}
    </div>
  );
}

function AlertBody({
  alert: a,
  now,
  className,
  large,
}: {
  alert: EmergencyAlert;
  now: string;
  className?: string;
  large?: boolean;
}) {
  const until = sameLocalDay(a.expiresAt, now)
    ? `jusqu’à ${formatTime(new Date(a.expiresAt))}`
    : `jusqu’au ${formatDateTime(a.expiresAt)}`;
  const Title = large ? "h3" : "p";
  return (
    <div className={cn("flex gap-3", className)}>
      <WarningGlyph className={cn("mt-0.5 shrink-0 text-[#ffb9a6]", large ? "size-6" : "size-5")} />
      <div className={cn("min-w-0 leading-snug", large ? "text-[15.5px]" : "text-[14px]")}>
        <Title
          className={cn(
            "font-bold text-white",
            large && "font-display text-[22px] leading-tight font-normal",
          )}
        >
          <span className="eyebrow mr-2 align-[0.1em] font-sans text-[#ffb9a6]">
            {a.level === "urgent" ? "Alerte urgente" : "Avis important"}
          </span>
          {large && <br />}
          {a.title}
        </Title>
        <p className={cn("text-[#f6d9cf]", large ? "mt-2" : "mt-0.5")}>
          {a.message} <strong className="font-bold text-white">{a.instruction}</strong>
        </p>
        <p className={cn("text-[#f0bfb0]", large ? "mt-2 text-[13.5px]" : "mt-0.5 text-[12.5px]")}>
          En vigueur {until}.
        </p>
      </div>
    </div>
  );
}

/** Warning triangle — drawn inline like the rest of the icon set. */
function WarningGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M10.3 3.9 1.8 18.2A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4.5M12 17.2h.01" />
    </svg>
  );
}

function sameLocalDay(aIso: string, bIso: string) {
  const a = new Date(aIso);
  const b = new Date(bIso);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** The current time as ISO, read on the client only, refreshed every 30 seconds. */
function useNowIso(): string | null {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date().toISOString());
    // First read deferred to a frame: never setState synchronously in the effect body.
    const raf = requestAnimationFrame(tick);
    const id = window.setInterval(tick, 30_000);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, []);
  return now;
}
