import { backdropSrc, formatRuntime, movieHref } from "@/lib/movie-utils";
import type { YTSMovie } from "@/types/movie";
import { HeroCarousel, type HeroSlide } from "./hero-carousel";

/**
 * Home spotlight. Server component: trims each film down to what the hero shows
 * so the client island receives a few hundred bytes per slide, not full YTS payloads.
 */
export function Hero({ movies }: { movies: YTSMovie[] }) {
  const slides: HeroSlide[] = movies
    .filter((m) => backdropSrc(m))
    .slice(0, 5)
    .map((m) => ({
      id: m.id,
      title: m.title,
      href: movieHref(m),
      backdrop: backdropSrc(m),
      year: m.year,
      runtime: formatRuntime(m.runtime),
      rating: m.rating ? m.rating.toFixed(1) : "",
      mpa: m.mpa_rating || "",
      genres: (m.genres ?? []).slice(0, 3),
      summary: m.summary || m.description_full || m.synopsis || "",
    }));

  if (!slides.length) return null;
  return <HeroCarousel slides={slides} />;
}
