"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { cx } from "@/lib/movie-utils";
import styles from "./dialog.module.css";

let lockCount = 0;
function lockScroll() {
  if (lockCount++ === 0) {
    const root = document.documentElement;
    const gap = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    if (gap > 0) root.style.paddingRight = `${gap}px`;
  }
}
function unlockScroll() {
  if (--lockCount <= 0) {
    lockCount = 0;
    const root = document.documentElement;
    root.style.overflow = "";
    root.style.paddingRight = "";
  }
}

/**
 * Shared behaviour for anything built on a native modal <dialog>:
 * syncs `open` with showModal()/close(), reports Esc/close back through onOpenChange,
 * closes on backdrop click and locks page scroll while open.
 * Focus moves into the dialog on open and returns to the opener on close (native behaviour).
 */
export function useModalDialog(
  ref: RefObject<HTMLDialogElement | null>,
  open: boolean,
  onOpenChange: (open: boolean) => void,
) {
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      lockScroll();
      return () => {
        unlockScroll();
        if (dialog.open) dialog.close();
      };
    }
    if (!open && dialog.open) dialog.close();
  }, [open, ref]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Guard: in StrictMode the dialog is closed and immediately re-opened; the queued
    // close event must not report a close for a dialog that is open again.
    const handleClose = () => {
      if (!dialog.open) onOpenChangeRef.current(false);
    };
    // Backdrop click: the pointer landed on the <dialog> box itself, outside its content.
    let downOnBackdrop = false;
    const handleDown = (e: PointerEvent) => {
      downOnBackdrop = e.target === dialog;
    };
    const handleClick = (e: MouseEvent) => {
      if (downOnBackdrop && e.target === dialog) dialog.close();
      downOnBackdrop = false;
    };
    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("pointerdown", handleDown);
    dialog.addEventListener("click", handleClick);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("pointerdown", handleDown);
      dialog.removeEventListener("click", handleClick);
    };
  }, [ref]);
}

export type DialogSize = "sm" | "md" | "lg" | "full";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  size?: DialogSize;
  /** Visually hide the title (still announced). */
  hideTitle?: boolean;
  /** Optional footer row (actions). */
  footer?: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
  hideTitle,
  footer,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  useModalDialog(ref, open, onOpenChange);

  return (
    <dialog
      ref={ref}
      className={cx(styles.dialog, styles[size], className)}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
    >
      {open ? (
        <div className={styles.panel}>
          <header className={cx(styles.header, hideTitle && "visually-hidden")}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {description ? (
              <p id={descId} className={styles.description}>
                {description}
              </p>
            ) : null}
          </header>
          <div className={styles.content}>{children}</div>
          {footer ? <footer className={styles.footer}>{footer}</footer> : null}
          {/* Last in DOM order so initial focus lands on the content, first visually via positioning. */}
          <button type="button" className={styles.close} aria-label="Close" onClick={() => onOpenChange(false)}>
            <X aria-hidden />
          </button>
        </div>
      ) : null}
    </dialog>
  );
}
