import type { Metadata } from "next";
import { ChipLink } from "@/components/ui/chip";
import { ButtonLink } from "@/components/ui/button";
import { InfiniteMovies } from "@/components/discovery/infinite-movies";
import { EmptyState } from "@/components/discovery/page-intro";
import { PAGE_SIZE, asPage, firstParam, genreLabel } from "@/components/discovery/catalog";
import { listMovies } from "@/lib/yts";
import { GENRES, type MovieFilters } from "@/types/movie";
import styles from "@/components/discovery/discovery.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function readQuery(searchParams: SearchParams) {
  return (firstParam((await searchParams).q) ?? "").trim().slice(0, 120);
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const q = await readQuery(searchParams);
  return {
    title: q ? `“${q}” — search` : "Search",
    description: "Search the Shoowflix catalogue by title, actor or year.",
    alternates: { canonical: "/search" },
    robots: { index: false, follow: true },
  };
}

const TRY = ["Nolan", "Studio Ghibli", "1999", "Heist", "Villeneuve", "Kurosawa"];

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const q = await readQuery(searchParams);

  if (!q) {
    return (
      <div className={styles.suggest}>
        <div className={styles.suggestGroup}>
          <h2 className={styles.suggestTitle}>Try a name, a year or a word</h2>
          <div className={styles.suggestList}>
            {TRY.map((t) => (
              <ChipLink key={t} href={`/search?q=${encodeURIComponent(t)}`} prefetch={false}>
                {t}
              </ChipLink>
            ))}
          </div>
        </div>
        <div className={styles.suggestGroup}>
          <h2 className={styles.suggestTitle}>Or start from a genre</h2>
          <div className={styles.suggestList}>
            {GENRES.map((g) => (
              <ChipLink key={g} href={`/genre/${g}`} size="sm" prefetch={false}>
                {genreLabel(g)}
              </ChipLink>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filters: MovieFilters = { query_term: q, sort_by: "download_count", order_by: "desc", limit: PAGE_SIZE };
  const firstPage = await listMovies({ ...filters, page: 1 }).then(asPage, () => null);
  const count = firstPage?.movie_count ?? 0;

  return (
    <>
      {count > 0 && (
        <div className={styles.resultsHead}>
          <h2 className={styles.resultsTitle}>Results for “{q}”</h2>
          <p className={styles.resultsCount}>
            <span className="mono">{count.toLocaleString("en-US")}</span> {count === 1 ? "match" : "matches"}, most
            streamed first
          </p>
        </div>
      )}
      <InfiniteMovies
        key={q}
        filters={filters}
        fallback={firstPage ?? undefined}
        empty={
          <EmptyState
            title={<>Nothing on the reel for “{q}”</>}
            actions={
              <>
                <ButtonLink href="/browse" variant="secondary">
                  Browse the catalogue
                </ButtonLink>
                <ButtonLink href="/#ai-title" variant="ghost">
                  Ask the projectionist
                </ButtonLink>
              </>
            }
          >
            Check the spelling, search by the original title, or try just an actor&apos;s or director&apos;s surname.
          </EmptyState>
        }
      />
    </>
  );
}
