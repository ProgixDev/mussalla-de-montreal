import { cn } from "@/lib/utils";
import { formatCAD } from "@/lib/format";
import { Girih } from "@/components/ui/girih";
import { Star8 } from "@/components/ui/star";

/**
 * The night balance card: big "solde de la caisse" with the month's entrées / sorties
 * beneath. Lit like the hero — a faint khatam lattice and a lamp-glow in the corner —
 * so the first thing a donor sees after scanning the QR belongs to the same place as
 * the home page. Shared by the phone board and the TV caisse page.
 */
export function BalanceCard({
  balanceCents,
  monthInCents,
  monthOutCents,
  size = "phone",
  className,
}: {
  balanceCents: number;
  monthInCents: number;
  monthOutCents: number;
  size?: "phone" | "tv";
  className?: string;
}) {
  const tv = size === "tv";
  return (
    <div
      className={cn(
        "border-gold/20 bg-night text-on-dark relative isolate overflow-hidden rounded-[12px] border",
        tv ? "p-8" : "p-6",
        className,
      )}
    >
      <Girih id={`girih-balance-${size}`} opacity={0.09} color="var(--gold)" className="-z-10" />
      <div
        aria-hidden="true"
        className="animate-glow absolute -top-20 -right-16 -z-10 size-56 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(236,217,160,0.28), transparent)" }}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow text-gold">Solde de la caisse</p>
        <Star8 size={tv ? 16 : 13} className="text-gold/70" />
      </div>
      <p className={cn("font-display nums mt-2 leading-none", tv ? "text-[64px]" : "text-[44px]")}>
        {formatCAD(balanceCents)}
      </p>
      <dl
        className={cn(
          "border-gold/15 mt-5 grid grid-cols-2 gap-4 border-t pt-4",
          tv && "mt-8 pt-6",
        )}
      >
        <div>
          <dt className="eyebrow text-gold/80">Entrées (mois)</dt>
          <dd
            className={cn("font-display nums text-gold-light mt-1", tv ? "text-3xl" : "text-2xl")}
          >
            + {formatCAD(monthInCents)}
          </dd>
        </div>
        <div>
          <dt className="eyebrow text-gold/80">Sorties (mois)</dt>
          <dd className={cn("font-display nums mt-1", tv ? "text-3xl" : "text-2xl")}>
            − {formatCAD(monthOutCents)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
