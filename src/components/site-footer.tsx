import Link from "next/link";
import { Emblem } from "@/components/ui/emblem";

/** Site-wide footer for the public pages. Night-emerald, gold accents. */
export function SiteFooter() {
  const cols: { id: string; title: string; links: { label: string; href: string }[] }[] = [
    {
      id: "pied-centre",
      title: "Le centre",
      links: [
        { label: "Activités", href: "/activites" },
        { label: "Événements", href: "/evenements" },
        { label: "Devenir membre", href: "/adhesion" },
        { label: "Bénévolat", href: "/benevolat" },
        { label: "Poser une question à l’Imam", href: "/imam" },
      ],
    },
    {
      id: "pied-caisse",
      title: "La caisse",
      links: [
        { label: "La caisse en direct", href: "/caisse" },
        { label: "Apprendre", href: "/apprendre" },
      ],
    },
    {
      id: "pied-espaces",
      title: "Espaces",
      links: [
        { label: "Portail", href: "/portail" },
        { label: "Écran TV", href: "/tv" },
        { label: "Backoffice", href: "/admin" },
      ],
    },
  ];

  return (
    <footer className="border-hairline-dark bg-night text-on-dark border-t">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-6 gap-y-10 px-6 py-14 md:px-8 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
        <div className="col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <Emblem size={40} className="text-gold" />
            <span className="font-display text-on-dark text-[18px]">Mussalla de Montréal</span>
          </div>
          <p className="text-on-dark-muted mt-4 max-w-[320px] text-[14px] leading-relaxed">
            Le centre communautaire de la mussalla : la prière, l’école, les activités et l’entraide
            — et une caisse où chaque don et chaque dépense sont visibles de tous.
          </p>
          <span className="font-arabic text-gold mt-4 inline-block text-[20px]" lang="ar">
            بارك الله فيكم
          </span>
        </div>

        {cols.map((col) => (
          <nav key={col.id} aria-labelledby={col.id}>
            <p id={col.id} className="eyebrow text-on-dark-faint">
              {col.title}
            </p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-on-dark-muted hover:text-on-dark text-[14px] transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <p className="eyebrow text-on-dark-faint">Infos</p>
          <ul className="text-on-dark-muted mt-4 space-y-2.5 text-[14px]">
            <li>Montréal (Québec)</li>
            <li>Dollars canadiens (CAD)</li>
            <li>Interface en français</li>
          </ul>
        </div>
      </div>

      <div className="border-hairline-dark border-t">
        <div className="text-on-dark-faint mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-2 px-6 py-5 text-[12px] sm:flex-row md:px-8">
          <p>© 2026 Mussalla de Montréal · Centre communautaire</p>
          <p>Fait pour la communauté, avec transparence.</p>
        </div>
      </div>
    </footer>
  );
}
