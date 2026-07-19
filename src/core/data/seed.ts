/**
 * Seed data — transcribed 1:1 from the design prototype’s logic class so the screens
 * render with the exact figures in the reference captures. Dollars in the prototype
 * are stored here as cents. This is the swappable layer: replace `getCaisseData()`
 * with Supabase reads and every surface keeps working unchanged.
 */
import type {
  CaisseData,
  Contribution,
  Expense,
  Goal,
  Member,
  DisplaySettings,
} from "./types";

const $ = (dollars: number) => dollars * 100;

/** 20 000 $ opening balance (prototype: state.opening). */
export const OPENING_CENTS = $(20_000);

const goals: Goal[] = [
  {
    id: "g1",
    title: "Rénovation de la salle d’ablution",
    targetCents: $(15_000),
    raisedCents: $(9_250),
    due: "30 nov. 2026",
  },
  {
    id: "g2",
    title: "Tapis et système de son",
    targetCents: $(8_000),
    raisedCents: $(6_480),
    due: "15 sept. 2026",
  },
  {
    id: "g3",
    title: "Fonds Ramadan 2027",
    targetCents: $(25_000),
    raisedCents: $(4_100),
    due: "1 fév. 2027",
  },
];

const contributions: Contribution[] = [
  { id: "c1", name: "Anonyme", realName: "Bilal K.", anon: true, amountCents: $(500), type: "mensuel", date: "Aujourd’hui", source: "Square" },
  { id: "c2", name: "Yassine B.", anon: false, amountCents: $(100), type: "ponctuel", date: "Hier", source: "Square" },
  { id: "c3", name: "Anonyme", realName: "Sofia M.", anon: true, amountCents: $(50), type: "ponctuel", date: "Hier", source: "Espèces" },
  { id: "c4", name: "Fatima Z.", anon: false, amountCents: $(250), type: "mensuel", date: "16 juil.", source: "Square" },
  { id: "c5", name: "Karim T.", anon: false, amountCents: $(40), type: "ponctuel", date: "15 juil.", source: "Espèces" },
  { id: "c6", name: "Anonyme", realName: "Hassan D.", anon: true, amountCents: $(1_000), type: "ponctuel", date: "14 juil.", source: "Square" },
  { id: "c7", name: "Nadia S.", anon: false, amountCents: $(75), type: "mensuel", date: "13 juil.", source: "Square" },
  { id: "c8", name: "Mohammed A.", anon: false, amountCents: $(200), type: "mensuel", date: "12 juil.", source: "Square" },
  { id: "c9", name: "Anonyme", realName: "Leïla T.", anon: true, amountCents: $(120), type: "ponctuel", date: "11 juil.", source: "Espèces" },
  { id: "c10", name: "Rachid M.", anon: false, amountCents: $(60), type: "ponctuel", date: "10 juil.", source: "Square" },
];

const expenses: Expense[] = [
  { id: "e1", item: "Loyer — juillet", amountCents: $(2_800), date: "1 juil. 2026", cat: "Loyer" },
  { id: "e2", item: "Électricité", amountCents: $(340), date: "5 juil. 2026", cat: "Services" },
  { id: "e3", item: "Réparation plomberie", amountCents: $(620), date: "9 juil. 2026", cat: "Entretien" },
  { id: "e4", item: "Produits de nettoyage", amountCents: $(95), date: "12 juil. 2026", cat: "Fournitures" },
  { id: "e5", item: "Assurance", amountCents: $(180), date: "15 juil. 2026", cat: "Administration" },
];

const members: Member[] = [
  { id: "m1", name: "Abdelkader R.", role: "Administrateur", scope: "Accès complet", initials: "AR", active: true },
  { id: "m2", name: "Yassine B.", role: "Gestionnaire", scope: "Contributions et dépenses", initials: "YB", active: true },
  { id: "m3", name: "Omar D.", role: "Gestionnaire", scope: "Affichage", initials: "OD", active: true },
];

const display: DisplaySettings = {
  mode: "rotation",
  pinnedPage: 0,
  rotationSpeed: 10,
};

/** The whole board. Swap this function’s body for Supabase reads later. */
export function getCaisseData(): CaisseData {
  return { members, contributions, expenses, goals, display, openingCents: OPENING_CENTS };
}
