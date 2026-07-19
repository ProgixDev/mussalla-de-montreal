import { cn } from "@/lib/utils";
import { formatCAD } from "@/lib/format";

/**
 * The dark-emerald balance card: big "solde de la caisse" with entrées / sorties
 * beneath, gold micro-labels. Shared by the phone board and the TV caisse page.
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
        "rounded-[8px] bg-ink text-on-dark",
        tv ? "p-8" : "p-6",
        className,
      )}
    >
      <p className="eyebrow text-gold">Solde de la caisse</p>
      <p className={cn("font-display nums mt-2 leading-none", tv ? "text-[64px]" : "text-[40px]")}>
        {formatCAD(balanceCents)}
      </p>
      <div className={cn("mt-5 grid grid-cols-2 gap-4", tv && "mt-8")}>
        <div>
          <p className="eyebrow text-gold/80">Entrées (mois)</p>
          <p className={cn("font-display nums mt-1", tv ? "text-3xl" : "text-2xl")}>
            {formatCAD(monthInCents)}
          </p>
        </div>
        <div>
          <p className="eyebrow text-gold/80">Sorties (mois)</p>
          <p className={cn("font-display nums mt-1", tv ? "text-3xl" : "text-2xl")}>
            {formatCAD(monthOutCents)}
          </p>
        </div>
      </div>
    </div>
  );
}
