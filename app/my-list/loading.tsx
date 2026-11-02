import { Skeleton } from "@/components/ui/skeleton";
import { MovieCardSkeleton } from "@/components/movie/movie-skeleton";
import styles from "./my-list.module.css";

/** Mirrors page.tsx + MyListGrid exactly (header, count line, card grid) so nothing shifts on swap. */
export default function Loading() {
  return (
    <div className={`container ${styles.page}`} aria-busy="true">
      <header className={styles.header}>
        <h1 className={styles.title}>My List</h1>
        <p className={styles.lede}>Films you’ve saved for later, newest first.</p>
      </header>
      <p className={styles.count} aria-hidden>
        <Skeleton className={styles.countSkeleton} />
      </p>
      <ul role="list" className={styles.grid}>
        {Array.from({ length: 12 }, (_, i) => (
          <li key={i}>
            <MovieCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
