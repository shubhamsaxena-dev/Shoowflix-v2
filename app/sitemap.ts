import type { MetadataRoute } from "next";
import { listMovies } from "@/lib/yts";
import { movieHref, SITE_URL } from "@/lib/movie-utils";
import { GENRES, type YTSMovie } from "@/types/movie";

export const revalidate = 86400;

const MOVIE_PAGES = 6; // 6 × 50 = latest ~300 films (each crawled film page is an ISR write)
const PER_PAGE = 50; // YTS maximum

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/browse`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/genre`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  const genreRoutes: MetadataRoute.Sitemap = GENRES.map((g) => ({
    url: `${SITE_URL}/genre/${g}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const pages = await Promise.all(
    Array.from({ length: MOVIE_PAGES }, (_, i) =>
      listMovies({ sort_by: "date_added", order_by: "desc", limit: PER_PAGE, page: i + 1 })
        .then((r) => r.movies ?? [])
        .catch(() => [] as YTSMovie[]),
    ),
  );

  const seen = new Set<number>();
  const movieRoutes: MetadataRoute.Sitemap = [];
  for (const movie of pages.flat()) {
    if (seen.has(movie.id)) continue;
    seen.add(movie.id);
    movieRoutes.push({
      url: `${SITE_URL}${movieHref(movie)}`,
      lastModified: movie.date_uploaded_unix ? new Date(movie.date_uploaded_unix * 1000) : undefined,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  return [...staticRoutes, ...genreRoutes, ...movieRoutes];
}
