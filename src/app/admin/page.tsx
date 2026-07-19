import type { Metadata } from "next";
import { Backoffice, BackofficeStoreProvider } from "@/features/backoffice";
import { getCaisseData } from "@/core/data/seed";

export const metadata: Metadata = {
  title: "Backoffice",
  robots: { index: false, follow: false },
};

/**
 * Private manager console. Seed phase: gated by an in-store check (any non-empty
 * credentials). Backend phase: this route sits behind Supabase Auth in middleware,
 * and the editable collections come from the database via server actions.
 */
export default function AdminPage() {
  const seed = getCaisseData();
  return (
    <BackofficeStoreProvider seed={seed}>
      <Backoffice />
    </BackofficeStoreProvider>
  );
}
