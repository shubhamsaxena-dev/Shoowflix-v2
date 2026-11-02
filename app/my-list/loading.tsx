import { Skeleton } from "@/components/ui/skeleton";
import styles from "./my-list.module.css";

export default function Loading() {
  return (
    <div className={`container ${styles.page}`} aria-busy="true">
      <header className={styles.header}>
        <h1 className={styles.title}>My List</h1>
        <p className={styles.lede}>Loading your saved films…</p>
      </header>
      <ul role="list" className={styles.grid}>
        {Array.from({ length: 12 }, (_, i) => (
          <li key={i} className={styles.skeletonCard}>
            <Skeleton className={styles.skeletonPoster} />
            <Skeleton className={styles.skeletonLine} />
            <Skeleton className={styles.skeletonLineShort} />
          </li>
        ))}
      </ul>
    </div>
  );
}
