"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary — catches errors in the root layout itself, so it renders its own
 * <html>/<body> and can't rely on the layout's CSS or fonts: inline styles only, in the
 * site's night palette and in French. Wire the error tracker's capture here.
 */
export default function GlobalError({
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
    <html lang="fr-CA">
      <body
        style={{
          margin: 0,
          background: "#0a1c15",
          color: "#f4eddd",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 32, fontWeight: 600, margin: 0 }}>
            Le site a rencontré un problème.
          </h1>
          <p style={{ maxWidth: 440, color: "#cabfa6", lineHeight: 1.6, margin: 0 }}>
            Réessayez dans un instant. Si le problème revient, revenez plus tard.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 8,
              height: 48,
              padding: "0 28px",
              borderRadius: 999,
              border: 0,
              background: "#d9bd77",
              color: "#0e231b",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
