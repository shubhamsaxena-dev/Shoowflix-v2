/**
 * Webtor embed SDK loader + minimal typings for @webtor/embed-sdk-js@0.2.19.
 *
 * The SDK is a plain script that replaces `window.webtor` (array queue) with a
 * generator exposing `push(config)` and event-name constants. We load it once per
 * page lifetime behind a single shared promise, with onerror + timeout handling,
 * and retry-friendly reset when loading fails.
 */

export const WEBTOR_SDK_VERSION = "0.2.19";
export const WEBTOR_SDK_URL = `https://cdn.jsdelivr.net/npm/@webtor/embed-sdk-js@${WEBTOR_SDK_VERSION}/dist/index.min.js`;
/** Subresource integrity for the pinned build above. Update together with the version. */
export const WEBTOR_SDK_INTEGRITY = "sha384-fT93IihHLfqyxkbyEznAQX6/Rd/vgXAVemfjJBzlYQKHkbxa2x6N6Yvr/Hm8b8r5";

/** Commands the SDK can send into the iframe player. */
export interface WebtorPlayerHandle {
  play(): void;
  pause(): void;
  setPosition(seconds: number): void;
}

export interface WebtorEvent {
  id: string;
  name: string;
  data?: unknown;
  player: WebtorPlayerHandle;
}

export interface WebtorFeatures {
  title?: boolean;
  p2pProgress?: boolean;
  subtitles?: boolean;
  settings?: boolean;
  fullscreen?: boolean;
  playpause?: boolean;
  currentTime?: boolean;
  timeline?: boolean;
  duration?: boolean;
  volume?: boolean;
  chromecast?: boolean;
  embed?: boolean;
  download?: boolean;
  browse?: boolean;
  continue?: boolean;
  autoSubtitles?: boolean;
}

/** Exactly one of `magnet` / `torrentUrl` (the SDK throws if both or neither are set). */
export interface WebtorConfig {
  id: string;
  magnet?: string;
  torrentUrl?: string;
  width?: string;
  height?: string;
  poster?: string;
  title?: string;
  imdbId?: string;
  header?: boolean;
  controls?: boolean;
  lang?: string;
  features?: WebtorFeatures;
  on?: (event: WebtorEvent) => void;
}

export interface WebtorSdk {
  push(config: WebtorConfig): void;
  readonly TORRENT_FETCHED: string;
  readonly TORRENT_ERROR: string;
  readonly INIT: string;
  readonly INITED: string;
  readonly OPEN: string;
  readonly PLAYER_STATUS: string;
  readonly CURRENT_TIME: string;
  readonly DURATION: string;
  readonly OPEN_SUBTITLES: string;
}

declare global {
  interface Window {
    webtor?: WebtorSdk | WebtorConfig[];
  }
}

function readySdk(): WebtorSdk | null {
  const w = window.webtor;
  if (w && !Array.isArray(w) && typeof w.push === "function" && typeof w.INITED === "string") return w;
  return null;
}

let sdkPromise: Promise<WebtorSdk> | null = null;

export class WebtorLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebtorLoadError";
  }
}

/** Load the SDK exactly once. Rejects on network error / CSP / adblock / timeout. */
export function loadWebtorSdk(timeoutMs = 20_000): Promise<WebtorSdk> {
  if (typeof window === "undefined") return Promise.reject(new WebtorLoadError("SDK is browser-only"));
  const ready = readySdk();
  if (ready) return Promise.resolve(ready);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<WebtorSdk>((resolve, reject) => {
    // The SDK drains an array queue on boot; make sure none of our configs sit in it.
    if (!window.webtor || Array.isArray(window.webtor)) window.webtor = [];

    const script = document.createElement("script");
    script.src = WEBTOR_SDK_URL;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.integrity = WEBTOR_SDK_INTEGRITY;
    script.dataset.webtorSdk = WEBTOR_SDK_VERSION;

    const timer = window.setTimeout(() => fail("Timed out loading the player"), timeoutMs);
    function cleanup() {
      window.clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
    }
    function fail(message: string) {
      cleanup();
      script.remove();
      reject(new WebtorLoadError(message));
    }

    script.onload = () => {
      cleanup();
      const sdk = readySdk();
      if (sdk) resolve(sdk);
      else fail("Player script loaded but did not initialise");
    };
    script.onerror = () => fail("Couldn't download the player script");
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    sdkPromise = null; // allow a clean retry
    throw error;
  });

  return sdkPromise;
}
