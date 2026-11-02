import type { Torrent, YTSMovie } from "@/types/movie";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.shoowflix.com";
export const SITE_NAME = "Shoowflix";

export function slugify(title: string | null | undefined): string {
  if (!title) return "untitled";
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  );
}

/** Canonical movie URL: /movie/{id}/{slug} */
export function movieHref(movie: Pick<YTSMovie, "id" | "title">): string {
  return `/movie/${movie.id}/${slugify(movie.title)}`;
}

/** Player URL. Quality is optional — player picks the best torrent when omitted. */
export function watchHref(movieId: number, quality?: string): string {
  return quality ? `/watch/${movieId}?q=${encodeURIComponent(quality)}` : `/watch/${movieId}`;
}

export function formatRuntime(minutes: number | undefined): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
}

const QUALITY_RANK: Record<string, number> = { "2160p": 4, "1080p": 3, "720p": 2, "480p": 1, "3D": 0 };

/** Prefer 1080p web, then by quality rank, then by seeds. */
export function sortTorrents(torrents: Torrent[] = []): Torrent[] {
  return [...torrents].sort((a, b) => {
    const qa = QUALITY_RANK[a.quality] ?? 0;
    const qb = QUALITY_RANK[b.quality] ?? 0;
    if (qa !== qb) return qb - qa;
    return (b.seeds ?? 0) - (a.seeds ?? 0);
  });
}

/**
 * How well a torrent should stream in the browser, highest first.
 * Webtor streams over HTTP from its own servers, so start-up time is driven by
 * (1) swarm health — how fast its servers can pull pieces, and
 * (2) how heavy the file is — bitrate to buffer, and whether it needs transcoding.
 * x265/HEVC and 10-bit often aren't playable natively in browsers and get transcoded
 * on the fly, which is the slowest path; 2160p and 3D are too heavy to start quickly.
 */
export function streamScore(t: Torrent): number {
  const health = (t.seeds ?? 0) + 0.5 * (t.peers ?? 0);
  if (health <= 0) return -1;
  const codec = (t.video_codec ?? "").toLowerCase();
  const heavyCodec = codec.includes("265") || codec.includes("hevc") || /10.?bit/i.test(t.type ?? "");
  const qualityWeight: Record<string, number> = { "1080p": 1.25, "720p": 1, "480p": 0.6, "2160p": 0.35, "3D": 0.2 };
  const sizeGb = (t.size_bytes ?? 0) / 1e9 || 2;
  // Diminishing returns past ~60 seeders: a 400-seed swarm isn't 6x faster than a 60-seed one.
  const swarm = Math.log2(1 + Math.min(health, 400)) / Math.log2(61);
  // Lighter files start sooner; penalise above ~2.5 GB.
  const weight = sizeGb <= 2.5 ? 1 : 2.5 / sizeGb;
  const webRip = (t.type ?? "").toLowerCase() === "web" ? 1.05 : 1;
  return swarm * (qualityWeight[t.quality] ?? 0.5) * weight * webRip * (heavyCodec ? 0.4 : 1);
}

/** Below this many seeds+peers a 1080p stream usually stalls; prefer a healthier 720p. */
const MIN_HEALTH_FOR_1080 = 15;

/**
 * Best torrent to start streaming. A quality the viewer chose is respected
 * (healthiest copy of it); otherwise the highest streamScore wins, with 1080p
 * only when its swarm can sustain it.
 */
export function pickStreamTorrent(torrents: Torrent[] = [], preferred?: string): Torrent | undefined {
  const usable = torrents.filter((t) => t.hash);
  if (preferred) {
    const match = usable.filter((t) => t.quality === preferred).sort((a, b) => streamScore(b) - streamScore(a))[0];
    if (match) return match;
  }
  const ranked = [...usable].sort((a, b) => streamScore(b) - streamScore(a));
  const best = ranked[0];
  if (best?.quality === "1080p" && (best.seeds ?? 0) + (best.peers ?? 0) < MIN_HEALTH_FOR_1080) {
    return ranked.find((t) => t.quality === "720p" && streamScore(t) > 0) ?? best;
  }
  return best;
}

/**
 * Announce list appended to magnet links (the fallback when the .torrent file can't be used).
 * Long-lived public UDP trackers; reviewed 2026-11. Dead trackers only cost time, so keep this short.
 */
export const TRACKERS = [
  "udp://tracker.opentrackr.org:1337/announce",
  "udp://open.demonii.com:1337/announce",
  "udp://open.stealth.si:80/announce",
  "udp://tracker.torrent.eu.org:451/announce",
  "udp://exodus.desync.com:6969/announce",
  "udp://explodie.org:6969/announce",
  "udp://tracker.qu.ax:6969/announce",
  "udp://tracker.dler.org:6969/announce",
  "udp://p4p.arenabg.com:1337/announce",
  "udp://tracker.tiny-vps.com:6969/announce",
  "https://tracker.tamersunion.org:443/announce",
];

/** Pure — safe on client and server. */
export function buildMagnet(hash: string, title: string): string {
  const tr = TRACKERS.map((t) => `tr=${encodeURIComponent(t)}`).join("&");
  return `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(title)}&${tr}`;
}

/** Bigger poster for detail pages — YTS medium covers are ~230px wide. */
export function posterSrc(movie: Pick<YTSMovie, "large_cover_image" | "medium_cover_image">, size: "md" | "lg" = "md") {
  return size === "lg" ? movie.large_cover_image || movie.medium_cover_image : movie.medium_cover_image || movie.large_cover_image;
}

export function backdropSrc(movie: Pick<YTSMovie, "background_image_original" | "background_image" | "large_cover_image">) {
  return movie.background_image_original || movie.background_image || movie.large_cover_image;
}

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
