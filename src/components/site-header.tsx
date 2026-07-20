"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Emblem } from "@/components/ui/emblem";
import { MenuIcon, XIcon } from "@/components/ui/icons";

/**
 * Public site navigation. On the home page it floats transparently over the hero
 * photo (like a landing hero) and turns into the solid night-emerald bar once you
 * scroll or open the mobile menu. On every other public page it's the solid bar from
 * the start. Focused surfaces (/tv, /admin) render their own chrome.
 */
const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/caisse", label: "La caisse" },
  { href: "/apprendre", label: "Apprendre" },
  { href: "/tv", label: "Écran TV" },
  { href: "/admin", label: "Backoffice" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
    const onScroll = () => setScrolled(window.scrollY > 24);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [isHome]);

  const overlay = isHome && !scrolled && !open;

  return (
    <header
      className={cn(
        "z-50 transition-colors duration-300",
        isHome ? "fixed inset-x-0 top-0" : "sticky top-0 border-b border-hairline-dark bg-night",
        overlay
          ? "bg-transparent"
          : isHome && "border-b border-hairline-dark bg-night/95 shadow-lg backdrop-blur-md",
        "text-on-dark",
      )}
    >
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
            <span className="font-display block text-[16px] text-on-dark">
              Mussalla de Montréal
            </span>
            <span className="eyebrow hidden text-on-dark-faint sm:block">
              La caisse · Transparence
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-auto hidden items-center gap-0.5 md:flex">
          {LINKS.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-[2px] px-3 pt-1.5 pb-2 text-[13px] font-medium whitespace-nowrap transition-colors",
                  active ? "text-on-dark" : "text-on-dark-muted hover:text-on-dark",
                )}
              >
                {l.label}
                {active && (
                  <span className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-gold" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          className="ml-auto inline-flex size-9 items-center justify-center rounded-[4px] text-on-dark transition hover:bg-white/10 md:hidden"
        >
          {open ? <XIcon width={22} height={22} /> : <MenuIcon width={22} height={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="border-t border-hairline-dark bg-night px-4 pb-4 md:hidden">
          {LINKS.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-[4px] px-3 py-3 text-[15px] font-medium transition-colors",
                  active
                    ? "bg-white/5 text-on-dark"
                    : "text-on-dark-muted hover:bg-white/5 hover:text-on-dark",
                )}
              >
                {l.label}
                {active && <span className="size-1.5 rounded-full bg-gold" />}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
