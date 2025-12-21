import { useMemo } from "react";
import useSWRImmutable from "swr/immutable";
import useSWRInfinite from "swr/infinite";
import type { MovieFilters } from "@/lib/types";
import type {
  YTSListMoviesResponse,
  YTSMovieDetailsResponse,
  YTSMovie,
  Torrent,
} from "@/types/movie";
import queryString from "query-string";
import { useSwr } from "./use-swr";

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
export function useMoviesInfinite(filters: MovieFilters | null = {}) {
  const keyFn = useMemo(() => getInfiniteKey(filters), [filters]);

  const { data, error, size, setSize, isValidating, mutate } =
    useSWRInfinite<YTSListMoviesResponse>(keyFn, fetcher);

  const movies = useMemo(
    () =>
      data?.reduce<YTSMovie[]>((acc, page) => {
        if (page.data?.movies) return [...acc, ...page.data.movies];
        return acc;
      }, []) || [],
    [data]
  );

  const canLoadMore =
    data &&
    data[data.length - 1]?.data?.movies?.length ===
      parseInt(filters?.limit?.toString() || "20");

  const loadMore = () => {
    if (canLoadMore && !isValidating) setSize(size + 1);
  };

  return {
    movies,
    error,
    isLoading: !data && !error,
    //@ts-ignore
    isLoadingMore: isValidating && data?.length > 0,
    canLoadMore,
    loadMore,
    mutate,
    size,
    isEmpty: data?.[0]?.data?.movies?.length === 0,
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
    sort_by: "date_added",
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
