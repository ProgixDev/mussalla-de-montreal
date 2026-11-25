import Image from "next/image";
import { cn } from "@/lib/utils";
import type { StickerKind } from "@/core/portal/types";

/**
 * Night UI kit for the portal and the new public pages — glass on night, gold accents,
 * the same language as the home page. Presentational only (no hooks), so it renders in
 * Server and Client Components alike.
 *
 * Accessibility built in: labels are always above fields (never placeholders), errors
 * are tied to their field with aria-describedby, touch targets are ≥ 44 px.
 */

// ── buttons ──────────────────────────────────────────────────────────────
type BtnVariant = "gold" | "ghost" | "subtle" | "danger";
type BtnSize = "md" | "sm";

export function btn(variant: BtnVariant = "gold", size: BtnSize = "md") {
  return cn(
    "focus-visible:outline-gold-light inline-flex items-center justify-center gap-2 rounded-full font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    size === "md" ? "h-11 px-5 text-[14.5px]" : "h-9 px-3.5 text-[13px]",
    variant === "gold" && "bg-gold text-ink hover:bg-gold-light font-semibold",
    variant === "ghost" &&
      "border-on-dark/25 text-on-dark hover:border-gold/60 border hover:bg-white/[0.04]",
    variant === "subtle" && "text-on-dark bg-white/[0.06] hover:bg-white/[0.1]",
    variant === "danger" && "bg-[#c2553a] font-semibold text-white hover:bg-[#d4664a]",
  );
}

// ── surfaces ─────────────────────────────────────────────────────────────
export function Panel({
  title,
  eyebrow,
  action,
  children,
  className,
  id,
}: {
  title?: React.ReactNode;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "border-gold/15 rounded-[18px] border bg-white/[0.035] p-5 shadow-[0_30px_60px_-34px_rgba(0,0,0,0.85)] backdrop-blur-sm md:p-6",
        className,
      )}
    >
      {(title || eyebrow || action) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow text-gold">{eyebrow}</p>}
            {title && (
              <h2 className="font-display text-on-dark mt-1 text-[22px] leading-tight">{title}</h2>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "light",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "light" | "gold";
}) {
  return (
    <div className="border-gold/12 rounded-[14px] border bg-white/[0.03] px-4 py-3.5">
      <p className="text-on-dark-muted text-[12.5px]">{label}</p>
      <p
        className={cn(
          "font-display nums mt-1 text-[28px] leading-none",
          tone === "gold" ? "text-gold-light" : "text-on-dark",
        )}
      >
        {value}
      </p>
      {hint && <p className="text-on-dark-faint mt-1.5 text-[12px]">{hint}</p>}
    </div>
  );
}

const PILL_TONES = {
  gold: "bg-gold/15 text-gold-light",
  emerald: "bg-[#1c7d5b]/30 text-[#9fe0c2]",
  neutral: "bg-white/[0.07] text-on-dark-muted",
  danger: "bg-[#c2553a]/25 text-[#ffb9a6]",
  warn: "bg-[#d9a23d]/20 text-[#ffd98a]",
} as const;

export function Pill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof PILL_TONES;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap",
        PILL_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-on-dark/15 text-on-dark-faint rounded-[12px] border border-dashed px-4 py-6 text-center text-[14px]">
      {children}
    </p>
  );
}

// ── forms ────────────────────────────────────────────────────────────────
export const inputCls =
  "w-full rounded-[12px] border border-on-dark/15 bg-night/60 px-3.5 py-2.5 text-[16px] text-on-dark placeholder:text-on-dark-faint/70 transition focus:border-gold/70 focus:outline-none focus:ring-2 focus:ring-gold/25 aria-[invalid=true]:border-[#e07a5f] md:text-[15px]";

export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-on-dark text-[13.5px] font-medium">
        {label}
        {required && (
          <span className="text-gold ml-1" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (obligatoire)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-on-dark-faint text-[12.5px]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[12.5px] text-[#ffb9a6]">
          {error}
        </p>
      )}
    </div>
  );
}

/** Props that tie an input to its Field's hint/error. */
export const describedBy = (id: string, error?: string, hint?: boolean) => ({
  id,
  "aria-invalid": error ? (true as const) : undefined,
  "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
});

/** A row of mutually exclusive choices (radio semantics, big touch targets). */
export function Segmented<T extends string>({
  name,
  label,
  options,
  value,
  onChange,
  className,
}: {
  name: string;
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="text-on-dark mb-1.5 text-[13.5px] font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "has-[:focus-visible]:outline-gold-light inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[14px] transition has-[:focus-visible]:outline-2",
              value === o.value
                ? "border-gold/70 bg-gold/15 text-gold-light"
                : "border-on-dark/15 text-on-dark-muted hover:border-on-dark/35 hover:text-on-dark",
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// ── identity ─────────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  ["#d9bd77", "#8a6a24"],
  ["#5fb38c", "#1f6b4d"],
  ["#e2a07a", "#93502f"],
  ["#8fb6e0", "#3d6a99"],
  ["#c9a6e8", "#6c4a91"],
  ["#e8c46a", "#9a7a1f"],
  ["#7fd0c4", "#2b7f73"],
  ["#f0a5b5", "#9b4a5c"],
] as const;

/** A child's (or member's) avatar: an 8-point star in their colour with their initial. */
export function StarAvatar({
  name,
  seed,
  size = 44,
  className,
}: {
  name: string;
  seed: number;
  size?: number;
  className?: string;
}) {
  const [light, dark] = AVATAR_PALETTE[Math.abs(seed) % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0];
  const gid = `av-${seed}-${size}`;
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="-12 -12 24 24" width={size} height={size} className="absolute inset-0">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={light} />
            <stop offset="100%" stopColor={dark} />
          </linearGradient>
        </defs>
        <rect x="-8.2" y="-8.2" width="16.4" height="16.4" rx="1.4" fill={`url(#${gid})`} />
        <rect
          x="-8.2"
          y="-8.2"
          width="16.4"
          height="16.4"
          rx="1.4"
          fill={`url(#${gid})`}
          transform="rotate(45)"
        />
      </svg>
      <span
        className="font-display text-night relative text-[0.42em] leading-none"
        style={{ fontSize: size * 0.4 }}
      >
        {name.trim().charAt(0).toUpperCase()}
      </span>
    </span>
  );
}

/**
 * Sticker badges a teacher can award — toy-like 3D renders (design/stickers/stickers.py),
 * the same set everywhere: teacher picker, parent badges, the child's album, the TV.
 * Decorative: the label is always given as text next to it.
 */
export function Sticker({
  kind,
  size = 40,
  className,
  locked = false,
}: {
  kind: StickerKind;
  size?: number;
  className?: string;
  /** Not earned yet: a soft silhouette (album). */
  locked?: boolean;
}) {
  return (
    <Image
      src={`/stickers/${kind}.webp`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      unoptimized
      className={cn(
        "shrink-0 select-none",
        locked
          ? "opacity-25 brightness-0 invert-[.35]"
          : "drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)]",
        className,
      )}
      draggable={false}
    />
  );
}

export const STICKER_LABELS: Record<StickerKind, string> = {
  etoile: "Étoile",
  croissant: "Croissant",
  livre: "Livre",
  lanterne: "Lanterne",
};
