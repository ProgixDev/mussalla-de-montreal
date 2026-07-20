import Link from "next/link";
import { Girih } from "@/components/ui/girih";
import { Ornament } from "@/components/ui/ornament";
import { ArchCrown } from "@/components/ui/arch";
import { Emblem } from "@/components/ui/emblem";

export const metadata = { title: "Page introuvable" };

/** 404 — in Québec French and inside the house arch, like the rest of the app. */
export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-sand px-6 text-center">
      <Girih id="girih-404" opacity={0.16} color="var(--gold-strong)" />

      <div className="animate-rise relative flex flex-col items-center">
        <Emblem size={46} className="text-emerald" />
        <ArchCrown className="mt-6" width={230} />
        <p className="eyebrow mt-2 text-gold-ink">Erreur 404</p>
        <h1 className="font-display mt-3 max-w-[560px] text-[34px] leading-tight text-ink md:text-[44px]">
          Cette page est introuvable.
        </h1>
        <Ornament className="mt-5 text-gold-deep" width={180} />
        <p className="mt-5 max-w-[440px] text-[16px] leading-relaxed text-muted-ink">
          La page que vous cherchez n’existe pas ou a été déplacée. Revenez à l’accueil pour
          retrouver la caisse.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="sheen inline-flex h-12 items-center gap-2 rounded-[2px] bg-emerald px-6 text-[15px] font-semibold text-on-dark shadow-lift transition hover:bg-emerald-deep active:scale-[0.98]"
          >
            Retour à l’accueil
          </Link>
          <Link
            href="/caisse"
            className="inline-flex h-12 items-center gap-2 rounded-[2px] border border-hairline-strong px-6 text-[15px] font-medium text-ink transition hover:border-gold-deep hover:bg-tint-warm"
          >
            Voir la caisse
          </Link>
        </div>
      </div>
    </main>
  );
}
