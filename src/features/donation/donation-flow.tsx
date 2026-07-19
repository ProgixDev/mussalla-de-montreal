"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { ArrowLeftIcon, CheckIcon } from "@/components/ui/icons";
import { formatCAD } from "@/lib/format";
import { useDonationStore } from "./provider";
import { effectiveCents, type Frequency } from "./store";

const PRESETS = [2_500, 5_000, 10_000, 25_000]; // 25 / 50 / 100 / 250 $
const STEP_TITLES = ["Montant", "Destination", "Affichage", "Paiement"];

export function DonationFlow({ goals }: { goals: { id: string; title: string }[] }) {
  const router = useRouter();
  const s = useDonationStore((st) => st);
  const destList = [
    { id: "general", label: "Caisse générale (fonctionnement)" },
    ...goals.map((g) => ({ id: g.id, label: g.title })),
  ];
  const amountCents = effectiveCents(s);
  const destLabel = destList.find((d) => d.id === s.dest)?.label ?? "";
  const freqLabel = s.freq === "monthly" ? "Chaque mois" : "Une fois";
  const isReceipt = s.step === 4;

  const onBack = () => (s.step === 0 ? router.push("/") : s.back());
  const onPrimary = () => {
    if (isReceipt) {
      s.reset();
      router.push("/");
    } else {
      s.next();
    }
  };
  const primaryLabel = isReceipt
    ? "Terminé"
    : s.step === 3
      ? `Confirmer le don · ${formatCAD(amountCents)}`
      : "Continuer";

  return (
    <div className="flex min-h-dvh flex-col bg-sand">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-4 py-8 md:py-12">
        <div className="flex w-full max-w-[480px] flex-col overflow-hidden rounded-[16px] border border-hairline bg-cream shadow-frame">
        {/* Header */}
        <header className="border-b border-hairline px-6 py-4">
          {!isReceipt ? (
            <>
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  aria-label="Retour"
                  className="text-muted-ink transition hover:text-ink"
                >
                  <ArrowLeftIcon width={22} height={22} />
                </button>
                <span className="eyebrow text-faint">Étape {s.step + 1} sur 4</span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {STEP_TITLES.map((t, i) => (
                  <span
                    key={t}
                    className={cn(
                      "h-1.5 rounded-full transition-colors",
                      i <= s.step ? "bg-emerald" : "bg-hairline-strong",
                    )}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="font-display text-lg text-ink">Mussalla de Montréal</span>
            </div>
          )}
        </header>

        {/* Body */}
        <div key={s.step} className="space-y-5 px-6 py-6 animate-tvfade">
          {s.step === 0 && <MontantStep />}
          {s.step === 1 && <DestinationStep destList={destList} />}
          {s.step === 2 && <AffichageStep />}
          {s.step === 3 && (
            <PaiementStep amountLabel={formatCAD(amountCents)} destLabel={destLabel} />
          )}
          {isReceipt && (
            <RecuStep
              amountLabel={formatCAD(amountCents)}
              destLabel={destLabel}
              freqLabel={freqLabel}
            />
          )}
        </div>

        {/* Footer CTA */}
        <div className="border-t border-hairline bg-cream p-5">
          <button
            onClick={onPrimary}
            className="flex h-12 w-full items-center justify-center rounded-[2px] bg-emerald text-[16px] font-semibold text-on-dark transition active:scale-[0.98] hover:bg-emerald-deep"
          >
            {primaryLabel}
          </button>
        </div>
        </div>
      </main>
    </div>
  );
}

/* ---------- shared bits ---------- */

function StepLabel({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow text-muted-ink">{children}</p>;
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-[2px] border border-hairline-strong">
      {options.map((o, i) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "py-2.5 text-[14px] font-medium transition-colors",
            i > 0 && "border-l border-hairline-strong",
            value === o.value ? "bg-emerald text-on-dark" : "bg-white text-body hover:bg-tint",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<"input">) {
  return (
    <label className="block">
      <span className="eyebrow text-muted-ink">{label}</span>
      <input
        {...props}
        className="mt-1.5 w-full rounded-[2px] border border-hairline-strong bg-white px-3 py-2.5 text-[16px] text-ink outline-none focus:border-emerald-focus"
      />
    </label>
  );
}

/* ---------- steps ---------- */

function MontantStep() {
  const presetCents = useDonationStore((s) => s.presetCents);
  const custom = useDonationStore((s) => s.custom);
  const setPreset = useDonationStore((s) => s.setPreset);
  const setCustom = useDonationStore((s) => s.setCustom);
  return (
    <div className="space-y-5">
      <StepLabel>Montant</StepLabel>
      <div className="grid grid-cols-2 gap-3">
        {PRESETS.map((cents) => {
          const active = !custom.trim() && presetCents === cents;
          return (
            <button
              key={cents}
              onClick={() => setPreset(cents)}
              className={cn(
                "rounded-[2px] border py-4 text-[18px] font-semibold transition",
                active
                  ? "border-emerald bg-tint text-emerald"
                  : "border-hairline-strong bg-white text-ink hover:border-emerald/50",
              )}
            >
              {formatCAD(cents)}
            </button>
          );
        })}
      </div>
      <Field
        label="Montant personnalisé"
        inputMode="decimal"
        placeholder="Ex. 75"
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
      />
    </div>
  );
}

function DestinationStep({ destList }: { destList: { id: string; label: string }[] }) {
  const dest = useDonationStore((s) => s.dest);
  const setDest = useDonationStore((s) => s.setDest);
  return (
    <div className="space-y-3">
      <StepLabel>Destination</StepLabel>
      <div className="space-y-2.5">
        {destList.map((d) => {
          const active = dest === d.id;
          return (
            <button
              key={d.id}
              onClick={() => setDest(d.id)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-[4px] border px-4 py-3.5 text-left text-[15px] transition",
                active
                  ? "border-emerald bg-tint text-ink"
                  : "border-hairline bg-white text-body hover:border-emerald/40",
              )}
            >
              <span>{d.label}</span>
              {active && <CheckIcon width={18} height={18} className="shrink-0 text-emerald" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AffichageStep() {
  const anon = useDonationStore((s) => s.anon);
  const name = useDonationStore((s) => s.name);
  const setAnon = useDonationStore((s) => s.setAnon);
  const setName = useDonationStore((s) => s.setName);
  return (
    <div className="space-y-4">
      <StepLabel>Affichage</StepLabel>
      <Segmented
        options={[
          { value: "named", label: "Afficher mon nom" },
          { value: "anon", label: "Rester anonyme" },
        ]}
        value={anon ? "anon" : "named"}
        onChange={(v) => setAnon(v === "anon")}
      />
      {anon ? (
        <p className="rounded-[4px] border border-hairline bg-white p-4 text-[14px] leading-relaxed text-muted-ink">
          Votre don restera anonyme à l’écran et sur les téléphones — mais il compte dans le total et
          vers les objectifs, comme les autres. Les gestionnaires en gardent la trace pour la
          comptabilité.
        </p>
      ) : (
        <Field
          label="Nom affiché"
          placeholder="Ex. Yassine B."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-[14px]">
      <span className="text-muted-ink">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}

function PaiementStep({ amountLabel, destLabel }: { amountLabel: string; destLabel: string }) {
  const freq = useDonationStore((s) => s.freq);
  const anon = useDonationStore((s) => s.anon);
  const name = useDonationStore((s) => s.name);
  const card = useDonationStore((s) => s.card);
  const setFreq = useDonationStore((s) => s.setFreq);
  const setCard = useDonationStore((s) => s.setCard);
  return (
    <div className="space-y-5">
      <div className="divide-y divide-row-divider rounded-[4px] border border-hairline bg-white px-4 py-1">
        <SummaryRow label="Montant" value={amountLabel} />
        <SummaryRow label="Destination" value={destLabel} />
        <SummaryRow label="Affichage" value={anon ? "Anonyme" : name || "Nom affiché"} />
      </div>

      <div>
        <StepLabel>Fréquence</StepLabel>
        <div className="mt-1.5">
          <Segmented
            options={[
              { value: "once", label: "Une fois" },
              { value: "monthly", label: "Chaque mois" },
            ]}
            value={freq}
            onChange={(v) => setFreq(v as Frequency)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Field
          label="Numéro de carte"
          inputMode="numeric"
          placeholder="1234 5678 9012 3456"
          value={card.num}
          onChange={(e) => setCard({ num: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="MM AA"
            placeholder="08 / 28"
            value={card.exp}
            onChange={(e) => setCard({ exp: e.target.value })}
          />
          <Field
            label="CVC"
            inputMode="numeric"
            placeholder="123"
            value={card.cvc}
            onChange={(e) => setCard({ cvc: e.target.value })}
          />
        </div>
      </div>

      {/* Square Web Payments SDK mounts here in production; this is a visual placeholder. */}
      <p className="flex items-center justify-center gap-2 text-[13px] text-muted-ink">
        <span className="inline-block size-2 rounded-full bg-emerald" />
        Paiement sécurisé par <span className="font-semibold text-emerald">Square</span>
      </p>
    </div>
  );
}

function RecuStep({
  amountLabel,
  destLabel,
  freqLabel,
}: {
  amountLabel: string;
  destLabel: string;
  freqLabel: string;
}) {
  const anon = useDonationStore((s) => s.anon);
  const name = useDonationStore((s) => s.name);
  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-tint text-emerald">
        <CheckIcon width={34} height={34} />
      </span>
      <h1 className="font-display mt-4 max-w-[280px] text-[26px] leading-tight text-ink">
        Merci · Qu’Allah vous récompense
      </h1>
      <p className="mt-2 text-[15px] text-muted-ink">Votre don a bien été reçu.</p>

      <div className="mt-6 w-full divide-y divide-row-divider rounded-[4px] border border-hairline bg-white px-4 py-1 text-left">
        <SummaryRow label="Montant" value={amountLabel} />
        <SummaryRow label="Destination" value={destLabel} />
        <SummaryRow label="Fréquence" value={freqLabel} />
        <SummaryRow label="Au nom de" value={anon ? "Anonyme" : name || "—"} />
      </div>

      <p className="mt-5 text-[13px] text-faint">Un reçu vous a été envoyé par courriel.</p>
    </div>
  );
}
