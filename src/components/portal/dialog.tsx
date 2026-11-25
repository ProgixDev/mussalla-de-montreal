"use client";

import { useEffect, useId, useRef } from "react";
import { XIcon } from "@/components/ui/icons";

/**
 * Modal built on the native <dialog>: showModal() gives the focus trap, Esc-to-close,
 * inert background and top-layer stacking for free. Used sparingly — only for focused
 * decisions (confirming an emergency alert, attesting a PV).
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // Unique per dialog: several dialogs can be mounted at once (an alert being composed
  // while another one is live), and a shared id would give them all the first one's name.
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby={titleId}
      className="border-gold/20 text-on-dark m-auto w-[min(560px,calc(100vw-32px))] rounded-[20px] border bg-[#0b1f17] p-0 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.9)] backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="border-gold/10 flex items-start justify-between gap-4 border-b px-6 py-4">
        <h2 id={titleId} className="font-display text-[21px] leading-tight">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="text-on-dark-muted hover:text-on-dark inline-flex size-9 shrink-0 items-center justify-center rounded-full transition hover:bg-white/[0.08]"
        >
          <XIcon width={18} height={18} />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
      {footer && (
        <div className="border-gold/10 flex flex-wrap justify-end gap-2 border-t px-6 py-4">
          {footer}
        </div>
      )}
    </dialog>
  );
}
