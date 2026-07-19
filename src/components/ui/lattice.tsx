import { cn } from "@/lib/utils";

/**
 * Geometric overlapping-circles lattice — the gold Islamic-pattern watermark behind
 * the hero panel and the TV screen. A 60px tiling SVG (from the prototype). Absolute
 * fill by default; the parent must be `relative` + `overflow-hidden`.
 */
const TILE =
  "url(\"data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2260%22%20height=%2260%22%3E%3Cg%20fill=%22none%22%20stroke=%22%23d9bd77%22%20stroke-width=%221%22%20opacity=%220.4%22%3E%3Ccircle%20cx=%220%22%20cy=%220%22%20r=%2230%22/%3E%3Ccircle%20cx=%2260%22%20cy=%220%22%20r=%2230%22/%3E%3Ccircle%20cx=%220%22%20cy=%2260%22%20r=%2230%22/%3E%3Ccircle%20cx=%2260%22%20cy=%2260%22%20r=%2230%22/%3E%3Ccircle%20cx=%2230%22%20cy=%2230%22%20r=%2230%22/%3E%3C/g%3E%3C/svg%3E\")";

export function Lattice({
  className,
  opacity = 0.5,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{ backgroundImage: TILE, backgroundRepeat: "repeat", opacity }}
    />
  );
}
