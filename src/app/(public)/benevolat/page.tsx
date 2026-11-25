import type { Metadata } from "next";
import { CommunityHero, VolunteerForm } from "@/features/community";
import { HandHeartIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Devenir bénévole",
  description:
    "Proposez votre aide à la Mussalla de Montréal : accueil, enseignement, événements, entretien… Dites-nous ce qui vous tente et quand vous êtes disponible.",
  alternates: { canonical: "/benevolat" },
};

/** « Devenir bénévole » (spec §4.7). */
export default function BenevolatPage() {
  return (
    <div className="bg-night text-on-dark">
      <CommunityHero id="benevolat" eyebrow="Bénévolat" title="Devenir bénévole">
        La mussalla vit grâce à celles et ceux qui donnent un peu de leur temps. Dites-nous ce qui
        vous tente et quand vous êtes disponible : la coordination des bénévoles vous recontacte.
      </CommunityHero>

      <div className="mx-auto max-w-[860px] px-4 py-12 md:px-8 md:py-16">
        <p className="border-gold/15 text-on-dark-muted mb-8 flex items-start gap-3 rounded-[14px] border bg-white/[0.03] px-4 py-3.5 text-[14px] leading-relaxed">
          <HandHeartIcon width={20} height={20} className="text-gold mt-0.5 shrink-0" />
          <span>
            Pas d’engagement minimum : une heure par mois compte. En service, ce formulaire sera
            accessible après connexion au portail, pour que vos disponibilités restent à jour.
          </span>
        </p>
        <VolunteerForm />
      </div>
    </div>
  );
}
