import "server-only";
import { unstable_cache } from "next/cache";
import type {
  YTSListMoviesResponse,
  YTSMovie,
  YTSMovieDetailsResponse,
  MovieFilters,
} from "@/types/movie";

/**
 * Server-side YTS data layer.
 * Used by Server Components (SSG/ISR) and by Route Handlers (/api/*).
 * Every call goes through Next's data cache with time-based revalidation + tags (see ytsFetch),
 * so pages built with these are statically generated and revalidated (ISR).
 */

/**
 * YTS mirrors, tried in order until one answers. NEXT_PUBLIC_API_ROOT takes a comma-separated
 * list; mirrors come and go (and some ISPs reset connections to some of them), so keep a few.
 */
const DEFAULT_API_ROOTS = [
  "https://movies-api.accel.li/api/v2", // official base URL; yts.gg "may be retired"
  "https://yts.gg/api/v2",
  "https://yts.mx/api/v2",
  "https://yts.lt/api/v2",
];
const API_ROOTS = (process.env.NEXT_PUBLIC_API_ROOT ?? "")
  .split(",")
  .map((root) => root.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const ROOTS = API_ROOTS.length ? API_ROOTS : DEFAULT_API_ROOTS;

/** Index of the last mirror that answered, so a dead mirror isn't retried first on every call. */
let preferredRoot = 0;

/**
 * YTS serves images from yts.gg/assets/*, which 301s to img.yts.gg. Point straight at the
 * image host to skip a redirect hop on every poster.
 */
const IMAGE_FIELDS = [
  "background_image",
  "background_image_original",
  "small_cover_image",
  "medium_cover_image",
  "large_cover_image",
] as const;

function directImage(url: string | undefined): string {
  return url ? url.replace(/^https?:\/\/(?:www\.)?yts\.[a-z]+\/assets\//, (m) => m.replace(/\/\/(?:www\.)?yts\./, "//img.yts.")) : "";
}

export function normalizeMovie(movie: YTSMovie): YTSMovie {
  const out = { ...movie };
  for (const field of IMAGE_FIELDS) out[field] = directImage(movie[field]);
  if (movie.torrents) out.torrents = movie.torrents.map((t) => ({ ...t, url: t.url?.replace(/^http:\/\//, "https://") ?? "" }));
  if (movie.cast) out.cast = movie.cast.map((c) => ({ ...c, url_small_image: directImage(c.url_small_image) || undefined }));
  return out;
}

/**
 * Public pages and APIs never carry torrent data (hashes, .torrent URLs). Lists, rails,
 * search and suggestions don't need it, and anything handed to a client component ends up
 * in the page's RSC payload. Only getMovie() keeps torrents, for the server-rendered quality
 * list and the gated /watch page.
 */
export function withoutTorrents(movie: YTSMovie): YTSMovie {
  return { ...movie, torrents: [] };
}

/** YTS mirrors occasionally hang; never let one request stall a render/build worker. */
const TIMEOUT_MS = 10_000;
const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";

export const REVALIDATE = {
  list: 60 * 30, // 30 min — catalog rails
  detail: 60 * 60 * 6, // 6 h — a movie's details rarely change
  suggestions: 60 * 60 * 12,
} as const;

export const TAGS = {
  movies: "movies",
  movie: (id: number | string) => `movie:${id}`,
} as const;

function toParams(filters: MovieFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "" || value === 0) continue;
    params.set(key, String(value));
  }
  params.sort(); // same query, same cache key, whatever order the filters were written in
  return params;
}

/**
 * Caching and politeness. The YTS API asks clients to cache responses and keep request rates
 * reasonable, so every call goes through three layers:
 *
 * 1. Data cache (unstable_cache), keyed by API path, not by mirror: a response from any mirror
 *    serves everyone, and switching mirrors doesn't cold-start the cache. Stale entries are
 *    served while a background refresh runs; if that refresh fails on every mirror, Next keeps
 *    the stale entry, so an outage shows the last good data instead of empty pages.
 * 2. In-flight dedup: identical concurrent misses share one upstream request.
 * 3. Concurrency cap: at most MAX_CONCURRENT upstream requests at once per server instance
 *    (the sitemap and genre showcase would otherwise fire 20+ in parallel).
 */
const MAX_CONCURRENT = 4;
let active = 0;
const waiting: Array<() => void> = [];

async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) await new Promise<void>((resolve) => waiting.push(resolve));
  active++;
  try {
    return await task();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

const inFlight = new Map<string, Promise<unknown>>();

function ytsFetch<T extends { status?: string }>(
  path: string,
  init: { revalidate: number; tags: string[] },
): Promise<T> {
  const cached = unstable_cache(
    () => {
      let pending = inFlight.get(path) as Promise<T> | undefined;
      if (!pending) {
        pending = withSlot(() => fetchFromMirrors<T>(path)).finally(() => inFlight.delete(path));
        inFlight.set(path, pending);
      }
      return pending;
    },
    ["yts", path],
    { revalidate: init.revalidate, tags: init.tags },
  );
  return cached();
}

async function fetchFromMirrors<T extends { status?: string }>(path: string): Promise<T> {
  // Start at the last good mirror, then walk the rest. A lone mirror gets one retry.
  const order = ROOTS.map((_, i) => (preferredRoot + i) % ROOTS.length);
  if (order.length === 1) order.push(order[0]);

  let lastError: unknown;
  for (const index of order) {
    const root = ROOTS[index];
    try {
      // Cached one level up by unstable_cache, so skip the per-URL fetch cache here.
      const res = await fetch(`${root}${path}`, {
        cache: "no-store",
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as T;
      // Lookalike mirrors serve a different schema; only a real YTS "ok" counts.
      if (json?.status !== "ok") throw new Error(`unexpected response (status: ${json?.status ?? "none"})`);
      preferredRoot = index;
      return json;
    } catch (error) {
      lastError = error;
      if (ROOTS.length > 1) console.warn(`[yts] ${new URL(root).host}${path.split("?")[0]} failed: ${(error as Error).message}`);
    }
  }
  throw new Error(`YTS ${path} failed on every mirror: ${(lastError as Error)?.message}`);
}

export async function listMovies(
  filters: MovieFilters = {},
): Promise<{ movie_count: number; limit: number; page_number: number; movies: YTSMovie[] }> {
  const params = toParams({ limit: 20, page: 1, sort_by: "date_added", order_by: "desc", ...filters });
  let json: YTSListMoviesResponse;
  try {
    json = await ytsFetch<YTSListMoviesResponse>(`/list_movies.json?${params}`, {
      revalidate: REVALIDATE.list,
      tags: [TAGS.movies],
    });
  } catch (error) {
    // At runtime, throw so ISR keeps serving the last good page.
    // At build time, degrade to an empty page instead of failing the deploy; ISR fills it in on the next revalidate.
    if (!IS_BUILD) throw error;
    console.warn(`[yts] build-time fetch failed, rendering empty list: ${(error as Error).message}`);
    return { movie_count: 0, limit: Number(filters.limit ?? 20), page_number: Number(filters.page ?? 1), movies: [] };
  }
  return {
    movie_count: json.data?.movie_count ?? 0,
    limit: json.data?.limit ?? 20,
    page_number: json.data?.page_number ?? 1,
    movies: (json.data?.movies ?? []).map((m) => withoutTorrents(normalizeMovie(m))),
  };
}

export async function getMovie(id: number): Promise<YTSMovie | null> {
  if (!Number.isFinite(id) || id <= 0) return null;
  try {
    const json = await ytsFetch<YTSMovieDetailsResponse>(
      `/movie_details.json?movie_id=${id}&with_images=true&with_cast=true`,
      { revalidate: REVALIDATE.detail, tags: [TAGS.movie(id)] },
    );
    const movie = json.data?.movie;
    return movie && movie.id ? normalizeMovie(movie) : null;
  } catch {
    return null;
  }
}

export async function getSuggestions(id: number): Promise<YTSMovie[]> {
  try {
    const json = await ytsFetch<YTSListMoviesResponse>(`/movie_suggestions.json?movie_id=${id}`, {
      revalidate: REVALIDATE.suggestions,
      tags: [TAGS.movie(id)],
    });
    const movies = json.data?.movies ?? [];
    if (movies.length) return movies.map((m) => withoutTorrents(normalizeMovie(m)));
  } catch {
    /* fall through to fallback */
  }
  const fallback = await listMovies({ sort_by: "rating", minimum_rating: 7, limit: 12 });
  return fallback.movies.filter((m) => m.id !== id);
}

/** Curated rails used on the home page. Keys are stable — use them as React keys/SWR keys. */
export const RAILS = {
  trending: { title: "Trending now", filters: { sort_by: "download_count", order_by: "desc" } },
  latest: { title: "Fresh arrivals", filters: { sort_by: "date_added", order_by: "desc" } },
  acclaimed: { title: "Critically adored", filters: { sort_by: "rating", minimum_rating: 8, order_by: "desc" } },
  loved: { title: "Audience favourites", filters: { sort_by: "like_count", order_by: "desc" } },
} as const satisfies Record<string, { title: string; filters: MovieFilters }>;

export type RailKey = keyof typeof RAILS;
