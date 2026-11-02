"use client";

import { useSearchParams } from "next/navigation";
import type { MoviesPage } from "@/hooks/use-movies";
import { DEFAULT_SORT, PAGE_SIZE, isSortKey, sortKeyToSortBy, type SortKey } from "./catalog";
import { InfiniteMovies } from "./infinite-movies";
import { SortChips } from "./sort-chips";
import styles from "./discovery.module.css";

/**
 * Genre listing. The page is statically generated with the default sort, so `?sort=`
 * is read on the client only. Sorting uses history.replaceState (Next syncs it with
 * useSearchParams) — no server round-trip for a static page.
 */
export function GenreFeed({ genre, firstPage }: { genre: string; firstPage: MoviesPage }) {
  const params = useSearchParams();
  const raw = params.get("sort");
  const sort: SortKey = isSortKey(raw) ? raw : DEFAULT_SORT;

  const setSort = (key: SortKey) => {
    const next = new URLSearchParams(params.toString());
    if (key === DEFAULT_SORT) next.delete("sort");
    else next.set("sort", key);
    const qs = next.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  };

  const filters = { genre, sort_by: sortKeyToSortBy(sort), order_by: "desc" as const, limit: PAGE_SIZE };

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.count}>
          <span className="mono">{firstPage.movie_count.toLocaleString("en-US")}</span> films
        </p>
        <SortChips value={sort} onChange={setSort} />
      </div>
      <InfiniteMovies
        key={sort}
        filters={filters}
        fallback={sort === DEFAULT_SORT ? firstPage : undefined}
        priorityCount={0}
      />
    </>
  );
}
