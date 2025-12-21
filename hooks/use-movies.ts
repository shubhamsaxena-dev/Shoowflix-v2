import { useMemo } from "react";
import useSWRImmutable from "swr/immutable";
import useSWRInfinite from "swr/infinite";
import type { SWRInfiniteResponse } from "swr/infinite";
import type { Torrent, YTSListMoviesResponse, YTSMovie } from "@/types/movie";
import type { MovieFilters } from "@/lib/types";
import { useSwr } from "./use-swr";
import queryString from "query-string";

// ---------------- Fetcher ----------------
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
  return response.json();
};

// ---------------- Query Helpers ----------------
export const getQueryParams = (
  baseUrl: string,
  params?: { [key: string]: string | number }
) => {
  if (!params) return baseUrl;
  return `${baseUrl}?${queryString.stringify(params)}`;
};

function buildQueryString(
  filters: MovieFilters | null = {},
  page: number = 1
): string {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== 0)
        params.append(key, value.toString());
    });
  }
  return params.toString();
}

// ---------------- Infinite SWR Key ----------------
const getInfiniteKey =
  (filters: MovieFilters | null) =>
  (pageIndex: number, previousPageData: YTSListMoviesResponse | null) => {
    if (!filters) return null; // no request
    if (pageIndex === 0) return `api/movies?${buildQueryString(filters, 1)}`;
    if (!previousPageData?.data?.movies?.length) return null; // reached end
    return `api/movies?${buildQueryString(filters, pageIndex + 1)}`;
  };

// ---------------- Infinite Movies Hook ----------------
export function useMoviesInfinite(filters: MovieFilters = {}) {
  const getKey = (
    pageIndex: number,
    previousPageData: YTSListMoviesResponse | null
  ) => {
    // Stop if previous page had no movies
    if (
      previousPageData &&
      (!previousPageData.data?.movies ||
        previousPageData.data.movies.length === 0)
    ) {
      return null;
    }

    const params = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      limit: "20",
      sort_by: filters.sort_by || "date_added",
      order_by: "desc",
    });

    if (filters.genre) params.append("genre", filters.genre);
    if (filters.quality) params.append("quality", filters.quality);
    if (filters.minimum_rating)
      params.append("minimum_rating", filters.minimum_rating.toString());
    if (filters.query_term) params.append("query_term", filters.query_term);

    return `/api/movies?${params.toString()}`;
  };

  const swr = useSWRInfinite<YTSListMoviesResponse>(getKey, fetcher, {
    revalidateFirstPage: false,
    revalidateOnFocus: false,
  });

  const movies =
    swr.data?.flatMap((page) => page?.data?.movies || []).filter(Boolean) || [];
  const isEmpty = swr.data?.[0]?.data?.movies?.length === 0;
  const isLoadingInitial = !swr.data && !swr.error;
  const isLoadingMore = swr.isValidating && swr.data && swr.size > 0;
  const canLoadMore =
    swr.data &&
    swr.data.length > 0 &&
    swr.data[swr.data.length - 1]?.data?.movies?.length === 20;

  return {
    movies,
    error: swr.error,
    isLoading: isLoadingInitial,
    isLoadingMore,
    canLoadMore: canLoadMore && !isLoadingMore,
    loadMore: () => swr.setSize(swr.size + 1),
    isEmpty,
    mutate: swr.mutate,
  };
}

// ---------------- Regular Movies Hook ----------------
export function useMovies(filters: MovieFilters | null = {}) {
  const key = useMemo(
    () => getQueryParams("/movies", filters as any),
    [filters]
  );

  const { data, error, mutate, isLoading } = useSwr({ key });

  return {
    data,
    error,
    isLoading,
    mutate,
    movies: data?.data?.movies || [],
  };
}

// ---------------- Movie Details ----------------
export function useMovieDetails(movieId: number) {
  const key = useMemo(
    () => `/movies/${movieId}?with_images=true&with_cast=true`,
    [movieId]
  );
  const execute = Number.isFinite(movieId) && movieId > 0;
  const { data, error, mutate, isLoading } = useSwr({ key, execute });

  return {
    data,
    error,
    isLoading,
    mutate,
    movie: data?.data?.movie,
  };
}

// ---------------- Movie Suggestions ----------------
export function useMovieSuggestions(movieId: number) {
  const key = useMemo(() => `/movies/${movieId}/suggestions`, [movieId]);
  const { data, error, mutate, isLoading } = useSwr({ key });

  return {
    data,
    error,
    isLoading,
    mutate,
    movies: data?.data?.movies || [],
  };
}

// ---------------- Predefined Hooks ----------------
export function useTrendingMovies() {
  return useMovies({ sort_by: "download_count", order_by: "desc", limit: 20 });
}
export function useTrendingMoviesInfinite() {
  return useMoviesInfinite({
    sort_by: "download_count",
    order_by: "desc",
    limit: 20,
  });
}
export function useHighRatedMovies() {
  return useMovies({
    minimum_rating: 8,
    sort_by: "rating",
    order_by: "desc",
    limit: 20,
  });
}
export function useHighRatedMoviesInfinite() {
  return useMoviesInfinite({
    minimum_rating: 8,
    sort_by: "rating",
    order_by: "desc",
    limit: 20,
  });
}
export function useRecentMovies() {
  return useMovies({ sort_by: "year", order_by: "desc", limit: 20 });
}
export function useRecentMoviesInfinite() {
  return useMoviesInfinite({
    sort_by: "year",
    order_by: "desc",
    limit: 20,
  });
}
export function useMoviesByGenre(genre: string) {
  return useMovies({ genre, sort_by: "rating", order_by: "desc", limit: 20 });
}
export function useMoviesByGenreInfinite(
  genre: string,
  params: MovieFilters = {}
) {
  return useMoviesInfinite({
    genre,
    ...params,
    limit: 20,
  });
}
export function useSearchMoviesInfinite(
  query: string,
  filters: MovieFilters = {}
) {
  return useMoviesInfinite({ query_term: query, ...filters, limit: 20 });
}

// ---------------- Magnet Link ----------------
export async function generateMagnetLink(
  movie: YTSMovie,
  torrent: Torrent
): Promise<string> {
  const response = await fetch("/api/magnet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hash: torrent.hash, title: movie.title }),
  });
  if (!response.ok) throw new Error("Failed to generate magnet link");
  const data = await response.json();
  return data.magnetLink;
}
