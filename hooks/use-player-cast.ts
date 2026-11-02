"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Casting via the Presentation API (navigator.presentation / PresentationRequest).
 * In Chrome and Edge, `request.start()` opens the browser's own Cast device picker and
 * renders `url` on the chosen Chromecast. The Remote Playback API isn't an option: it needs
 * a <video> element, and Webtor's video lives in a cross-origin iframe.
 *
 * Not in TypeScript's DOM lib, so the few members we use are typed here.
 */
interface PresentationConnectionLike extends EventTarget {
  readonly state: "connecting" | "connected" | "closed" | "terminated";
  terminate(): void;
}
interface PresentationRequestLike {
  start(): Promise<PresentationConnectionLike>;
}
type PresentationRequestCtor = new (urls: string[]) => PresentationRequestLike;

export type CastState = "unsupported" | "idle" | "connecting" | "casting";

function getCtor(): PresentationRequestCtor | null {
  if (typeof window === "undefined") return null;
  const ctor = (window as unknown as { PresentationRequest?: PresentationRequestCtor }).PresentationRequest;
  return typeof ctor === "function" ? ctor : null;
}

const noSubscribe = () => () => {};

export function usePlayerCast({
  castUrl,
  onCastStart,
  onCastEnd,
}: {
  /** Absolute or same-origin URL the TV should open. */
  castUrl: string | null;
  onCastStart?: () => void;
  onCastEnd?: () => void;
}) {
  const [state, setState] = useState<CastState>("idle");
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const connectionRef = useRef<PresentationConnectionLike | null>(null);
  const handlers = useRef({ onCastStart, onCastEnd });
  useEffect(() => {
    handlers.current = { onCastStart, onCastEnd };
  }, [onCastStart, onCastEnd]);

  // Server snapshot "unsupported" keeps hydration stable; the client then reports the real value.
  const apiAvailable = useSyncExternalStore(noSubscribe, () => getCtor() !== null, () => false);
  const supported = apiAvailable && castUrl !== null;

  /** Must be called from a click/tap: browsers only open the picker on a user gesture. */
  const start = useCallback(async (): Promise<"started" | "dismissed" | "no-devices" | "unsupported"> => {
    const Ctor = getCtor();
    if (!Ctor || !castUrl) return "unsupported";
    setDeviceError(null);
    setState("connecting");
    try {
      const url = new URL(castUrl, window.location.href).toString();
      const connection = await new Ctor([url]).start();
      connectionRef.current = connection;
      const end = () => {
        if (connectionRef.current !== connection) return;
        connectionRef.current = null;
        setState("idle");
        handlers.current.onCastEnd?.();
      };
      connection.addEventListener("close", end);
      connection.addEventListener("terminate", end);
      setState("casting");
      handlers.current.onCastStart?.();
      return "started";
    } catch (error) {
      setState("idle");
      const name = error instanceof DOMException ? error.name : "";
      // NotAllowedError/AbortError: the viewer closed the picker. NotFoundError: no devices found.
      if (name === "NotFoundError") {
        setDeviceError("No Cast devices found. Check the TV and this computer are on the same Wi-Fi.");
        return "no-devices";
      }
      if (name === "NotSupportedError") return "unsupported";
      return "dismissed";
    }
  }, [castUrl]);

  const stop = useCallback(() => {
    const connection = connectionRef.current;
    connectionRef.current = null;
    try {
      connection?.terminate();
    } catch {
      /* already gone */
    }
    setState("idle");
    handlers.current.onCastEnd?.();
  }, []);

  // Leaving the page ends the presentation.
  useEffect(
    () => () => {
      try {
        connectionRef.current?.terminate();
      } catch {
        /* ignore */
      }
    },
    [],
  );

  return { supported, state: supported ? state : ("unsupported" as CastState), start, stop, deviceError };
}
