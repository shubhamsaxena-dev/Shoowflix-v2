import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { InfiniteMovies } from "@/components/discovery/infinite-movies";
import { EmptyState } from "@/components/discovery/page-intro";
import { asPage, browseParamsToFilters, firstParam, genreLabel, isGenre } from "@/components/discovery/catalog";
import { listMovies } from "@/lib/yts";
import styles from "@/components/discovery/discovery.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const sp = await searchParams;
  const genre = firstParam(sp.genre);
  const filtered = Object.keys(sp).length > 0;
  return {
    title: isGenre(genre) ? `Browse ${genreLabel(genre)} films` : "Browse films",
    description: "Browse the full Shoowflix catalogue by genre, quality and rating.",
    alternates: { canonical: "/browse" },
    // Filter permutations are crawl traps; index the plain catalogue only.
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters = browseParamsToFilters({
    genre: firstParam(sp.genre),
    quality: firstParam(sp.quality),
    rating: firstParam(sp.rating),
    sort: firstParam(sp.sort),
    order: firstParam(sp.order),
  });

  const firstPage = await listMovies({ ...filters, page: 1 }).then(asPage, () => null);
  const feedKey = JSON.stringify(filters);

  return (
    <>
      {firstPage && (
        <p className={`${styles.count} ${styles.browseCount}`}>
          <span className="mono">{firstPage.movie_count.toLocaleString("en-US")}</span> films
        </p>
      )}
      <InfiniteMovies
        key={feedKey}
        filters={filters}
        fallback={firstPage ?? undefined}
        empty={
          <EmptyState
            title="No films match these filters"
            actions={
              <>
                <ButtonLink href="/browse" variant="secondary">
                  Clear filters
                </ButtonLink>
                <Link href="/genre" className={styles.inlineLink}>
                  Browse by genre
                </Link>
              </>
            }
          >
            Try a lower minimum rating or any quality.
          </EmptyState>
        }
      />
    </>
  );
}
