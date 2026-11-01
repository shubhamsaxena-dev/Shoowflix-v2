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

/** Best torrent for instant streaming: 1080p > 720p > anything, weighted by seeds. Avoids 2160p (too heavy for webtor). */
export function pickStreamTorrent(torrents: Torrent[] = [], preferred?: string): Torrent | undefined {
  if (preferred) {
    const match = torrents.filter((t) => t.quality === preferred).sort((a, b) => b.seeds - a.seeds)[0];
    if (match) return match;
  }
  for (const q of ["1080p", "720p", "480p", "2160p"]) {
    const match = torrents.filter((t) => t.quality === q).sort((a, b) => b.seeds - a.seeds)[0];
    if (match) return match;
  }
  return torrents[0];
}

export const TRACKERS = [
  "udp://tracker.opentrackr.org:1337/announce",
  "udp://open.stealth.si:80/announce",
  "udp://tracker.torrent.eu.org:451/announce",
  "udp://exodus.desync.com:6969/announce",
  "udp://tracker.openbittorrent.com:6969/announce",
  "wss://tracker.openwebtorrent.com",
  "wss://tracker.webtorrent.dev",
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
