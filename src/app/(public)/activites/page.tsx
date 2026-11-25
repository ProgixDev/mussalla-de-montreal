import Link from "next/link";
import type { Metadata } from "next";
import { ActivityCatalogue, CommunityHero } from "@/features/community";
import { btn } from "@/components/portal/kit";
import { ArrowRightIcon, LockIcon, UsersIcon } from "@/components/ui/icons";
import { Star8 } from "@/components/ui/star";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Nos activités",
  description:
    "Cours de Coran et d’arabe, cercles, dars, sport : les activités de la Mussalla de Montréal pour les femmes, les hommes, les enfants et tous publics — horaires, âges, tarifs et places.",
  alternates: { canonical: "/activites" },
};

const RULES = [
  {
    title: "Femmes, hommes : des activités réservées",
    text: "Les activités des femmes sont réservées aux femmes, celles des hommes aux hommes. C’est le genre déclaré lors de l’adhésion qui détermine l’accès.",
  },
  {
    title: "Un âge pour chaque groupe",
    text: "Chaque activité indique son âge. Pour un enfant, il est calculé à partir de sa date de naissance au moment de l’inscription.",
  },
  {
    title: "Adhésion et places",
    text: "Certaines activités demandent une adhésion active. Quand une activité est complète, l’inscription passe sur la liste d’attente.",
  },
];

/** « Nos activités » — the public catalogue (spec §4.1). */
export default function ActivitesPage() {
  return (
    <div className="bg-night text-on-dark">
      <CommunityHero id="activites" eyebrow="Le centre" title="Nos activités">
        Apprendre le Coran et l’arabe, se retrouver entre sœurs ou entre frères, faire du sport,
        écouter un rappel : une place pour chacun, à chaque âge.
      </CommunityHero>

      <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
        <section
          aria-labelledby="regles-acces"
          className="border-gold/20 bg-gold/[0.05] rounded-[18px] border p-5 md:p-6"
        >
          <div className="flex items-center gap-3">
            <LockIcon width={18} height={18} className="text-gold shrink-0" />
            <h2 id="regles-acces" className="font-display text-[22px] leading-tight">
              Règles d’accès
            </h2>
          </div>
          <ul className="mt-4 grid gap-4 md:grid-cols-3 md:gap-6">
            {RULES.map((r) => (
              <li key={r.title} className="flex gap-3">
                <Star8 size={11} className="text-gold mt-1.5" />
                <div>
                  <p className="text-on-dark text-[15px] font-medium">{r.title}</p>
                  <p className="text-on-dark-muted mt-1 text-[14px] leading-relaxed">{r.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-on-dark-faint mt-4 text-[13px]">
            Ces règles sont vérifiées par le centre au moment de valider chaque demande.
          </p>
        </section>

        <section aria-labelledby="catalogue" className="mt-12">
          <h2 id="catalogue" className="font-display text-[28px] leading-tight md:text-[34px]">
            Le catalogue
          </h2>
          <div className="mt-5">
            <ActivityCatalogue />
          </div>
        </section>

        <aside className="border-gold/15 mt-14 flex flex-col items-start gap-4 rounded-[18px] border bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-start gap-3">
            <UsersIcon width={22} height={22} className="text-gold mt-0.5 shrink-0" />
            <div>
              <p className="font-display text-[20px] leading-tight">Pas encore membre ?</p>
              <p className="text-on-dark-muted mt-1 text-[14.5px]">
                Une seule demande pour vous et vos enfants — les inscriptions suivent.
              </p>
            </div>
          </div>
          <Link href="/adhesion" className={cn(btn("gold"), "shrink-0")}>
            Devenir membre
            <ArrowRightIcon width={16} height={16} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
