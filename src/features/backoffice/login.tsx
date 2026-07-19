"use client";

import { Emblem } from "@/components/ui/emblem";
import { useBackoffice } from "./provider";

/**
 * The gate. Prototype behavior: any non-empty email + password signs in. In the
 * backend phase this form posts to a Supabase Auth server action; the shell and
 * write APIs sit behind that session.
 */
export function Login() {
  const email = useBackoffice((s) => s.email);
  const pass = useBackoffice((s) => s.pass);
  const err = useBackoffice((s) => s.err);
  const setField = useBackoffice((s) => s.setField);
  const login = useBackoffice((s) => s.login);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-sand px-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          login();
        }}
        className="w-full max-w-[380px] rounded-[8px] border border-hairline bg-cream p-8 shadow-frame"
      >
        <div className="flex flex-col items-center text-center">
          <Emblem size={48} className="text-emerald" />
          <h1 className="font-display mt-4 text-[28px] text-ink">Backoffice</h1>
          <p className="mt-1 text-[14px] text-muted-ink">Mussalla de Montréal · La caisse</p>
        </div>

        <div className="mt-7 space-y-4">
          <label className="block">
            <span className="eyebrow text-muted-ink">Courriel</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setField({ email: e.target.value })}
              placeholder="gestionnaire@mussalla-mtl.ca"
              className="mt-1.5 w-full rounded-[2px] border border-hairline-strong bg-white px-3 py-2.5 text-[15px] text-ink outline-none focus:border-emerald-focus"
            />
          </label>
          <label className="block">
            <span className="eyebrow text-muted-ink">Mot de passe</span>
            <input
              type="password"
              value={pass}
              onChange={(e) => setField({ pass: e.target.value })}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-[2px] border border-hairline-strong bg-white px-3 py-2.5 text-[15px] text-ink outline-none focus:border-emerald-focus"
            />
          </label>
          {err && <p className="text-[13px] text-error">{err}</p>}
          <button
            type="submit"
            className="h-11 w-full rounded-[2px] bg-emerald text-[15px] font-semibold text-on-dark transition active:scale-[0.98] hover:bg-emerald-deep"
          >
            Se connecter
          </button>
        </div>
      </form>
    </main>
  );
}
