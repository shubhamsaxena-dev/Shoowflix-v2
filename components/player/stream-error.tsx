"use client";

import Link from "next/link";
import { CircleAlert, RotateCcw, ShieldCheck } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import type { StageSource, StreamErrorKind } from "./types";
import { sourceLabel } from "./format";
import styles from "./stream-error.module.css";

const COPY: Record<StreamErrorKind, { title: string; body: string }> = {
  sdk: {
    title: "The player didn't load",
    body: "Your browser couldn't download the Webtor player. An ad or tracker blocker may be stopping cdn.jsdelivr.net or webtor.io — allow both for this site, then retry.",
  },
  torrent: {
    title: "This torrent couldn't be opened",
    body: "Webtor couldn't read the files for this release. Another quality is usually a different upload, so it often works when this one doesn't.",
  },
  stalled: {
    title: "No peers answered",
    body: "Nothing came through from the swarm in the last 45 seconds. Releases with more seeds start faster.",
  },
  mount: {
    title: "The player couldn't start",
    body: "Something on this page stopped the player from attaching. Retrying usually fixes it.",
  },
};

export function StreamError({
  kind,
  current,
  alternative,
  backHref,
  onRetry,
  onSwitch,
}: {
  kind: StreamErrorKind;
  current: StageSource;
  alternative?: StageSource;
  backHref: string;
  onRetry: () => void;
  onSwitch: (hash: string) => void;
}) {
  const copy = COPY[kind];
  const networky = kind !== "sdk" && kind !== "mount";

  return (
    <div className={styles.wrap} role="alert">
      <div className={styles.card}>
        <CircleAlert className={styles.icon} aria-hidden />
        <h2 className={styles.title}>{copy.title}</h2>
        <p className={styles.body}>{copy.body}</p>
        <p className={styles.meta}>
          {sourceLabel(current)} <span>{current.size}</span> <span>{current.seeds} seeds</span>
        </p>

        <div className={styles.actions}>
          <Button variant="primary" onClick={onRetry}>
            <RotateCcw size={16} aria-hidden /> Retry {current.quality}
          </Button>
          {alternative ? (
            <Button variant="secondary" onClick={() => onSwitch(alternative.hash)}>
              Try {sourceLabel(alternative)}
              <span className={styles.altSeeds}>{alternative.seeds} seeds</span>
            </Button>
          ) : null}
          <Link href={backHref} className={buttonClass({ variant: "ghost" })}>
            Back to the film
          </Link>
        </div>

        {networky ? (
          <div className={styles.vpn}>
            <ShieldCheck className={styles.vpnIcon} aria-hidden />
            <p>
              <strong>Stuck on every quality?</strong> Some networks and ISPs block peer-to-peer traffic. Connecting
              through a VPN usually gets the stream moving, and keeps your activity private.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
