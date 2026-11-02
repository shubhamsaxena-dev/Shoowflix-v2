"use client";

import { FallbackImage } from "@/components/ui/fallback-image";
import Link from "next/link";
import useSWR from "swr";
import { Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { posterSrc, watchHref } from "@/lib/movie-utils";
import type { YTSMovie } from "@/types/movie";
import styles from "./up-next-panel.module.css";

export const suggestionsKey = (movieId: number) => `/api/movies/${movieId}/suggestions`;

export function UpNextPanel({ movieId }: { movieId: number }) {
  const { data, error, isLoading } = useSWR<{ movies: YTSMovie[] }>(suggestionsKey(movieId), {
    revalidateIfStale: false,
  });
  const movies = data?.movies ?? [];

  if (isLoading) {
    return (
      <ul role="list" className={styles.list} aria-busy="true" aria-label="Loading suggestions">
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i} className={styles.item}>
            <Skeleton className={styles.poster} />
            <span className={styles.text}>
              <Skeleton style={{ width: "70%", height: "1rem" }} />
              <Skeleton style={{ width: "40%", height: "0.75rem" }} />
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (error || movies.length === 0) {
    return <p className={styles.empty}>No suggestions for this film yet. Browse the catalog for something else.</p>;
  }

  return (
    <ul role="list" className={styles.list}>
      {movies.map((m) => (
        <li key={m.id}>
          <Link href={watchHref(m.id)} className={styles.item} prefetch={false}>
            <span className={styles.poster}>
              <FallbackImage src={posterSrc(m)} alt="" fill sizes="64px" quality={60} />
            </span>
            <span className={styles.text}>
              <span className={styles.title}>{m.title}</span>
              <span className={styles.meta}>
                {m.year}
                {m.rating ? (
                  <span className={styles.rating}>
                    <Star size={11} aria-hidden /> {m.rating.toFixed(1)}
                  </span>
                ) : null}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
