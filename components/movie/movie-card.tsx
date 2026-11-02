import { FallbackImage } from "@/components/ui/fallback-image";
import Link from "next/link";
import { Star } from "lucide-react";
import { WatchlistButton } from "@/components/account/watchlist-button";
import { cx, formatRuntime, movieHref, posterSrc } from "@/lib/movie-utils";
import type { YTSMovie } from "@/types/movie";
import styles from "./movie-card.module.css";

/** Default for rail cards; grids pass their own. Keep in sync with movie-card.module.css widths. */
export const RAIL_CARD_SIZES = "(min-width: 1024px) 200px, (min-width: 640px) 172px, 42vw";

export function MovieCard({
  movie,
  priority = false,
  sizes = RAIL_CARD_SIZES,
  rank,
  className,
}: {
  movie: YTSMovie;
  priority?: boolean;
  sizes?: string;
  /** Renders a large display numeral beside the poster (Trending rail). */
  rank?: number;
  className?: string;
}) {
  const href = movieHref(movie);
  const runtime = formatRuntime(movie.runtime);
  const rating = movie.rating ? movie.rating.toFixed(1) : null;
  const genres = (movie.genres ?? []).slice(0, 2);

  return (
    <article className={cx(styles.card, rank !== undefined && styles.ranked, className)}>
      {rank !== undefined && (
        <span className={styles.rank} aria-hidden>
          {rank}
        </span>
      )}
      <div className={styles.frame}>
        <Link href={href} className={styles.link} prefetch={false}>
          <div className={styles.poster}>
            <FallbackImage
              src={posterSrc(movie, "lg")}
              alt=""
              fill
              sizes={sizes}
              quality={70}
              loading={priority ? "eager" : "lazy"}
              className={styles.img}
              fallback={
                <span className={styles.noPoster} aria-hidden>
                  <span className={styles.noPosterTitle}>{movie.title}</span>
                  {movie.year ? <span className={styles.noPosterYear}>{movie.year}</span> : null}
                </span>
              }
            />
            <div className={styles.reveal} aria-hidden>
              <dl className={styles.slate}>
                {movie.year ? (
                  <div>
                    <dt>Year</dt>
                    <dd>{movie.year}</dd>
                  </div>
                ) : null}
                {runtime ? (
                  <div>
                    <dt>Runtime</dt>
                    <dd>{runtime}</dd>
                  </div>
                ) : null}
                {rating ? (
                  <div>
                    <dt>IMDb</dt>
                    <dd className={styles.rating}>{rating}</dd>
                  </div>
                ) : null}
              </dl>
              {genres.length > 0 && <p className={styles.genres}>{genres.join(" / ")}</p>}
            </div>
          </div>
          <h3 className={styles.title}>{movie.title}</h3>
          <p className={styles.meta}>
            <span>{movie.year}</span>
            {rating && (
              <span className={styles.metaRating}>
                <Star aria-hidden />
                <span className="visually-hidden">Rated </span>
                {rating}
              </span>
            )}
          </p>
        </Link>
        <div className={styles.save}>
          <WatchlistButton movieId={movie.id} variant="icon" size="sm" title={movie.title} />
        </div>
      </div>
    </article>
  );
}
