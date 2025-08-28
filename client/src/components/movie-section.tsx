import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import MovieCard from "./movie-card";
import type { YTSMovie } from "@shared/schema";

interface MovieSectionProps {
  title: string;
  movies: YTSMovie[] | undefined;
  isLoading: boolean;
  onMovieClick: (movie: YTSMovie) => void;
  onViewAll?: () => void;
  error?: string | null;
}

export default function MovieSection({ 
  title, 
  movies, 
  isLoading, 
  onMovieClick, 
  onViewAll,
  error 
}: MovieSectionProps) {
  
  if (error) {
    return (
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" data-testid={`section-title-${title}`}>{title}</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground" data-testid={`section-error-${title}`}>
            Failed to load movies. Please try again later.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-2 sm:px-4">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold" data-testid={`section-title-${title}`}>{title}</h2>
        {onViewAll && (
          <Button 
            variant="ghost" 
            className="text-primary hover:text-primary/80 transition-colors"
            onClick={onViewAll}
            data-testid={`section-view-all-${title}`}
          >
            View All <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-hidden movie-scroll pb-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-48">
              <Skeleton className="h-72 w-full rounded-lg mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))
        ) : movies && movies.length > 0 ? (
          movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onClick={onMovieClick}
            />
          ))
        ) : (
          <div className="text-center py-8 w-full">
            <p className="text-muted-foreground" data-testid={`section-empty-${title}`}>
              No movies found in this section.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
