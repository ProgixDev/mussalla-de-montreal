import { createStore } from "zustand/vanilla";

/**
 * Donation wizard state (client-only draft). In the seed phase, `confirm` just moves
 * to the receipt; when Square is wired, step 4 mounts the Web Payments SDK, tokenizes
 * the card, and the server records the gift via webhook — this store stays the same.
 */
export type Frequency = "once" | "monthly";

export interface DonationState {
  step: number; // 0..4 (montant, destination, affichage, paiement, reçu)
  presetCents: number; // selected preset chip
  custom: string; // custom amount, dollars as typed
  dest: string; // "general" or a goal id
  freq: Frequency;
  anon: boolean;
  name: string;
  card: { num: string; exp: string; cvc: string };
  setPreset: (cents: number) => void;
  setCustom: (v: string) => void;
  setDest: (id: string) => void;
  setFreq: (f: Frequency) => void;
  setAnon: (v: boolean) => void;
  setName: (v: string) => void;
  setCard: (patch: Partial<DonationState["card"]>) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
}

/** Effective gift amount in cents: the custom field wins when filled. */
export function effectiveCents(s: Pick<DonationState, "presetCents" | "custom">): number {
  const parsed = Number.parseFloat(s.custom.replace(",", "."));
  return s.custom.trim() && Number.isFinite(parsed) && parsed > 0
    ? Math.round(parsed * 100)
    : s.presetCents;
}

export type DonationStore = ReturnType<typeof createDonationStore>;

export function createDonationStore() {
  return createStore<DonationState>((set) => ({
    step: 0,
    presetCents: 10_000, // 100 $
    custom: "",
    dest: "general",
    freq: "once",
    anon: false,
    name: "",
    card: { num: "", exp: "", cvc: "" },
    setPreset: (presetCents) => set({ presetCents, custom: "" }),
    setCustom: (custom) => set({ custom }),
    setDest: (dest) => set({ dest }),
    setFreq: (freq) => set({ freq }),
    setAnon: (anon) => set({ anon }),
    setName: (name) => set({ name }),
    setCard: (patch) => set((s) => ({ card: { ...s.card, ...patch } })),
    next: () => set((s) => ({ step: Math.min(4, s.step + 1) })),
    back: () => set((s) => ({ step: Math.max(0, s.step - 1) })),
    reset: () =>
      set({
        step: 0,
        presetCents: 10_000,
        custom: "",
        dest: "general",
        freq: "once",
        anon: false,
        name: "",
        card: { num: "", exp: "", cvc: "" },
      }),
  }));
}
