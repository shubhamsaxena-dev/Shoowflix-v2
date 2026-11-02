import { Skeleton } from "@/components/ui/skeleton";
import { cx } from "@/lib/movie-utils";
import cardStyles from "./movie-card.module.css";
import railStyles from "./movie-rail.module.css";
import gridStyles from "./movie-grid.module.css";
import styles from "./movie-skeleton.module.css";

/** Same box model as MovieCard (poster 2/3 + two-line title + meta row) so swapping in is CLS-free. */
export function MovieCardSkeleton() {
  return (
    <div className={cardStyles.card} aria-hidden>
      <Skeleton className={cx(cardStyles.poster, styles.poster)} />
      <div className={cardStyles.meta}>
        <Skeleton className={styles.line} style={{ width: "40%" }} />
      </div>
      <div className={cardStyles.title}>
        <Skeleton className={styles.line} style={{ width: "85%" }} />
      </div>
    </div>
  );
}

export function RailSkeleton({ count = 8, title = true }: { count?: number; title?: boolean }) {
  return (
    <section className={railStyles.rail} aria-busy="true" aria-label="Loading films">
      {title && (
        <div className={cx("container", railStyles.head)}>
          <div className={railStyles.heading}>
            <Skeleton className={styles.line} style={{ width: 80 }} />
            <Skeleton className={styles.titleLine} />
          </div>
        </div>
      )}
      <ul role="list" className={railStyles.track}>
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className={railStyles.item}>
            <MovieCardSkeleton />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <ul role="list" className={gridStyles.grid} aria-busy="true" aria-label="Loading films">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <MovieCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
