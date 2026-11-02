import Link from "next/link";
import { useId } from "react";
import { ArrowUpRight } from "lucide-react";
import { cx } from "@/lib/movie-utils";
import type { YTSMovie } from "@/types/movie";
import { MovieCard } from "./movie-card";
import { RailControls } from "./rail-controls";
import styles from "./movie-rail.module.css";

/**
 * Server-renderable horizontal rail. Only the prev/next buttons hydrate.
 * `numbered` turns it into a ranked chart with display numerals.
 */
export function MovieRail({
  title,
  href,
  movies,
  eyebrow,
  numbered = false,
  className,
}: {
  title: string;
  href?: string;
  movies: YTSMovie[];
  eyebrow?: string;
  numbered?: boolean;
  className?: string;
}) {
  const id = useId();
  const trackId = `rail-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const headingId = `${trackId}-title`;
  if (!movies.length) return null;

  return (
    <section className={cx(styles.rail, numbered && styles.numbered, className)} aria-labelledby={headingId}>
      <div className={cx("container", styles.head)}>
        <div className={styles.heading}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <h2 id={headingId} className={styles.title}>
            {title}
          </h2>
        </div>
        <div className={styles.actions}>
          {href && (
            <Link href={href} className={styles.seeAll}>
              See all
              <ArrowUpRight aria-hidden />
            </Link>
          )}
          <RailControls trackId={trackId} label={title} />
        </div>
      </div>
      <ul role="list" id={trackId} className={styles.track} tabIndex={-1}>
        {movies.map((movie, i) => (
          <li key={movie.id} className={styles.item}>
            <MovieCard movie={movie} rank={numbered ? i + 1 : undefined} />
          </li>
        ))}
      </ul>
    </section>
  );
}
