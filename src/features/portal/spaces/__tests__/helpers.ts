import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach } from "vitest";
import type { Person } from "@/core/portal/types";
import { usePortal } from "@/lib/portal/store";

/**
 * Shared set-up for the portal interaction tests (test-only — never imported by the app).
 *
 * - jsdom knows <dialog> but implements neither showModal() nor close(), and has no
 *   scrollIntoView(): minimal stand-ins, enough for the native-dialog component.
 * - The store is a module singleton: every test starts again from the seed.
 * - vitest runs without globals, so Testing Library's automatic cleanup and act()
 *   environment flag are wired here.
 */
export function setupPortalTests() {
  beforeAll(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const dialog = HTMLDialogElement.prototype;
    if (!("showModal" in dialog)) {
      Object.assign(dialog, {
        showModal(this: HTMLDialogElement) {
          this.open = true;
        },
        close(this: HTMLDialogElement) {
          if (!this.open) return;
          this.open = false;
          this.dispatchEvent(new Event("close"));
        },
      });
    }
    if (!("scrollIntoView" in Element.prototype)) {
      Object.assign(Element.prototype, { scrollIntoView() {} });
    }
  });
  beforeEach(() => {
    usePortal.getState().resetDemo();
  });
  afterEach(() => {
    cleanup();
  });
}

/** A seeded person, as the portal shell passes it to a space. */
export function person(id: string): Person {
  const p = usePortal.getState().persons.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown person ${id}`);
  return p;
}

/** A local ISO day `days` from today — forms refuse past dates. */
export function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
