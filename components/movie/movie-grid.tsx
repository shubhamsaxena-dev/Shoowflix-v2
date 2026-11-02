import type { YTSMovie } from "@/types/movie";
import { cx } from "@/lib/movie-utils";
import { MovieCard } from "./movie-card";
import styles from "./movie-grid.module.css";

/** Matches the column widths in movie-grid.module.css. */
export const GRID_CARD_SIZES = "(min-width: 1520px) 220px, (min-width: 1024px) 16vw, (min-width: 640px) 24vw, 45vw";

export function MovieGrid({
  movies,
  priorityCount = 0,
  className,
}: {
  movies: YTSMovie[];
  /** Mark the first N posters priority — only when the grid is the page's LCP. */
  priorityCount?: number;
  className?: string;
}) {
  return (
    <ul role="list" className={cx(styles.grid, className)}>
      {movies.map((movie, i) => (
        <li key={movie.id}>
          <MovieCard movie={movie} sizes={GRID_CARD_SIZES} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
