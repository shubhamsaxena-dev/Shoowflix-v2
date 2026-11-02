import styles from "./loading.module.css";

/** Instant dark curtain while the server shell resolves — matches the stage, so no flash. */
export default function WatchLoading() {
  return (
    <div className={styles.curtain} role="status" aria-live="polite">
      <span className="visually-hidden">Loading the player</span>
    </div>
  );
}
