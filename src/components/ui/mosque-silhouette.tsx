import { cn } from "@/lib/utils";

/**
 * Decorative mosque skyline (domes + minarets + arches) drawn in `currentColor`.
 * Purely ornamental — always paired with `aria-hidden`. Transcribed from the
 * prototype (viewBox 0 0 280 84). Used low-opacity on the hero and TV welcome.
 */
export function MosqueSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 84"
      width="100%"
      fill="currentColor"
      aria-hidden="true"
      className={cn("block", className)}
    >
      <rect x="0" y="78" width="280" height="3" rx="1.5" />
      {/* left minaret */}
      <rect x="37" y="30" width="7" height="48" />
      <path d="M33.5 30 Q40.5 13 47.5 30 Z" />
      <rect x="39" y="9" width="3" height="6" />
      <circle cx="40.5" cy="7.5" r="2.2" />
      {/* right minaret */}
      <rect x="236" y="30" width="7" height="48" />
      <path d="M232.5 30 Q239.5 13 246.5 30 Z" />
      <rect x="238" y="9" width="3" height="6" />
      <circle cx="239.5" cy="7.5" r="2.2" />
      {/* side domes */}
      <path d="M70 78 V58 Q70 51 78 51 Q86 51 86 58 V78 Z" />
      <path d="M194 78 V58 Q194 51 202 51 Q210 51 210 58 V78 Z" />
      {/* main hall + central dome */}
      <rect x="100" y="46" width="80" height="32" />
      <path d="M106 46 C106 33 122 33 122 20 C122 11 130 8 140 8 C150 8 158 11 158 20 C158 33 174 33 174 46 Z" />
      <rect x="138.5" y="2" width="3" height="7" />
      <circle cx="140" cy="2" r="2.6" />
    </svg>
  );
}
