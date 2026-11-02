"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { PLAYER_SHORTCUTS } from "@/hooks/use-player-shortcuts";
import styles from "./shortcuts-sheet.module.css";

/** Small keyboard reference. Rendered inside the stage so it also shows in fullscreen. */
export function ShortcutsSheet({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => prev?.focus?.();
  }, []);

  return (
    <div className={styles.scrim} onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="shortcuts-title" className={styles.sheet}>
        <header className={styles.head}>
          <h2 id="shortcuts-title" className={styles.title}>
            Keyboard shortcuts
          </h2>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Close shortcuts">
            <X size={18} aria-hidden />
          </button>
        </header>
        <dl className={styles.list}>
          {PLAYER_SHORTCUTS.map((s) => (
            <div key={s.label} className={styles.row}>
              <dt>
                {s.keys.map((k) => (
                  <kbd key={k} className={styles.kbd}>
                    {k}
                  </kbd>
                ))}
              </dt>
              <dd>{s.label}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.note}>
          Play, pause, seek and volume live inside the player. Click the picture first to use its own keys.
        </p>
      </div>
    </div>
  );
}
