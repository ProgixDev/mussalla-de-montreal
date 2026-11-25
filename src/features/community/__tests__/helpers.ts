import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach } from "vitest";
import { usePortal } from "@/lib/portal/store";

/**
 * Shared set-up for the public form tests (test-only — never imported by the app).
 *
 * - jsdom has no scrollIntoView(): the forms scroll the first invalid field, and the
 *   success heading, into view.
 * - The store is a module singleton: every test starts again from the seed.
 * - vitest runs without globals, so Testing Library's automatic cleanup and act()
 *   environment flag are wired here.
 */
export function setupFormTests() {
  beforeAll(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
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
