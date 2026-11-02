"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/movie-utils";
import type { StageSource, StreamStage } from "./types";
import { formatClock } from "./format";
import styles from "./loading-reel.module.css";

const STEPS: { stage: StreamStage; label: string; detail: string }[] = [
  { stage: "sdk", label: "Loading the player", detail: "Fetching the Webtor player" },
  { stage: "metadata", label: "Reading the torrent", detail: "Resolving files from the magnet link" },
  { stage: "peers", label: "Connecting to peers", detail: "Finding people sharing this film" },
  { stage: "buffering", label: "Buffering", detail: "Filling the first few seconds" },
];

const ORDER: StreamStage[] = ["sdk", "metadata", "peers", "buffering", "playing"];

/**
 * "Warming up the projector" — a film-leader countdown. Each step of the stream
 * start-up is one number of the leader (4 → 1), so the countdown is real progress.
 */
export function LoadingReel({
  stage,
  source,
  torrentName,
  retryNote,
  onReveal,
}: {
  stage: StreamStage;
  source: StageSource;
  torrentName?: string;
  retryNote?: string;
  onReveal: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const t = setInterval(() => setElapsed((Date.now() - started) / 1000), 1000);
    return () => clearInterval(t);
  }, []);

  const current = Math.max(0, ORDER.indexOf(stage));
  const step = STEPS[Math.min(current, STEPS.length - 1)]!;
  const count = STEPS.length - Math.min(current, STEPS.length - 1);

  return (
    <div className={styles.reel}>
      <div className={styles.leader} aria-hidden>
        <span className={styles.sweep} />
        <span className={styles.crossV} />
        <span className={styles.crossH} />
        <span key={count} className={styles.count}>
          {count}
        </span>
      </div>

      <div className={styles.copy}>
        <p className={styles.title}>Warming up the projector</p>
        <p className={styles.now} role="status" aria-live="polite">
          {retryNote ?? step.detail}
        </p>

        <ol className={styles.steps}>
          {STEPS.map((s, i) => (
            <li
              key={s.stage}
              className={cx(styles.step, i < current && styles.done, i === current && styles.active)}
              aria-current={i === current ? "step" : undefined}
            >
              <span className={styles.tick} aria-hidden />
              {s.label}
            </li>
          ))}
        </ol>

        <dl className={styles.stats}>
          <div>
            <dt>Elapsed</dt>
            <dd>{formatClock(elapsed)}</dd>
          </div>
          <div>
            <dt>Swarm</dt>
            <dd>
              {source.seeds} seeds / {source.peers} peers
            </dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{source.size}</dd>
          </div>
          {torrentName ? (
            <div className={styles.file}>
              <dt>File</dt>
              <dd title={torrentName}>{torrentName}</dd>
            </div>
          ) : null}
        </dl>

        {stage === "buffering" ? (
          <button type="button" className={styles.reveal} onClick={onReveal}>
            Show the player now
          </button>
        ) : elapsed > 20 && stage !== "sdk" ? (
          <p className={styles.hint}>Rare films can take up to a minute to find peers.</p>
        ) : null}
      </div>
    </div>
  );
}
