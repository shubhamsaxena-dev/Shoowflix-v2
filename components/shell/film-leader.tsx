import { cx } from "@/lib/movie-utils";
import styles from "./film-leader.module.css";

/**
 * Academy-leader countdown: concentric rings, crosshair, a sweeping wedge and a numeral.
 * `countdown` cycles 3-2-1 with the sweep (loading); otherwise the given numeral is static.
 */
export function FilmLeader({
  numeral,
  countdown,
  size = "md",
  className,
}: {
  numeral?: string | number;
  countdown?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div className={cx(styles.leader, styles[size], className)} aria-hidden>
      <span className={styles.sweep} />
      <span className={styles.ringOuter} />
      <span className={styles.ringInner} />
      <span className={styles.crossH} />
      <span className={styles.crossV} />
      {countdown ? (
        <span className={cx(styles.numeral, styles.countdown)}>
          <span>3</span>
          <span>2</span>
          <span>1</span>
        </span>
      ) : (
        <span className={styles.numeral}>{numeral}</span>
      )}
    </div>
  );
}
