import type { Metadata } from "next";
import { CommunityHero, ImamQuestionForm } from "@/features/community";
import { LockIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Poser une question à l’Imam",
  description:
    "Posez votre question à l’imam de la Mussalla de Montréal, en toute confidentialité : elle n’est jamais publiée et vous recevez une réponse privée.",
  alternates: { canonical: "/imam" },
};

const PRIVACY = [
  "Vous, qui l’avez posée.",
  "Les administrateurs habilités, qui la confient à l’imam.",
  "L’imam à qui elle est attribuée.",
];

/** « Poser une question à l’Imam » (spec §4.9, §6.7). */
export default function ImamPage() {
  return (
    <div className="bg-night text-on-dark">
      <CommunityHero
        id="imam"
        eyebrow="Question privée"
        title="Poser une question à l’Imam"
        arabic={{
          text: "فَاسْأَلُوا أَهْلَ الذِّكْرِ",
          gloss: "« Interrogez donc les gens du savoir » — sourate An-Nahl, verset 43",
        }}
      >
        Une question sur la prière, la famille, le jeûne ou la vie de tous les jours ? Posez-la
        simplement : l’imam vous répond en privé.
      </CommunityHero>

      <div className="mx-auto max-w-[860px] px-4 py-12 md:px-8 md:py-16">
        <section
          aria-labelledby="confidentialite"
          className="border-gold/30 bg-gold/[0.06] mb-10 rounded-[18px] border p-5 md:p-6"
        >
          <div className="flex items-center gap-3">
            <LockIcon width={20} height={20} className="text-gold shrink-0" />
            <h2 id="confidentialite" className="font-display text-[22px] leading-tight">
              Votre question reste privée
            </h2>
          </div>
          <p className="text-on-dark mt-3 text-[15px] leading-relaxed">
            Elle n’est <strong className="text-gold-light font-semibold">jamais publiée</strong> —
            ni sur ce site, ni sur les écrans du centre, ni dans aucune liste. Seuls peuvent la lire
            :
          </p>
          <ul className="text-on-dark-muted mt-3 space-y-1.5 text-[14.5px]">
            {PRIVACY.map((p) => (
              <li key={p} className="flex gap-2.5">
                <span aria-hidden="true" className="text-gold">
                  ·
                </span>
                {p}
              </li>
            ))}
          </ul>
          <p className="text-on-dark-faint mt-3 text-[13.5px]">
            Chaque consultation, attribution et réponse est inscrite au journal du centre.
          </p>
        </section>

        <ImamQuestionForm />
      </div>
    </div>
  );
}
