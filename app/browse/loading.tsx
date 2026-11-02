import { GridSkeleton } from "@/components/movie/movie-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import styles from "@/components/discovery/discovery.module.css";

/** Only the grid area: the intro + filter bar live in the layout and stay put. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className={`${styles.count} ${styles.browseCount}`}>
        <Skeleton style={{ width: 90, height: "1.5em" }} />
      </p>
      <GridSkeleton count={12} />
    </div>
  );
}
