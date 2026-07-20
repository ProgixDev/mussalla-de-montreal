import type { Metadata } from "next";
import { TvScreen, TvStoreProvider } from "@/features/tv-display";
import { QrCode } from "@/components/board/qr-code";
import { getCaisseData } from "@/core/data/seed";
import { computeTotals } from "@/core/data/derive";
import { site } from "@/core/site";

export const metadata: Metadata = {
  title: "Écran TV",
  robots: { index: false, follow: false },
};

/**
 * Public kiosk. Seeds the TV store with the current display settings; the screen
 * component runs the clock + rotation client-side. The QR is generated on the server
 * and passed down (async Server Components can’t render inside a client component).
 */
export default function TvPage() {
  const data = getCaisseData();
  const totals = computeTotals(data);

  return (
    <TvStoreProvider display={data.display}>
      <TvScreen
        data={data}
        totals={totals}
        qr={<QrCode url={`${site.url}/caisse`} size={92} />}
        qrLabel={site.host}
      />
    </TvStoreProvider>
  );
}
