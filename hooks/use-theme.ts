"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

const EVENT = "shoowflix:theme";

function read(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key !== "theme") return;
    const next = e.newValue === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Theme preference. Dark ("Projection") is the default; light is "Matinee".
 * Persists to localStorage.theme and sets <html data-theme>, which the inline
 * script in app/layout.tsx re-applies before paint on the next load. Syncs across tabs.
 */
export function useTheme() {
  const theme = useSyncExternalStore<Theme>(subscribe, read, () => "dark");

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage blocked — theme still applies for this page view */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const toggle = useCallback(() => setTheme(read() === "dark" ? "light" : "dark"), [setTheme]);

  return { theme, setTheme, toggle };
}
