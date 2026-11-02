import "server-only";
import { prisma } from "@/lib/prisma";
import { getMovie } from "@/lib/yts";
import type { CardMovie, YTSMovie } from "@/types/movie";

/**
 * Card-sized copies of films, stored when they're added to a list. YTS has no
 * "fetch these ids" endpoint, so this is how My List avoids one request per film:
 * one findMany, plus a bounded backfill for ids saved before snapshots existed.
 */

/** Cold ids fetched from YTS at most this many at a time (each one only once, then stored). */
const BACKFILL_CONCURRENCY = 4;

function toRow(movie: YTSMovie) {
  return {
    title: movie.title,
    year: movie.year ?? 0,
    runtime: movie.runtime ?? 0,
    rating: movie.rating ?? 0,
    genres: movie.genres ?? [],
    poster: movie.medium_cover_image ?? "",
    posterLarge: movie.large_cover_image ?? "",
  };
}

function toCard(row: {
  movieId: number;
  title: string;
  year: number;
  runtime: number;
  rating: number;
  genres: string[];
  poster: string;
  posterLarge: string;
}): CardMovie {
  return {
    id: row.movieId,
    title: row.title,
    year: row.year,
    runtime: row.runtime,
    rating: row.rating,
    genres: row.genres,
    medium_cover_image: row.poster,
    large_cover_image: row.posterLarge,
  };
}

/** Store a card snapshot. Best effort: returns false instead of throwing. */
export async function saveSnapshot(movie: YTSMovie): Promise<boolean> {
  try {
    const data = toRow(movie);
    await prisma.movieSnapshot.upsert({
      where: { movieId: movie.id },
      update: data,
      create: { movieId: movie.id, ...data },
    });
    return true;
  } catch (error) {
    console.error("[movie-snapshot] save failed", movie.id, error);
    return false;
  }
}

/**
 * Fetch one film (served from the fetch cache when warm) and try to store its snapshot.
 * The card is returned even if storing fails, so the page still renders. Never throws.
 */
export async function snapshotById(movieId: number): Promise<CardMovie | null> {
  try {
    const movie = await getMovie(movieId);
    if (!movie) return null;
    await saveSnapshot(movie);
    return toCard({ movieId: movie.id, ...toRow(movie) });
  } catch (error) {
    console.error("[movie-snapshot] fetch failed", movieId, error);
    return null;
  }
}

/** Stored snapshots for `ids`; an empty list if the store can't be read (then everything falls back to YTS). */
async function readSnapshots(ids: number[]) {
  try {
    return await prisma.movieSnapshot.findMany({ where: { movieId: { in: ids } } });
  } catch (error) {
    console.error("[movie-snapshot] read failed, falling back to YTS", error);
    return [];
  }
}

/** Run `fn` over `items` with at most `limit` in flight. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]!);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * Cards for `ids`, in the same order. Snapshots come from one query; any film without one
 * (saved before snapshots existed, or the store is unavailable) is fetched from YTS at most
 * 4 at a time and stored for next time.
 */
export async function getCards(ids: number[]): Promise<CardMovie[]> {
  if (!ids.length) return [];
  const rows = await readSnapshots(ids);
  const byId = new Map<number, CardMovie>(rows.map((r) => [r.movieId, toCard(r)]));

  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) {
    const filled = await mapLimit(missing, BACKFILL_CONCURRENCY, snapshotById);
    filled.forEach((card, i) => {
      if (card) byId.set(missing[i]!, card);
    });
  }

  return ids.map((id) => byId.get(id)).filter((c): c is CardMovie => Boolean(c));
}
