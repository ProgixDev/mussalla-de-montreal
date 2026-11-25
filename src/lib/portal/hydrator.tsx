"use client";

import { useEffect } from "react";
import { usePortal } from "./store";

/**
 * Restores the persisted demo state after mount (never during render), so the server
 * HTML and the first client render match. Mounted once in the root layout.
 */
export function PortalHydrator() {
  useEffect(() => {
    void usePortal.persist.rehydrate();
    // Another tab of the same browser changed the demo (e.g. an alert published in the
    // portal while /tv is open): pick it up live, like the realtime channel will.
    const onStorage = (e: StorageEvent) => {
      if (e.key === usePortal.persist.getOptions().name) void usePortal.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}

/** True once the saved demo state (if any) has been restored. */
export const usePortalReady = () => usePortal((s) => s.hydrated);
