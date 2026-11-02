"use client";

import { useEffect, useId, useRef } from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import { cx } from "@/lib/movie-utils";
import type { StageSource } from "./types";
import { sourceLabel } from "./format";
import styles from "./quality-menu.module.css";

/** Release picker. Switching re-initialises the player with the new magnet — no page reload. */
export function QualityMenu({
  sources,
  currentHash,
  recommendedHash,
  open,
  onOpenChange,
  onSelect,
}: {
  sources: StageSource[];
  currentHash: string;
  recommendedHash?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (hash: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const current = sources.find((s) => s.hash === currentHash);

  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  // Focus the selected release when the menu opens (only on open, not on every re-render).
  useEffect(() => {
    if (!open) return;
    const active =
      menuRef.current?.querySelector<HTMLElement>('[aria-checked="true"]') ??
      menuRef.current?.querySelector<HTMLElement>("[role=menuitemradio]");
    active?.focus();

    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onOpenChangeRef.current(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitemradio]") ?? []);
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = (index + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onOpenChange(false);
      rootRef.current?.querySelector<HTMLElement>("button")?.focus();
    } else if (e.key === "Tab") {
      onOpenChange(false);
    }
  };

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => onOpenChange(!open)}
        title="Quality (Q)"
      >
        <SlidersHorizontal size={16} aria-hidden />
        <span className="visually-hidden">Quality: </span>
        <span className={styles.current}>{current?.quality ?? "Quality"}</span>
      </button>

      {open ? (
        <div ref={menuRef} id={menuId} role="menu" aria-label="Choose a release" className={styles.menu} onKeyDown={onKeyDown}>
          <p className={styles.heading}>Release</p>
          {sources.map((s) => {
            const selected = s.hash === currentHash;
            return (
              <button
                key={s.hash}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                tabIndex={-1}
                className={cx(styles.item, selected && styles.selected)}
                onClick={() => {
                  onOpenChange(false);
                  if (!selected) onSelect(s.hash);
                }}
              >
                <span className={styles.check} aria-hidden>
                  {selected ? <Check size={14} /> : null}
                </span>
                <span className={styles.label}>
                  {sourceLabel(s)}
                  {s.hash === recommendedHash ? <span className={styles.rec}>Best for streaming</span> : null}
                </span>
                <span className={styles.size}>{s.size}</span>
                <span className={styles.seeds}>{s.seeds} seeds</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
