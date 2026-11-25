"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { EmergencyBanner } from "@/components/emergency-banner";
import { Emblem } from "@/components/ui/emblem";
import { ArrowRightIcon, MenuIcon, XIcon } from "@/components/ui/icons";

/**
 * Public site navigation. On the home page it floats transparently over the hero
 * photo (like a landing hero) and turns into the solid night-emerald bar once you
 * scroll or open the mobile menu. On every other public page it's the solid bar from
 * the start. Focused surfaces (/tv, /admin, /portail) render their own chrome — they are
 * linked from the footer, and the portal also from the gold « Portail » pill.
 *
 * A live emergency alert (§4.4) is rendered INSIDE the header, at its top, so it travels
 * with the fixed overlay on the home page instead of fighting it.
 */
const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/activites", label: "Activités" },
  { href: "/evenements", label: "Événements" },
  { href: "/caisse", label: "La caisse" },
  { href: "/apprendre", label: "Apprendre" },
];
const PORTAL = { href: "/portail", label: "Portail" };

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const isHome = pathname === "/";
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // On the home page the bar is transparent until the hero scrolls past. Initial
  // reads are deferred to an animation frame so we never setState synchronously in
  // the effect body (avoids cascading renders / hydration reads during render).
  useEffect(() => {
    if (!isHome) {
      const raf = requestAnimationFrame(() => setScrolled(false));
      return () => cancelAnimationFrame(raf);
    }
    // The home page opens with the gallery walk: the bar stays a transparent overlay
    // for the whole walk and only turns solid once the content after it (#fin-galerie)
    // reaches the top. Any other home layout falls back to "solid after 24px".
    const onScroll = () => {
      const after = document.getElementById("fin-galerie");
      setScrolled(after ? after.getBoundingClientRect().top <= 72 : window.scrollY > 24);
    };
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [isHome]);

  // Esc closes the mobile menu and hands focus back to its button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const overlay = isHome && !scrolled && !open;

  return (
    <header
      className={cn(
        "z-50 transition-colors duration-300",
        isHome ? "fixed inset-x-0 top-0" : "border-hairline-dark bg-night sticky top-0 border-b",
        overlay
          ? "bg-transparent"
          : isHome && "border-hairline-dark bg-night/95 border-b shadow-lg backdrop-blur-md",
        "text-on-dark",
      )}
    >
      <EmergencyBanner />
      <div
        className={cn(
          "mx-auto flex max-w-[1200px] items-center gap-4 px-4 py-3 md:px-8",
          overlay && "[text-shadow:0_1px_10px_rgba(0,0,0,0.45)]",
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 leading-tight"
          onClick={() => setOpen(false)}
        >
          <Emblem size={34} className={overlay ? "text-gold" : "text-emerald"} />
          <span>
            <span className="font-display text-on-dark block text-[16px]">
              Mussalla de Montréal
            </span>
            <span className="eyebrow text-on-dark-faint hidden sm:block">Centre communautaire</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Navigation principale"
          className="ml-auto hidden items-center gap-0.5 lg:flex"
        >
          {LINKS.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-[2px] px-3 pt-1.5 pb-2 text-[13px] font-medium whitespace-nowrap transition-colors",
                  active ? "text-on-dark" : "text-on-dark-muted hover:text-on-dark",
                )}
              >
                {l.label}
                {active && (
                  <span className="bg-gold absolute inset-x-3 bottom-1 h-0.5 rounded-full" />
                )}
              </Link>
            );
          })}
          <Link
            href={PORTAL.href}
            className="bg-gold text-ink hover:bg-gold-light focus-visible:outline-gold-light ml-3 inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold whitespace-nowrap transition [text-shadow:none] focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {PORTAL.label}
            <ArrowRightIcon width={14} height={14} />
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="menu-mobile"
          className="text-on-dark ml-auto inline-flex size-11 items-center justify-center rounded-[4px] transition hover:bg-white/10 lg:hidden"
        >
          {open ? <XIcon width={22} height={22} /> : <MenuIcon width={22} height={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav
          id="menu-mobile"
          aria-label="Navigation principale"
          className="border-hairline-dark bg-night border-t px-4 pb-4 lg:hidden"
        >
          {LINKS.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-[4px] px-3 py-3 text-[15px] font-medium transition-colors",
                  active
                    ? "text-on-dark bg-white/5"
                    : "text-on-dark-muted hover:text-on-dark hover:bg-white/5",
                )}
              >
                {l.label}
                {active && <span className="bg-gold size-1.5 rounded-full" />}
              </Link>
            );
          })}
          <Link
            href={PORTAL.href}
            onClick={() => setOpen(false)}
            className="bg-gold text-ink hover:bg-gold-light focus-visible:outline-gold-light mt-3 flex h-12 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {PORTAL.label}
            <ArrowRightIcon width={16} height={16} />
          </Link>
        </nav>
      )}
    </header>
  );
}
