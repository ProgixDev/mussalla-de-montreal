"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Error boundary for every page under the root layout — keeps the site's fonts and
 * night palette, speaks French, and always offers a way forward (retry or home).
 * Wire the error tracker's capture here when one is chosen.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="bg-night text-on-dark flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow text-gold">Oups</p>
      <h1 className="font-display mt-3 max-w-[520px] text-[32px] leading-tight md:text-[44px]">
        Cette page a rencontré un problème.
      </h1>
      <p className="text-on-dark-muted mt-4 max-w-[440px] text-[16px] leading-relaxed">
        Rien n’est perdu. Réessayez dans un instant ; si le problème revient, retournez à l’accueil.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-gold text-ink hover:bg-gold-light inline-flex h-12 items-center rounded-full px-7 text-[15px] font-semibold transition"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="border-on-dark/30 text-on-dark hover:border-gold/70 inline-flex h-12 items-center rounded-full border px-7 text-[15px] font-medium transition"
        >
          Retour à l’accueil
        </Link>
      </div>
      {error.digest && (
        <p className="text-on-dark-faint mt-6 text-[12px]">Référence : {error.digest}</p>
      )}
    </main>
  );
}
