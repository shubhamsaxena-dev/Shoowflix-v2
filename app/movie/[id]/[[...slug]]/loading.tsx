import { Skeleton } from "@/components/ui/skeleton";
import { cx } from "@/lib/movie-utils";
import styles from "@/components/movie/detail/detail.module.css";

/** Mirrors MovieHeader's boxes so the real header drops in without shifting. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading film">
      <header className={styles.header}>
        <div className={styles.backdrop} aria-hidden>
          <div className={styles.scrim} />
        </div>
        <div className={cx("container", styles.headerInner)}>
          <div className={styles.poster}>
            <Skeleton className={styles.skPoster} />
          </div>
          <div className={styles.headline}>
            <Skeleton className={styles.skTitle} />
            <Skeleton className={styles.skLine} style={{ width: 320, height: 44 }} />
            <Skeleton className={styles.skLine} style={{ width: 220, height: 30 }} />
            <Skeleton className={styles.skLine} style={{ width: 280, height: 52, borderRadius: "var(--radius-pill)" }} />
          </div>
        </div>
      </header>
      <div className={cx("container", styles.body)}>
        <div className={styles.main}>
          <div className={styles.section}>
            <Skeleton className={styles.skLine} style={{ width: 140, height: 28 }} />
            <Skeleton className={styles.skLine} style={{ width: "100%" }} />
            <Skeleton className={styles.skLine} style={{ width: "92%" }} />
            <Skeleton className={styles.skLine} style={{ width: "60%" }} />
          </div>
        </div>
        <div className={styles.aside}>
          <Skeleton style={{ height: 320, borderRadius: "var(--radius-lg)" }} />
        </div>
      </div>
    </div>
  );
}
