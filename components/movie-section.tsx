import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import MovieCardWithFavorites from "./movie-card-with-favorites";
import type { YTSMovie } from "@/types/movie";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';

interface MovieSectionProps {
  title: string;
  movies?: YTSMovie[];
  isLoading: boolean;
  onMovieClick?: (movie: YTSMovie) => void;
  onViewAll?: () => void;
  error?: string;
  loadingMovieId?: number | null;
  loadingViewAll?: boolean;
}

export default function MovieSection({ 
  title, 
  movies, 
  isLoading, 
  onMovieClick,
  onViewAll,
  error,
  loadingMovieId,
  loadingViewAll
}: MovieSectionProps) {

  return (
    <section className="container mx-auto px-2 sm:px-4 group" style={{ minHeight: '380px', paddingBottom: '2rem' }}>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold" data-testid={`section-title-${title}`}>{title}</h2>
        {onViewAll && (
          <Button 
            variant="ghost" 
            className="text-foreground hover:text-foreground hover:bg-accent transition-colors font-medium"
            onClick={onViewAll}
            disabled={loadingViewAll}
            data-testid={`section-view-all-${title}`}
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
      
      <div className="relative">
        {isLoading ? (
          // Loading skeleton with fixed dimensions
          <div className="flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-hidden pb-4" style={{ minHeight: '320px' }}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 w-36 sm:w-48">
                <div className="bg-gray-700 rounded-lg mb-4 animate-pulse" style={{ aspectRatio: '2/3', height: '208px' }}></div>
                <div className="h-4 w-full mb-2 bg-gray-600 rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-gray-600 rounded animate-pulse"></div>
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
                  <MovieCardWithFavorites
                    movie={movie}
                    onClick={(movie) => onMovieClick?.(movie)}
                    isLoading={loadingMovieId === movie.id}
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
