"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Search } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { OPEN_SEARCH_EVENT } from "./search-events";
import styles from "./search-trigger.module.css";

const loadCommandSearch = () => import("./command-search");
const CommandSearch = dynamic(() => loadCommandSearch().then((m) => m.CommandSearch), { ssr: false });

const noop = () => () => {};
const isMac = () => /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

export function SearchTrigger() {
  const [open, setOpen] = useState(false);
  // Mount the palette only after first use so its JS stays off the critical path.
  const [mounted, setMounted] = useState(false);
  const mac = useSyncExternalStore(noop, isMac, () => null);

  const show = useCallback(() => {
    setMounted(true);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName ?? "");
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setMounted(true);
        setOpen((o) => !o);
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, show);
    };
  }, [show]);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={show}
        onPointerEnter={() => void loadCommandSearch()}
        onFocus={() => void loadCommandSearch()}
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+K Control+K /"
        aria-label="Search films"
      >
        <Search className={styles.icon} aria-hidden />
        <span className={styles.label}>Search films</span>
        {mac !== null ? (
          <span className={styles.keys} aria-hidden>
            <Kbd>{mac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>K</Kbd>
          </span>
        ) : null}
      </button>
      {mounted ? <CommandSearch open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}
