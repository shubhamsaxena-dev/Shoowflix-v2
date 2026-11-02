"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./side-panel.module.css";

/** Non-modal drawer on the stage (right on desktop, bottom on phones). Esc is handled by the stage. */
export function SidePanel({
  id,
  title,
  onClose,
  children,
}: {
  id: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <aside ref={ref} id={id} className={styles.panel} aria-label={title} tabIndex={-1}>
      <header className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        <button type="button" className={styles.close} onClick={onClose} aria-label={`Close ${title.toLowerCase()}`}>
          <X size={18} aria-hidden />
        </button>
      </header>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
