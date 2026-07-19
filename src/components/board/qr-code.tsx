import QRCode from "qrcode";

/**
 * A real QR code (SVG) pointing at `url` — the design’s placeholder replaced with a
 * scannable code, per the handoff. Async Server Component: generated at render time,
 * no client JS. Dark modules on a white ground so it scans from across the room.
 */
export async function QrCode({
  url,
  size = 96,
  className,
}: {
  url: string;
  size?: number;
  className?: string;
}) {
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 0,
    color: { dark: "#0e231b", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      // Static, app-generated SVG — safe to inline.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
