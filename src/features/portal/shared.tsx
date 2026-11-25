"use client";

import { cn } from "@/lib/utils";
import { usePortal } from "@/lib/portal/store";
import type { FunctionalProfile, Person } from "@/core/portal/types";

/** Shared helpers for every portal space. */

export const PROFILE_LABELS: Record<FunctionalProfile, string> = {
  secretary: "Secrétariat",
  shura_member: "Membre de la Shura",
  activity_manager: "Responsable d’activités",
  imam: "Imam",
  accountant: "Comptabilité",
  volunteer_coordinator: "Coordination bénévoles",
};

export const ROLE_LABELS = {
  admin: "Administration",
  teacher: "Enseignant",
  parent: "Membre / parent",
  child: "Enfant",
  screen: "Écran",
} as const;

/** "Fatima Zahra B." — public-facing short name. */
export function usePersonName() {
  const persons = usePortal((s) => s.persons);
  const children = usePortal((s) => s.children);
  return (id: string, full = false) => {
    const p = persons.find((x) => x.id === id);
    if (p) return full ? `${p.firstName} ${p.lastName}` : `${p.firstName} ${p.lastName.charAt(0)}.`;
    const c = children.find((x) => x.id === id);
    if (c) return full ? `${c.firstName} ${c.lastName}` : c.firstName;
    return "—";
  };
}

export interface SpaceProps {
  /** The signed-in person (for the child persona, a synthetic Person built from the child). */
  me: Person;
}

/** In-space navigation: a row of tabs (scrollable on phones). */
export function SpaceTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { id: T; label: string; badge?: number }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <nav aria-label={label} className="-mx-5 mb-6 overflow-x-auto px-5 md:mx-0 md:px-0">
      <div
        role="tablist"
        className="border-gold/12 flex min-w-max gap-1.5 rounded-full border bg-white/[0.03] p-1.5"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={value === t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "focus-visible:outline-gold-light inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium whitespace-nowrap transition focus-visible:outline-2",
              value === t.id
                ? "bg-gold text-ink"
                : "text-on-dark-muted hover:text-on-dark hover:bg-white/[0.06]",
            )}
          >
            {t.label}
            {t.badge ? (
              <span
                className={cn(
                  "nums rounded-full px-1.5 text-[11.5px] leading-5",
                  value === t.id ? "bg-ink/15 text-ink" : "bg-gold/20 text-gold-light",
                )}
              >
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </nav>
  );
}

/** Page heading inside a space. */
export function SpaceHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <p className="eyebrow text-gold">{eyebrow}</p>
      <h1 className="font-display text-on-dark mt-2 text-[30px] leading-tight md:text-[40px]">
        {title}
      </h1>
      {children && (
        <div className="text-on-dark-muted mt-2 max-w-[640px] text-[15px] leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

export const POINT_CATEGORY_LABELS = {
  memorisation: "Mémorisation",
  lecture: "Lecture",
  attitude: "Attitude",
  comportement: "Comportement",
  ponctualite: "Ponctualité",
} as const;

/** "+10" / "−2" — signed points, gold when positive, soft coral when negative. */
export function PointsBadge({ points, className }: { points: number; className?: string }) {
  const positive = points > 0;
  return (
    <span
      className={cn(
        "nums inline-flex min-w-12 items-center justify-center rounded-full px-2.5 py-1 text-[14px] font-semibold",
        positive ? "bg-gold/15 text-gold-light" : "bg-[#c2553a]/20 text-[#ffb9a6]",
        className,
      )}
    >
      {positive ? "+" : "−"}
      {Math.abs(points)}
    </span>
  );
}

/** A drawn mushaf page (when the teacher hasn't attached a photo): ruled lines + page number. */
export function MushafPage({ page, className }: { page: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 60 80"
      className={cn("block", className)}
      role="img"
      aria-label={`Page ${page}`}
    >
      <rect
        x="1"
        y="1"
        width="58"
        height="78"
        rx="3"
        fill="#f3ead6"
        stroke="#c9a24b"
        strokeWidth="1.2"
      />
      <rect
        x="5"
        y="5"
        width="50"
        height="70"
        rx="1.5"
        fill="none"
        stroke="#c9a24b"
        strokeOpacity="0.55"
        strokeWidth="0.8"
      />
      {Array.from({ length: 9 }, (_, i) => (
        <line
          key={i}
          x1="10"
          x2="50"
          y1={14 + i * 6.2}
          y2={14 + i * 6.2}
          stroke="#6b5717"
          strokeOpacity="0.35"
          strokeWidth="1.1"
          strokeDasharray={i % 3 === 0 ? "26 3 8" : "14 2 20"}
        />
      ))}
      <circle cx="30" cy="72" r="4.4" fill="#0f5a40" />
      <text
        x="30"
        y="72"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="5.2"
        fill="#f7f1e5"
        fontFamily="serif"
      >
        {page}
      </text>
    </svg>
  );
}

/** Local ISO day ("2026-11-28") for "today" — never toISOString (that's UTC). */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** A small "this is where the real integration plugs in" note (spec §10 decisions). */
export function DemoNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-gold/15 bg-gold/[0.06] text-on-dark-muted mt-3 rounded-[12px] border px-3.5 py-2.5 text-[12.5px] leading-relaxed">
      <span className="text-gold-light font-semibold">Démo · </span>
      {children}
    </p>
  );
}
