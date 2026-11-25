import Link from "next/link";
import { Girih } from "@/components/ui/girih";
import { Ornament } from "@/components/ui/ornament";
import { ArchCrown } from "@/components/ui/arch";
import { Emblem } from "@/components/ui/emblem";

export const metadata = { title: "Page introuvable" };

/** 404 — in Québec French, at night under the house arch, like the rest of the site. */
export default function NotFound() {
  return (
    <main className="bg-night text-on-dark relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <Girih id="girih-404" opacity={0.07} color="var(--gold)" className="-z-10" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 40%, rgba(217,189,119,0.14), transparent 70%)",
        }}
      />
      <div aria-hidden="true" className="grain pointer-events-none absolute inset-0 -z-10" />

      <div className="animate-rise relative flex flex-col items-center">
        <Emblem size={46} className="text-gold" />
        <ArchCrown className="mt-6" width={230} tone="text-gold" />
        <p className="eyebrow text-gold mt-2">Erreur 404</p>
        <h1 className="font-display text-on-dark mt-3 max-w-[560px] text-[34px] leading-tight md:text-[48px]">
          Cette page est introuvable.
        </h1>
        <Ornament className="text-gold mt-5" width={180} />
        <p className="text-on-dark-muted mt-5 max-w-[440px] text-[16px] leading-relaxed">
          La page que vous cherchez n’existe pas ou a été déplacée. Revenez à l’accueil pour
          retrouver la caisse.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="sheen bg-gold text-ink shadow-lamp hover:bg-gold-light inline-flex h-12 items-center gap-2 rounded-full px-7 text-[15px] font-semibold transition active:scale-[0.98]"
          >
            Retour à l’accueil
          </Link>
          <Link
            href="/caisse"
            className="border-on-dark/30 text-on-dark hover:border-gold/70 inline-flex h-12 items-center gap-2 rounded-full border px-7 text-[15px] font-medium transition"
          >
            Voir la caisse
          </Link>
        </div>
      </div>
    </main>
  );
}
