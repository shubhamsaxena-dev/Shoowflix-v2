import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GenreFeed } from "@/components/discovery/genre-feed";
import { PageIntro } from "@/components/discovery/page-intro";
import { GENRE_NOTES, PAGE_SIZE, asPage, genreLabel, isGenre } from "@/components/discovery/catalog";
import { MovieGrid } from "@/components/movie/movie-grid";
import { listMovies } from "@/lib/yts";
import { GENRES } from "@/types/movie";

export const revalidate = 21600; // 6 h
export const dynamicParams = false;

export function generateStaticParams() {
  return GENRES.map((genre) => ({ genre }));
}

type Props = { params: Promise<{ genre: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { genre } = await params;
  if (!isGenre(genre)) return {};
  const label = genreLabel(genre);
  return {
    title: `${label} films`,
    description: `Stream ${label.toLowerCase()} films in HD. ${GENRE_NOTES[genre]}`,
    alternates: { canonical: `/genre/${genre}` },
    openGraph: { title: `${label} films`, url: `/genre/${genre}` },
  };
}

export default async function GenrePage({ params }: Props) {
  const { genre } = await params;
  if (!isGenre(genre)) notFound();

  const firstPage = asPage(await listMovies({ genre, sort_by: "date_added", order_by: "desc", limit: PAGE_SIZE, page: 1 }));

  return (
    <div className="container">
      <PageIntro
        kicker={<Link href="/genre">Genres</Link>}
        title={genreLabel(genre)}
        lede={GENRE_NOTES[genre]}
      />
      {/* Fallback = the same first page, server-rendered, so the static HTML is never a skeleton. */}
      <Suspense fallback={<MovieGrid movies={firstPage.movies} />}>
        <GenreFeed genre={genre} firstPage={firstPage} />
      </Suspense>
    </div>
  );
}
