"use client";

import { useEffect } from "react";
import { MovieGrid } from "@/components/movie/movie-grid";
import { GridSkeleton } from "@/components/movie/movie-skeleton";
import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/use-in-view";
import { useMoviesInfinite, type MoviesPage } from "@/hooks/use-movies";
import type { MovieFilters } from "@/types/movie";
import { PAGE_SIZE } from "./catalog";
import styles from "./discovery.module.css";

/**
 * Grid + infinite scroll. Page 1 arrives from the server as `fallback` (already in the HTML);
 * a sentinel 800px below the fold pulls pages 2+ through SWR.
 * Remount with a `key` when filters change so pagination state resets.
 */
export function InfiniteMovies({
  filters,
  fallback,
  empty,
  priorityCount = 0,
}: {
  filters: MovieFilters;
  fallback?: MoviesPage;
  empty?: React.ReactNode;
  priorityCount?: number;
}) {
  const { movies, total, isEnd, isEmpty, isLoading, isLoadingMore, error, loadMore, retry } = useMoviesInfinite(
    filters,
    fallback,
  );
  const [sentinel, inView] = useInView({ rootMargin: "800px 0px", disabled: isEnd || !!error });

  useEffect(() => {
    if (inView && !isLoadingMore && !isEnd && !error) void loadMore();
  }, [inView, isLoadingMore, isEnd, error, loadMore]);

  if (isLoading && !movies.length) return <GridSkeleton count={filters.limit ?? PAGE_SIZE} />;
  if (isEmpty) return <>{empty}</>;

  return (
    <div className={styles.feed}>
      <MovieGrid movies={movies} priorityCount={priorityCount} />

      {isLoadingMore && !isEnd && <GridSkeleton count={6} />}

      <div ref={sentinel} className={styles.sentinel} aria-hidden />

      <p className={styles.feedStatus} role="status">
        {error ? (
          <>
            <span>That reel didn&apos;t load.</span>
            <Button variant="outline" size="sm" onClick={() => retry()}>
              Try again
            </Button>
          </>
        ) : isEnd && movies.length ? (
          <span className="mono">
            End of reel · {movies.length.toLocaleString("en-US")} of {total.toLocaleString("en-US")} films
          </span>
        ) : !isLoadingMore ? (
          <Button variant="ghost" size="sm" onClick={() => loadMore()}>
            Load more
          </Button>
        ) : (
          <span className="visually-hidden">Loading more films</span>
        )}
      </p>
    </div>
  );
}
