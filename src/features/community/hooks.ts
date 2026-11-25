"use client";

import { useSyncExternalStore } from "react";
import { activities as seedActivities } from "@/core/portal/seed";
import type { Activity } from "@/core/portal/types";
import { usePortal } from "@/lib/portal/store";
import { usePortalReady } from "@/lib/portal/hydrator";
import { todayIso } from "./labels";

/**
 * The activity catalogue as the visitor should see it. Until the persisted demo state is
 * restored we render the seed — exactly what the server rendered — so hydration never
 * mismatches; afterwards, the live store (seat counts included).
 */
export function usePublicActivities(): Activity[] {
  const ready = usePortalReady();
  const stored = usePortal((s) => s.activities);
  return ready ? stored : seedActivities;
}

const noSubscribe = () => () => {};

/**
 * The visitor's local day ("2026-11-25"), or null during server render and hydration —
 * the server's clock (and time zone) is not the visitor's.
 */
export function useToday(): string | null {
  return useSyncExternalStore(noSubscribe, todayIso, () => null);
}
