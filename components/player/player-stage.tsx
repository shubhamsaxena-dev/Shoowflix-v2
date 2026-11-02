"use client";

import dynamic from "next/dynamic";
import { FallbackImage } from "@/components/ui/fallback-image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { preload } from "swr";
import { ArrowLeft, Info, Keyboard, ListVideo, Maximize, Minimize } from "lucide-react";
import { cx, watchHref } from "@/lib/movie-utils";
import { fetcher } from "@/lib/swr";
import { useContinueWatching } from "@/hooks/use-continue-watching";
import { usePlayerFullscreen, usePlayerIdle } from "@/hooks/use-player-chrome";
import { usePlayerShortcuts } from "@/hooks/use-player-shortcuts";
import type { PlayerSignal, WebtorController } from "./webtor-player";
import type { StageMovie, StageSource, StreamErrorKind, StreamStage } from "./types";
import { formatClock, sourceLabel } from "./format";
import { LoadingReel } from "./loading-reel";
import { StreamError } from "./stream-error";
import { QualityMenu } from "./quality-menu";
import { SidePanel } from "./side-panel";
import { InfoPanel } from "./info-panel";
import { UpNextPanel, suggestionsKey } from "./up-next-panel";
import { ShortcutsSheet } from "./shortcuts-sheet";
import styles from "./player-stage.module.css";

const WebtorPlayer = dynamic(() => import("./webtor-player"), { ssr: false, loading: () => null });

/* ------------------------------------------------------------------ */
/* Stream state machine                                                */
/* ------------------------------------------------------------------ */

const ORDER: StreamStage[] = ["sdk", "metadata", "peers", "buffering", "playing"];
const MAX_AUTO_RETRIES = 2;
const STALL_MS = 45_000;
const REVEAL_AFTER_READY_MS = 1800;

interface StreamState {
  stage: StreamStage;
  error: { kind: StreamErrorKind; message: string } | null;
  attempt: number;
  autoRetries: number;
  retryInMs: number | null;
  revealed: boolean;
  torrentName?: string;
  lastEventAt: number;
  position: number;
  duration: number;
}

type Action =
  | { type: "signal"; signal: PlayerSignal; now: number }
  | { type: "retry"; manual: boolean; now: number }
  | { type: "reset"; now: number }
  | { type: "reveal" }
  | { type: "stall" };

function advance(stage: StreamStage, to: StreamStage): StreamStage {
  if (stage === "error") return stage;
  return ORDER.indexOf(to) > ORDER.indexOf(stage) ? to : stage;
}

function initState(now: number): StreamState {
  return {
    stage: "sdk",
    error: null,
    attempt: 0,
    autoRetries: 0,
    retryInMs: null,
    revealed: false,
    lastEventAt: now,
    position: 0,
    duration: 0,
  };
}

function reducer(state: StreamState, action: Action): StreamState {
  switch (action.type) {
    case "reveal":
      return state.stage === "error" ? state : { ...state, revealed: true };
    case "stall":
      return { ...state, stage: "error", error: { kind: "stalled", message: "No progress for 45s" } };
    case "reset":
      return { ...initState(action.now), attempt: state.attempt + 1 };
    case "retry":
      return {
        ...initState(action.now),
        attempt: state.attempt + 1,
        autoRetries: action.manual ? 0 : state.autoRetries,
        position: state.position,
      };
    case "signal": {
      const { signal, now } = action;
      const s = { ...state, lastEventAt: now };
      switch (signal.type) {
        case "sdk-loading":
          return s;
        case "mounted":
        case "handshake":
          return { ...s, stage: advance(s.stage, "metadata") };
        case "torrent":
          return { ...s, stage: advance(s.stage, "peers"), torrentName: signal.name ?? s.torrentName };
        case "ready":
        case "open":
          return { ...s, stage: advance(s.stage, "buffering") };
        case "status":
          return /play/i.test(signal.status) ? { ...s, stage: advance(s.stage, "playing"), revealed: true } : s;
        case "time":
          return signal.seconds > 0
            ? { ...s, position: signal.seconds, stage: advance(s.stage, "playing"), revealed: true }
            : { ...s, position: signal.seconds };
        case "duration":
          return { ...s, duration: signal.seconds };
        case "error": {
          const retriable = signal.kind === "torrent" && s.stage !== "playing";
          if (retriable && s.autoRetries < MAX_AUTO_RETRIES) {
            return { ...s, autoRetries: s.autoRetries + 1, retryInMs: 1500 * 2 ** s.autoRetries };
          }
          return { ...s, stage: "error", error: { kind: signal.kind, message: signal.message }, retryInMs: null };
        }
      }
    }
  }
}

/* ------------------------------------------------------------------ */

type Panel = "info" | "next" | null;

export interface PlayerStageProps {
  movie: StageMovie;
  sources: StageSource[];
  initialHash: string;
  recommendedHash?: string;
}

export function PlayerStage({ movie, sources, initialHash, recommendedHash }: PlayerStageProps) {
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<WebtorController | null>(null);

  const [hash, setHash] = useState(initialHash);
  const source = sources.find((s) => s.hash === hash) ?? sources[0]!;
  const [state, dispatch] = useReducer(reducer, 0, () => initState(0));

  const [panel, setPanel] = useState<Panel>(null);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [resumedAt, setResumedAt] = useState<number | null>(null);

  const { isFullscreen, supported: fsSupported, toggle: toggleFullscreen } = usePlayerFullscreen(stageRef);
  const showOverlay = state.stage === "error" || !state.revealed;
  const { idle } = usePlayerIdle(stageRef, {
    enabled: !showOverlay && !panel && !qualityOpen && !shortcutsOpen,
  });

  /* ---------- page-level side effects ---------- */

  // The stage covers the viewport; stop the document behind it from scrolling.
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, []);

  // Scheduled auto-retry (backoff) after a torrent error.
  useEffect(() => {
    if (state.retryInMs == null) return;
    const t = setTimeout(() => dispatch({ type: "retry", manual: false, now: Date.now() }), state.retryInMs);
    return () => clearTimeout(t);
  }, [state.retryInMs, state.attempt]);

  // Watchdog: no SDK event for a while before playback starts → stalled.
  useEffect(() => {
    if (!["sdk", "metadata", "peers"].includes(state.stage) || state.retryInMs != null) return;
    const t = setTimeout(() => dispatch({ type: "stall" }), STALL_MS);
    return () => clearTimeout(t);
  }, [state.stage, state.lastEventAt, state.retryInMs]);

  // Once the player UI is ready, lift the curtain even if autoplay was blocked.
  useEffect(() => {
    if (state.stage !== "buffering" || state.revealed) return;
    const t = setTimeout(() => dispatch({ type: "reveal" }), REVEAL_AFTER_READY_MS);
    return () => clearTimeout(t);
  }, [state.stage, state.revealed]);

  // Resume chip auto-dismiss.
  useEffect(() => {
    if (resumedAt == null) return;
    const t = setTimeout(() => setResumedAt(null), 8000);
    return () => clearTimeout(t);
  }, [resumedAt]);

  /* ---------- continue watching ---------- */

  const progress = useContinueWatching();
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const session = useRef({
    position: 0,
    duration: movie.runtime * 60,
    lastSaved: -Infinity,
    sawTime: false,
    startedAt: 0,
    resumeHandled: false,
    pendingSeek: null as number | null,
    finished: false,
  });

  const qualityRef = useRef(source.quality);
  useEffect(() => {
    qualityRef.current = source.quality;
  }, [source.quality]);

  const persist = useCallback(
    (immediate = false) => {
      const s = session.current;
      if (s.finished) return;
      progressRef.current.save(
        {
          movieId: movie.id,
          title: movie.title,
          poster: movie.poster,
          backdrop: movie.backdrop,
          quality: qualityRef.current,
          position: Math.round(s.position),
          duration: Math.round(s.duration),
        },
        { immediate },
      );
      s.lastSaved = s.position;
    },
    [movie.id, movie.title, movie.poster, movie.backdrop],
  );

  const maybeResume = useCallback(() => {
    const s = session.current;
    if (s.resumeHandled || !controllerRef.current) return;
    s.resumeHandled = true;
    let target = s.pendingSeek;
    if (target == null) {
      const saved = progressRef.current.get(movie.id);
      const dur = saved?.duration || s.duration;
      if (saved && saved.position > 30 && (!dur || saved.position < dur * 0.95)) target = saved.position;
    }
    s.pendingSeek = null;
    if (target != null && target > 5) {
      controllerRef.current.seek(target);
      s.position = target;
      setResumedAt(target);
    }
  }, [movie.id]);

  const onSignal = useCallback(
    (signal: PlayerSignal) => {
      dispatch({ type: "signal", signal, now: Date.now() });
      const s = session.current;

      if (signal.type === "ready") {
        if (!s.startedAt) s.startedAt = Date.now();
        // Record "started watching" without clobbering a real resume point.
        const existing = progressRef.current.get(movie.id);
        if (!existing) persist();
      } else if (signal.type === "duration") {
        s.duration = signal.seconds;
        maybeResume();
      } else if (signal.type === "time") {
        s.sawTime = true;
        s.position = signal.seconds;
        if (signal.seconds > 0) maybeResume();
        if (s.duration > 0 && s.position / s.duration > 0.95 && !s.finished) {
          s.finished = true;
          void progressRef.current.remove(movie.id);
        } else if (Math.abs(s.position - s.lastSaved) >= 10) {
          persist();
        }
      } else if (signal.type === "error") {
        controllerRef.current = null;
      }
    },
    [movie.id, persist, maybeResume],
  );

  // Heartbeat: when the SDK gives us no time events, estimate position from wall-clock.
  useEffect(() => {
    if (state.stage !== "playing") return;
    const t = setInterval(() => {
      const s = session.current;
      if (!s.sawTime && s.startedAt) {
        s.position = Math.min((Date.now() - s.startedAt) / 1000, s.duration || Infinity);
      }
      if (s.position > 0) persist();
    }, 30_000);
    return () => clearInterval(t);
  }, [state.stage, persist]);

  // Final write on leave.
  useEffect(() => {
    const s = session.current;
    return () => {
      if (s.position > 0) persist(true);
    };
  }, [persist]);

  /* ---------- actions ---------- */

  const retry = useCallback(() => {
    session.current.resumeHandled = false;
    session.current.pendingSeek = session.current.position > 5 ? session.current.position : null;
    dispatch({ type: "retry", manual: true, now: Date.now() });
  }, []);

  const switchSource = useCallback(
    (nextHash: string) => {
      const next = sources.find((s) => s.hash === nextHash);
      if (!next || next.hash === hash) return;
      const s = session.current;
      if (s.position > 0) persist(true);
      s.resumeHandled = false;
      s.pendingSeek = s.position > 5 ? s.position : null;
      s.sawTime = false;
      s.startedAt = 0;
      setHash(next.hash);
      dispatch({ type: "reset", now: Date.now() });
      // Keep the URL shareable without a navigation.
      window.history.replaceState(null, "", watchHref(movie.id, next.quality));
    },
    [sources, hash, persist, movie.id],
  );

  const togglePanel = useCallback((p: Exclude<Panel, null>) => {
    setQualityOpen(false);
    setPanel((cur) => (cur === p ? null : p));
  }, []);

  const prefetchSuggestions = useCallback(() => {
    void preload(suggestionsKey(movie.id), fetcher);
  }, [movie.id]);

  usePlayerShortcuts({
    Escape: () => {
      if (shortcutsOpen) setShortcutsOpen(false);
      else if (qualityOpen) setQualityOpen(false);
      else if (panel) setPanel(null);
      else if (isFullscreen) void toggleFullscreen();
      else router.push(movie.href);
    },
    f: () => void toggleFullscreen(),
    q: () => {
      setPanel(null);
      setQualityOpen((o) => !o);
    },
    i: () => togglePanel("info"),
    n: () => togglePanel("next"),
    "?": () => setShortcutsOpen((o) => !o),
  });

  /* ---------- derived ---------- */

  const alternative = useMemo(() => {
    const others = sources.filter((s) => s.hash !== source.hash);
    const lower = others.filter((s) => s.sizeBytes < source.sizeBytes).sort((a, b) => b.seeds - a.seeds)[0];
    return lower ?? others.sort((a, b) => b.seeds - a.seeds)[0];
  }, [sources, source.hash, source.sizeBytes]);

  const statusText =
    state.stage === "error"
      ? "Stream stopped"
      : state.retryInMs != null
        ? "Retrying"
        : state.stage === "playing"
          ? "Streaming"
          : "Starting stream";

  const retryNote =
    state.retryInMs != null
      ? `That attempt failed. Retrying (${state.autoRetries} of ${MAX_AUTO_RETRIES})…`
      : undefined;

  return (
    <div
      ref={stageRef}
      className={cx(styles.stage, idle && styles.idle)}
      data-stage={state.stage}
      role="region"
      aria-label={`Player: ${movie.title}`}
    >
      {movie.backdrop ? (
        <div className={styles.ambient} aria-hidden>
          <FallbackImage src={movie.backdrop} alt="" fill sizes="480px" quality={40} />
        </div>
      ) : null}

      {/* ---------- top bar ---------- */}
      <header className={styles.topbar}>
        <Link href={movie.href} className={styles.back} aria-label={`Back to ${movie.title}`}>
          <ArrowLeft size={18} aria-hidden />
        </Link>

        <div className={styles.heading}>
          <h1 className={styles.title}>{movie.title}</h1>
          <p className={styles.sub}>
            <span>{movie.year}</span>
            <span>{sourceLabel(source)}</span>
          </p>
        </div>

        <div className={styles.tools}>
          {sources.length > 1 ? (
            <QualityMenu
              sources={sources}
              currentHash={source.hash}
              recommendedHash={recommendedHash}
              open={qualityOpen}
              onOpenChange={(o) => {
                if (o) setPanel(null);
                setQualityOpen(o);
              }}
              onSelect={switchSource}
            />
          ) : null}
          <button
            type="button"
            className={styles.tool}
            aria-pressed={panel === "next"}
            aria-controls={panel === "next" ? "player-panel-next" : undefined}
            onClick={() => togglePanel("next")}
            onPointerEnter={prefetchSuggestions}
            onFocus={prefetchSuggestions}
            title="Up next (N)"
          >
            <ListVideo size={18} aria-hidden />
            <span className={styles.toolLabel}>Up next</span>
          </button>
          <button
            type="button"
            className={styles.tool}
            aria-pressed={panel === "info"}
            aria-controls={panel === "info" ? "player-panel-info" : undefined}
            onClick={() => togglePanel("info")}
            title="Film details (I)"
          >
            <Info size={18} aria-hidden />
            <span className={styles.toolLabel}>Details</span>
          </button>
          {fsSupported ? (
            <button
              type="button"
              className={styles.tool}
              onClick={() => void toggleFullscreen()}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize size={18} aria-hidden /> : <Maximize size={18} aria-hidden />}
            </button>
          ) : null}
        </div>
      </header>

      {/* Invisible strip that brings the chrome back while it's hidden (iframe swallows pointer events). */}
      <div className={styles.hotzone} aria-hidden />

      {/* ---------- picture ---------- */}
      <div className={styles.theater}>
        <div className={styles.frame}>
          <WebtorPlayer
            key={`${source.hash}:${state.attempt}`}
            magnet={source.magnet}
            attempt={state.attempt}
            title={movie.title}
            imdbId={movie.imdbId}
            poster={movie.backdrop}
            onSignal={onSignal}
            controllerRef={controllerRef}
          />

          {state.stage === "error" && state.error ? (
            <StreamError
              kind={state.error.kind}
              current={source}
              alternative={alternative}
              backHref={movie.href}
              onRetry={retry}
              onSwitch={switchSource}
            />
          ) : showOverlay ? (
            <LoadingReel
              key={`${source.hash}:${state.attempt}`}
              stage={state.stage}
              source={source}
              torrentName={state.torrentName}
              retryNote={retryNote}
              onReveal={() => dispatch({ type: "reveal" })}
            />
          ) : null}

          {resumedAt != null && !showOverlay ? (
            <div className={styles.resume} role="status">
              <span>
                Resumed at <span className={styles.mono}>{formatClock(resumedAt)}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  controllerRef.current?.seek(0);
                  session.current.position = 0;
                  setResumedAt(null);
                }}
              >
                Start over
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* ---------- bottom bar ---------- */}
      <footer className={styles.bottombar}>
        <p className={styles.status} aria-live="polite">
          <span className={styles.dot} aria-hidden />
          {statusText}
        </p>
        <p className={styles.stats}>
          <span>
            {source.seeds} seeds / {source.peers} peers
          </span>
          <span className={styles.size}>{source.size}</span>
          {state.duration > 0 ? (
            <span className={styles.time}>
              {formatClock(state.position)} / {formatClock(state.duration)}
            </span>
          ) : null}
        </p>
        <button type="button" className={styles.keys} onClick={() => setShortcutsOpen(true)} title="Shortcuts (?)">
          <Keyboard size={16} aria-hidden />
          <span className={styles.toolLabel}>Shortcuts</span>
        </button>
      </footer>

      {panel === "info" ? (
        <SidePanel id="player-panel-info" title="Details" onClose={() => setPanel(null)}>
          <InfoPanel movie={movie} source={source} />
        </SidePanel>
      ) : null}
      {panel === "next" ? (
        <SidePanel id="player-panel-next" title="Up next" onClose={() => setPanel(null)}>
          <UpNextPanel movieId={movie.id} />
        </SidePanel>
      ) : null}
      {shortcutsOpen ? <ShortcutsSheet onClose={() => setShortcutsOpen(false)} /> : null}
    </div>
  );
}
