import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { preconnect, preload } from "react-dom";
import { getMovie } from "@/lib/yts";
import { verifyCastToken } from "@/lib/cast-token";
import { backdropSrc, buildMagnet, pickStreamTorrent } from "@/lib/movie-utils";
import { CastReceiver } from "@/components/player/cast-receiver";
import { WEBTOR_SDK_INTEGRITY, WEBTOR_SDK_URL } from "@/components/player/webtor-sdk";
import styles from "@/components/player/cast-receiver.module.css";

export const metadata: Metadata = { title: "Casting", robots: { index: false, follow: false } };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Opened on the Chromecast by the Presentation API. That session has no cookies, so the
 * disclaimer/sign-in gates are replaced by a signed link minted on the (gated) watch page.
 */
export default async function CastPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  preload(WEBTOR_SDK_URL, { as: "script", crossOrigin: "anonymous", integrity: WEBTOR_SDK_INTEGRITY, fetchPriority: "high" });
  preconnect("https://webtor.io");

  const [{ id: rawId }, query] = await Promise.all([params, searchParams]);
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  if (!(await verifyCastToken(id, first(query.t)))) {
    return (
      <div className={styles.receiver}>
        <div className={styles.overlay}>
          <p className={styles.title}>This cast link has expired</p>
          <p className={styles.note}>Start casting again from the player on your computer.</p>
        </div>
      </div>
    );
  }

  const movie = await getMovie(id);
  if (!movie) notFound();
  const torrent = pickStreamTorrent(movie.torrents ?? [], first(query.q));
  if (!torrent) notFound();

  return (
    <CastReceiver
      title={movie.title_english || movie.title}
      imdbId={movie.imdb_code || undefined}
      poster={backdropSrc(movie) || undefined}
      magnet={buildMagnet(torrent.hash, `${movie.title_long || movie.title} [${torrent.quality}]`)}
      torrentUrl={/^https:\/\//.test(torrent.url) ? torrent.url : undefined}
    />
  );
}
