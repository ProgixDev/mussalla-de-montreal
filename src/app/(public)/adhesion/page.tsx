import type { Metadata } from "next";
import { CommunityHero, MembershipForm } from "@/features/community";

export const metadata: Metadata = {
  title: "Devenir membre",
  description:
    "Demande d’adhésion à la Mussalla de Montréal : vos coordonnées, vos enfants et les activités souhaitées, en une seule demande validée par le centre.",
  alternates: { canonical: "/adhesion" },
};

const STEPS = ["Vous remplissez la demande", "Le centre la valide", "Vous entrez dans le portail"];

/**
 * « Devenir membre » (spec §4.1, §4.2). `?activite=<id>` — set by the catalogue's
 * « S’inscrire » — pre-checks that activity in the form.
 */
export default async function AdhesionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { activite } = await searchParams;
  const initialActivityId = typeof activite === "string" ? activite : activite?.[0];

  return (
    <div className="bg-night text-on-dark">
      <CommunityHero id="adhesion" eyebrow="Adhésion" title="Devenir membre">
        Une seule demande pour vous et vos enfants. Le centre la vérifie, puis vous accédez au
        portail familial : inscriptions, messages, suivi des enfants.
      </CommunityHero>

      <div className="mx-auto max-w-[860px] px-4 py-12 md:px-8 md:py-16">
        <ol aria-label="Les étapes" className="mb-10 grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className="border-gold/12 text-on-dark flex items-center gap-3 rounded-[14px] border bg-white/[0.03] px-4 py-3 text-[14px]"
            >
              <span
                aria-hidden="true"
                className="nums bg-gold/15 text-gold-light flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
              >
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>

        <MembershipForm initialActivityId={initialActivityId} />
      </div>
    </div>
  );
}
