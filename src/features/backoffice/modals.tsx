"use client";

import { useBackoffice } from "./provider";
import type {
  ContributionSource,
  ContributionType,
  ExpenseCategory,
} from "@/core/data/types";

const inputCls =
  "mt-1.5 w-full rounded-[2px] border border-hairline-strong bg-white px-3 py-2 text-[15px] text-ink outline-none focus:border-emerald-focus";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow text-muted-ink">{label}</span>
      {children}
    </label>
  );
}

const EXPENSE_CATS: ExpenseCategory[] = [
  "Loyer",
  "Services",
  "Entretien",
  "Fournitures",
  "Administration",
  "Autre",
];

export function Modals() {
  const modal = useBackoffice((s) => s.modal);
  const draft = useBackoffice((s) => s.draft);
  const setDraft = useBackoffice((s) => s.setDraft);
  const save = useBackoffice((s) => s.save);
  const close = useBackoffice((s) => s.closeModal);

  if (!modal) return null;

  const titles: Record<string, string> = {
    contribution: modal.mode === "add" ? "Ajouter une contribution" : "Modifier la contribution",
    expense: modal.mode === "add" ? "Ajouter une dépense" : "Modifier la dépense",
    goal: modal.mode === "add" ? "Créer un objectif" : "Modifier l’objectif",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(20,21,15,.45)" }}
      onClick={close}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="w-full max-w-[440px] rounded-[12px] bg-white p-6 shadow-modal animate-modalin"
      >
        <h2 className="font-display text-[22px] text-ink">{titles[modal.type]}</h2>

        <div className="mt-5 space-y-4">
          {modal.type === "contribution" && (
            <>
              <Labeled label="Personne">
                <input
                  className={inputCls}
                  value={draft.name ?? ""}
                  onChange={(e) => setDraft({ name: e.target.value })}
                  placeholder="Ex. Yassine B."
                />
              </Labeled>
              <label className="flex items-center gap-2.5 text-[14px] text-body">
                <input
                  type="checkbox"
                  checked={!!draft.anon}
                  onChange={(e) => setDraft({ anon: e.target.checked })}
                  className="size-4 accent-emerald"
                />
                Afficher comme <span className="font-medium">Anonyme</span> sur les écrans publics
              </label>
              {draft.anon && (
                <Labeled label="Nom réel (privé, backoffice seulement)">
                  <input
                    className={inputCls}
                    value={draft.realName ?? ""}
                    onChange={(e) => setDraft({ realName: e.target.value })}
                    placeholder="Ex. Bilal K."
                  />
                </Labeled>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Labeled label="Montant ($)">
                  <input
                    className={inputCls}
                    inputMode="decimal"
                    value={draft.amount ?? ""}
                    onChange={(e) => setDraft({ amount: e.target.value })}
                    placeholder="100"
                  />
                </Labeled>
                <Labeled label="Date">
                  <input
                    className={inputCls}
                    value={draft.date ?? ""}
                    onChange={(e) => setDraft({ date: e.target.value })}
                    placeholder="Aujourd’hui"
                  />
                </Labeled>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Labeled label="Type">
                  <select
                    className={inputCls}
                    value={draft.type ?? "ponctuel"}
                    onChange={(e) => setDraft({ type: e.target.value as ContributionType })}
                  >
                    <option value="ponctuel">Ponctuel</option>
                    <option value="mensuel">Mensuel</option>
                  </select>
                </Labeled>
                <Labeled label="Source">
                  <select
                    className={inputCls}
                    value={draft.source ?? "Espèces"}
                    onChange={(e) => setDraft({ source: e.target.value as ContributionSource })}
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Square">Square</option>
                  </select>
                </Labeled>
              </div>
            </>
          )}

          {modal.type === "expense" && (
            <>
              <Labeled label="Poste">
                <input
                  className={inputCls}
                  value={draft.item ?? ""}
                  onChange={(e) => setDraft({ item: e.target.value })}
                  placeholder="Ex. Loyer — août"
                />
              </Labeled>
              <div className="grid grid-cols-2 gap-3">
                <Labeled label="Montant ($)">
                  <input
                    className={inputCls}
                    inputMode="decimal"
                    value={draft.amount ?? ""}
                    onChange={(e) => setDraft({ amount: e.target.value })}
                    placeholder="340"
                  />
                </Labeled>
                <Labeled label="Date">
                  <input
                    className={inputCls}
                    value={draft.date ?? ""}
                    onChange={(e) => setDraft({ date: e.target.value })}
                    placeholder="1 août 2026"
                  />
                </Labeled>
              </div>
              <Labeled label="Catégorie">
                <select
                  className={inputCls}
                  value={draft.cat ?? "Autre"}
                  onChange={(e) => setDraft({ cat: e.target.value as ExpenseCategory })}
                >
                  {EXPENSE_CATS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Labeled>
            </>
          )}

          {modal.type === "goal" && (
            <>
              <Labeled label="Titre">
                <input
                  className={inputCls}
                  value={draft.title ?? ""}
                  onChange={(e) => setDraft({ title: e.target.value })}
                  placeholder="Ex. Fonds Ramadan 2027"
                />
              </Labeled>
              <div className="grid grid-cols-2 gap-3">
                <Labeled label="Amassé ($)">
                  <input
                    className={inputCls}
                    inputMode="decimal"
                    value={draft.raised ?? ""}
                    onChange={(e) => setDraft({ raised: e.target.value })}
                    placeholder="0"
                  />
                </Labeled>
                <Labeled label="Objectif ($)">
                  <input
                    className={inputCls}
                    inputMode="decimal"
                    value={draft.target ?? ""}
                    onChange={(e) => setDraft({ target: e.target.value })}
                    placeholder="15000"
                  />
                </Labeled>
              </div>
              <Labeled label="Échéance">
                <input
                  className={inputCls}
                  value={draft.due ?? ""}
                  onChange={(e) => setDraft({ due: e.target.value })}
                  placeholder="30 nov. 2026"
                />
              </Labeled>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={close}
            className="h-10 rounded-[2px] border border-hairline-strong px-4 text-[14px] font-medium text-body transition hover:bg-tint"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="h-10 rounded-[2px] bg-emerald px-5 text-[14px] font-semibold text-on-dark transition active:scale-[0.98] hover:bg-emerald-deep"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
