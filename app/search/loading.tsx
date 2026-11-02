import { GridSkeleton } from "@/components/movie/movie-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import styles from "@/components/discovery/discovery.module.css";

/** Results area only: the intro and search field stay mounted in the layout. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <div className={styles.resultsHead}>
        <Skeleton style={{ width: "min(360px, 70%)", height: "var(--text-2xl)" }} />
      </div>
      <GridSkeleton count={12} />
    </div>
  );
}
