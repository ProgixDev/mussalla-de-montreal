import type { Metadata } from "next";
import { DonationFlow, DonationStoreProvider } from "@/features/donation";
import { getCaisseData } from "@/core/data/seed";

export const metadata: Metadata = {
  title: "Faire un don",
  description: "Contribuez à la caisse de la Mussalla de Montréal — paiement sécurisé par Square.",
};

/** Public donation wizard. Goals feed the "Destination" step. */
export default function DonPage() {
  const { goals } = getCaisseData();
  return (
    <DonationStoreProvider>
      <DonationFlow goals={goals.map((g) => ({ id: g.id, title: g.title }))} />
    </DonationStoreProvider>
  );
}
