"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import type { PlayerSignal, WebtorController } from "./webtor-player";
import styles from "./cast-receiver.module.css";

const WebtorPlayer = dynamic(() => import("./webtor-player"), { ssr: false });

/**
 * What the TV shows when a viewer casts: the film, full-bleed, no chrome.
 * Starts on the .torrent file like the main player and falls back to the magnet once.
 */
export function CastReceiver({
  title,
  imdbId,
  poster,
  magnet,
  torrentUrl,
}: {
  title: string;
  imdbId?: string;
  poster?: string;
  magnet: string;
  torrentUrl?: string;
}) {
  const controllerRef = useRef<WebtorController | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "playing" | "error">("loading");

  const onSignal = useCallback(
    (signal: PlayerSignal) => {
      if (signal.type === "time" && signal.seconds > 0) setStatus("playing");
      if (signal.type === "status" && /play/i.test(signal.status)) setStatus("playing");
      if (signal.type === "error") {
        if (attempt === 0) setAttempt(1); // file → magnet
        else setStatus("error");
      }
    },
    [attempt],
  );

  return (
    <div className={styles.receiver}>
      <WebtorPlayer
        key={attempt}
        magnet={magnet}
        torrentUrl={attempt === 0 ? torrentUrl : undefined}
        attempt={attempt}
        title={title}
        imdbId={imdbId}
        poster={poster}
        onSignal={onSignal}
        controllerRef={controllerRef}
      />
      {status !== "playing" ? (
        <div className={styles.overlay} aria-live="polite">
          <p className={styles.title}>{title}</p>
          <p className={styles.note}>
            {status === "error" ? "This stream couldn’t start. Try another quality on your computer." : "Starting on your TV…"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
