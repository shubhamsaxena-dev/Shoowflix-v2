"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Copy, Magnet, Star } from "lucide-react";
import { formatRuntime } from "@/lib/movie-utils";
import { Button, buttonClass } from "@/components/ui/button";
import type { StageMovie, StageSource } from "./types";
import { sourceLabel } from "./format";
import styles from "./info-panel.module.css";

export function InfoPanel({ movie, source }: { movie: StageMovie; source: StageSource }) {
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 2200);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source.magnet);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
  };

  return (
    <div className={styles.info}>
      <p className={styles.facts}>
        <span>{movie.year}</span>
        {movie.runtime ? <span>{formatRuntime(movie.runtime)}</span> : null}
        {movie.mpaRating ? <span>{movie.mpaRating}</span> : null}
        {movie.rating ? (
          <span className={styles.rating}>
            <Star size={12} aria-hidden /> {movie.rating.toFixed(1)}
          </span>
        ) : null}
      </p>
      {movie.genres.length ? <p className={styles.genres}>{movie.genres.join(", ")}</p> : null}
      {movie.summary ? <p className={styles.summary}>{movie.summary}</p> : null}

      <section className={styles.release} aria-labelledby="release-heading">
        <h3 id="release-heading" className={styles.subhead}>
          This release
        </h3>
        <dl className={styles.grid}>
          <dt>Quality</dt>
          <dd>{sourceLabel(source)}</dd>
          <dt>Size</dt>
          <dd>{source.size}</dd>
          <dt>Swarm</dt>
          <dd className={styles.signal}>
            {source.seeds} seeds / {source.peers} peers
          </dd>
        </dl>

        <p className={styles.note}>Prefer your own client? Grab the magnet link.</p>
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={copy} aria-live="polite">
            {copied === "ok" ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
            {copied === "ok" ? "Copied" : copied === "fail" ? "Copy blocked" : "Copy magnet"}
          </Button>
          <a href={source.magnet} className={buttonClass({ variant: "ghost", size: "sm" })} rel="nofollow">
            <Magnet size={14} aria-hidden /> Open in torrent client
          </a>
        </div>
      </section>

      <Link href={movie.href} className={styles.more}>
        Full film page
      </Link>
    </div>
  );
}
