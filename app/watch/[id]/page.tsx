import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { castPath, createCastToken } from "@/lib/cast-token";
import { preconnect, prefetchDNS, preload } from "react-dom";
import { getMovie } from "@/lib/yts";
import { backdropSrc, buildMagnet, movieHref, pickStreamTorrent, posterSrc, sortTorrents } from "@/lib/movie-utils";
import { PlayerStage } from "@/components/player/player-stage";
import { NoStream } from "@/components/player/no-stream";
import type { StageMovie, StageSource } from "@/components/player/types";
import { WEBTOR_SDK_INTEGRITY, WEBTOR_SDK_URL } from "@/components/player/webtor-sdk";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const id = parseId((await params).id);
  const movie = id ? await getMovie(id) : null; // deduped with the page via the fetch cache
  return {
    title: movie ? `Watch ${movie.title} (${movie.year})` : "Player",
    description: movie?.summary?.slice(0, 160) || undefined,
    robots: { index: false, follow: false },
    alternates: movie ? { canonical: movieHref(movie) } : undefined,
  };
}

export default async function WatchPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  // Warm the connections the player needs before the client bundle asks for them.
  // The SDK download starts while the HTML is still streaming, not after hydration + the player chunk.
  preload(WEBTOR_SDK_URL, { as: "script", crossOrigin: "anonymous", integrity: WEBTOR_SDK_INTEGRITY, fetchPriority: "high" });
  preconnect("https://cdn.jsdelivr.net", { crossOrigin: "anonymous" });
  preconnect("https://webtor.io");
  prefetchDNS("https://webtor.io");

  const [{ id: rawId }, query, session] = await Promise.all([params, searchParams, auth()]);
  // Watching is for signed-in members. proxy.ts redirects first; this keeps the page safe on its own.
  if (!session?.user?.id) {
    const qs = new URLSearchParams(
      Object.entries(query).flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : v ? [[k, v]] : [])),
    ).toString();
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/watch/${rawId}${qs ? `?${qs}` : ""}`)}`);
  }
  const id = parseId(rawId);
  if (!id) notFound();

  const movie = await getMovie(id);
  if (!movie) notFound();

  const q = Array.isArray(query.q) ? query.q[0] : query.q;
  const torrents = (movie.torrents ?? []).filter((t) => t.hash);
  const picked = pickStreamTorrent(torrents, q);
  const recommended = pickStreamTorrent(torrents);

  const stageMovie: StageMovie = {
    id: movie.id,
    title: movie.title_english || movie.title,
    year: movie.year,
    runtime: movie.runtime ?? 0,
    rating: movie.rating ?? 0,
    genres: movie.genres ?? [],
    summary: movie.summary || movie.description_full || "",
    mpaRating: movie.mpa_rating || undefined,
    imdbId: movie.imdb_code || undefined,
    poster: posterSrc(movie, "lg") || undefined,
    backdrop: backdropSrc(movie) || undefined,
    href: movieHref(movie),
  };

  if (!picked) return <NoStream movie={stageMovie} />;

  const sources: StageSource[] = sortTorrents(torrents).map((t) => ({
    hash: t.hash,
    quality: t.quality,
    type: t.type,
    codec: t.video_codec,
    size: t.size,
    sizeBytes: t.size_bytes ?? 0,
    seeds: t.seeds ?? 0,
    peers: t.peers ?? 0,
    magnet: buildMagnet(t.hash, `${movie.title_long || movie.title} [${t.quality}]`),
    torrentUrl: /^https:\/\//.test(t.url) ? t.url : undefined,
  }));

  return (
    <PlayerStage
      key={movie.id}
      movie={stageMovie}
      sources={sources}
      initialHash={picked.hash}
      recommendedHash={recommended?.hash}
      castBase={castPath(movie.id, await createCastToken(movie.id))}
    />
  );
}
