/**
 * Shared catalog constants + URL <-> filter mapping.
 * No "use client" here on purpose: imported by Server Components (first page)
 * and by client hooks (pages 2+) so both sides agree on keys and page size.
 */
import { GENRES, type Genre, type MovieFilters, type SortBy, type YTSMovie } from "@/types/movie";

/** Divisible by 2, 3, 4 and 6 so grid rows end flush. */
export const PAGE_SIZE = 24;

export const SORTS = [
  { value: "latest", label: "Latest", sort_by: "date_added" },
  { value: "rated", label: "Top rated", sort_by: "rating" },
  { value: "popular", label: "Popular", sort_by: "download_count" },
  { value: "year", label: "Year", sort_by: "year" },
] as const satisfies ReadonlyArray<{ value: string; label: string; sort_by: SortBy }>;

export type SortKey = (typeof SORTS)[number]["value"];
export const DEFAULT_SORT: SortKey = "latest";

export function sortKeyToSortBy(key: string | null | undefined): SortBy {
  return SORTS.find((s) => s.value === key)?.sort_by ?? "date_added";
}

export function isSortKey(key: string | null | undefined): key is SortKey {
  return SORTS.some((s) => s.value === key);
}

export const QUALITIES = ["720p", "1080p", "2160p", "3D"] as const;
export const MIN_RATINGS = [5, 6, 7, 8, 9] as const;

export function isGenre(value: string | null | undefined): value is Genre {
  return !!value && (GENRES as readonly string[]).includes(value);
}

export function genreLabel(genre: string): string {
  if (genre === "sci-fi") return "Sci‑Fi";
  return genre.charAt(0).toUpperCase() + genre.slice(1);
}

/** YTS returns display genres ("Sci-Fi", "Film-Noir"); map to our route slug when we have one. */
export function genreSlug(display: string): string | null {
  const slug = display.toLowerCase();
  return isGenre(slug) ? slug : null;
}

/** One line per genre — used on tiles, genre headers and meta descriptions. */
export const GENRE_NOTES: Record<Genre, string> = {
  action: "Car chases, last stands and stunts done for real.",
  adventure: "Maps, expeditions and a long way from home.",
  animation: "Hand-drawn, stop-motion and pixel-perfect worlds.",
  biography: "Real lives, told at feature length.",
  comedy: "Deadpan, slapstick and everything between.",
  crime: "Heists, informants and the long arm of the law.",
  documentary: "True stories with the cameras rolling.",
  drama: "People under pressure, up close.",
  family: "Films the whole sofa can agree on.",
  fantasy: "Dragons, curses and other kingdoms.",
  history: "Wars, courts and turning points, restaged.",
  horror: "Lights off, volume up.",
  music: "Bands, tours and the songs that made them.",
  musical: "When talking isn't enough, they sing.",
  mystery: "Clues, red herrings and a final reveal.",
  romance: "Meet-cutes, slow burns and grand gestures.",
  "sci-fi": "Spaceships, androids and the near future.",
  sport: "Underdogs, rivalries and the final whistle.",
  thriller: "Tension that holds until the credits.",
  war: "Frontlines, home fronts and the cost of both.",
  western: "Dust, revolvers and wide open country.",
};

/** Browse URL state → YTS filters (validated; unknown values are dropped). */
export interface BrowseParams {
  genre?: string;
  quality?: string;
  rating?: string;
  sort?: string;
  order?: string;
}

export function browseParamsToFilters(p: BrowseParams): MovieFilters {
  const rating = Number(p.rating);
  return {
    genre: isGenre(p.genre) ? p.genre : undefined,
    quality: (QUALITIES as readonly string[]).includes(p.quality ?? "") ? p.quality : undefined,
    minimum_rating: (MIN_RATINGS as readonly number[]).includes(rating) ? rating : undefined,
    sort_by: sortKeyToSortBy(p.sort),
    order_by: p.order === "asc" ? "asc" : "desc",
    limit: PAGE_SIZE,
  };
}

export function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** lib/yts types `movies` as optional; normalise to the `/api/movies` page shape. */
export function asPage<T extends { movie_count: number; limit: number; page_number: number; movies?: YTSMovie[] }>(
  r: T,
): { movie_count: number; limit: number; page_number: number; movies: YTSMovie[] } {
  return { movie_count: r.movie_count, limit: r.limit, page_number: r.page_number, movies: r.movies ?? [] };
}
