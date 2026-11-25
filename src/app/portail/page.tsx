import type { Metadata } from "next";
import { Portal } from "@/features/portal";

export const metadata: Metadata = {
  title: "Portail",
  robots: { index: false, follow: false },
};

/** Portail du centre — focused surface (own chrome, no public header/footer). */
export default function PortailPage() {
  return <Portal />;
}
