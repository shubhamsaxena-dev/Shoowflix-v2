"use client";

import { FallbackImage } from "@/components/ui/fallback-image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import useSWR from "swr";
import { ArrowRight, CornerDownLeft, Search, Star } from "lucide-react";
import { useModalDialog } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { ChipLink } from "@/components/ui/chip";
import { movieHref, cx } from "@/lib/movie-utils";
import { toQuery } from "@/lib/swr";
import { GENRES, type YTSMovie } from "@/types/movie";
import styles from "./command-search.module.css";

type SearchResponse = { movie_count: number; movies: YTSMovie[] };

const QUICK_GENRES = GENRES.filter((g) =>
  ["action", "comedy", "drama", "horror", "sci-fi", "animation", "thriller", "romance"].includes(g),
);

function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function CommandSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const listId = useId();
  useModalDialog(ref, open, onOpenChange);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const term = useDebounced(query.trim());
  const searching = term.length >= 2;

  const { data, isLoading, error } = useSWR<SearchResponse>(
    searching ? `/api/movies${toQuery({ query_term: term, limit: 8 })}` : null,
    { keepPreviousData: true },
  );
  const movies = searching ? (data?.movies ?? []) : [];
  const pending = query.trim() !== term || (searching && isLoading);
  // Options = movies + a trailing "see all results" row.
  const optionCount = searching ? movies.length + 1 : 0;

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [open]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const choose = (index: number) => {
    if (index < movies.length) go(movieHref(movies[index]));
    else if (term) go(`/search?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && optionCount) {
      e.preventDefault();
      setActive((i) => (i + 1) % optionCount);
    } else if (e.key === "ArrowUp" && optionCount) {
      e.preventDefault();
      setActive((i) => (i - 1 + optionCount) % optionCount);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (optionCount) choose(Math.min(active, optionCount - 1));
      else if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  useEffect(() => {
    document.getElementById(`${listId}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, listId]);

  const activeId = optionCount ? `${listId}-opt-${Math.min(active, optionCount - 1)}` : undefined;

  return (
    <dialog ref={ref} className={styles.dialog} aria-label="Search films">
      {open ? (
        <div className={styles.panel}>
          <div className={styles.bar}>
            {pending && searching ? (
              <Spinner size="sm" label={null} className={styles.barIcon} />
            ) : (
              <Search className={styles.barIcon} aria-hidden />
            )}
            <input
              ref={inputRef}
              className={styles.input}
              type="search"
              placeholder="Search by title, actor or IMDb code"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
              role="combobox"
              aria-expanded={optionCount > 0}
              aria-controls={listId}
              aria-activedescendant={activeId}
              aria-autocomplete="list"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
            />
            <button type="button" className={styles.esc} onClick={() => onOpenChange(false)}>
              <span className={styles.escDesktop}>
                <Kbd>Esc</Kbd>
              </span>
              <span className={styles.escMobile}>Cancel</span>
            </button>
          </div>

          <div className={styles.body}>
            {!searching ? (
              <div className={styles.idle}>
                <p className={styles.idleTitle}>Start typing to search the catalogue</p>
                <p className={styles.idleHint}>Or jump straight into a genre</p>
                <div className={styles.genres}>
                  {QUICK_GENRES.map((g) => (
                    <ChipLink key={g} href={`/genre/${g}`} size="sm" onClick={() => onOpenChange(false)}>
                      {g === "sci-fi" ? "Sci-Fi" : g}
                    </ChipLink>
                  ))}
                </div>
              </div>
            ) : error ? (
              <p className={styles.message} role="alert">
                Search is unavailable right now. Try again in a moment.
              </p>
            ) : (
              <ul id={listId} role="listbox" aria-label="Results" className={styles.list}>
                {!pending && movies.length === 0 ? (
                  <li role="presentation" className={styles.message}>
                    No films match “{term}”. Check the spelling or try a shorter title.
                  </li>
                ) : null}
                {movies.map((m, i) => (
                  <li
                    key={m.id}
                    id={`${listId}-opt-${i}`}
                    role="option"
                    aria-selected={active === i}
                    className={cx(styles.option, active === i && styles.optionActive)}
                    onPointerMove={() => setActive(i)}
                    onClick={() => choose(i)}
                  >
                    <span className={styles.thumb}>
                      {m.small_cover_image || m.medium_cover_image ? (
                        <FallbackImage
                          src={m.medium_cover_image || m.small_cover_image}
                          alt=""
                          fill
                          sizes="48px"
                          quality={60}
                        />
                      ) : null}
                    </span>
                    <span className={styles.meta}>
                      <span className={styles.title}>{m.title}</span>
                      <span className={styles.sub}>
                        <span className="mono">{m.year}</span>
                        {m.rating ? (
                          <span className={cx("mono", styles.rating)}>
                            <Star aria-hidden />
                            {m.rating.toFixed(1)}
                          </span>
                        ) : null}
                        {m.genres?.length ? <span className={styles.genreText}>{m.genres.slice(0, 2).join(", ")}</span> : null}
                      </span>
                    </span>
                    <CornerDownLeft className={styles.enter} aria-hidden />
                  </li>
                ))}
                <li
                  id={`${listId}-opt-${movies.length}`}
                  role="option"
                  aria-selected={active === movies.length}
                  className={cx(styles.option, styles.all, active === movies.length && styles.optionActive)}
                  onPointerMove={() => setActive(movies.length)}
                  onClick={() => choose(movies.length)}
                >
                  <span>
                    See all results for <strong>“{term}”</strong>
                  </span>
                  <ArrowRight className={styles.enter} aria-hidden />
                </li>
              </ul>
            )}
          </div>

          <footer className={styles.footer} aria-hidden>
            <span>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> to move
            </span>
            <span>
              <Kbd>↵</Kbd> to open
            </span>
            <Link href="/browse" className={styles.footerLink} onClick={() => onOpenChange(false)} tabIndex={-1}>
              Browse with filters
            </Link>
          </footer>
        </div>
      ) : null}
    </dialog>
  );
}
