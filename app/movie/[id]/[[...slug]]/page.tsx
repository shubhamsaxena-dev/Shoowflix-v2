import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache, Suspense } from "react";
import { MovieRail } from "@/components/movie/movie-rail";
import { RailSkeleton } from "@/components/movie/movie-skeleton";
import { Trailer } from "@/components/movie/detail/trailer";
import {
  CastList,
  MovieFacts,
  MovieHeader,
  StreamPicker,
  Synopsis,
} from "@/components/movie/detail/movie-detail";
import detailStyles from "@/components/movie/detail/detail.module.css";
import { fetchMovie, getSuggestions } from "@/lib/yts";
import { backdropSrc, cx, movieHref, posterSrc, SITE_NAME, SITE_URL, slugify } from "@/lib/movie-utils";
import type { YTSMovie } from "@/types/movie";

// Film details rarely change; every regeneration is an ISR write, so keep pages for 30 days.
export const revalidate = 2592000;
export const dynamicParams = true;

type Props = { params: Promise<{ id: string; slug?: string[] }> };

/** Dedupes the detail fetch between generateMetadata and the page within one render. */
const loadMovie = cache(async (rawId: string) => {
  const id = Number.parseInt(rawId, 10);
  if (!Number.isFinite(id) || id <= 0 || String(id) !== rawId) return null;
  return fetchMovie(id);
});

/** Nothing at build time: pages are rendered (and cached) the first time someone opens them. */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const movie = await loadMovie(id);
  if (!movie) return { title: "Film not found", robots: { index: false } };

  const title = movie.year ? `${movie.title} (${movie.year})` : movie.title;
  const description = truncate(
    movie.summary || movie.description_full || `Stream ${movie.title} in HD on ${SITE_NAME}.`,
    160,
  );
  const image = backdropSrc(movie) || posterSrc(movie, "lg");
  const canonical = movieHref(movie);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "video.movie",
      title,
      description,
      url: canonical,
      images: image ? [{ url: image, alt: movie.title }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export default async function MoviePage({ params }: Props) {
  const { id, slug } = await params;
  const movie = await loadMovie(id);
  if (!movie) notFound();

  const canonicalSlug = slugify(movie.title);
  if (slug?.length !== 1 || slug[0] !== canonicalSlug) permanentRedirect(movieHref(movie));

  return (
    <article>
      <script
        type="application/ld+json"
        // JSON-LD must be inline; escape "<" so a title can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(movieJsonLd(movie)).replace(/</g, "\\u003c") }}
      />

      <MovieHeader movie={movie} />

      <div className={cx("container", detailStyles.body)}>
        <div className={detailStyles.main}>
          <Synopsis movie={movie} />
          {movie.yt_trailer_code ? (
            <section className={detailStyles.section} aria-labelledby="trailer-title">
              <h2 id="trailer-title" className={detailStyles.sectionTitle}>
                Trailer
              </h2>
              <Trailer code={movie.yt_trailer_code} title={movie.title} />
            </section>
          ) : null}
          <CastList cast={movie.cast} />
          <MovieFacts movie={movie} />
        </div>
        <aside className={detailStyles.aside} aria-label="Watch options">
          <StreamPicker movie={movie} />
        </aside>
      </div>

      <div className="cv-auto">
        <Suspense fallback={<RailSkeleton />}>
          <Suggestions id={movie.id} />
        </Suspense>
      </div>
    </article>
  );
}

async function Suggestions({ id }: { id: number }) {
  const movies = await getSuggestions(id).catch(() => [] as YTSMovie[]);
  return <MovieRail title="If you liked this" eyebrow="Up next" movies={movies.filter((m) => m.id !== id)} />;
}

/* ------------------------------------------------------------------ */

function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : clean;
}

function isoDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : h ? "" : "0M"}`;
}

function movieJsonLd(movie: YTSMovie) {
  const url = `${SITE_URL}${movieHref(movie)}`;
  return {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    url,
    image: posterSrc(movie, "lg") || undefined,
    description: movie.summary || movie.description_full || undefined,
    datePublished: movie.year ? String(movie.year) : undefined,
    duration: movie.runtime ? isoDuration(movie.runtime) : undefined,
    genre: movie.genres?.length ? movie.genres : undefined,
    contentRating: movie.mpa_rating || undefined,
    inLanguage: movie.language || undefined,
    sameAs: movie.imdb_code ? `https://www.imdb.com/title/${movie.imdb_code}/` : undefined,
    actor: movie.cast?.length ? movie.cast.map((c) => ({ "@type": "Person", name: c.name })) : undefined,
    // Google requires a count; YTS only exposes likes, so the rating is omitted without them.
    aggregateRating:
      movie.rating > 0 && (movie.like_count ?? 0) > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: movie.rating,
            bestRating: 10,
            worstRating: 1,
            ratingCount: movie.like_count,
          }
        : undefined,
    trailer: movie.yt_trailer_code
      ? {
          "@type": "VideoObject",
          name: `${movie.title} trailer`,
          embedUrl: `https://www.youtube.com/embed/${movie.yt_trailer_code}`,
          thumbnailUrl: `https://i.ytimg.com/vi/${movie.yt_trailer_code}/hqdefault.jpg`,
          uploadDate: movie.date_uploaded ? movie.date_uploaded.replace(" ", "T") : undefined,
          description: `Official trailer for ${movie.title}`,
        }
      : undefined,
  };
}
