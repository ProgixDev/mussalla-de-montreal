"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MenuIcon, XIcon } from "@/components/ui/icons";

/**
 * Public site navigation — the night-emerald bar from the design. Inline links on
 * desktop; a hamburger dropdown on mobile. Shown on the browsable public pages; the
 * focused surfaces render their own chrome (/don, /tv, /admin).
 */
const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/caisse", label: "La caisse" },
  { href: "/don", label: "Faire un don" },
  { href: "/tv", label: "Écran TV" },
  { href: "/admin", label: "Backoffice" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-hairline-dark bg-night text-on-dark">
      <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-4 py-3 md:px-8">
        <Link href="/" className="leading-tight" onClick={() => setOpen(false)}>
          <span className="font-display block text-[16px] text-on-dark">Mussalla de Montréal</span>
          <span className="eyebrow hidden text-on-dark-faint sm:block">
            La caisse · Transparence
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
