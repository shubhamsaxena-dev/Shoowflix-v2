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

export async function saveSnapshot(movie: YTSMovie): Promise<void> {
  const data = toRow(movie);
  await prisma.movieSnapshot.upsert({
    where: { movieId: movie.id },
    update: data,
    create: { movieId: movie.id, ...data },
  });
}

/** Best effort: fetch (from the fetch cache when warm) and store. Never throws. */
export async function snapshotById(movieId: number): Promise<CardMovie | null> {
  try {
    const movie = await getMovie(movieId);
    if (!movie) return null;
    await saveSnapshot(movie);
    return toCard({ movieId: movie.id, ...toRow(movie) });
  } catch (error) {
    console.error("[movie-snapshot]", movieId, error);
    return null;
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

/** Cards for `ids`, in the same order. Missing snapshots are backfilled a few at a time. */
export async function getCards(ids: number[]): Promise<CardMovie[]> {
  if (!ids.length) return [];
  const rows = await prisma.movieSnapshot.findMany({ where: { movieId: { in: ids } } });
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
