"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createTvStore, type TvState, type TvStore } from "./store";
import type { DisplaySettings } from "@/core/data/types";

const TvStoreContext = createContext<TvStore | null>(null);

/** One store per mount, seeded by the RSC route from the current display settings. */
export function TvStoreProvider({
  children,
  display,
}: {
  children: React.ReactNode;
  display: DisplaySettings;
}) {
  const [store] = useState<TvStore>(() => createTvStore(display));
  return <TvStoreContext.Provider value={store}>{children}</TvStoreContext.Provider>;
}

export function useTvStore<T>(selector: (state: TvState) => T): T {
  const store = useContext(TvStoreContext);
  if (!store) throw new Error("useTvStore must be used within a TvStoreProvider.");
  return useStore(store, selector);
}
