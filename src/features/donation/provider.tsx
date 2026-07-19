"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createDonationStore, type DonationState, type DonationStore } from "./store";

const DonationStoreContext = createContext<DonationStore | null>(null);

export function DonationStoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState<DonationStore>(() => createDonationStore());
  return (
    <DonationStoreContext.Provider value={store}>{children}</DonationStoreContext.Provider>
  );
}

export function useDonationStore<T>(selector: (state: DonationState) => T): T {
  const store = useContext(DonationStoreContext);
  if (!store) throw new Error("useDonationStore must be used within a DonationStoreProvider.");
  return useStore(store, selector);
}
