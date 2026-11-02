import Link from "next/link";
import { ChipLink } from "@/components/ui/chip";
import { FallbackImage } from "@/components/ui/fallback-image";
import { listMovies } from "@/lib/yts";
import { posterSrc } from "@/lib/movie-utils";
import { GENRES, type Genre, type YTSMovie } from "@/types/movie";
import { GENRE_NOTES, genreLabel } from "./catalog";
import styles from "./genre-showcase.module.css";

/** The eight genres people reach for most get a poster fan; the rest are quick links. */
const FEATURED: Genre[] = ["action", "comedy", "drama", "horror", "sci-fi", "thriller", "animation", "romance"];
const POSTERS_PER_GENRE = 3;

type Poster = Pick<YTSMovie, "id" | "title" | "medium_cover_image" | "large_cover_image">;

/**
 * YTS tags films with every genre that applies (and adds "Action" to almost everything),
 * so a genre query returns anything carrying the tag at all. To make each card *look* like
 * its genre we rank the most-liked films by how focused their tags are:
 * clashing tags cost 3, every other tag costs 1, ignoring the noisy "Action" tag outside
 * the Action card. Popularity breaks ties.
 */
const CLASHES: Record<string, string[]> = {
  action: ["Animation", "Comedy", "Family", "Romance"],
  comedy: ["Action", "Animation", "Horror"],
  drama: ["Animation", "Sci-Fi", "Fantasy", "Family"],
  horror: ["Animation", "Comedy", "Family"],
  "sci-fi": ["Animation", "Family"],
  thriller: ["Animation", "Comedy", "Family"],
  animation: [],
  romance: ["Animation", "Horror", "Sci-Fi", "Fantasy"],
};

function focusPenalty(movie: YTSMovie, genre: string): number {
  const tags = (movie.genres ?? []).filter((t) => genre === "action" || t !== "Action");
  const clashes = CLASHES[genre] ?? [];
  let penalty = tags.reduce((sum, t) => sum + (clashes.includes(t) ? 3 : 1), 0);
  // Animated features worth showing are mostly family films; live action is sometimes mis-tagged "Animation".
  if (genre === "animation" && tags.includes("Family")) penalty -= 2;
  return penalty;
}

/** Three well-loved posters per featured genre that read as that genre. Each film is used once. */
async function loadPosters(): Promise<Record<string, Poster[]>> {
  const lists = await Promise.all(
    FEATURED.map((genre) =>
      listMovies({ genre, sort_by: "like_count", order_by: "desc", minimum_rating: 7, limit: 50 })
        .then((r) => r.movies)
        .catch(() => [] as YTSMovie[]),
    ),
  );
  const used = new Set<number>();
  const out: Record<string, Poster[]> = {};
  FEATURED.forEach((genre, i) => {
    const ranked = lists[i]
      .map((movie, order) => ({ movie, order, penalty: focusPenalty(movie, genre) }))
      .filter(({ movie }) => movie.medium_cover_image || movie.large_cover_image)
      .sort((a, b) => a.penalty - b.penalty || a.order - b.order);
    const picks: Poster[] = [];
    for (const { movie: m } of ranked) {
      if (picks.length === POSTERS_PER_GENRE) break;
      if (used.has(m.id)) continue;
      used.add(m.id);
      picks.push({ id: m.id, title: m.title, medium_cover_image: m.medium_cover_image, large_cover_image: m.large_cover_image });
    }
    out[genre] = picks;
  });
  return out;
}

export async function GenreShowcase() {
  const posters = await loadPosters();
  const others = GENRES.filter((g) => !FEATURED.includes(g));

  return (
    <section className={styles.section} aria-labelledby="genre-showcase-title">
      <div className={styles.head}>
        <h2 id="genre-showcase-title" className={styles.title}>
          Browse by genre
        </h2>
        <Link href="/genre" className={styles.all} prefetch={false}>
          All {GENRES.length} genres
        </Link>
      </div>

      <ul role="list" className={styles.grid}>
        {FEATURED.map((genre) => (
          <li key={genre}>
            <Link href={`/genre/${genre}`} className={styles.card} prefetch={false}>
              <span className={styles.text}>
                <span className={styles.name}>{genreLabel(genre)}</span>
                <span className={styles.note}>{GENRE_NOTES[genre]}</span>
              </span>
              <span className={styles.fan} aria-hidden>
                {(posters[genre] ?? []).map((p, i) => (
                  <span key={p.id} className={styles.poster} data-i={i}>
                    <FallbackImage
                      src={posterSrc(p, "md")}
                      alt=""
                      fill
                      sizes="120px"
                      quality={60}
                      loading="lazy"
                    />
                  </span>
                ))}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <nav className={styles.more} aria-label="More genres">
        {others.map((genre) => (
          <ChipLink key={genre} href={`/genre/${genre}`} size="sm" prefetch={false}>
            {genreLabel(genre)}
          </ChipLink>
        ))}
      </nav>
    </section>
  );
}

/** Same footprint as GenreShowcase so streaming it in never shifts the page. */
export function GenreShowcaseSkeleton() {
  return (
    <section className={styles.section} aria-busy="true" aria-label="Loading genres">
      <div className={styles.head}>
        <h2 className={styles.title}>Browse by genre</h2>
      </div>
      <ul role="list" className={styles.grid}>
        {FEATURED.map((genre) => (
          <li key={genre}>
            <span className={styles.card}>
              <span className={styles.text}>
                <span className={styles.name}>{genreLabel(genre)}</span>
                <span className={styles.note}>{GENRE_NOTES[genre]}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.more} />
    </section>
  );
}
