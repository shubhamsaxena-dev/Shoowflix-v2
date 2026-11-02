/* Shoowflix service worker — hand-written, no build step.
 *
 *  /_next/static/*, fonts, /brand icons ...... cache-first (content-hashed / immutable)
 *  Posters & backdrops (YTS hosts,
 *    and /_next/image of them) ........ stale-while-revalidate, capped
 *  /api/*, /watch/*, auth, RSC ........ network-only (never cached)
 *  Page navigations ................... network, with a tiny offline page on failure
 *
 * Bump VERSION to invalidate every cache on the next activation.
 */
const VERSION = "v2.1.0";
const STATIC_CACHE = `shoowflix-static-${VERSION}`;
const IMAGE_CACHE = `shoowflix-images-${VERSION}`;
const IMAGE_LIMIT = 160;

const IMAGE_HOSTS = /(^|\.)yts\.(mx|lt|am|ag|rs)$/i;
const NETWORK_ONLY = [/^\/api\//, /^\/watch(\/|$)/, /^\/signin/, /^\/signup/, /^\/register/, /^\/auth\//];

const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · Shoowflix</title><style>html{color-scheme:dark}body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#0b0c0f;color:#f3efe6;font:16px/1.5 system-ui,sans-serif;text-align:center;padding:24px}h1{font:400 2.25rem/1.1 Georgia,serif;margin:0 0 8px}p{color:#a3a1a8;margin:0 0 20px}button{font:inherit;background:#ffb238;color:#1a1203;border:0;border-radius:999px;padding:10px 20px;cursor:pointer}</style></head><body><main><h1>You're offline</h1><p>Shoowflix needs a connection to stream and browse. Check your network, then try again.</p><button onclick="location.reload()">Try again</button></main></body></html>`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("shoowflix-") && !k.endsWith(VERSION)).map((k) => caches.delete(k)),
      );
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

function isImageRequest(url) {
  if (IMAGE_HOSTS.test(url.hostname)) return true;
  if (url.origin === self.location.origin && url.pathname === "/_next/image") {
    try {
      return IMAGE_HOSTS.test(new URL(url.searchParams.get("url") || "", self.location.origin).hostname);
    } catch {
      return false;
    }
  }
  return false;
}

function isStaticAsset(url) {
  if (url.origin !== self.location.origin) return false;
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(woff2?|ttf|otf)$/i.test(url.pathname) ||
    url.pathname.startsWith("/brand/")
  );
}

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(event) {
  const { request } = event;
  const cache = await caches.open(IMAGE_CACHE);
  const hit = await cache.match(request);
  const refresh = fetch(request)
    .then(async (res) => {
      // Opaque (no-cors) responses are fine to cache for <img>; skip errors.
      if (res.ok || res.type === "opaque") {
        await cache.put(request, res.clone());
        await trimCache(IMAGE_CACHE, IMAGE_LIMIT);
      }
      return res;
    })
    .catch(() => undefined);
  if (hit) {
    event.waitUntil(refresh);
    return hit;
  }
  return (await refresh) || Response.error();
}

async function navigate(event) {
  try {
    const preloaded = await event.preloadResponse;
    if (preloaded) return preloaded;
    return await fetch(event.request);
  } catch {
    return new Response(OFFLINE_HTML, { status: 503, headers: { "content-type": "text/html; charset=utf-8" } });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (NETWORK_ONLY.some((re) => re.test(url.pathname))) return;
    // React Server Component payloads must always be fresh.
    if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  } else if (request.destination === "image" && isImageRequest(url)) {
    event.respondWith(staleWhileRevalidate(event));
  } else if (request.mode === "navigate" && url.origin === self.location.origin) {
    event.respondWith(navigate(event));
  }
  // Everything else: browser default (network).
});
