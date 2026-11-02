import { FallbackImage } from "@/components/ui/fallback-image";
import Link from "next/link";
import { Play } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { WatchlistButton } from "@/components/account/watchlist-button";
import { genreSlug } from "@/components/discovery/catalog";
import {
  backdropSrc,
  cx,
  formatRuntime,
  movieHref,
  pickStreamTorrent,
  posterSrc,
  sortTorrents,
  watchHref,
} from "@/lib/movie-utils";
import type { Cast, Torrent, YTSMovie } from "@/types/movie";
import { ShareButton } from "./share-button";
import styles from "./detail.module.css";
import { WatchButton } from "@/components/account/watch-button";

/* ------------------------------------------------------------------ */
/* Header: backdrop (LCP) + poster + title + slate + actions           */
/* ------------------------------------------------------------------ */

export function MovieHeader({ movie }: { movie: YTSMovie }) {
  const backdrop = backdropSrc(movie);
  const runtime = formatRuntime(movie.runtime);
  const best = pickStreamTorrent(movie.torrents);
  const tagline = movie.title_long && movie.title_long !== movie.title ? movie.title_long : null;

  return (
    <header className={styles.header} data-header-overlay="">
      <div className={styles.backdrop} aria-hidden>
        {backdrop && (
          <FallbackImage
            fade={false}
            src={backdrop}
            alt=""
            fill
            sizes="100vw"
            quality={75}
            preload
            fetchPriority="high"
            loading="eager"
            className={styles.backdropImg}
          />
        )}
        <div className={styles.scrim} />
      </div>

      <div className={cx("container", styles.headerInner)}>
        <div className={styles.poster}>
          <FallbackImage
            fallback={
              <span className={styles.noPoster} aria-hidden>
                {movie.title}
              </span>
            }
            src={posterSrc(movie, "lg")}
            alt={`${movie.title} poster`}
            fill
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 220px, 36vw"
            quality={70}
            loading="eager"
          />
        </div>

        <div className={styles.headline}>
          {tagline && <p className={styles.kicker}>{tagline}</p>}
          <h1 className={styles.title}>{movie.title}</h1>

          <dl className={styles.slate}>
            {movie.year ? <SlateCell label="Year" value={movie.year} /> : null}
            {runtime ? <SlateCell label="Runtime" value={runtime} /> : null}
            {movie.rating ? (
              <SlateCell label="IMDb" value={<span className={styles.rating}>{movie.rating.toFixed(1)}</span>} />
            ) : null}
            {movie.mpa_rating ? <SlateCell label="Rated" value={movie.mpa_rating} /> : null}
            {movie.language ? <SlateCell label="Language" value={movie.language.toUpperCase()} /> : null}
          </dl>

          {movie.genres?.length ? (
            <ul role="list" className={styles.genres} aria-label="Genres">
              {movie.genres.map((g) => {
                const slug = genreSlug(g);
                return (
                  <li key={g}>
                    {slug ? (
                      <Link href={`/genre/${slug}`} className={styles.genre}>
                        {g}
                      </Link>
                    ) : (
                      <span className={styles.genre}>{g}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : null}

          <div className={styles.ctas}>
            {best ? (
              <WatchButton movieId={movie.id} size="lg">
                <Play aria-hidden fill="currentColor" />
                Play
                <span className={styles.ctaQuality}>{best.quality}</span>
              </WatchButton>
            ) : null}
            <WatchlistButton movieId={movie.id} variant="full" size="lg" title={movie.title} />
            <ShareButton title={movie.title} path={movieHref(movie)} text={movie.summary?.slice(0, 140)} />
          </div>
        </div>
      </div>
    </header>
  );
}

function SlateCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Synopsis                                                           */
/* ------------------------------------------------------------------ */

export function Synopsis({ movie }: { movie: YTSMovie }) {
  const text = movie.description_full || movie.summary || movie.synopsis;
  if (!text) return null;
  const [lead, ...rest] = text.split(/\n+/).filter(Boolean);
  return (
    <section className={styles.section} aria-labelledby="synopsis-title">
      <h2 id="synopsis-title" className={styles.sectionTitle}>
        Synopsis
      </h2>
      <div className={styles.synopsis}>
        <p className={styles.synopsisLead}>{lead}</p>
        {rest.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Cast                                                               */
/* ------------------------------------------------------------------ */

export function CastList({ cast }: { cast?: Cast[] }) {
  if (!cast?.length) return null;
  return (
    <section className={styles.section} aria-labelledby="cast-title">
      <h2 id="cast-title" className={styles.sectionTitle}>
        Cast
      </h2>
      <ul role="list" className={styles.cast}>
        {cast.map((c) => (
          <li key={`${c.imdb_code}-${c.character_name}`} className={styles.castItem}>
            <span className={styles.avatar}>
              {c.url_small_image ? (
                <FallbackImage
                  src={c.url_small_image}
                  alt=""
                  fill
                  sizes="56px"
                  quality={70}
                  loading="lazy"
                  fallback={<span aria-hidden>{initials(c.name)}</span>}
                />
              ) : (
                <span aria-hidden>{initials(c.name)}</span>
              )}
            </span>
            <span className={styles.castText}>
              <a
                href={`https://www.imdb.com/name/nm${c.imdb_code}/`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.castName}
              >
                {c.name}
              </a>
              {c.character_name && <span className={styles.castRole}>as {c.character_name}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Stream picker                                                      */
/* ------------------------------------------------------------------ */

export function StreamPicker({ movie }: { movie: YTSMovie }) {
  const torrents = sortTorrents(movie.torrents);
  return (
    <section className={cx(styles.section, styles.booth)} aria-labelledby="streams-title">
      <div className={styles.boothHead}>
        <h2 id="streams-title" className={styles.sectionTitle}>
          Choose a print
        </h2>
        <p className={styles.boothNote}>Higher seed counts start faster.</p>
      </div>
      {torrents.length ? (
        <ul role="list" className={styles.prints}>
          {torrents.map((t, i) => (
            // Not keyed by hash: React keys are serialized into the RSC payload, and hashes stay behind /watch.
            <PrintRow key={`${t.quality}-${t.type}-${i}`} torrent={t} movie={movie} />
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No prints are available for this film yet.</p>
      )}
    </section>
  );
}

function PrintRow({ torrent: t, movie }: { torrent: Torrent; movie: YTSMovie }) {
  const health = t.seeds >= 50 ? 3 : t.seeds >= 10 ? 2 : t.seeds > 0 ? 1 : 0;
  return (
    <li className={styles.print}>
      <div className={styles.printQuality}>
        <span className={styles.printRes}>{t.quality}</span>
        <span className={styles.printType}>{[t.type, t.video_codec].filter(Boolean).join(" ")}</span>
      </div>
      <dl className={styles.printStats}>
        <div>
          <dt>Size</dt>
          <dd>{t.size}</dd>
        </div>
        <div>
          <dt>Seeds</dt>
          <dd className={styles.seeds}>
            <span className={styles.health} data-level={health} aria-hidden>
              <i />
              <i />
              <i />
            </span>
            {t.seeds}
          </dd>
        </div>
        <div>
          <dt>Peers</dt>
          <dd>{t.peers}</dd>
        </div>
      </dl>
      <div className={styles.printActions}>
        <WatchButton movieId={movie.id} quality={t.quality} size="sm">
          <Play aria-hidden fill="currentColor" />
          Stream
          <span className="visually-hidden"> in {t.quality}</span>
        </WatchButton>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Details facts (sidebar)                                             */
/* ------------------------------------------------------------------ */

export function MovieFacts({ movie }: { movie: YTSMovie }) {
  return (
    <dl className={styles.facts}>
      {movie.imdb_code && (
        <div>
          <dt>IMDb</dt>
          <dd>
            <a href={`https://www.imdb.com/title/${movie.imdb_code}/`} target="_blank" rel="noopener noreferrer">
              {movie.imdb_code}
            </a>
          </dd>
        </div>
      )}
      {movie.like_count ? (
        <div>
          <dt>Likes</dt>
          <dd>{movie.like_count.toLocaleString("en-US")}</dd>
        </div>
      ) : null}
      {movie.date_uploaded && (
        <div>
          <dt>Added</dt>
          <dd>
            <time dateTime={movie.date_uploaded.replace(" ", "T")}>{movie.date_uploaded.slice(0, 10)}</time>
          </dd>
        </div>
      )}
    </dl>
  );
}
