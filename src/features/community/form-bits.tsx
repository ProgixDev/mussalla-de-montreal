"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon } from "@/components/ui/icons";
import { Star8 } from "@/components/ui/star";

/**
 * Form pieces the kit doesn't have yet: choice groups that can carry a hint and an error
 * (the kit's Segmented can't), a required consent checkbox, and the success heading.
 *
 * Selected chips show a check mark as well as the gold tint — state is never colour-only.
 * The first control of a group has the id `${name}-0`, which is what a submit focuses.
 */

const CHIP =
  "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-[14px] transition select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-light";
const CHIP_ON = "border-gold/70 bg-gold/15 text-gold-light";
const CHIP_OFF = "border-on-dark/15 text-on-dark-muted hover:border-on-dark/35 hover:text-on-dark";
const CHIP_INVALID = "border-[#e07a5f]/70";

function GroupLegend({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <legend className="text-on-dark mb-1.5 text-[13.5px] font-medium">
      {children}
      {required && (
        <>
          <span className="text-gold ml-1" aria-hidden="true">
            *
          </span>
          <span className="sr-only"> (obligatoire)</span>
        </>
      )}
    </legend>
  );
}

function GroupMessages({ name, hint, error }: { name: string; hint?: string; error?: string }) {
  return (
    <>
      {hint && !error && (
        <p id={`${name}-hint`} className="text-on-dark-faint mt-1.5 text-[12.5px]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} role="alert" className="mt-1.5 text-[12.5px] text-[#ffb9a6]">
          {error}
        </p>
      )}
    </>
  );
}

const describedIds = (name: string, hint?: string, error?: string) =>
  error ? `${name}-error` : hint ? `${name}-hint` : undefined;

/** Single choice (radio semantics) as a row of chips. `value` "" = nothing chosen yet. */
export function ChoiceGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  hint,
  error,
  required,
  className,
}: {
  name: string;
  legend: React.ReactNode;
  options: readonly { value: T; label: string }[];
  value: T | "";
  onChange: (v: T) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}) {
  const described = describedIds(name, hint, error);
  return (
    <fieldset className={cn("min-w-0", className)}>
      <GroupLegend required={required}>{legend}</GroupLegend>
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={cn(CHIP, checked ? CHIP_ON : CHIP_OFF, error && !checked && CHIP_INVALID)}
            >
              <input
                type="radio"
                id={`${name}-${i}`}
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                // aria-invalid isn't valid on a radio: the error reaches it through describedby.
                aria-describedby={described}
                className="sr-only"
              />
              {checked && <CheckIcon width={15} height={15} className="-ml-1 shrink-0" />}
              {o.label}
            </label>
          );
        })}
      </div>
      <GroupMessages name={name} hint={hint} error={error} />
    </fieldset>
  );
}

/** Several choices (checkbox semantics) as chips. */
export function ChipGroup({
  name,
  legend,
  options,
  values,
  onToggle,
  hint,
  error,
  required,
  className,
}: {
  name: string;
  legend: React.ReactNode;
  options: readonly { value: string; label: string }[];
  values: readonly string[];
  onToggle: (v: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}) {
  const described = describedIds(name, hint, error);
  return (
    <fieldset className={cn("min-w-0", className)}>
      <GroupLegend required={required}>{legend}</GroupLegend>
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => {
          const checked = values.includes(o.value);
          return (
            <label
              key={o.value}
              className={cn(CHIP, checked ? CHIP_ON : CHIP_OFF, error && CHIP_INVALID)}
            >
              <input
                type="checkbox"
                id={`${name}-${i}`}
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onToggle(o.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={described}
                className="sr-only"
              />
              {checked && <CheckIcon width={15} height={15} className="-ml-1 shrink-0" />}
              {o.label}
            </label>
          );
        })}
      </div>
      <GroupMessages name={name} hint={hint} error={error} />
    </fieldset>
  );
}

export const checkboxCls =
  "mt-0.5 size-5 shrink-0 cursor-pointer accent-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light disabled:cursor-not-allowed";

/** A required agreement (consent to be contacted, communications…). */
export function ConsentCheckbox({
  id,
  checked,
  onChange,
  error,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={cn(
          "text-on-dark flex cursor-pointer items-start gap-3 rounded-[14px] border bg-white/[0.025] px-4 py-3.5 text-[14.5px] leading-relaxed transition hover:bg-white/[0.045]",
          error ? "border-[#e07a5f]/70" : "border-on-dark/15",
        )}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={checkboxCls}
        />
        <span>
          {children}
          <span className="text-gold ml-1" aria-hidden="true">
            *
          </span>
          <span className="sr-only"> (obligatoire)</span>
        </span>
      </label>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[12.5px] text-[#ffb9a6]">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The heading of a "sent" state. It takes focus when it appears, so keyboard and screen
 * reader users land on the confirmation instead of on a form that no longer exists.
 */
export function SuccessHeading({
  children,
  eyebrow,
}: {
  children: React.ReactNode;
  eyebrow: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "center" });
  }, []);
  return (
    <div className="flex items-start gap-4">
      <span
        aria-hidden="true"
        className="relative mt-1 flex size-12 shrink-0 items-center justify-center"
      >
        <Star8 size={48} className="text-gold/20 absolute inset-0" />
        <CheckIcon width={22} height={22} className="text-gold-light relative" />
      </span>
      <div className="min-w-0">
        <p className="eyebrow text-gold">{eyebrow}</p>
        <h2
          ref={ref}
          tabIndex={-1}
          className="font-display text-on-dark mt-1 text-[28px] leading-tight outline-none md:text-[34px]"
        >
          {children}
        </h2>
      </div>
    </div>
  );
}

/** Small print under a form or a confirmation. */
export function FinePrint({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-on-dark-faint text-[12.5px] leading-relaxed", className)}>{children}</p>
  );
}
