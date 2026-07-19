import { createStore } from "zustand/vanilla";
import type {
  CaisseData,
  Contribution,
  ContributionSource,
  ContributionType,
  DisplaySettings,
  Expense,
  ExpenseCategory,
  Goal,
} from "@/core/data/types";

/**
 * Backoffice state. In the seed phase this is an in-memory board the manager edits
 * (add/edit prepends/updates and every derived figure recomputes) — exactly the
 * prototype’s model. When the backend lands, `login` becomes Supabase Auth and each
 * CRUD action becomes a zod-validated server action writing to Postgres; this store
 * shrinks to UI state (section, modal, draft) over server data.
 */
export type Section =
  | "dashboard"
  | "contributions"
  | "expenses"
  | "goals"
  | "display"
  | "members";

export type ModalType = "contribution" | "expense" | "goal";
export interface ModalState {
  type: ModalType;
  mode: "add" | "edit";
  id?: string;
}

/** Draft holds dollar-denominated amount strings; converted to cents on save. */
export interface Draft {
  // contribution
  name?: string;
  realName?: string;
  anon?: boolean;
  type?: ContributionType;
  source?: ContributionSource;
  // expense
  item?: string;
  cat?: ExpenseCategory;
  // goal
  title?: string;
  raised?: string;
  target?: string;
  due?: string;
  // shared
  amount?: string;
  date?: string;
}

export interface BackofficeState {
  authed: boolean;
  email: string;
  pass: string;
  err: string;
  section: Section;

  contributions: Contribution[];
  expenses: Expense[];
  goals: Goal[];
  members: CaisseData["members"];
  openingCents: number;
  display: DisplaySettings;

  modal: ModalState | null;
  draft: Draft;

  setField: (patch: Partial<Pick<BackofficeState, "email" | "pass">>) => void;
  login: () => void;
  logout: () => void;
  setSection: (section: Section) => void;
  setDisplay: (patch: Partial<DisplaySettings>) => void;

  openModal: (type: ModalType, mode: "add" | "edit", id?: string) => void;
  closeModal: () => void;
  setDraft: (patch: Partial<Draft>) => void;
  save: () => void;
}

const toCents = (v: string | undefined) => {
  const n = Number.parseFloat((v ?? "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};
const genId = (prefix: string, list: { id: string }[]) => `${prefix}${list.length + 1}-${list.length}`;

export type BackofficeStore = ReturnType<typeof createBackofficeStore>;

export function createBackofficeStore(seed: CaisseData) {
  return createStore<BackofficeState>((set, get) => ({
    authed: false,
    email: "",
    pass: "",
    err: "",
    section: "dashboard",

    contributions: seed.contributions,
    expenses: seed.expenses,
    goals: seed.goals,
    members: seed.members,
    openingCents: seed.openingCents,
    display: seed.display,

    modal: null,
    draft: {},

    setField: (patch) => set({ ...patch, err: "" }),
    // Prototype auth: any non-empty pair passes. Real auth = Supabase (backend phase).
    login: () =>
      set((s) =>
        s.email.trim() && s.pass.trim()
          ? { authed: true, err: "", pass: "" }
          : { err: "Entrez votre courriel et votre mot de passe." },
      ),
    logout: () => set({ authed: false, section: "dashboard", email: "", pass: "" }),
    setSection: (section) => set({ section }),
    setDisplay: (patch) => set((s) => ({ display: { ...s.display, ...patch } })),

    openModal: (type, mode, id) => {
      const s = get();
      let draft: Draft = {};
      if (mode === "edit" && id) {
        if (type === "contribution") {
          const c = s.contributions.find((x) => x.id === id);
          if (c)
            draft = {
              name: c.name,
              realName: c.realName ?? "",
              anon: c.anon,
              amount: String(c.amountCents / 100),
              type: c.type,
              source: c.source,
              date: c.date,
            };
        } else if (type === "expense") {
          const e = s.expenses.find((x) => x.id === id);
          if (e)
            draft = { item: e.item, amount: String(e.amountCents / 100), cat: e.cat, date: e.date };
        } else {
          const g = s.goals.find((x) => x.id === id);
          if (g)
            draft = {
              title: g.title,
              raised: String(g.raisedCents / 100),
              target: String(g.targetCents / 100),
              due: g.due,
            };
        }
      } else {
        if (type === "contribution")
          draft = { name: "", anon: false, amount: "", type: "ponctuel", source: "Espèces", date: "Aujourd’hui" };
        else if (type === "expense") draft = { item: "", amount: "", cat: "Autre", date: "" };
        else draft = { title: "", raised: "0", target: "", due: "" };
      }
      set({ modal: { type, mode, id }, draft });
    },
    closeModal: () => set({ modal: null, draft: {} }),
    setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

    save: () => {
      const { modal, draft } = get();
      if (!modal) return;
      if (modal.type === "contribution") {
        const anon = !!draft.anon;
        const realName = draft.realName?.trim() || undefined;
        const row: Contribution = {
          id: modal.id ?? genId("c", get().contributions),
          name: anon ? "Anonyme" : draft.name?.trim() || "Anonyme",
          realName: anon ? realName || draft.name?.trim() : undefined,
          anon,
          amountCents: toCents(draft.amount),
          type: draft.type ?? "ponctuel",
          source: draft.source ?? "Espèces",
          date: draft.date?.trim() || "Aujourd’hui",
        };
        set((s) => ({
          contributions:
            modal.mode === "add"
              ? [row, ...s.contributions]
              : s.contributions.map((c) => (c.id === row.id ? row : c)),
        }));
      } else if (modal.type === "expense") {
        const row: Expense = {
          id: modal.id ?? genId("e", get().expenses),
          item: draft.item?.trim() || "Dépense",
          amountCents: toCents(draft.amount),
          cat: draft.cat ?? "Autre",
          date: draft.date?.trim() || "Aujourd’hui",
        };
        set((s) => ({
          expenses:
            modal.mode === "add"
              ? [row, ...s.expenses]
              : s.expenses.map((e) => (e.id === row.id ? row : e)),
        }));
      } else {
        const row: Goal = {
          id: modal.id ?? genId("g", get().goals),
          title: draft.title?.trim() || "Objectif",
          raisedCents: toCents(draft.raised),
          targetCents: toCents(draft.target),
          due: draft.due?.trim() || "—",
        };
        set((s) => ({
          goals:
            modal.mode === "add"
              ? [...s.goals, row]
              : s.goals.map((g) => (g.id === row.id ? row : g)),
        }));
      }
      set({ modal: null, draft: {} });
    },
  }));
}
