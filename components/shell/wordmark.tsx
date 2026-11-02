import { cx } from "@/lib/movie-utils";
import styles from "./wordmark.module.css";

/**
 * Typographic wordmark in Big Shoulders black, the double "o" lit like a pair of
 * projector reels. Server component; purely presentational.
 */
export function Wordmark({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span className={cx(styles.wordmark, styles[size], className)} role="img" aria-label="Shoowflix">
      <span aria-hidden>Sh</span>
      <span className={styles.reels} aria-hidden>
        oo
      </span>
      <span aria-hidden>wflix</span>
    </span>
  );
}
