"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createBackofficeStore, type BackofficeState, type BackofficeStore } from "./store";
import type { CaisseData } from "@/core/data/types";

const BackofficeStoreContext = createContext<BackofficeStore | null>(null);

export function BackofficeStoreProvider({
  children,
  seed,
}: {
  children: React.ReactNode;
  seed: CaisseData;
}) {
  const [store] = useState<BackofficeStore>(() => createBackofficeStore(seed));
  return (
    <BackofficeStoreContext.Provider value={store}>{children}</BackofficeStoreContext.Provider>
  );
}

export function useBackoffice<T>(selector: (state: BackofficeState) => T): T {
  const store = useContext(BackofficeStoreContext);
  if (!store) throw new Error("useBackoffice must be used within a BackofficeStoreProvider.");
  return useStore(store, selector);
}
