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

/** Sticker badges a teacher can award — drawn, gold, no emoji. */
export function Sticker({
  kind,
  size = 40,
  className,
}: {
  kind: StickerKind;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      className={cn("shrink-0 drop-shadow-[0_0_10px_rgba(236,217,160,0.35)]", className)}
    >
      <circle cx="24" cy="24" r="22" fill="#0f3b2b" stroke="#d9bd77" strokeWidth="1.5" />
      <circle
        cx="24"
        cy="24"
        r="18.5"
        fill="none"
        stroke="#d9bd77"
        strokeOpacity="0.35"
        strokeDasharray="0.01 2.6"
        strokeLinecap="round"
      />
      <g fill="#ecd9a0" stroke="none">
        {kind === "etoile" && (
          <path d="M24 11 L26.7 19.5 L35.3 16.7 L30.6 24 L35.3 31.3 L26.7 28.5 L24 37 L21.3 28.5 L12.7 31.3 L17.4 24 L12.7 16.7 L21.3 19.5 Z" />
        )}
        {kind === "croissant" && (
          <>
            <path d="M28.5 13.5 A11 11 0 1 0 28.5 34.5 A8.6 8.6 0 1 1 28.5 13.5 Z" />
            <path d="M33 19.5 l1.1 2.4 2.6.3-1.9 1.8.5 2.6-2.3-1.3-2.3 1.3.5-2.6-1.9-1.8 2.6-.3 Z" />
          </>
        )}
        {kind === "livre" && (
          <path
            d="M13 16 C17 14.5 21 14.8 24 17 C27 14.8 31 14.5 35 16 L35 33 C31 31.5 27 31.8 24 34 C21 31.8 17 31.5 13 33 Z M24 17 L24 34"
            stroke="#0f3b2b"
            strokeWidth="1.2"
          />
        )}
        {kind === "lanterne" && (
          <path
            d="M24 10 L24 13 M20 15 L28 15 L30 18 L18 18 Z M18.5 18.5 Q15.5 26 18.5 33 L29.5 33 Q32.5 26 29.5 18.5 Z M21 34 L27 34 L25.6 37.5 L22.4 37.5 Z"
            stroke="#ecd9a0"
            strokeWidth="1.2"
          />
        )}
      </g>
    </svg>
  );
}

export const STICKER_LABELS: Record<StickerKind, string> = {
  etoile: "Étoile",
  croissant: "Croissant",
  livre: "Livre",
  lanterne: "Lanterne",
};
