import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Hero } from "@/components/movie/hero";
import { MovieRail } from "@/components/movie/movie-rail";
import { RailSkeleton } from "@/components/movie/movie-skeleton";
import { GenreShowcase, GenreShowcaseSkeleton } from "@/components/discovery/genre-showcase";
import { listMovies, RAILS, type RailKey } from "@/lib/yts";
import { cx, SITE_NAME } from "@/lib/movie-utils";
import type { YTSMovie } from "@/types/movie";
import styles from "@/components/discovery/discovery.module.css";

export const revalidate = 1800;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Client islands, code-split. Both still SSR (ContinueWatching renders nothing server-side).
const ContinueWatchingRail = dynamic(() =>
  import("@/components/player/continue-watching-rail").then((m) => m.ContinueWatchingRail),
);
const AiSuggest = dynamic(() => import("@/components/discovery/ai-suggest").then((m) => m.AiSuggest));

/** A failed rail should hide that rail, not take the home page down. */
async function loadRail(key: RailKey): Promise<YTSMovie[]> {
  try {
    const { movies } = await listMovies({ ...RAILS[key].filters, limit: 20 });
    return movies ?? [];
  } catch (error) {
    console.warn(`[home] rail "${key}" failed, hiding it: ${(error as Error).message}`);
    return [];
  }
}

const RAIL_LINKS: Record<RailKey, string> = {
  trending: "/browse?sort=popular",
  latest: "/browse",
  acclaimed: "/browse?sort=rated&rating=8",
  loved: "/browse?sort=popular",
};

export default async function HomePage() {
  // Kick off every rail at once; above-the-fold awaits, the rest stream in.
  const rails = {
    trending: loadRail("trending"),
    latest: loadRail("latest"),
    acclaimed: loadRail("acclaimed"),
    loved: loadRail("loved"),
  } satisfies Record<RailKey, Promise<YTSMovie[]>>;

  const trending = await rails.trending;

  return (
    <>
      <h1 className="visually-hidden">{SITE_NAME} — stream films instantly</h1>

      <Hero movies={trending} />

      <ContinueWatchingRail />

      <MovieRail
        title={RAILS.trending.title}
        eyebrow="Most streamed"
        href={RAIL_LINKS.trending}
        movies={trending.slice(0, 10)}
        numbered
      />

      <Suspense fallback={<RailSkeleton />}>
        <AsyncRail railKey="latest" movies={rails.latest} eyebrow="Just added" />
      </Suspense>

      <div className={cx("container", "cv-auto", styles.homeSection)}>
        <Suspense fallback={<GenreShowcaseSkeleton />}>
          <GenreShowcase />
        </Suspense>
      </div>

      <div className="cv-auto">
        <Suspense fallback={<RailSkeleton />}>
          <AsyncRail railKey="acclaimed" movies={rails.acclaimed} eyebrow="IMDb 8 and above" />
        </Suspense>
      </div>

      <div className={cx("container", "cv-auto", styles.homeSection)}>
        <AiSuggest />
      </div>

      <div className="cv-auto">
        <Suspense fallback={<RailSkeleton />}>
          <AsyncRail railKey="loved" movies={rails.loved} eyebrow="Most liked" />
        </Suspense>
      </div>
    </>
  );
}

async function AsyncRail({
  railKey,
  movies,
  eyebrow,
}: {
  railKey: RailKey;
  movies: Promise<YTSMovie[]>;
  eyebrow?: string;
}) {
  return <MovieRail title={RAILS[railKey].title} eyebrow={eyebrow} href={RAIL_LINKS[railKey]} movies={await movies} />;
}
