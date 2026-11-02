import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMovie } from "@/lib/yts";
import { MovieCard } from "@/components/movie/movie-card";
import { GRID_CARD_SIZES } from "@/components/movie/movie-grid";
import { EmptyList } from "@/components/account/empty-list";
import type { YTSMovie } from "@/types/movie";
import { MyListGrid } from "./my-list-grid";
import styles from "./my-list.module.css";

export const metadata: Metadata = {
  title: "My List",
  robots: { index: false },
};

export default async function MyListPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/my-list");

  const row = await prisma.userFeaturedMovies.findUnique({
    where: { userId: session.user.id },
    select: { movieIds: true },
  });
  // Stored newest-first by POST /api/watchlist.
  const ids = (row?.movieIds ?? []).map(Number).filter((n) => Number.isFinite(n) && n > 0);
  const movies = (await Promise.all(ids.map((id) => getMovie(id)))).filter((m): m is YTSMovie => Boolean(m));

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>My List</h1>
        <p className={styles.lede}>Films you’ve saved for later, newest first.</p>
      </header>

      {movies.length ? (
        <MyListGrid
          items={movies.map((movie, i) => ({
            id: movie.id,
            node: <MovieCard movie={movie} sizes={GRID_CARD_SIZES} priority={i < 2} />,
          }))}
        />
      ) : (
        <EmptyList />
      )}
    </div>
  );
}
