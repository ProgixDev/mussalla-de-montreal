"use client";

import { usePortal } from "@/lib/portal/store";
import { isOnScreen, totalPoints } from "@/core/portal/derive";
import { Ornament } from "@/components/ui/ornament";
import { Star8 } from "@/components/ui/star";
import { EmptyNote, StarAvatar } from "@/components/portal/kit";
import { ChildHomework, ChildProgress } from "./parent";
import type { SpaceProps } from "../shared";

/**
 * The child's own space (role `child`, spec §3): read-only — encouragements, badges,
 * homework. A child can never change a score, a point, a consent or family data.
 */
export function ChildSpace({ me }: SpaceProps) {
  const child = usePortal((s) => s.children.find((c) => c.id === me.id));
  const points = usePortal((s) => s.points);
  const congrats = usePortal((s) => s.congratulations);

  if (!child) return <EmptyNote>Profil introuvable.</EmptyNote>;

  const total = totalPoints(points, child.id);
  const now = new Date().toISOString();
  const bravo = congrats.find((c) => c.childId === child.id && isOnScreen(c, now));

  return (
    <>
      <section className="border-gold/20 relative mb-8 overflow-hidden rounded-[24px] border bg-[radial-gradient(80%_120%_at_20%_0%,rgba(217,189,119,0.18),transparent_60%)] px-6 py-8 md:px-10">
        <div className="flex flex-wrap items-center gap-6">
          <StarAvatar name={child.firstName} seed={child.avatar} size={96} />
          <div>
            <p className="eyebrow text-gold">Mon espace</p>
            <h1 className="font-display text-on-dark mt-2 text-[38px] leading-none md:text-[48px]">
              Salam {child.firstName} !
            </h1>
            <p className="text-on-dark-muted mt-3 text-[16px]">
              Tu as <span className="nums font-display text-gold-light text-[22px]">{total}</span>{" "}
              points. Continue comme ça !
            </p>
          </div>
        </div>
        {bravo && (
          <div className="border-gold/40 bg-gold/10 mt-7 flex items-center gap-4 rounded-[18px] border px-5 py-4">
            <Star8 size={30} className="animate-twinkle text-gold-light shrink-0" />
            <div>
              <p className="font-display text-gold-light text-[22px]">{bravo.title}</p>
              <p className="text-on-dark text-[14.5px]">{bravo.message}</p>
              <p className="text-on-dark-muted mt-0.5 text-[12.5px]">
                Ton bravo passe sur les écrans du centre !
              </p>
            </div>
          </div>
        )}
      </section>

      <ChildProgress child={child} forChild />

      <div className="mt-10">
        <h2 className="font-display text-on-dark text-[26px]">Mes devoirs</h2>
        <Ornament className="text-gold mt-3 mb-5" width={150} />
        <ChildHomework child={child} />
      </div>
    </>
  );
}
