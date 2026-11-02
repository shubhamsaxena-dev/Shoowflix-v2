"use client";

import Form from "next/form";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import styles from "./discovery.module.css";

/**
 * Search field for /search. Works without JS (GET form via next/form);
 * with JS it updates `?q=` as you type (debounced) so the server re-renders results.
 */
export function SearchBox() {
  const router = useRouter();
  const urlQuery = (useSearchParams().get("q") ?? "").trim();
  const [value, setValue] = useState(urlQuery);
  const [initialQuery] = useState(urlQuery);
  const [pending, startTransition] = useTransition();
  const timer = useRef<number | undefined>(undefined);
  const [lastPushed, setLastPushed] = useState(urlQuery);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Follow external navigations (suggestion links, back/forward) without clobbering typing.
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    if (urlQuery !== lastPushed) {
      setLastPushed(urlQuery);
      setValue(urlQuery);
    }
  }

  const push = (q: string) => {
    const trimmed = q.trim();
    if (trimmed === lastPushed) return;
    setLastPushed(trimmed);
    startTransition(() =>
      router.replace(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search", { scroll: false }),
    );
  };

  const onChange = (q: string) => {
    setValue(q);
    window.clearTimeout(timer.current);
    if (q.trim().length === 0 || q.trim().length >= 2) {
      timer.current = window.setTimeout(() => push(q), 350);
    }
  };

  return (
    <Form action="/search" className={styles.searchForm} role="search" onSubmit={() => window.clearTimeout(timer.current)}>
      <Search className={styles.searchIcon} aria-hidden />
      <label htmlFor="search-q" className="visually-hidden">
        Search films
      </label>
      <input
        id="search-q"
        name="q"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Title, actor, year…"
        autoComplete="off"
        enterKeyHint="search"
        spellCheck={false}
        autoFocus={!initialQuery}
        className={styles.searchInput}
      />
      <span className={styles.searchTrail}>
        {pending ? (
          <Spinner size="sm" label="Searching" />
        ) : value ? (
          <button
            type="button"
            className={styles.searchClear}
            onClick={() => {
              onChange("");
              push("");
            }}
            aria-label="Clear search"
          >
            <X aria-hidden />
          </button>
        ) : null}
      </span>
    </Form>
  );
}
