"use client";

import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { fetcher, toQuery } from "@/lib/swr";
import { PAGE_SIZE } from "@/components/discovery/catalog";
import type { MovieFilters, YTSMovie } from "@/types/movie";

/** Shape of `GET /api/movies` (mirrors lib/yts.listMovies). */
export interface MoviesPage {
  movie_count: number;
  limit: number;
  page_number: number;
  movies: YTSMovie[];
}

export function moviesKey(filters: MovieFilters, page = 1): string {
  return `/api/movies${toQuery({ limit: PAGE_SIZE, ...filters, page })}`;
}

/**
 * Paged catalog for infinite scroll.
 * Pass the server-rendered first page as `fallbackFirstPage` so the initial render
 * is the ISR/SSR HTML and SWR does not refetch page 1 on mount.
 */
export function useMoviesInfinite(filters: MovieFilters, fallbackFirstPage?: MoviesPage) {
  const limit = filters.limit ?? PAGE_SIZE;

  const swr = useSWRInfinite<MoviesPage>(
    (index, previous) => {
      if (previous && (previous.movies.length < limit || previous.page_number * limit >= previous.movie_count)) {
        return null; // reached the end
      }
      return moviesKey({ ...filters, limit }, index + 1);
    },
    fetcher,
    {
      fallbackData: fallbackFirstPage ? [fallbackFirstPage] : undefined,
      revalidateOnMount: !fallbackFirstPage,
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      persistSize: false,
    },
  );

  const pages = swr.data ?? [];
  const movies = dedupe(pages.flatMap((p) => p.movies ?? []));
  const total = pages[0]?.movie_count ?? 0;
  const last = pages[pages.length - 1];
  const isEnd = !!last && (last.movies.length < limit || last.page_number * limit >= last.movie_count);
  const isLoadingMore = swr.isLoading || (swr.size > 0 && typeof swr.data?.[swr.size - 1] === "undefined");

  return {
    movies,
    total,
    isEnd,
    isEmpty: !!last && total === 0,
    isLoading: swr.isLoading,
    isLoadingMore,
    error: swr.error as Error | undefined,
    loadMore: () => swr.setSize((s) => s + 1),
    retry: () => swr.mutate(),
  };
}

/**
 * Single-page search for type-ahead UIs. Debounce the query in the caller;
 * `keepPreviousData` keeps the last results on screen while the next query loads.
 */
export function useMovieSearch(query: string, opts: { limit?: number; minLength?: number } = {}) {
  const { limit = 8, minLength = 2 } = opts;
  const q = query.trim();
  const key = q.length >= minLength ? moviesKey({ query_term: q, limit, sort_by: "download_count" }) : null;

  const { data, error, isLoading, isValidating } = useSWR<MoviesPage>(key, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  return {
    movies: key ? (data?.movies ?? []) : [],
    total: key ? (data?.movie_count ?? 0) : 0,
    isLoading,
    isValidating,
    error: error as Error | undefined,
  };
}

function dedupe(movies: YTSMovie[]): YTSMovie[] {
  const seen = new Set<number>();
  return movies.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
}
