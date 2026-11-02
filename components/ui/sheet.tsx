"use client";

import { useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "@/lib/movie-utils";
import { useModalDialog } from "./dialog";
import styles from "./sheet.module.css";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right" | "bottom";
  title: ReactNode;
  /** Visually hide the title (still announced). */
  hideTitle?: boolean;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Side drawer built on a native modal <dialog>. Esc, backdrop click and scroll lock included. */
export function Sheet({ open, onOpenChange, side = "right", title, hideTitle, children, footer, className }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useModalDialog(ref, open, onOpenChange);

  return (
    <dialog ref={ref} className={cx(styles.sheet, styles[side], className)} aria-labelledby={titleId}>
      {open ? (
        <div className={styles.panel}>
          {side === "bottom" ? <span className={styles.grabber} aria-hidden /> : null}
          <header className={cx(styles.header, hideTitle && "visually-hidden")}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
          </header>
          <div className={styles.content}>{children}</div>
          {footer ? <footer className={styles.footer}>{footer}</footer> : null}
          <button type="button" className={styles.close} aria-label="Close" onClick={() => onOpenChange(false)}>
            <X aria-hidden />
          </button>
        </div>
      ) : null}
    </dialog>
  );
}
