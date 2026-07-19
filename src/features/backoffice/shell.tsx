"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Emblem } from "@/components/ui/emblem";
import {
  CoinsIcon,
  DashboardIcon,
  LogOutIcon,
  MenuIcon,
  MonitorIcon,
  ReceiptIcon,
  TargetIcon,
  UsersIcon,
  XIcon,
} from "@/components/ui/icons";
import { TV_PAGES } from "@/core/data/derive";
import { useBackoffice } from "./provider";
import {
  Contributions,
  Dashboard,
  Display,
  Expenses,
  Goals,
  Members,
  SECTION_TITLES,
} from "./sections";
import type { Section } from "./store";

const NAV: { key: Section; label: string; Icon: typeof DashboardIcon }[] = [
  { key: "dashboard", label: "Tableau de bord", Icon: DashboardIcon },
  { key: "contributions", label: "Contributions", Icon: CoinsIcon },
  { key: "expenses", label: "Dépenses", Icon: ReceiptIcon },
  { key: "goals", label: "Objectifs", Icon: TargetIcon },
  { key: "display", label: "Affichage", Icon: MonitorIcon },
  { key: "members", label: "Membres", Icon: UsersIcon },
];

export function Shell() {
  const section = useBackoffice((s) => s.section);
  const setSection = useBackoffice((s) => s.setSection);
  const logout = useBackoffice((s) => s.logout);
  const display = useBackoffice((s) => s.display);
  const manager = useBackoffice((s) => s.members[0]);
  const [drawer, setDrawer] = useState(false);

  const tvStatus =
    display.mode === "pinned"
      ? `Épinglé · ${TV_PAGES[display.pinnedPage]?.label}`
      : `Rotation · ${display.rotationSpeed} s`;

  const go = (key: Section) => {
    setSection(key);
    setDrawer(false);
  };

  const sidebar = (
    <>
      <div className="flex items-center gap-3 px-5 py-5">
        <Emblem size={36} className="text-emerald" />
        <div className="leading-tight">
          <p className="font-display text-[15px] text-ink">Mussalla de Montréal</p>
          <p className="eyebrow text-muted-ink">Backoffice</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map(({ key, label, Icon }) => {
          const active = section === key;
          return (
            <button
              key={key}
              onClick={() => go(key)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[4px] px-3 py-2.5 text-[14px] transition",
                active
                  ? "border-l-2 border-emerald bg-white font-medium text-ink"
                  : "text-body hover:bg-white/60",
              )}
            >
              <Icon width={18} height={18} className={active ? "text-emerald" : "text-muted-ink"} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-hairline p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-tint font-display text-[14px] text-emerald">
            {manager?.initials}
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-medium text-ink">{manager?.name}</p>
            <p className="text-[12px] text-muted-ink">{manager?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-1 flex w-full items-center gap-2 rounded-[4px] px-3 py-2 text-[13px] font-medium text-muted-ink transition hover:bg-white/60 hover:text-ink"
        >
          <LogOutIcon width={16} height={16} />
          Se déconnecter
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-dvh bg-cream">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-hairline bg-cream-2 md:flex">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setDrawer(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col bg-cream-2 shadow-modal">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-hairline bg-cream px-4 py-3.5 md:px-6 md:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setDrawer(true)}
              aria-label="Ouvrir le menu"
              className="inline-flex size-9 items-center justify-center rounded-[4px] text-ink transition hover:bg-tint md:hidden"
            >
              <MenuIcon width={22} height={22} />
            </button>
            <h1 className="font-display truncate text-[20px] text-ink md:text-[24px]">
              {SECTION_TITLES[section]}
            </h1>
          </div>
          <Link
            href="/tv"
            className="flex shrink-0 items-center gap-2 rounded-full border border-hairline bg-white px-3 py-1.5 text-[12px] font-medium text-muted-ink transition hover:border-emerald/40 hover:text-ink"
          >
            <span className="inline-block size-1.5 rounded-full bg-gold-deep animate-livepulse" />
            <span className="hidden sm:inline">Écran TV · </span>
            {tvStatus}
          </Link>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {section === "dashboard" && <Dashboard />}
          {section === "contributions" && <Contributions />}
          {section === "expenses" && <Expenses />}
          {section === "goals" && <Goals />}
          {section === "display" && <Display />}
          {section === "members" && <Members />}
        </div>
      </div>

      {/* Close affordance for the open drawer (X in the header area) */}
      {drawer && (
        <button
          onClick={() => setDrawer(false)}
          aria-label="Fermer le menu"
          className="fixed top-3.5 right-4 z-50 inline-flex size-9 items-center justify-center rounded-full bg-ink/10 text-ink md:hidden"
        >
          <XIcon width={20} height={20} />
        </button>
      )}
    </div>
  );
}
