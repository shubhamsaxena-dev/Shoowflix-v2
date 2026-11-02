import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import type { StageMovie } from "./types";
import styles from "./no-stream.module.css";

/** Server-rendered fallback when a film has no torrents to stream. */
export function NoStream({ movie }: { movie: StageMovie }) {
  return (
    <section className={styles.wrap} aria-labelledby="no-stream-title">
      <h1 id="no-stream-title" className={styles.title}>
        {movie.title} has no stream yet
      </h1>
      <p className={styles.body}>
        There are no releases for this film in the catalog right now. New uploads usually appear within a few days.
      </p>
      <div className={styles.actions}>
        <Link href={movie.href} className={buttonClass({ variant: "primary" })}>
          Back to the film
        </Link>
        <Link href="/browse" className={buttonClass({ variant: "ghost" })}>
          Browse the catalog
        </Link>
      </div>
    </section>
  );
}
