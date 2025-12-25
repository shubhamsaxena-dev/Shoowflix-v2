import { useEffect, useRef, useCallback, useState } from "react";
import { useMoviesInfinite } from "@/hooks/use-movies";
import MovieCard from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MovieFilters } from "@/lib/types";
import { YTSMovie } from "@/types/movie";
import { useRouter } from "next/router";

interface InfiniteScrollMoviesProps {
  filters?: MovieFilters;
  className?: string;
}

export function InfiniteScrollMovies({
  filters = {},
  className = "",
}: InfiniteScrollMoviesProps) {
  const {
    movies,
    error,
    isLoading,
    isLoadingMore,
    canLoadMore,
    loadMore,
    isEmpty,
  } = useMoviesInfinite(filters);
  const [loadingMovieId, setLoadingMovieId] = useState<number | null>(null);
  const router = useRouter();

  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const handleMovieClick = (movie: YTSMovie) => {
    // Set loading state for this movie
    setLoadingMovieId(movie.id);

    // Navigate to movie detail page with proper router
    const movieSlug = movie.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    // Use timeout to show loading state briefly before navigation
    setTimeout(() => {
      router.push(`/movie/${movie.id}/${movieSlug}`);
    }, 150);
  };
  const lastMovieElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && canLoadMore) {
          loadMore();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoadingMore, canLoadMore, loadMore]
  );

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load movies: {error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 ${className}`}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-48 sm:h-64 lg:h-72 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No movies found</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {movies.map((movie, index) => {
          const isLast = index === movies.length - 1;
          return (
            <div
              key={movie.id}
              ref={isLast ? lastMovieElementRef : null}
              data-testid={`movie-card-${movie.id}`}
            >
              <MovieCard
                movie={movie}
                onClick={() => handleMovieClick(movie)}
                isLoading={loadingMovieId === movie.id}
              />
            </div>
          );
        })}
      </div>

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`loading-${i}`} className="space-y-2">
              <Skeleton className="h-48 sm:h-64 lg:h-72 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Load more trigger (for manual loading as fallback) */}
      {canLoadMore && !isLoadingMore && (
        <div className="text-center py-4">
          <div ref={loadMoreRef} />
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            data-testid="button-load-more"
          >
            Load More Movies
          </button>
        </div>
      )}

      {/* End message */}
      {!canLoadMore && !isLoadingMore && movies.length > 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500">You've reached the end!</p>
        </div>
      )}
    </div>
  );
}
