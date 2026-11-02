"use client";

import { FallbackImage } from "@/components/ui/fallback-image";
import Link from "next/link";
import { Play, X } from "lucide-react";
import { watchHref } from "@/lib/movie-utils";
import { progressRatio, useContinueWatching } from "@/hooks/use-continue-watching";
import styles from "./continue-watching-rail.module.css";

function remaining(position: number, duration: number) {
  if (!duration) return "Started";
  if (position <= 0) return "Not started";
  const mins = Math.max(1, Math.round((duration - position) / 60));
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m left` : `${mins}m left`;
}

/** "Continue watching" shelf. Renders nothing until there is something to continue. */
export function ContinueWatchingRail() {
  const { items, remove } = useContinueWatching();
  if (items.length === 0) return null;

  return (
    <section className={styles.rail} aria-labelledby="continue-watching-title">
      <h2 id="continue-watching-title" className={styles.heading}>
        Continue watching
      </h2>
      <ul role="list" className={styles.track}>
        {items.map((item) => {
          const ratio = progressRatio(item);
          const image = item.backdrop || item.poster;
          return (
            <li key={item.movieId} className={styles.card}>
              <Link href={watchHref(item.movieId, item.quality)} className={styles.link} prefetch={false}>
                <span className={styles.media}>
                  {image ? <FallbackImage src={image} alt="" fill sizes="(max-width: 640px) 70vw, 320px" quality={60} /> : null}
                  <span className={styles.play} aria-hidden>
                    <Play size={18} />
                  </span>
                </span>
                <span className={styles.body}>
                  <span className={styles.title}>{item.title}</span>
                  <span className={styles.meta}>
                    {item.quality ? <span>{item.quality}</span> : null}
                    <span>{remaining(item.position, item.duration)}</span>
                  </span>
                </span>
                <span
                  className={styles.bar}
                  role="progressbar"
                  aria-label={`${Math.round(ratio * 100)}% watched`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(ratio * 100)}
                >
                  <span className={styles.fill} style={{ transform: `scaleX(${Math.max(ratio, 0.02)})` }} />
                </span>
              </Link>
              <button
                type="button"
                className={styles.remove}
                onClick={() => void remove(item.movieId)}
                aria-label={`Remove ${item.title} from Continue watching`}
              >
                <X size={14} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
