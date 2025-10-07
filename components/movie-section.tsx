"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import MovieCard from "./movie-card";
import { useMoviesByGenre } from "@/hooks/use-movies";
import type { YTSMovie } from "@/types/movie";
import { memo } from "react";

interface MovieSectionProps {
  title?: string;
  genre?: string;
  movies?: YTSMovie[];
  isLoading?: boolean;
  onMovieClick?: (movie: YTSMovie) => void;
  onViewAll?: () => void;
  loadingMovieId?: number | null;
  loadingViewAll?: boolean;
  error?:any
}

const MovieSection=({
  title,
  genre,
  movies: propMovies,
  isLoading: propLoading = false,
  onMovieClick,
  onViewAll,
  loadingMovieId,
  loadingViewAll,
}: MovieSectionProps) =>{
  // Fetch if genre is provided and movies prop is not
  const { movies: fetchedMovies = [], isLoading: fetchedLoading, error } =
    !propMovies && genre ? useMoviesByGenre(genre) : { movies: [], isLoading: false, error: null };

  const isLoading = propMovies ? propLoading : fetchedLoading;
  const movies = propMovies ? propMovies.slice(0, 20) : fetchedMovies.slice(0, 20);
  const displayTitle = title || (genre ? `${genre} Movies` : "Movies");

  return (
    <section
      className="container mx-auto px-2 sm:px-4 group"
      style={{ minHeight: "380px", paddingBottom: "2rem" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">{displayTitle}</h2>

        {onViewAll && (
          <Button
            variant="ghost"
            className="text-foreground hover:text-foreground hover:bg-accent transition-colors font-medium"
            onClick={onViewAll}
            disabled={loadingViewAll}
          >
            {loadingViewAll ? (
              <>
                Loading... <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              <>
                View All <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="relative">
        {error ? (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load movies.
          </div>
        ) : isLoading ? (
          <div
            className="flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-hidden pb-4"
            style={{ minHeight: "320px" }}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 w-36 sm:w-48">
                <div
                  className="bg-gray-700 rounded-lg mb-4 animate-pulse"
                  style={{ aspectRatio: "2/3", height: "208px" }}
                ></div>
                <div className="h-4 w-full mb-2 bg-gray-600 rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-gray-600 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : movies.length > 0 ? (
          <Swiper
            modules={[FreeMode]}
            spaceBetween={16}
            slidesPerView="auto"
            freeMode={movies.length > 4}
            className="pb-4 max-w-full overflow-hidden"
            breakpoints={{
              320: { slidesPerView: 2.2, spaceBetween: 12 },
              640: { slidesPerView: 3.5, spaceBetween: 16 },
              768: { slidesPerView: 4.5, spaceBetween: 20 },
              1024: { slidesPerView: 5.5, spaceBetween: 24 },
              1280: { slidesPerView: 6.5, spaceBetween: 24 },
            }}
          >
            {movies.map((movie:any) => (
              <SwiperSlide key={movie.id} className="!w-auto">
                <MovieCard
                  movie={movie}
                  onClick={() => onMovieClick?.(movie)}
                  isLoading={loadingMovieId === movie.id}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="text-center py-8 w-full">
            <p className="text-muted-foreground">No movies found in this section.</p>
          </div>
        )}
      </div>
    </section>
  );
}


export default memo(MovieSection)