"use client";

import { useBackoffice } from "./provider";
import { Login } from "./login";
import { Shell } from "./shell";
import { Modals } from "./modals";

/** Gate → shell. The whole console is behind the auth check. */
export function Backoffice() {
  const authed = useBackoffice((s) => s.authed);
  if (!authed) return <Login />;
  return (
    <>
      <Shell />
      <Modals />
    </>
  );
}
