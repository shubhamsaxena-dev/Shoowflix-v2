import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GENRES } from "@/types/movie";
import { cx } from "@/lib/movie-utils";
import { GENRE_NOTES, genreLabel } from "./catalog";
import styles from "./genre-tiles.module.css";

/** Typographic genre index: a festival-programme listing rather than image cards. */
export function GenreTiles({ headingLevel = 2, title = "Browse by genre", className }: {
  headingLevel?: 1 | 2;
  title?: string;
  className?: string;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className={cx(styles.section, className)} aria-labelledby="genre-index-title">
      <div className={styles.head}>
        <Heading id="genre-index-title" className={styles.title}>
          {title}
        </Heading>
        <p className={styles.lede}>{GENRES.length} genres, from westerns to sci‑fi.</p>
      </div>
      <ul role="list" className={styles.grid}>
        {GENRES.map((g) => (
          <li key={g}>
            <Link href={`/genre/${g}`} className={styles.tile} prefetch={false}>
              <span className={styles.name}>{genreLabel(g)}</span>
              <span className={styles.note}>{GENRE_NOTES[g]}</span>
              <ArrowUpRight className={styles.arrow} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
