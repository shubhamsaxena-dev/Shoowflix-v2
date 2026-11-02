import { GridSkeleton } from "@/components/movie/movie-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import styles from "@/components/discovery/discovery.module.css";

export default function Loading() {
  return (
    <div className="container" aria-busy="true">
      <header className={styles.intro}>
        <div className={styles.introText}>
          <Skeleton style={{ width: 80, height: 14 }} />
          <Skeleton style={{ width: "min(420px, 70%)", height: "var(--text-hero)" }} />
          <Skeleton style={{ width: "min(360px, 90%)", height: 20 }} />
        </div>
      </header>
      <div className={styles.toolbar}>
        <Skeleton style={{ width: 90, height: 18 }} />
        <Skeleton style={{ width: 300, height: 30, borderRadius: "var(--radius-pill)" }} />
      </div>
      <GridSkeleton count={12} />
    </div>
  );
}
