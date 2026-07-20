"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Emblem } from "@/components/ui/emblem";
import { Ornament } from "@/components/ui/ornament";
import { ArchCrown } from "@/components/ui/arch";
import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/redirect";
import { CredentialsSchema } from "../schema";

/**
 * Minimal functional auth form (sign in / sign up). Intentionally plain — visual
 * design lands in the design phase. The browser Supabase client sets the auth
 * cookies; the middleware keeps the session fresh and guards protected routes.
 */
export function SignInForm() {
  const router = useRouter();
  const next = safeRedirectPath(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = CredentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Identifiants invalides");
      return;
    }
    setError(null);
    setPending(true);
    const supabase = createClient();
    const { error: authError } =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword(parsed.data)
        : await supabase.auth.signUp(parsed.data);
    setPending(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="animate-rise flex w-full max-w-sm flex-col gap-4 rounded-[10px] border border-hairline bg-cream p-8 shadow-frame"
    >
      <div className="flex flex-col items-center text-center">
        <Emblem size={44} className="text-emerald" />
        <ArchCrown className="mt-5" width={190} />
        <h1 className="font-display mt-2 text-[26px] leading-tight text-ink">
          {mode === "sign-in" ? "Content de vous revoir" : "Créer un compte"}
        </h1>
        <p className="mt-1 text-[13px] text-muted-ink">Mussalla de Montréal · La caisse</p>
        <Ornament className="mt-4 text-gold-deep" width={150} />
      </div>

      <label className="mt-2 block">
        <span className="eyebrow text-muted-ink">Courriel</span>
        <Input
          type="email"
          placeholder="vous@exemple.ca"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Courriel"
          className="mt-1.5"
        />
      </label>
      <label className="block">
        <span className="eyebrow text-muted-ink">Mot de passe</span>
        <Input
          type="password"
          placeholder="••••••••"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label="Mot de passe"
          className="mt-1.5"
        />
      </label>
      {error ? (
        <p role="alert" className="text-[13px] text-error">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} size="lg" className="mt-1 h-11 rounded-[2px]">
        {pending ? "Un instant…" : mode === "sign-in" ? "Se connecter" : "Créer le compte"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
      >
        {mode === "sign-in" ? "Pas encore de compte ? En créer un" : "Déjà un compte ? Se connecter"}
      </Button>
    </form>
  );
}
