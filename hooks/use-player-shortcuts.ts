"use client";

import { useEffect, useRef } from "react";

export type ShortcutMap = Partial<Record<"Escape" | "f" | "q" | "i" | "n" | "?", () => void>>;

export const PLAYER_SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["F"], label: "Toggle fullscreen" },
  { keys: ["Q"], label: "Choose quality" },
  { keys: ["I"], label: "Film details" },
  { keys: ["N"], label: "Up next" },
  { keys: ["?"], label: "Show shortcuts" },
  { keys: ["Esc"], label: "Close panel, exit fullscreen, then leave" },
];

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

/**
 * Global player shortcuts. Handlers are read from a ref so callers can pass a fresh
 * object every render without re-binding listeners. Shortcuts only work while focus is
 * on our page — keys pressed inside the cross-origin player iframe never reach us.
 */
export function usePlayerShortcuts(map: ShortcutMap) {
  const ref = useRef(map);
  useEffect(() => {
    ref.current = map;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      const key = e.key === "Escape" ? "Escape" : e.key === "?" ? "?" : e.key.toLowerCase();
      const handler = ref.current[key as keyof ShortcutMap];
      if (!handler) return;
      e.preventDefault();
      handler();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
