import Link from "next/link";
import { Emblem } from "@/components/ui/emblem";

/** Site-wide footer for the public pages. Night-emerald, gold accents. */
export function SiteFooter() {
  const cols: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: "Naviguer",
      links: [
        { label: "Accueil", href: "/" },
        { label: "La caisse", href: "/caisse" },
        { label: "Faire un don", href: "/don" },
      ],
    },
    {
      title: "Espaces",
      links: [
        { label: "Écran TV", href: "/tv" },
        { label: "Backoffice", href: "/admin" },
      ],
    },
  ];

  return (
    <footer className="border-t border-hairline-dark bg-night text-on-dark">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-14 md:grid-cols-[1.6fr_1fr_1fr_1.2fr] md:px-8">
        <div>
          <div className="flex items-center gap-3">
            <Emblem size={40} className="text-gold" />
            <span className="font-display text-[18px] text-on-dark">Mussalla de Montréal</span>
          </div>
          <p className="mt-4 max-w-[320px] text-[14px] leading-relaxed text-on-dark-muted">
            La caisse — chaque don et chaque dépense, visibles de tous. Ce que cela construit n’est
            pas un écran : c’est la confiance.
          </p>
          <span className="font-arabic mt-4 block text-[20px] text-gold" lang="ar">
            بارك الله فيكم
          </span>
        </div>

        {cols.map((col) => (
          <nav key={col.title}>
            <p className="eyebrow text-on-dark-faint">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[14px] text-on-dark-muted transition-colors hover:text-on-dark"
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
          <ul className="mt-4 space-y-2.5 text-[14px] text-on-dark-muted">
            <li>Montréal (Québec)</li>
            <li>Dollars canadiens (CAD)</li>
            <li>Interface en français</li>
            <li>Paiements sécurisés par Square</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-hairline-dark">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-2 px-6 py-5 text-[12px] text-on-dark-faint sm:flex-row md:px-8">
          <p>© 2026 Mussalla de Montréal · La caisse</p>
          <p>Fait pour la communauté, avec transparence.</p>
        </div>
      </div>
    </footer>
  );
}
