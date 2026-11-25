"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePortal } from "@/lib/portal/store";
import { usePortalReady } from "@/lib/portal/hydrator";
import { Emblem } from "@/components/ui/emblem";
import { Girih } from "@/components/ui/girih";
import { Ornament } from "@/components/ui/ornament";
import { Star8 } from "@/components/ui/star";
import { ArrowLeftIcon, LogOutIcon } from "@/components/ui/icons";
import { Pill, StarAvatar, btn } from "@/components/portal/kit";
import type { Person } from "@/core/portal/types";
import { PROFILE_LABELS, ROLE_LABELS } from "./shared";
import { ParentSpace } from "./spaces/parent";
import { ChildSpace } from "./spaces/child";
import { TeacherSpace } from "./spaces/teacher";
import { AdminSpace } from "./spaces/admin";
import { FinanceSpace } from "./spaces/finance";
import { GovernanceSpace } from "./spaces/governance";
import { ImamSpace } from "./spaces/imam";
import { ActivitiesSpace } from "./spaces/activities";

/**
 * Portail du centre — one sign-in, one space per role (spec §3). In this prototype the
 * sign-in is a persona picker; with the backend it becomes Supabase Auth and the space is
 * chosen from the user's role + cumulative profiles, every permission re-checked
 * server-side.
 */
const SPACES = {
  parent: ParentSpace,
  enfant: ChildSpace,
  enseignant: TeacherSpace,
  admin: AdminSpace,
  comptable: FinanceSpace,
  secretariat: GovernanceSpace,
  imam: ImamSpace,
  activites: ActivitiesSpace,
} as const;

export function Portal() {
  const ready = usePortalReady();
  const personaId = usePortal((s) => s.personaId);

  if (!ready) {
    return (
      <div
        className="bg-night text-on-dark-muted flex min-h-dvh items-center justify-center"
        aria-busy="true"
      >
        <Star8 size={28} className="animate-spinslow text-gold/70" />
        <span className="sr-only">Chargement du portail…</span>
      </div>
    );
  }
  return personaId ? <PortalShell personaId={personaId} /> : <PersonaPicker />;
}

function PersonaPicker() {
  const personas = usePortal((s) => s.personas);
  const signIn = usePortal((s) => s.signIn);
  return (
    <main className="bg-night text-on-dark relative isolate min-h-dvh overflow-hidden px-5 py-14 md:py-20">
      <Girih id="girih-portail" opacity={0.06} color="var(--gold)" className="-z-10" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background: "radial-gradient(60% 50% at 50% 0%, rgba(217,189,119,0.14), transparent 70%)",
        }}
      />
      <div className="mx-auto max-w-[1080px]">
        <Link
          href="/"
          className="text-on-dark-muted hover:text-on-dark inline-flex items-center gap-2 text-[14px]"
        >
          <ArrowLeftIcon width={16} height={16} /> Retour au site
        </Link>
        <div className="mt-8 text-center">
          <Emblem size={52} className="text-gold mx-auto" />
          <h1 className="font-display mt-5 text-[36px] leading-tight md:text-[52px]">
            Portail du centre
          </h1>
          <Ornament className="text-gold mx-auto mt-5" width={180} />
          <p className="text-on-dark-muted mx-auto mt-5 max-w-[560px] text-[16px] leading-relaxed">
            Chaque personne n’entre que dans son espace. Pour la démonstration, choisissez un profil
            — la vraie connexion (courriel et mot de passe) remplacera ce choix.
          </p>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {personas.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => signIn(p.id)}
                className="group border-gold/15 hover:border-gold/55 focus-visible:outline-gold-light flex h-full w-full flex-col rounded-[18px] border bg-white/[0.035] p-5 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.06] focus-visible:outline-2"
              >
                <StarAvatar name={p.label} seed={i} size={46} />
                <span className="font-display text-on-dark mt-4 text-[21px] leading-tight">
                  {p.label}
                </span>
                <span className="text-on-dark-muted mt-1.5 text-[14px] leading-relaxed">
                  {p.description}
                </span>
                <span className="text-gold-light mt-auto pt-4 text-[13px] font-medium opacity-80 group-hover:opacity-100">
                  Entrer →
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="text-on-dark-faint mt-10 text-center text-[13px]">
          Prototype de démonstration : les données sont fictives et restent dans ce navigateur.
        </p>
      </div>
    </main>
  );
}

function PortalShell({ personaId }: { personaId: string }) {
  const personas = usePortal((s) => s.personas);
  const persons = usePortal((s) => s.persons);
  const children = usePortal((s) => s.children);
  const signOut = usePortal((s) => s.signOut);
  const resetDemo = usePortal((s) => s.resetDemo);
  const persona = personas.find((p) => p.id === personaId) ?? personas[0]!;

  // The child persona signs in as a child profile; give it a Person shape for the shell.
  const me: Person = useMemo(() => {
    const person = persons.find((p) => p.id === persona.personId);
    if (person) return person;
    const child = children.find((c) => c.id === persona.personId);
    return {
      id: child?.id ?? persona.personId,
      firstName: child?.firstName ?? "Enfant",
      lastName: child?.lastName ?? "",
      gender: child?.gender ?? "femme",
      role: "child",
      profiles: [],
      membership: "active",
      email: "",
      phone: "",
    };
  }, [persons, children, persona.personId]);

  const Space = SPACES[persona.id as keyof typeof SPACES] ?? ParentSpace;

  return (
    <div className="bg-night text-on-dark relative isolate min-h-dvh">
      <Girih id="girih-portail-shell" opacity={0.045} color="var(--gold)" className="-z-10" />
      <header className="border-gold/10 bg-night/85 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-5 py-3 md:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Retour au site">
            <Emblem size={34} className="text-gold" />
            <span className="hidden leading-tight sm:block">
              <span className="font-display block text-[16px]">Portail du centre</span>
              <span className="eyebrow text-on-dark-faint block">Mussalla de Montréal</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <div className="hidden items-center gap-2 md:flex">
              <Pill tone="gold">{ROLE_LABELS[me.role]}</Pill>
              {me.profiles.map((pr) => (
                <Pill key={pr}>{PROFILE_LABELS[pr]}</Pill>
              ))}
            </div>
            <span className="text-on-dark hidden text-[14px] sm:inline">{me.firstName}</span>
            <button type="button" onClick={signOut} className={btn("subtle", "sm")}>
              <LogOutIcon width={15} height={15} />
              <span>Changer d’espace</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 pt-8 pb-20 md:px-8">
        <Space me={me} />
      </main>

      <footer className="border-gold/10 border-t">
        <div className="text-on-dark-faint mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-5 py-5 text-[12.5px] md:px-8">
          <p>
            Prototype — données fictives conservées dans ce navigateur. Chaque action correspond à
            une procédure serveur du cahier des charges.
          </p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Remettre toutes les données de démonstration à zéro ?"))
                resetDemo();
            }}
            className="hover:text-on-dark underline-offset-4 hover:underline"
          >
            Réinitialiser la démo
          </button>
        </div>
      </footer>
    </div>
  );
}
