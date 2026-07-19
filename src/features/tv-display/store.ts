import { createStore } from "zustand/vanilla";
import type { DisplaySettings } from "@/core/data/types";
import { TV_PAGES } from "@/core/data/derive";

/**
 * TV display state. The display settings are the shared control surface the
 * backoffice drives (pin a page or auto-rotate + speed) — here they seed from the
 * server and `setDisplay` is the seam a Supabase realtime subscription will call so
 * the TV reflects backoffice changes with no reload.
 */
export interface TvState {
  display: DisplaySettings;
  /** Current page index while rotating. */
  tvPage: number;
  /** Client clock (ms). null until mounted, to avoid SSR hydration mismatch. */
  now: number | null;
  setDisplay: (display: DisplaySettings) => void;
  setNow: (now: number) => void;
  /** Advance to the next page (rotation ticker). */
  advance: () => void;
}

export type TvStore = ReturnType<typeof createTvStore>;

export function createTvStore(display: DisplaySettings) {
  return createStore<TvState>((set) => ({
    display,
    tvPage: display.mode === "pinned" ? display.pinnedPage : 0,
    now: null,
    setDisplay: (next) =>
      set((state) => ({
        display: next,
        // Jump straight to a pinned page; keep position while rotating.
        tvPage: next.mode === "pinned" ? next.pinnedPage : state.tvPage,
      })),
    setNow: (now) => set({ now }),
    advance: () => set((state) => ({ tvPage: (state.tvPage + 1) % TV_PAGES.length })),
  }));
}
