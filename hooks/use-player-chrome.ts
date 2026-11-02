"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/**
 * Theater-mode chrome: visible on any pointer/touch/key activity, hidden after
 * `idleMs` of inactivity while `enabled` (e.g. playing and no panel open).
 *
 * Note: pointer movement *inside* the cross-origin player iframe never reaches
 * us, so the stage keeps letterbox areas and a top hot-zone outside the iframe.
 */
export function usePlayerIdle(targetRef: RefObject<HTMLElement | null>, { enabled, idleMs = 3000 }: { enabled: boolean; idleMs?: number }) {
  const [idle, setIdle] = useState(false);
  const [prevEnabled, setPrevEnabled] = useState(enabled);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const enabledRef = useRef(enabled);

  // Toggling `enabled` always starts from "chrome visible" (render-phase adjustment, no effect).
  if (prevEnabled !== enabled) {
    setPrevEnabled(enabled);
    setIdle(false);
  }

  const arm = useCallback(() => {
    clearTimeout(timer.current);
    if (enabledRef.current) timer.current = setTimeout(() => setIdle(true), idleMs);
  }, [idleMs]);

  const wake = useCallback(() => {
    setIdle(false);
    arm();
  }, [arm]);

  useEffect(() => {
    enabledRef.current = enabled;
    arm();
    return () => clearTimeout(timer.current);
  }, [enabled, arm]);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    const opts = { passive: true } as const;
    el.addEventListener("pointermove", wake, opts);
    el.addEventListener("pointerdown", wake, opts);
    el.addEventListener("touchstart", wake, opts);
    el.addEventListener("focusin", wake);
    window.addEventListener("keydown", wake);
    return () => {
      el.removeEventListener("pointermove", wake);
      el.removeEventListener("pointerdown", wake);
      el.removeEventListener("touchstart", wake);
      el.removeEventListener("focusin", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [targetRef, wake]);

  return { idle: enabled && idle, wake };
}

type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> };
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

/** Fullscreen API for an element (whole stage, not just the iframe), with WebKit fallback. */
export function usePlayerFullscreen(targetRef: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const doc = document as FsDocument;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feature detection after mount
    setSupported(Boolean(document.fullscreenEnabled || (document.documentElement as FsElement).webkitRequestFullscreen));
    const sync = () => setIsFullscreen(Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const toggle = useCallback(async () => {
    const doc = document as FsDocument;
    const el = targetRef.current as FsElement | null;
    try {
      if (doc.fullscreenElement ?? doc.webkitFullscreenElement) {
        await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
      } else if (el) {
        await (el.requestFullscreen?.({ navigationUI: "hide" }) ?? el.webkitRequestFullscreen?.());
      }
    } catch {
      /* user gesture missing or denied — nothing to do */
    }
  }, [targetRef]);

  return { isFullscreen, supported, toggle };
}
