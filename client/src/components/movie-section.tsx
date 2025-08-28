import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import MovieCard from "./movie-card";
import type { YTSMovie } from "@shared/schema";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';

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
    <section className="container mx-auto px-2 sm:px-4 group">
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
      
      <div className="relative">
        {isLoading ? (
          // Loading skeleton
          <div className="flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-hidden pb-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 w-48">
                <Skeleton className="h-72 w-full rounded-lg mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : movies && movies.length > 0 ? (
          <>
            <Swiper
              modules={[FreeMode]}
              spaceBetween={16}
              slidesPerView="auto"
              freeMode={true}
              breakpoints={{
                320: {
                  slidesPerView: 2.2,
                  spaceBetween: 12
                },
                640: {
                  slidesPerView: 3.5,
                  spaceBetween: 16
                },
                768: {
                  slidesPerView: 4.5,
                  spaceBetween: 20
                },
                1024: {
                  slidesPerView: 5.5,
                  spaceBetween: 24
                },
                1280: {
                  slidesPerView: 6.5,
                  spaceBetween: 24
                }
              }}
              className="pb-4"
            >
              {movies.map((movie) => (
                <SwiperSlide key={movie.id} className="!w-auto">
                  <MovieCard
                    movie={movie}
                    onClick={onMovieClick}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </>
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
