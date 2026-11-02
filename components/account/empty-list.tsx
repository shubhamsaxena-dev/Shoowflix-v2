import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import styles from "./empty-list.module.css";

/** Designed empty state for My List: an unexposed frame waiting for a film. */
export function EmptyList() {
  return (
    <div className={styles.empty}>
      <div className={styles.frames} aria-hidden>
        <span className={styles.frame} />
        <span className={`${styles.frame} ${styles.lit}`}>
          <span className={styles.plus} />
        </span>
        <span className={styles.frame} />
      </div>
      <h2 className={styles.title}>Nothing on the reel yet</h2>
      <p className={styles.text}>
        Press the + on any film to save it here. Your list follows you to every device you sign in on.
      </p>
      <ButtonLink href="/browse" size="lg">
        <Compass aria-hidden />
        Browse films
      </ButtonLink>
    </div>
  );
}
