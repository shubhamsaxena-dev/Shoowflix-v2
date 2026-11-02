"use client";

import { useEffect, useId, useRef, type RefObject } from "react";
import { loadWebtorSdk, type WebtorPlayerHandle, type WebtorSdk } from "./webtor-sdk";
import styles from "./webtor-player.module.css";

/** Normalised signals the stage reacts to. Names are ours, not the SDK's. */
export type PlayerSignal =
  | { type: "sdk-loading" }
  | { type: "mounted" } // iframe injected, waiting for metadata
  | { type: "handshake" } // iframe booted and asked for config (INIT)
  | { type: "torrent"; name?: string } // TORRENT_FETCHED
  | { type: "ready" } // INITED — player UI ready, play() requested
  | { type: "open" } // OPEN — a file was opened
  | { type: "status"; status: string } // PLAYER_STATUS
  | { type: "time"; seconds: number } // CURRENT_TIME
  | { type: "duration"; seconds: number } // DURATION
  | { type: "error"; kind: "sdk" | "torrent" | "mount"; message: string };

export interface WebtorController {
  play(): void;
  pause(): void;
  seek(seconds: number): void;
}

export interface WebtorPlayerProps {
  magnet: string;
  /** Bump to tear down and re-create the player with the same magnet (retry). */
  attempt: number;
  title: string;
  imdbId?: string;
  poster?: string;
  onSignal: (signal: PlayerSignal) => void;
  controllerRef: RefObject<WebtorController | null>;
}

function num(value: unknown): number | null {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function torrentName(data: unknown): string | undefined {
  if (data && typeof data === "object" && "name" in data && typeof data.name === "string") return data.name;
  return undefined;
}

/**
 * Thin, lifecycle-safe wrapper around the Webtor iframe player.
 * - One effect owns the player: it runs when magnet/attempt (or metadata) change,
 *   and its cleanup removes the iframe host and silences the old SDK callback.
 * - Signals go through a ref, so parents can re-render freely without re-initialising.
 * - We never touch the iframe's internal DOM.
 */
export default function WebtorPlayer({
  magnet,
  attempt,
  title,
  imdbId,
  poster,
  onSignal,
  controllerRef,
}: WebtorPlayerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const signalRef = useRef(onSignal);
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  useEffect(() => {
    signalRef.current = onSignal;
  }, [onSignal]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    const emit = (signal: PlayerSignal) => {
      if (!disposed) signalRef.current(signal);
    };

    // A fresh, non-React-managed mount node per session keeps the SDK away from React's DOM.
    const mount = document.createElement("div");
    mount.id = `webtor-${baseId}-${attempt}-${Date.now().toString(36)}`;
    mount.className = styles.mount;
    host.appendChild(mount);

    emit({ type: "sdk-loading" });

    const handleEvent = (sdk: WebtorSdk, e: { name: string; data?: unknown; player: WebtorPlayerHandle }) => {
      if (disposed) return; // SDK keeps its window listener forever — ignore stale sessions
      switch (e.name) {
        case sdk.INIT:
          emit({ type: "handshake" });
          break;
        case sdk.TORRENT_FETCHED:
          emit({ type: "torrent", name: torrentName(e.data) });
          break;
        case sdk.TORRENT_ERROR:
          emit({ type: "error", kind: "torrent", message: "The torrent could not be loaded." });
          break;
        case sdk.INITED:
          controllerRef.current = {
            play: () => e.player.play(),
            pause: () => e.player.pause(),
            seek: (s) => e.player.setPosition(Math.max(0, s)),
          };
          e.player.play();
          emit({ type: "ready" });
          break;
        case sdk.OPEN:
          emit({ type: "open" });
          break;
        case sdk.PLAYER_STATUS:
          emit({ type: "status", status: String(e.data ?? "") });
          break;
        case sdk.CURRENT_TIME: {
          const s = num(e.data);
          if (s !== null) emit({ type: "time", seconds: s });
          break;
        }
        case sdk.DURATION: {
          const s = num(e.data);
          if (s !== null && s > 0) emit({ type: "duration", seconds: s });
          break;
        }
      }
    };

    loadWebtorSdk()
      .then((sdk) => {
        if (disposed) return;
        try {
          sdk.push({
            id: mount.id,
            magnet,
            width: "100%",
            height: "100%",
            title,
            imdbId: imdbId || undefined,
            poster: poster || undefined,
            header: true,
            controls: true,
            lang: "en",
            features: {
              autoSubtitles: true,
              chromecast: true,
              download: false,
              embed: false,
              browse: false,
              title: false,
              continue: true,
              p2pProgress: true,
              subtitles: true,
              settings: true,
              fullscreen: true,
              playpause: true,
              currentTime: true,
              timeline: true,
              duration: true,
              volume: true,
            },
            on: (e) => handleEvent(sdk, e),
          });
          emit({ type: "mounted" });
        } catch (error) {
          emit({ type: "error", kind: "mount", message: String(error) });
        }
      })
      .catch((error: unknown) => {
        emit({ type: "error", kind: "sdk", message: error instanceof Error ? error.message : String(error) });
      });

    return () => {
      disposed = true;
      controllerRef.current = null;
      mount.remove(); // removes the iframe → stops the stream and its messages
    };
  }, [magnet, attempt, title, imdbId, poster, baseId, controllerRef]);

  return <div ref={hostRef} className={styles.host} />;
}
