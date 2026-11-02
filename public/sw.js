/* Shoowflix service worker — hand-written, no build step.
 *
 *  /_next/static/*, fonts, /brand icons ...... cache-first (content-hashed / immutable)
 *  Posters & backdrops ................ not intercepted: YTS sends no CORS headers, so the
 *    worker could only cache opaque responses, which Safari pads to megabytes each and which
 *    filled the quota on iOS. YTS's 30-day Cache-Control and the HTTP cache do the job.
 *  /api/*, /watch/*, auth, RSC ........ network-only (never cached)
 *  Page navigations ................... network, with a tiny offline page on failure
 *
 * Bump VERSION to invalidate every cache on the next activation.
 */
const VERSION = "v2.3.0";

/* Never run on localhost: dev-server chunk URLs aren't content-hashed, so cache-first
 * would pin stale CSS/JS across edits. A worker left behind by a local production run
 * clears its caches and unregisters itself on the next activation. */
const IS_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(self.location.hostname);
const STATIC_CACHE = `shoowflix-static-${VERSION}`;
// /_vercel: Analytics and Speed Insights scripts and beacons must never be cached.
const NETWORK_ONLY = [/^\/_vercel\//, /^\/api\//, /^\/watch(\/|$)/, /^\/signin/, /^\/signup/, /^\/register/, /^\/auth\//];

const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · Shoowflix</title><style>html{color-scheme:dark}body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#12152b;color:#eef0fb;font:16px/1.5 system-ui,sans-serif;text-align:center;padding:24px}h1{font:800 2.5rem/1 "Arial Narrow",system-ui,sans-serif;margin:0 0 8px}p{color:#a5abcb;margin:0 0 20px}button{font:inherit;background:#b7c4ff;color:#12152b;border:0;border-radius:8px;padding:10px 20px;cursor:pointer}</style></head><body><main><h1>You're offline</h1><p>Shoowflix needs a connection to stream and browse. Check your network, then try again.</p><button onclick="location.reload()">Try again</button></main></body></html>`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (IS_LOCAL) {
        const all = await caches.keys();
        await Promise.all(all.filter((k) => k.startsWith("shoowflix-")).map((k) => caches.delete(k)));
        await self.registration.unregister();
        return;
      }
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("shoowflix-") && !k.endsWith(VERSION)).map((k) => caches.delete(k)),
      );
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  if (url.origin !== self.location.origin) return false;
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(woff2?|ttf|otf)$/i.test(url.pathname) ||
    url.pathname.startsWith("/brand/")
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
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
  if (IS_LOCAL) return;
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
  } else if (request.mode === "navigate" && url.origin === self.location.origin) {
    event.respondWith(navigate(event));
  }
  // Everything else: browser default (network).
});
